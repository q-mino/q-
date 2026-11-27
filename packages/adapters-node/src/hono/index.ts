// The relay's HTTP interface (PER-19, MBX-6, ADP-4, CFG-3), on Hono: what a
// request shows turned into the desk's `Caller`, its version and its
// operation taken from its body, the relay's clock for `now`, and the desk's
// trees answering; their events carried back as they come, one JSON a line
// (NDJSON), in their order, until the stream ends or the phone lets it go. A
// transport: it reads nothing of an event and decides nothing (ADP-1). It
// writes nothing about the requests it serves: no access logs (CFG-3).
//
// The contract (MBX-9):
// - `POST /depositor/deposit_an_envelope`, body
//   `{ "version", "operation", "input": { "deposit_address", "envelope" } }`;
// - `POST /holder/collect_the_envelopes`, the collect secret as
//   `Authorization: Bearer <R>`, body `{ "version", "input": { "deposit_address" }, "from"? }`;
// - the tree's events with 200, `application/x-ndjson`; a body not in this
//   form, or an `Authorization` that is not a bearer credential, 400 and
//   nothing else, since no tree heard it;
// - CORS open to every origin (MBX-9; A, 23 Nov 2026): the PWA is served
//   from another origin, and a request with `Authorization` and JSON is
//   preflighted by the browser. No gate: only a browser enforces an origin,
//   and the relay is open to every depositor anyway;
// - a deposit when the disk has too little room, 507
//   `{ "fault": "the_relay_is_full" }`, before its body is read, heard by no
//   tree (REL-3): the transport's refusal, which a phone tries again;
// - `GET /`, what the relay says of itself: its version, its commit and
//   where the source of that commit is (REL-4, AGPL § 13), nothing else;
// - `POST /inviter/leave_an_invitation` (INV-5), body
//   `{ "version", "operation", "input": { "stand", "ticket", "takeable_until" } }`,
//   signed: `Authorization: Signature <s>`, `s` the Ed25519 signature in
//   base64url over `q-stand/` and the body's bytes as sent, which the key the
//   relay's configuration names for the stand the input names verifies; one
//   that does not verify, or a stand with no key, shows nothing, and the
//   inviter's node is not found (PER-14);
// - `POST /passer_by/the_invitations_on_a_stand` (INV-5), body
//   `{ "version", "input": { "stand" } }`: each invitation's id and until
//   when it can be taken, never its ticket;
// - for each stand of the configuration, its page (INV-7): `GET /<name>`
//   takes nothing; `POST /<name>` takes the oldest invitation on the stand
//   (INV-3), trying the next when another passer-by took it meanwhile, and
//   shows its link, or says the stand is empty; rendered by the relay's page
//   (`AStandsPage`), with no script, no cookie, not cached, and no CORS.

import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import * as z from 'zod'
import * as zz from '@q-mino/domains/library'
import type { desk } from '@q-mino/domains/desk/_node.ts'
import { caller } from '@q-mino/domains/desk/_value.ts'
import type { majors as depositor_majors } from '@q-mino/domains/desk/depositor/_majors.ts'
import type { deposit_an_envelope } from '@q-mino/domains/desk/depositor/_usecase.ts'
import type { majors as holder_majors } from '@q-mino/domains/desk/holder/_majors.ts'
import type { collect_the_envelopes } from '@q-mino/domains/desk/holder/_usecase.ts'
import type { majors as inviter_majors } from '@q-mino/domains/desk/inviter/_majors.ts'
import type { leave_an_invitation } from '@q-mino/domains/desk/inviter/_usecase.ts'
import type { majors as passer_by_majors } from '@q-mino/domains/desk/passer_by/_majors.ts'
import type {
  take_an_invitation,
  the_invitation_taken,
  the_invitations_on_a_stand,
} from '@q-mino/domains/desk/passer_by/_usecase.ts'
import { passer_by } from '@q-mino/domains/desk/passer_by/_version.ts'
import { deposit_address } from '@q-mino/domains/mailbox/deposits/_id.ts'
import { stand as a_stand } from '@q-mino/domains/stand/invitations/_id.ts'
import { randomBytes } from 'node:crypto'
import type { RoomForADeposit } from '../disk/index.ts'

