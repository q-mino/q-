import { afterEach, describe, expect, test } from 'vitest'
import * as zz from '@q-mino/domains/library'
import { base64url_of } from '@q-mino/domains/seals/safe/_dsl.ts'
import { libsodium_primitives } from '@q-mino/adapters-common'
import { always_room, the_relays_storage } from '@q-mino/adapters-node'
import { relay } from '../src/index.ts'
import type { Stand } from '../src/settings.ts'
import { hash, lines_of } from './harness.ts'

// The stand over the relay's HTTP interface (INV-5..INV-7, INV-10), by
// `app.request`, no server started, on SQLite in memory: a leave signed with
// the stand's key, one with a wrong signature or another key, the passer-by's
// reading, the page's `GET` taking nothing, its `POST` taking the oldest and
// showing its link and its QR, the stand empty, a stand with no inviter yet,
// and the page's headers. The assistant's key is drawn by libsodium, as it
// draws its own (AST-13).

const app_of_the_test_site = 'https://q-mino-prova.github.io/q-/'
const T1 = 'dGlja2V0LW9mLXRoZS1hc3Npc3RhbnQtMQ'
const T2 = 'dGlja2V0LW9mLXRoZS1hc3Npc3RhbnQtMg'

/** Thursday 28 November 2026, by the relay's clock (UTC). */
const thursday = (time: string) => `2026-11-28T${time}:00.000Z`

const opened: (() => void)[] = []
afterEach(() => {
  for (const close of opened.splice(0)) close()
})

/** A key pair of a stand, drawn as the assistant draws it: its seed and its public half in base64url. */
const a_key_pair = async (seed_byte: number) => {
  const primitives = await libsodium_primitives()
  const seed = new Uint8Array(32).fill(seed_byte)
  return {
    public_key: base64url_of(primitives.public_key_of(seed)),
    /** The signature of a request's body (INV-5): over `q-stand/` and the body's bytes, in base64url. */
    signs: (body: string) =>
      base64url_of(primitives.sign(seed, new TextEncoder().encode(`q-stand/${body}`))),
  }
}

/** A relay with these stands, its clock at Thursday 9:00, over SQLite in memory. */
const a_relay_with = async (stands: readonly Stand[]) => {
  const primitives = await libsodium_primitives()
  const storage = the_relays_storage(':memory:')
  opened.push(() => {
    storage.close()
  })
  let instant = zz.date_time.parse(thursday('09:00'))
  const the_relay = await relay(storage)({
    clock: { now: () => instant, time_zone: zz.time_zone.parse('UTC') },
    elapsed: () => new Promise<void>(() => undefined),
    hash,
    room: always_room,
    stands,
    signature_holds: primitives.signature_holds,
  })
  return {
    app: the_relay.http,
    at: (time: string) => {
      instant = zz.date_time.parse(thursday(time))
    },
  }
}

/** The body of a leave, as the assistant sends it. */
const a_leave = (operation: string, ticket: string, takeable_until = '2026-11-29T09:00:00.000Z') =>
  JSON.stringify({
    version: '1.0.0',
    operation,
    input: { stand: 'assistente', ticket, takeable_until },
  })

/** A request posted, its body as given, with these headers. */
const posted = (body: string, headers: Readonly<Record<string, string>> = {}): RequestInit => ({
  method: 'POST',
  body,
  headers: { 'Content-Type': 'application/json', ...headers },
})

