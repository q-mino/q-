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
//   nothing else, since no tree heard it.

import { Hono, type Context } from 'hono'
import * as z from 'zod'
import * as zz from '@q-mino/domains/library'
import type { desk } from '@q-mino/domains/desk/_node.ts'
import { caller } from '@q-mino/domains/desk/_value.ts'
import type { majors as depositor_majors } from '@q-mino/domains/desk/depositor/_majors.ts'
import type { deposit_an_envelope } from '@q-mino/domains/desk/depositor/_usecase.ts'
import type { majors as holder_majors } from '@q-mino/domains/desk/holder/_majors.ts'
import type { collect_the_envelopes } from '@q-mino/domains/desk/holder/_usecase.ts'
import { deposit_address } from '@q-mino/domains/mailbox/deposits/_id.ts'

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

/** The hash of a collect secret, behind a port (PER-19, V5): D = hash(R), the primitives' (SEA-4). */
export type HashOfACollectSecret = (secret: string) => Promise<string>

/** What the interface is wired to: the desk's trees, the hash of R, the relay's clock. */
export interface TheDesk {
  readonly depositor: { readonly deposit_an_envelope: DepositPort }
  readonly holder: { readonly collect_the_envelopes: CollectPort }
  readonly hash: HashOfACollectSecret
  readonly clock: zz.Clock
}

/**
 * The scope of a depositor's operation (DOM-11, MBX-6): the persona alone,
 * since a depositor is anyone and has no id; its correlation the
 * operation's, since nothing of a phone's chain crosses the relay (F2).
 */
const the_scope_of_a_deposit = 'depositor'

/** The body of a deposit: the version the phone was built at, its operation, the leaf's input. */
const a_deposit = z.strictObject({
  version: zz.semver,
  operation: zz.operation_id,
  input: z.unknown(),
})

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
 * relay's configurator serves (step 24) and a test calls with `app.request`.
 */
export const the_desks_http_interface = (the_desk: TheDesk) => {
  /** The `Caller` the node `desk` takes (MBX-6): anyone, or the D of the R shown; R never enters the tree (V5). */
  const caller_of = async (shown: Shown & { readonly shows: 'nothing' | 'a_collect_secret' }) =>
    shown.shows === 'nothing'
      ? caller.parse({ shows: 'nothing' })
      : caller.parse({
          shows: 'a_collect_secret',
          id: deposit_address.parse(await the_desk.hash(shown.secret)),
        })
  const now = () => ({
    now: zz.in_zone(the_desk.clock.time_zone)(the_desk.clock.now()),
    time_zone: the_desk.clock.time_zone,
  })
  return new Hono()
    .post('/depositor/deposit_an_envelope', async (c) => {
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
}

/** The relay's HTTP interface, a Hono app. */
export type TheDesksHttpInterface = ReturnType<typeof the_desks_http_interface>