/** The port of the depositor's leaf, as the relay's configurator wires it. */
type DepositPort = zz.TreePorts<
  typeof desk,
  typeof depositor_majors,
  { deposit_an_envelope: typeof deposit_an_envelope }
>['deposit_an_envelope']

/** The port of the holder's leaf, as the relay's configurator wires it. */
type CollectPort = zz.TreePorts<
  typeof desk,
  typeof holder_majors,
  { collect_the_envelopes: typeof collect_the_envelopes }
>['collect_the_envelopes']

/** The port of the inviter's leaf, as the relay's configurator wires it. */
type LeavePort = zz.TreePorts<
  typeof desk,
  typeof inviter_majors,
  { leave_an_invitation: typeof leave_an_invitation }
>['leave_an_invitation']

/** The ports of the passer-by's leaves, as the relay's configurator wires them. */
type PasserByPorts = zz.TreePorts<
  typeof desk,
  typeof passer_by_majors,
  {
    the_invitations_on_a_stand: typeof the_invitations_on_a_stand
    take_an_invitation: typeof take_an_invitation
    the_invitation_taken: typeof the_invitation_taken
  }
>

/** The hash of a collect secret, behind a port (PER-19, V5): D = hash(R), the primitives' (SEA-4). */
export type HashOfACollectSecret = (secret: string) => Promise<string>

/** What the relay says of itself at `GET /` (REL-4, AGPL § 13): its version, its commit, the source of that commit. */
export interface AboutTheRelay {
  readonly version: string
  readonly commit: string
  readonly source: string
}

/**
 * Whether a signature is the inviter's of a stand (INV-5): the key the
 * relay's configuration names for that stand verifies it over the bytes
 * signed; a stand with no key, or a signature out of form, does not.
 */
export type TheInviterSigned = (stand: string, signed: Uint8Array, signature: string) => boolean

/** A stand of the relay's configuration (INV-6): its name, its page's path, whether it has an inviter yet, the app its links open. */
export interface AStandServed {
  readonly name: string
  readonly has_an_inviter: boolean
  readonly app: string
}

/**
 * What a stand's page shows (INV-7), which the relay's page draws: the stand
 * and what to do (`GET`, the button); the stand with no inviter yet; a link
 * taken (`POST`), the app's address with its ticket after `#ticket=`
 * (WEB-1); or the stand empty.
 */
export type AStandsPage =
  | { readonly page: 'the_stand'; readonly stand: AStandServed }
  | { readonly page: 'no_inviter_yet'; readonly stand: AStandServed }
  | { readonly page: 'a_link_taken'; readonly stand: AStandServed; readonly link: string }
  | { readonly page: 'the_stand_is_empty'; readonly stand: AStandServed }

/** The page of a stand drawn, a whole HTML document (INV-7): the relay's, with its words. */
export type DrawAStandsPage = (page: AStandsPage) => string

/**
 * What the interface is wired to: the desk's trees, the hash of R, the
 * relay's clock, the room on its disk for a deposit (REL-3), and what it
 * says of itself (REL-4); the stands it serves, the check of their
 * inviters' signatures (INV-5), and their page (INV-7).
 */
export interface TheDesk {
  readonly depositor: { readonly deposit_an_envelope: DepositPort }
  readonly holder: { readonly collect_the_envelopes: CollectPort }
  readonly inviter: { readonly leave_an_invitation: LeavePort }
  readonly passer_by: PasserByPorts
  readonly hash: HashOfACollectSecret
  readonly clock: zz.Clock
  readonly room: RoomForADeposit
  readonly about: AboutTheRelay
  readonly stands: readonly AStandServed[]
  readonly the_inviter_signed: TheInviterSigned
  readonly the_page: DrawAStandsPage
}

/**
 * The scope of a depositor's operation (DOM-11, MBX-6): the persona alone,
 * since a depositor is anyone and has no id; its correlation the
 * operation's, since nothing of a phone's chain crosses the relay (F2).
 */
const the_scope_of_a_deposit = 'depositor'

/** The scope of a take (DOM-11, INV-3): the persona alone, a passer-by has no id; its operation drawn here. */
const the_scope_of_a_take = 'passer_by'

