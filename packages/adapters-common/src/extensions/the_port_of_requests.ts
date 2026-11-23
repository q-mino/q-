import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { the_identity_of_a_request, type Machine } from '@q-mino/domains/post/_dsl.ts'
import type * as post_value from '@q-mino/domains/post/_value.ts'
import { content } from '@q-mino/domains/post/_value.ts'
import type { call_off_a_request, send_a_request } from '@q-mino/domains/post/requests/_usecase.ts'
import type * as requests_value from '@q-mino/domains/post/requests/_value.ts'
import { as_traced, type TheKernelsTrace } from './the_kernels_trace.ts'

// The kernel's ports of requests (F7, EXT-2, EXT-8, PST-5, PST-8, GR-6;
// parts 12.4 and 13.3): one per composed extension, `(request) =>
// Promise<answer>`, the boundary's call and its closed answer; and the
// kernel's own, for the requests of the kernel's business (the extensions
// in common, EXT-8). Both compose the request's identity, give the answer
// `post` keeps under it, following a request that waits until it closes,
// else send the request through `post/requests` under it; both first take
// no input over what a letter carries (PST-12; A, 23 Nov 2026), each with its
// own answer; the extension's port refuses what it does not serve too
// (sending nothing, keeping nothing), the kernel's nothing else (F8, EXT-7:
// the kernel is never inactive, and an offer is an extension's). Their wiring is functions: the
// post's ports, the bonds' read, the machine's hash, the kernel's
// `extensions`, so that the oracle and the phone wire them alike. Beside
// them, the calling off (F7, EXT-7; A, 21 Nov 2026): the requests in flight
// of an extension the user deactivated, or withdrew from their bond, called
// off in `post`, which sends them again no more, so that their deliveries
// read the refusal kept.

/** The scope of the port of requests' operations (DOM-11): the port is the entry that sends, under the request's identity. */
export const the_scope_of_the_port_of_requests = 'the_port_of_requests'

/**
 * A bond as the port reads it (PST-5): kept, with my face that signs (the
 * safe's face id, its key) and theirs with the mailbox they declared (its D,
 * its relays); or gone: removed, or never a bond of the node's (BND-6: a
 * removed bond stays removed).
 */
export type ABondToAskOn =
  | {
      readonly bond: 'kept'
      readonly from: { readonly face_id: string; readonly key: string }
      readonly to: {
        readonly key: string
        readonly mailbox: { readonly deposit_address: string; readonly relays: readonly string[] }
      }
    }
  | { readonly bond: 'gone' }

/** The events of `the_answer_to_a_request`, as the port reads them: its snapshot with the answer kept, if any, and the position it was read at. */
export type TheAnswerKeptEvent =
  | {
      readonly event: 'snapshot'
      readonly entries: readonly { readonly answer: requests_value.answer }[]
      readonly position: zz.position
    }
  | { readonly event: 'invalid_request' }

/**
 * The port's wiring (GR-6): the clock; the post's machine, for its hash
 * (PST-3); the post's ports, `send_a_request`, `the_answer_to_a_request`
 * and the log of the facts it follows (PST-8); the bond a call names, from
 * `bonds`; what `extensions` tells (EXT-7: block 4 writes the domain); the
 * kernel's trace (EXT-6).
 */
export interface ThePortOfRequestsWiring {
  readonly clock: zz.Clock
  readonly machine: Pick<Machine, 'hash'>
  readonly post: {
    readonly send_a_request: zz.CommandUseCasePort<typeof send_a_request>
    readonly the_answer_to_a_request: (
      context: zz.RootContext,
      input: { readonly request_id: string },
    ) => AsyncIterable<TheAnswerKeptEvent>
    readonly log: zz.FactLog
  }
  readonly the_bond: (bond: boundary.bond) => Promise<ABondToAskOn>
  readonly extensions: {
    readonly is_active: (extension: string) => Promise<boolean>
    readonly is_offered: (extension: string, bond: boundary.bond) => Promise<boolean>
  }
  readonly trace: TheKernelsTrace
}

/**
 * The wiring of the kernel's own port of requests (EXT-8): the clock, the
 * machine's hash and the post's ports, as the extensions' port takes them;
 * the bond by the address book's id (`bonds`); the kernel's trace, for a
 * request too large for a letter (`a_request_not_sent`). No `extensions`:
 * the kernel is never inactive, and an offer is an extension's (EXT-7).
 */