describe('the stand over HTTP (INV-5..INV-7)', () => {
  test('a leave signed with the stand’s key is on the stand; read by anyone, never its ticket', async () => {
    const key = await a_key_pair(1)
    const relay = await a_relay_with([
      { name: 'assistente', inviter: key.public_key, app: app_of_the_test_site },
    ])
    const body = a_leave('leave-1', T1)
    const left = await relay.app.request(
      '/inviter/leave_an_invitation',
      posted(body, { Authorization: `Signature ${key.signs(body)}` }),
    )
    expect(left.status).toBe(200)
    expect(await lines_of(left)).toEqual([
      {
        event: 'the_invitation_is_on_the_stand',
        payload: { invitation_id: expect.any(String), left_at: thursday('09:00') },
      },
    ])
    const read = await relay.app.request(
      '/passer_by/the_invitations_on_a_stand',
      posted(JSON.stringify({ version: '1.0.0', input: { stand: 'assistente' } })),
    )
    const lines = await lines_of(read)
    expect(lines).toMatchObject([
      { event: 'snapshot', entries: [{ takeable_until: '2026-11-29T09:00:00.000Z' }] },
    ])
    expect(JSON.stringify(lines)).not.toContain(T1)
  })

  test('a wrong signature, another stand’s key, or none: the inviter is not found; not a signature: 400', async () => {
    const key = await a_key_pair(1)
    const another = await a_key_pair(2)
    const relay = await a_relay_with([
      { name: 'assistente', inviter: key.public_key, app: app_of_the_test_site },
    ])
    const body = a_leave('leave-1', T1)
    for (const authorization of [
      `Signature ${key.signs(a_leave('leave-1', T2))}`,
      `Signature ${another.signs(body)}`,
      `Signature ${'A'.repeat(86)}`,
    ]) {
      const refused = await relay.app.request(
        '/inviter/leave_an_invitation',
        posted(body, { Authorization: authorization }),
      )
      expect(await lines_of(refused)).toEqual([{ event: 'not_found' }])
    }
    expect(
      await lines_of(await relay.app.request('/inviter/leave_an_invitation', posted(body))),
    ).toEqual([{ event: 'not_found' }])
    const bearer = await relay.app.request(
      '/inviter/leave_an_invitation',
      posted(body, { Authorization: 'Bearer something' }),
    )
    expect(bearer.status).toBe(400)
    expect(await bearer.json()).toEqual({ fault: 'authorization' })
    const not_json = await relay.app.request(
      '/inviter/leave_an_invitation',
      posted('{', { Authorization: `Signature ${key.signs('{')}` }),
    )
    expect(not_json.status).toBe(400)
  })

  test('the page’s GET takes nothing; its POST takes the oldest and shows its link and its QR; then empty', async () => {
    const key = await a_key_pair(1)
    const relay = await a_relay_with([
      { name: 'assistente', inviter: key.public_key, app: app_of_the_test_site },
    ])
    for (const [operation, ticket] of [
      ['leave-1', T1],
      ['leave-2', T2],
    ] as const) {
      const body = a_leave(operation, ticket)
      await relay.app.request(
        '/inviter/leave_an_invitation',
        posted(body, { Authorization: `Signature ${key.signs(body)}` }),
      )
      relay.at('09:05')
    }
    const the_page = await relay.app.request('/assistente')
    expect(the_page.status).toBe(200)
    expect(the_page.headers.get('cache-control')).toBe('no-store')
    expect(the_page.headers.get('content-security-policy')).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    )
    expect(the_page.headers.get('referrer-policy')).toBe('no-referrer')
    expect(the_page.headers.get('set-cookie')).toBeNull()
    expect(the_page.headers.get('access-control-allow-origin')).toBeNull()
    const text = await the_page.text()
    expect(text).toContain('<title>L&#39;assistente di Cumino</title>')
    expect(text).toContain('<form method="post" action="/assistente">')
    expect(text).toContain(`href="${app_of_the_test_site}"`)
    expect(text).not.toContain('<script')
    expect(text).not.toContain(T1)
    // A GET again, a preview, a crawler: still two on the stand.
    await relay.app.request('/assistente')
    const first = await (await relay.app.request('/assistente', { method: 'POST' })).text()
    expect(first).toContain(`href="${app_of_the_test_site}#ticket=${T1}"`)
    expect(first).toMatch(/<svg [^>]*viewBox="0 0 \d+ \d+"/)
    expect(first).toContain('Ecco il tuo link')
    const second = await (await relay.app.request('/assistente', { method: 'POST' })).text()
    expect(second).toContain(`#ticket=${T2}"`)
    const empty = await relay.app.request('/assistente', { method: 'POST' })
    expect(empty.status).toBe(200)
    expect(await empty.text()).toContain('Ora non ci sono link')
  })

  test('a stand with no inviter yet: its page says so, takes nothing, and no leave is heard', async () => {
    const key = await a_key_pair(1)
    const relay = await a_relay_with([
      { name: 'assistente', inviter: undefined, app: app_of_the_test_site },
    ])
    for (const method of ['GET', 'POST']) {
      const page = await relay.app.request('/assistente', { method })
      expect(page.status).toBe(200)
      const text = await page.text()
      expect(text).toContain('non è ancora arrivato')
      expect(text).not.toContain('<form')
    }
    const body = a_leave('leave-1', T1)
    expect(
      await lines_of(
        await relay.app.request(
          '/inviter/leave_an_invitation',
          posted(body, { Authorization: `Signature ${key.signs(body)}` }),
        ),
      ),
    ).toEqual([{ event: 'not_found' }])
  })

  test('no stand configured: no page; the phones’ paths keep their CORS', async () => {
    const relay = await a_relay_with([])
    expect((await relay.app.request('/assistente')).status).toBe(404)
    const preflight = await relay.app.request('/inviter/leave_an_invitation', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://q-mino-prova.github.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    })
    expect(preflight.headers.get('access-control-allow-origin')).toBe('*')
  })
})