/** The scope of a leave (DOM-11, INV-5): the persona and the stand its signature is the inviter's of. */
const the_scope_of_a_leave = (stand: string): string => `inviter/${stand}`

/** What an inviter signs begins so (INV-5): its domain, then the body's bytes. */
const the_prefix_of_what_an_inviter_signs = new TextEncoder().encode('q-stand/')

/** An operation drawn at random for a take (INV-3): 16 bytes in base64url, as a phone's ids (WEB-4). */
const an_operation_drawn = (): zz.operation_id =>
  zz.operation_id.parse(randomBytes(16).toString('base64url'))

/** The body of a deposit: the version the phone was built at, its operation, the leaf's input. */
const a_deposit = z.strictObject({
  version: zz.semver,
  operation: zz.operation_id,
  input: z.unknown(),
})

/** The body of a read: the version and the leaf's input. */
const a_read = z.strictObject({
  version: zz.semver,
  input: z.unknown(),
})

/** The stand a leave's input names, if it names one: whose key verifies its signature. */
const the_stand_named = z.object({ input: z.object({ stand: z.string() }) })

/** An inviter's signature (INV-5): `Signature <s>`, base64url. */
const signature_in = (authorization: string): string | undefined =>
  /^Signature ([A-Za-z0-9_-]+)$/.exec(authorization)?.[1]

/** The body of a collect: the version, the leaf's input, and the position it resumes from, if any. */
const a_collect = z.strictObject({
  version: zz.semver,
  input: z.unknown(),
  from: zz.position.optional(),
})

/** What a request shows (MBX-6): nothing, a collect secret, or a credential that is not one. */
type Shown =
  | { readonly shows: 'nothing' }
  | { readonly shows: 'a_collect_secret'; readonly secret: string }
  | { readonly shows: 'not_a_bearer_credential' }

const shown_by = (authorization: string | undefined): Shown => {
  if (authorization === undefined) return { shows: 'nothing' }
  const bearer = /^Bearer ([^\s]+)$/.exec(authorization)?.[1]
  return bearer === undefined
    ? { shows: 'not_a_bearer_credential' }
    : { shows: 'a_collect_secret', secret: bearer }
}

/**
 * The events of a port, one JSON a line, pulled as the phone reads them; let
 * go, the port's stream is let go too. A collect waiting for the next fact is
 * let go when it comes: the storage wakes every reader at each fact.
 */
const ndjson = (events: AsyncIterable<unknown>): ReadableStream<Uint8Array> => {
  const iterator = events[Symbol.asyncIterator]()
  const encoder = new TextEncoder()
  let let_go = false
  return new ReadableStream<Uint8Array>({
    pull: async (controller) => {
      const next = await iterator.next()
      if (let_go) return
      if (next.done === true) controller.close()
      else controller.enqueue(encoder.encode(`${JSON.stringify(next.value)}\n`))
    },
    cancel: () => {
      let_go = true
      void iterator.return?.()
    },
  })
}

const answered = (c: Context, events: AsyncIterable<unknown>): Response =>
  c.body(ndjson(events), 200, { 'Content-Type': 'application/x-ndjson' })

const not_a_request = (c: Context, fault: string): Response => c.json({ fault }, 400)

/** The disk has too little room (REL-3): 507, Insufficient Storage, a refusal of the transport's. */
const the_relay_is_full = (c: Context): Response => c.json({ fault: 'the_relay_is_full' }, 507)

/**
 * CORS (MBX-9): every origin, the two paths' method, the headers a phone
 * sends, a preflight kept a day by the browser, no credentials (R goes as a
 * bearer credential the phone sets, never a cookie).
 */
const open_to_every_origin = cors({
  origin: '*',
  allowMethods: ['POST'],
  allowHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86_400,
})

/** The JSON body of a request, or nothing when it is not JSON. */
const body_of = async (c: Context): Promise<unknown> => {
  try {
    const body: unknown = await c.req.json()
    return body
  } catch {
    return undefined
  }
}

/**
 * The relay's HTTP interface over the desk (MBX-9): a Hono app, which the
 * relay's main serves (REL-1, REL-2) and a test calls with `app.request`.
 */