export interface TheKernelsPortOfRequestsWiring {
  readonly clock: zz.Clock
  readonly machine: Pick<Machine, 'hash'>
  readonly post: ThePortOfRequestsWiring['post']
  readonly the_bond: (bond: string) => Promise<ABondToAskOn>
  readonly trace: TheKernelsTrace
}

/**
 * A request of the kernel's business (F7, EXT-8): the effect's path and the
 * entry's id, from which the kernel composes its identity; the bond, by the
 * address book's id; the kernel's use case it invokes on the peer, by its
 * persona, its path in the surface and the version it speaks; its input; the
 * seconds it waits for the response (at most the seven days a relay keeps a
 * letter, MBX-2).
 */
export interface AKernelsRequest {
  readonly effect: string
  readonly id: string
  readonly bond: string
  readonly invokes: {
    readonly persona: post_value.persona
    readonly use_case: string
    readonly version: string
  }
  readonly input: boundary.Json
  readonly waits: number
}

/**
 * The answer of the kernel's port of requests, a closed ADT (F7): the peer
 * responded, with its event, a claim (F2) the delivery parses; no response
 * in the request's time; the bond gone; its input over what a letter
 * carries (PST-12), nothing sent. Never a refusal of what the kernel does
 * not serve (F8, EXT-7).
 */
export type AnAnswerToTheKernelsRequest =
  | { readonly answer: 'responded'; readonly event: boundary.Json }
  | { readonly answer: 'no_response' }
  | { readonly answer: 'the_bond_is_gone' }
  | { readonly answer: 'too_large_for_a_letter' }

/** Whether a request not sent yet goes on to its bond (EXT-2, EXT-7): on, or refused with the port's answer. */
type AGate<refused> =
  { readonly gate: 'open' } | { readonly gate: 'closed'; readonly answer: refused }

/** The gate of the kernel's requests: always open (F8, EXT-7). */
const always_open = (): Promise<AGate<never>> => Promise.resolve({ gate: 'open' })

/** The path of the post's use case the port invokes, for the fingerprint (LIB-10). */
const sending = 'post/requests/usecase/send_a_request'

/** The path of the post's use case the calling off invokes, for the fingerprint (LIB-10). */
const calling_off = 'post/requests/usecase/call_off_a_request'

/** A request the kernel called off (PST-14), in the port's words: refused, with why (EXT-2). */
interface ACalledOff {
  readonly answer: 'refused'
  readonly why: requests_value.why_called_off
}

/** The first event of a stream, its rest left. */
const first_of = async <event>(events: AsyncIterable<event>): Promise<event | undefined> => {
  for await (const event of events) return event
  return undefined
}

/** Every event of a stream, until it ends. */
const every = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const all: event[] = []
  for await (const event of events) all.push(event)
  return all
}

/** The answer `post` keeps, in the port's words (EXT-2): answered, with the event; no response; called off, refused with why (PST-14). */
const in_the_ports_words = (
  answer: Exclude<requests_value.answer, { readonly status: 'waiting' }>,
): AnAnswerToTheKernelsRequest | ACalledOff => {
  switch (answer.status) {
    case 'no_response':
      return { answer: 'no_response' }
    case 'called_off':
      return { answer: 'refused', why: answer.why }
    case 'answered': {
      const event = boundary.json.safeParse(answer.event)
      if (!event.success) throw new Error('the event kept is no JSON value (PST-12)')
      return { answer: 'responded', event: event.data }
    }
  }
}

/**
 * The path the two ports share (F7, PST-2, PST-5, PST-8, PST-12), for a
 * request whose identity the port composes:
 * - an input over what a letter carries (`content` of the post, PST-12):
 *   `too_large_for_a_letter`, nothing sent, nothing kept, checked before
 *   the identity, which it does not need; each port answers it in its
 *   words (A, 23 Nov 2026: one rule for both);
 * - the identity, `the_identity_of_a_request(machine)(whose)` (PST-2);
 * - the answer kept under it (PST-8), if the port sent it: followed until
 *   the request closes, never sent again (F7, "The port keeps the
 *   answer"); whatever the bond became meanwhile (its letter is out
 *   already, PST-8); an offer withdrawn or the extension deactivated calls
 *   it off (`the_calling_off`), the refusal kept its answer (PST-14);
 * - else the gate: a new request the port refuses, with its answer (the
 *   extension's port: not active, not offered to the bond), sends nothing
 *   and keeps nothing;
 * - else the bond, from `bonds`: gone, `the_bond_is_gone` (the same every
 *   time: a removed bond stays removed, BND-6);
 * - else `send_a_request` under the operation `{ id: identity, scope: the
 *   port's }`, from my face to theirs, what it invokes, the input and its
 *   time; then the answer kept, followed until it closes. A request `post`
 *   does not send otherwise is the kernel's fault, thrown (an input too
 *   large is answered before).
 */
