// The stand, from the assistant (AST-13, INV-5): the stand's own key, drawn
// at the first start (Ed25519, its 32-byte seed in `stand.key`, base64url,
// readable by its user only), its public half for the relay's
// configuration (INV-6); and the stand's client over HTTP: a leave signed
// over `q-stand/` and the body's bytes as sent, the count of what the stand
// holds. The answers are NDJSON, their first line read. [Q, C, 27 Nov 2026]

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'
import { z } from 'zod'

/** The stand's key: its seed, and its public half in base64url (43 characters). */
export interface TheStandsKey {
  readonly seed: Uint8Array<ArrayBuffer>
  readonly public_key: string
}

const base64url = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64url')

/** The key of `stand.key`, drawn and kept if there is none: whether it was drawn now. */
export const the_stand_s_key = (
  file: string,
  primitives: Pick<Primitives, 'random_bytes' | 'public_key_of'>,
): { readonly key: TheStandsKey; readonly drawn: boolean } => {
  const drawn = !existsSync(file)
  if (drawn) {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 })
    writeFileSync(file, `${base64url(primitives.random_bytes(32))}\n`, { mode: 0o600, flag: 'wx' })
  }
  chmodSync(file, 0o600)
  const seed = new Uint8Array(Buffer.from(readFileSync(file, 'utf8').trim(), 'base64url'))
  if (seed.length !== 32) throw new Error(`${file}: not a key of 32 bytes in base64url`)
  return { key: { seed, public_key: base64url(primitives.public_key_of(seed)) }, drawn }
}

/** What a leave answered (INV-5): its first event, or the relay out of reach. */
export const a_leave_s_answer = z.enum([
  'the_invitation_is_on_the_stand',
  'the_stand_is_full',
  'not_takeable_then',
  'not_found',
  'refused',
  'identity_already_used',
  'invalid_request',
])

export type ALeave =
  | { readonly left: z.output<typeof a_leave_s_answer> }
  | { readonly left: 'out_of_reach'; readonly fault: string }

export type ACount =
  | { readonly counted: 'counted'; readonly takeable: number }
  | { readonly counted: 'out_of_reach'; readonly fault: string }

/** The stand as the assistant reaches it (AST-13). */
export interface TheStand {
  readonly leaves: (invitation: {
    readonly operation: string
    readonly ticket: string
    readonly takeable_until: string
  }) => Promise<ALeave>
  /** How many invitations of the stand can still be taken now. */
  readonly counts: (now: string) => Promise<ACount>
}

/** A fetch as the stand's client uses it (Node's, or a test's app). */
export type AFetch = (url: string, init: RequestInit) => Promise<Response>

const the_first_line_of = async (answer: Response): Promise<unknown> => {
  const text = await answer.text()
  const first = text.split('\n').find((line) => line.trim() !== '')
  return first === undefined ? undefined : JSON.parse(first)
}

const why_of = (fault: unknown): string => (fault instanceof Error ? fault.message : String(fault))

/** The stand's client over HTTP (INV-5), signing with the stand's key. */
export const the_stand_over_http = (wiring: {
  readonly relay: string
  readonly stand: string
  readonly key: TheStandsKey
  readonly sign: Primitives['sign']
  readonly fetch: AFetch
}): TheStand => ({
  leaves: async (invitation) => {
    const body = JSON.stringify({
      version: '1.0.0',
      operation: invitation.operation,
      input: {
        stand: wiring.stand,
        ticket: invitation.ticket,
        takeable_until: invitation.takeable_until,
      },
    })
    const signature = base64url(
      wiring.sign(wiring.key.seed, new TextEncoder().encode(`q-stand/${body}`)),
    )
    try {
      const answer = await wiring.fetch(`${wiring.relay}/inviter/leave_an_invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Signature ${signature}` },
        body,
      })
      const event = z.object({ event: a_leave_s_answer }).safeParse(await the_first_line_of(answer))
      return event.success
        ? { left: event.data.event }
        : { left: 'out_of_reach', fault: `an answer of status ${String(answer.status)}` }
    } catch (fault) {
      return { left: 'out_of_reach', fault: why_of(fault) }
    }
  },
  counts: async (now) => {
    try {
      const answer = await wiring.fetch(`${wiring.relay}/passer_by/the_invitations_on_a_stand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: '1.0.0', input: { stand: wiring.stand } }),
      })
      const snapshot = z
        .object({
          event: z.literal('snapshot'),
          entries: z.array(z.object({ takeable_until: z.string() })),
        })
        .safeParse(await the_first_line_of(answer))
      if (!snapshot.success)
        return { counted: 'out_of_reach', fault: `an answer of status ${String(answer.status)}` }
      return {
        counted: 'counted',
        takeable: snapshot.data.entries.filter((entry) => entry.takeable_until > now).length,
      }
    } catch (fault) {
      return { counted: 'out_of_reach', fault: why_of(fault) }
    }
  },
})