export const the_desks_http_interface = (the_desk: TheDesk) => {
  const the_pages = new Set(the_desk.stands.map((stand) => `/${stand.name}`))
  /** The `Caller` the node `desk` takes (MBX-6): anyone, or the D of the R shown; R never enters the tree (V5). */
  const caller_of = async (shown: Shown & { readonly shows: 'nothing' | 'a_collect_secret' }) =>
    shown.shows === 'nothing'
      ? caller.parse({ shows: 'nothing' })
      : caller.parse({
          shows: 'a_collect_secret',
          id: deposit_address.parse(await the_desk.hash(shown.secret)),
        })
  const now = () => ({
    now: the_desk.clock.now(),
    time_zone: the_desk.clock.time_zone,
  })
  const app = new Hono()
    // CORS for the phones' paths and `GET /`, never for a page (INV-7): a page
    // is read by its visitor's browser, not by another origin's script.
    .use((c, next) => (the_pages.has(c.req.path) ? next() : open_to_every_origin(c, next)))
    .get('/', (c) => c.json(the_desk.about))
    .post('/depositor/deposit_an_envelope', async (c) => {
      if ((await the_desk.room()).room === 'too_little') return the_relay_is_full(c)
      const shown = shown_by(c.req.header('authorization'))
      const body = a_deposit.safeParse(await body_of(c))
      if (shown.shows === 'not_a_bearer_credential') return not_a_request(c, 'authorization')
      if (!body.success) return not_a_request(c, 'body')
      const { version, operation, input } = body.data
      return answered(
        c,
        the_desk.depositor.deposit_an_envelope(
          {
            caller: await caller_of(shown),
            version,
            ...now(),
            operation: { id: operation, scope: the_scope_of_a_deposit },
            correlation: zz.correlation.parse(operation),
          },
          // cast: the wire's input reaches the leaf's schema, which parses it at the version (PER-5, DOM-21)
          input as Parameters<DepositPort>[1],
        ),
      )
    })
    .post('/holder/collect_the_envelopes', async (c) => {
      const shown = shown_by(c.req.header('authorization'))
      const body = a_collect.safeParse(await body_of(c))
      if (shown.shows === 'not_a_bearer_credential') return not_a_request(c, 'authorization')
      if (!body.success) return not_a_request(c, 'body')
      const { version, input, from } = body.data
      const context = { caller: await caller_of(shown), version, ...now() }
      // cast: the wire's input reaches the leaf's schema, which parses it at the version (PER-5, DOM-21)
      const told = input as Parameters<CollectPort>[1]
      return answered(
        c,
        from === undefined
          ? the_desk.holder.collect_the_envelopes(context, told)
          : the_desk.holder.collect_the_envelopes(context, told, from),
      )
    })
    .post('/inviter/leave_an_invitation', async (c) => {
      const authorization = c.req.header('authorization')
      const signature = authorization === undefined ? undefined : signature_in(authorization)
      if (authorization !== undefined && signature === undefined)
        return not_a_request(c, 'authorization')
      const bytes = new Uint8Array(await c.req.arrayBuffer())
      const body = a_deposit.safeParse(json_of(bytes))
      if (!body.success) return not_a_request(c, 'body')
      const { version, operation, input } = body.data
      const named = the_stand_named.safeParse(body.data)
      const signed = new Uint8Array(the_prefix_of_what_an_inviter_signs.length + bytes.length)
      signed.set(the_prefix_of_what_an_inviter_signs)
      signed.set(bytes, the_prefix_of_what_an_inviter_signs.length)
      const the_stand = named.success ? a_stand.safeParse(named.data.input.stand) : undefined
      // A signature that does not verify, or a stand with no key, shows nothing (INV-5).
      const the_caller =
        signature !== undefined &&
        the_stand?.success === true &&
        the_desk.the_inviter_signed(the_stand.data, signed, signature)
          ? caller.parse({ shows: 'the_signature_of_a_stand_s_inviter', stand: the_stand.data })
          : caller.parse({ shows: 'nothing' })
      return answered(
        c,
        the_desk.inviter.leave_an_invitation(
          {
            caller: the_caller,
            version,
            ...now(),
            operation: {
              id: operation,
              scope: the_scope_of_a_leave(
                the_caller.shows === 'the_signature_of_a_stand_s_inviter' ? the_caller.stand : '',
              ),
            },
            correlation: zz.correlation.parse(operation),
          },
          // cast: the wire's input reaches the leaf's schema, which parses it at the version (PER-5, DOM-21)
          input as Parameters<LeavePort>[1],
        ),
      )
    })
    .post('/passer_by/the_invitations_on_a_stand', async (c) => {
      const body = a_read.safeParse(await body_of(c))
      if (!body.success) return not_a_request(c, 'body')
      const { version, input } = body.data
      return answered(
        c,
        the_desk.passer_by.the_invitations_on_a_stand(
          { caller: caller.parse({ shows: 'nothing' }), version, ...now() },
          // cast: the wire's input reaches the leaf's schema, which parses it at the version (PER-5, DOM-21)
          input as Parameters<PasserByPorts['the_invitations_on_a_stand']>[1],
        ),
      )
    })
  for (const stand of the_desk.stands) {
    app
      .get(`/${stand.name}`, (c) =>
        a_page(
          c,
          stand.has_an_inviter ? { page: 'the_stand', stand } : { page: 'no_inviter_yet', stand },
        ),
      )
      .post(`/${stand.name}`, async (c) =>
        a_page(
          c,
          stand.has_an_inviter
            ? await a_link_taken(the_desk, now)(stand)
            : { page: 'no_inviter_yet', stand },
        ),
      )
  }
  /** A page of a stand, as INV-7 sends it: not cached, no script, no referrer, framed by none. */
  const a_page = (c: Context, page: AStandsPage): Response =>
    c.html(the_desk.the_page(page), 200, the_headers_of_a_page)
  return app
}