const a_request_through_post = (
  wiring: Pick<TheKernelsPortOfRequestsWiring, 'clock' | 'machine' | 'post'>,
) => {
  const when = (): zz.RootContext => ({
    now: wiring.clock.now(),
    time_zone: wiring.clock.time_zone,
  })
  /** The answer kept under an identity, if any, and the position it was read at. */
  const kept = async (
    identity: string,
  ): Promise<{ readonly answer?: requests_value.answer; readonly position?: zz.position }> => {
    const read = await first_of(
      wiring.post.the_answer_to_a_request(when(), { request_id: identity }),
    )
    if (read?.event !== 'snapshot') throw new Error(`no answer read for ${identity} (PST-8)`)
    const [entry] = read.entries
    return entry === undefined
      ? { position: read.position }
      : { answer: entry.answer, position: read.position }
  }
  /**
   * A request the port sent, followed until it closes (PST-8, DOM-3): its
   * facts' log from the position its answer was read at, read again after
   * each fact (the log resumes inclusively, DOM-17: one iteration, never
   * started again from the same position), from a new read if the log
   * cannot give that position.
   */
  const until_it_closes = async (
    identity: string,
    first: { readonly answer?: requests_value.answer; readonly position?: zz.position },
  ): Promise<AnAnswerToTheKernelsRequest | ACalledOff> => {
    let read = first
    for (;;) {
      const answer = read.answer
      if (answer === undefined) throw new Error(`the request ${identity} is kept nowhere (PST-8)`)
      if (answer.status !== 'waiting') return in_the_ports_words(answer)
      for await (const event of wiring.post.log(read.position)) {
        if (event.event === 'caught_up') continue
        read = await kept(identity)
        if (read.answer?.status !== 'waiting' || event.event === 'position_unavailable') break
      }
    }
  }
  return async <refused>(request: {
    readonly whose: post_value.whose_request
    readonly gate: () => Promise<AGate<refused>>
    readonly bond: () => Promise<ABondToAskOn>
    readonly invokes: post_value.invocation
    readonly input: boundary.Json
    readonly waits: number
  }): Promise<AnAnswerToTheKernelsRequest | ACalledOff | refused> => {
    if (!content.safeParse(request.input).success) return { answer: 'too_large_for_a_letter' }
    const identity = the_identity_of_a_request(wiring.machine)(request.whose)
    const already = await kept(identity)
    if (already.answer !== undefined) return until_it_closes(identity, already)
    const gate = await request.gate()
    if (gate.gate === 'closed') return gate.answer
    const bond = await request.bond()
    if (bond.bond === 'gone') return { answer: 'the_bond_is_gone' }
    const input = {
      request_id: identity,
      from: bond.from,
      to: {
        key: bond.to.key,
        mailbox: {
          deposit_address: bond.to.mailbox.deposit_address,
          relays: [...bond.to.mailbox.relays],
        },
      },
      invokes: request.invokes,
      input: request.input,
      waits: request.waits,
    }
    const sent = await every(
      wiring.post.send_a_request(
        {
          ...when(),
          operation: {
            id: zz.operation_id.parse(identity),
            scope: the_scope_of_the_port_of_requests,
          },
          correlation: zz.correlation.parse(identity),
          fingerprint: zz.fingerprint_of({ path: sending, input }),
        },
        input,
      ),
    )
    const last = sent.at(-1)
    if (last?.outcome !== 'applied') {
      throw new Error(
        `post did not send the request ${identity}: ${JSON.stringify(as_traced(last))} (PST-5, PST-12)`,
      )
    }
    return until_it_closes(identity, await kept(identity))
  }
}

/** A refusal of the extensions' port (EXT-2): the boundary's answer `refused`. */
type ARefusal = Extract<boundary.an_answer_to_a_request, { readonly answer: 'refused' }>