/** The headers of a stand's page (INV-7). */
const the_headers_of_a_page = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy':
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'Referrer-Policy': 'no-referrer',
}

/** A body's bytes as JSON, or nothing when they are not. */
const json_of = (bytes: Uint8Array): unknown => {
  try {
    const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    return parsed
  } catch {
    return undefined
  }
}

/** The first event of a port's answer, its stream let go. */
const the_first_of = async <event>(events: AsyncIterable<event>): Promise<event | undefined> => {
  for await (const event of events) return event
  return undefined
}

/**
 * A passer-by takes the oldest invitation on a stand (INV-3): the stand read,
 * the oldest taken by its id under an operation drawn here; taken meanwhile
 * by another, the next, at most as many as the stand held; the ticket read by
 * the take, and its link. None taken: the stand is empty.
 */
const a_link_taken =
  (
    the_desk: TheDesk,
    now: () => { readonly now: zz.date_time; readonly time_zone: zz.time_zone },
  ) =>
  async (stand: AStandServed): Promise<AStandsPage> => {
    const version = passer_by[zz.$Version]
    const anyone = caller.parse({ shows: 'nothing' })
    const the_stand = a_stand.parse(stand.name)
    const read = await the_first_of(
      the_desk.passer_by.the_invitations_on_a_stand(
        { caller: anyone, version, ...now() },
        { stand: the_stand },
      ),
    )
    const on_the_stand = read?.event === 'snapshot' ? read.entries : []
    for (const invitation of on_the_stand) {
      const operation = an_operation_drawn()
      const taken = await the_first_of(
        the_desk.passer_by.take_an_invitation(
          {
            caller: anyone,
            version,
            ...now(),
            operation: { id: operation, scope: the_scope_of_a_take },
            correlation: zz.correlation.parse(operation),
          },
          { stand: the_stand, invitation_id: invitation.invitation_id },
        ),
      )
      if (taken?.event !== 'the_invitation_is_yours') continue
      const in_hand = await the_first_of(
        the_desk.passer_by.the_invitation_taken(
          { caller: anyone, version, ...now() },
          { take_id: taken.payload.take_id },
        ),
      )
      const [the_invitation] = in_hand?.event === 'snapshot' ? in_hand.entries : []
      if (the_invitation === undefined) continue
      return { page: 'a_link_taken', stand, link: `${stand.app}#ticket=${the_invitation.ticket}` }
    }
    return { page: 'the_stand_is_empty', stand }
  }

/** The relay's HTTP interface, a Hono app. */
export type TheDesksHttpInterface = ReturnType<typeof the_desks_http_interface>