/**
 * The kernel's port of requests for one extension (F7, EXT-2), by its name
 * and its manifest's `touches`. In order:
 * - a call its manifest does not declare: `refused`, `not_declared`, in the
 *   kernel's trace (`a_call_not_declared`, EXT-4);
 * - the shared path (`a_request_through_post`), the identity `{ of:
 *   'an_extension', extension, effect, id }`, the extension's name the
 *   kernel's; an input over what a letter carries (PST-12), `refused`,
 *   `too_large_for_a_letter` (A, 21 Nov 2026), so that the call is answered
 *   and its delivery exhausted, never thrown and left unanswered behind the
 *   executor's position (EXT-2, DOM-14); its gate, the extension not
 *   active, or not offered to the
 *   bond (an offer goes both ways, EXT-7): `refused`, `not_active`,
 *   `not_offered_to_the_bond`, checked after the answer kept, so that a
 *   delivery met again reads its request's answer; what it invokes, the
 *   extension's name added (EXT-5).
 */
export const the_port_of_requests =
  (wiring: ThePortOfRequestsWiring) =>
  (extension: { readonly name: string; readonly touches: readonly boundary.port[] }) => {
    const through_post = a_request_through_post(wiring)
    const the_gate_of = async (bond: boundary.bond): Promise<AGate<ARefusal>> => {
      if (!(await wiring.extensions.is_active(extension.name))) {
        return { gate: 'closed', answer: { answer: 'refused', why: 'not_active' } }
      }
      if (!(await wiring.extensions.is_offered(extension.name, bond))) {
        return { gate: 'closed', answer: { answer: 'refused', why: 'not_offered_to_the_bond' } }
      }
      return { gate: 'open' }
    }
    return async (request: boundary.a_request): Promise<boundary.an_answer_to_a_request> => {
      if (!extension.touches.includes('the_port_of_requests')) {
        wiring.trace({
          why: 'a_call_not_declared',
          extension: extension.name,
          now: wiring.clock.now(),
          call: { port: 'the_port_of_requests', request: as_traced(request) },
        })
        return { answer: 'refused', why: 'not_declared' }
      }
      const answer = await through_post({
        whose: {
          of: 'an_extension',
          extension: extension.name,
          effect: request.effect,
          id: request.id,
        },
        gate: () => the_gate_of(request.bond),
        bond: () => wiring.the_bond(request.bond),
        invokes: {
          of: 'an_extension',
          extension: extension.name,
          persona: request.invokes.persona,
          use_case: request.invokes.use_case,
          version: request.invokes.version,
        },
        input: request.input,
        waits: request.waits,
      })
      return answer.answer === 'too_large_for_a_letter'
        ? { answer: 'refused', why: 'too_large_for_a_letter' }
        : answer
    }
  }

/**
 * The kernel's own port of requests (F7, EXT-8; part 13.3), for the
 * deliveries of the kernel's business (`ask_for_the_extensions_in_common`):
 * the shared path (`a_request_through_post`), the identity `{ of:
 * 'the_kernel', effect, id }` (PST-2), its gate always open: the kernel's
 * requests are always declared, the kernel is never inactive, and an offer
 * is an extension's (F8, EXT-7); what it sends invokes `{ of: 'the_kernel',
 * persona, use_case, version }` (EXT-5). Its answer is its own closed set:
 * `responded`, `no_response`, `the_bond_is_gone`, and an input over what a
 * letter carries `too_large_for_a_letter`, traced (`a_request_not_sent`),
 * never thrown: a throw would hold the executor behind it (A, 23 Nov
 * 2026, as for the extensions on 21 Nov). Never called off (the
 * calling off is an extension's, PST-14): a refusal kept under its
 * identity is a fault of the wiring, thrown.
 */
export const the_kernels_port_of_requests = (wiring: TheKernelsPortOfRequestsWiring) => {
  const through_post = a_request_through_post(wiring)
  return async (request: AKernelsRequest): Promise<AnAnswerToTheKernelsRequest> => {
    const invokes: post_value.invocation = {
      of: 'the_kernel',
      persona: request.invokes.persona,
      use_case: request.invokes.use_case,
      version: request.invokes.version,
    }
    const answer = await through_post({
      whose: { of: 'the_kernel', effect: request.effect, id: request.id },
      gate: always_open,
      bond: () => wiring.the_bond(request.bond),
      invokes,
      input: request.input,
      waits: request.waits,
    })
    if (answer.answer === 'too_large_for_a_letter') {
      wiring.trace({
        why: 'a_request_not_sent',
        request: { effect: request.effect, id: request.id, invokes },
        now: wiring.clock.now(),
        because: 'too_large_for_a_letter',
      })
    }
    if (answer.answer === 'refused') {
      throw new Error(`a request of the kernel's was called off (${answer.why}): never (PST-14)`)
    }
    return answer
  }
}

/** The scope of the calling off's operations (DOM-11): the kernel calls a request off under its identity. */
export const the_scope_of_the_calling_off = 'the_calling_off'

/** The events of `the_requests_waiting`, as the calling off reads them: its snapshot. */
export type TheRequestsWaitingEvent =
  | {
      readonly event: 'snapshot'
      readonly entries: readonly requests_value.waiting_request_card[]
    }
  | { readonly event: 'invalid_request' }

/**
 * The calling off's wiring (GR-6): the clock; the post's ports,
 * `the_requests_waiting` and `call_off_a_request` (PST-14); the bond a
 * request went on, by the face of the node's that signs it and the key of
 * theirs, as `bonds` keeps it (none: removed, BND-6); what `extensions`
 * tells (EXT-7), as the port reads it.
 */
export interface TheCallingOffWiring {
  readonly clock: zz.Clock
  readonly post: {
    readonly the_requests_waiting: (
      context: zz.RootContext,
      input: Record<string, never>,
    ) => AsyncIterable<TheRequestsWaitingEvent>
    readonly call_off_a_request: zz.CommandUseCasePort<typeof call_off_a_request>
  }
  readonly the_bond_of: (asked: {
    readonly face_id: string
    readonly their_key: string
  }) => Promise<boundary.bond | undefined>
  readonly extensions: ThePortOfRequestsWiring['extensions']
}

/** Why a request waiting is called off, if it is (EXT-7): its extension not active; else not offered to the bond it went on, if that bond is kept. */
const why_called_off = async (
  wiring: Pick<TheCallingOffWiring, 'the_bond_of' | 'extensions'>,
  request: requests_value.waiting_request_card,
): Promise<requests_value.why_called_off | undefined> => {
  if (request.invokes.of !== 'an_extension') return undefined
  const extension = request.invokes.extension
  if (!(await wiring.extensions.is_active(extension))) return 'not_active'
  const bond = await wiring.the_bond_of({ face_id: request.face_id, their_key: request.their_key })
  if (bond === undefined) return undefined
  return (await wiring.extensions.is_offered(extension, bond))
    ? undefined
    : 'not_offered_to_the_bond'
}

/**
 * The calling off (F7, EXT-7, PST-14; A, 21 Nov 2026: who withdraws does
 * not keep asking): one look, which calls off in `post` each request that
 * waits of an extension not active, or not offered to the bond it went on,
 * with why, under the operation `{ id: <the request's identity>, scope: the
 * calling off's }`; `post` sends it again no more, and the port gives its
 * delivery the refusal kept (`not_active`, `not_offered_to_the_bond`). The
 * kernel's own requests are never called off, nor one whose bond is gone
 * (its letter is out already, PST-8). The kernel looks after each fact of
 * the office and when the node starts (the extensions following the office,
 * EXT-15), so that a fall between a withdrawal and its look is made good at
 * the next start. A request that closed between the read and its calling
 * off is refused by `post`: nothing to call off. Gives the requests called
 * off.
 */
export const the_calling_off =
  (wiring: TheCallingOffWiring) => async (): Promise<readonly string[]> => {
    const now = (): zz.RootContext => ({
      now: wiring.clock.now(),
      time_zone: wiring.clock.time_zone,
    })
    const read = await first_of(wiring.post.the_requests_waiting(now(), {}))
    if (read?.event !== 'snapshot') throw new Error('no requests waiting read (PST-14)')
    const called_off: string[] = []
    for (const request of read.entries) {
      const why = await why_called_off(wiring, request)
      if (why === undefined) continue
      const input = { request_id: request.id, why }
      const outcomes = await every(
        wiring.post.call_off_a_request(
          {
            ...now(),
            operation: {
              id: zz.operation_id.parse(request.id),
              scope: the_scope_of_the_calling_off,
            },
            correlation: zz.correlation.parse(request.id),
            fingerprint: zz.fingerprint_of({ path: calling_off, input }),
          },
          input,
        ),
      )
      if (outcomes.at(-1)?.outcome === 'applied') called_off.push(request.id)
    }
    return called_off
  }
