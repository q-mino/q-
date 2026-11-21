import * as zz from '@q-mino/domains/library'
import {
  a_letter_in_an_envelope,
  the_identity_of_the_response_to,
  the_letter_in_an_envelope,
  the_operation_of_a_deposit,
  type MailboxPort,
  type Machine,
} from '@q-mino/domains/post/_dsl.ts'
import type * as post_value from '@q-mino/domains/post/_value.ts'
import type { take_a_response } from '@q-mino/domains/post/requests/_usecase.ts'
import type { persona } from '@q-mino/domains/persona/_node.ts'
import type * as persona_value from '@q-mino/domains/persona/_value.ts'
import {
  as_traced,
  route,
  type AnEnvelopeNotOpened,
  type ARequestAsItCame,
  type Routed,
  type TheKernelsTrace,
} from '../extensions/index.ts'

// The kernel's entry (EXT-6, F7, F8, PST-4, PST-7, PST-9, PER-5, PER-23;
// part 13.2): one envelope collected at a mailbox of mine at a time, opened
// by the face of mine at that mailbox (PST-4), or traced as an envelope not
// opened; a response goes to the request it names (PST-7), never to a
// persona; a request is routed by what it invokes (EXT-6): to the kernel's
// persona, by the leaf's path; to an extension's leaves mounted on that
// persona; or nowhere, the node silent (F8), traced. The first event of the
// leaf is the response, answered on the bond of the `Caller`'s key, written,
// sealed and deposited once (PST-9). Its wiring is functions, so that the
// oracle and the phone wire it alike. A fault of a port throws: the
// collector does not advance its position, and a second pass meets the
// duplicate branches (DOM-11), so it is the same.

/** The scope of the kernel's entry's operations (DOM-11): the entry takes a response under the response's identity. */
export const the_scope_of_the_kernels_entry = 'the_kernel_s_entry'

/** The path of the post's use case the entry invokes for a response, for the fingerprint (LIB-10). */
const taking = 'post/requests/usecase/take_a_response'

/**
 * The scope of a request's operation (DOM-11): the persona it names and who
 * asks, the key of a face, or the id of an anonymous letter (PER-4), so that
 * a face sending again meets its operation, and each anonymous envelope is
 * an operation of its own.
 */
export const the_scope_of_a_letter = (
  persona_named: post_value.persona,
  caller: post_value.caller,
): string => `${persona_named}/${caller.is === 'a_face' ? caller.key : caller.id}`

/** What the entry gives the top of every persona of the kernel (PER-23): the root's context and the `Caller`. */
type TheKernelsEntryContext = zz.EntryOf<typeof persona>

/** A persona's tree of the kernel, its leaves by their path from the persona's segment (EXT-5). */
export type APersonasTree = zz.TreePortByPath<TheKernelsEntryContext>

/** An extension's leaves mounted on a persona of the kernel (PER-6, "A mounted folder"). */
export type AnExtensionsLeaves = zz.PortByPath<TheKernelsEntryContext>

/** An event of a leaf, the kernel's or an extension's: what a response carries (F7). */
type ALeafsEvent = { readonly event: string } & Readonly<Record<string, unknown>>

/** A face at my mailbox (PER-22): the key whose signature holds, the mailbox of mine the letter came to. */
export interface AFaceAtMyMailbox {
  readonly face: string
  readonly mailbox: string
}

/**
 * The bond a response goes on (F7, PST-9): kept, with my face that signs
 * (the safe's face id, its key) and theirs with the mailbox they declared
 * (its D, its relays); or none, and the request gets no response.
 */
export type ABondToAnswerOn =
  | {
      readonly bond: 'kept'
      readonly from: { readonly face_id: string; readonly key: string }
      readonly to: {
        readonly key: string
        readonly mailbox: { readonly deposit_address: string; readonly relays: readonly string[] }
      }
    }
  | { readonly bond: 'none' }

/**
 * What the routing reads (EXT-6, EXT-7, F8): the extensions installed (the
 * composition's), those of them active, and those offered to the bond of
 * a face at my mailbox, by name, or not known when the face has no bond
 * there (auth's lookup, `the_extensions_offered_to_the_bond_of_a_key`).
 */
export interface TheRoutingsReads {
  readonly installed: () => Promise<readonly string[]>
  readonly the_active_among: (names: readonly string[]) => Promise<readonly string[]>
  readonly offered_to_the_bond_of_the_caller: (
    caller: AFaceAtMyMailbox,
  ) => Promise<zz.Answer<readonly string[]>>
}

/**
 * The entry's wiring (GR-6): the clock; the post's machine of the face of
 * mine at a mailbox, none where no face of mine is; the kernel's four
 * persona trees, by path; an extension's leaves mounted on a persona, none
 * where it has no surface; the routing's reads; the post's `take_a_response`
 * and its mailbox port; the bond a response goes on; the machine of a face
 * of mine, to sign and seal a response; the kernel's trace (EXT-6).
 */
export interface TheKernelsEntryWiring {
  readonly clock: zz.Clock
  readonly the_machine_at_my_mailbox: (
    mailbox: post_value.deposit_address,
  ) => Promise<Machine | undefined>
  readonly the_personas: Readonly<Record<post_value.persona, APersonasTree>>
  readonly the_leaves_of_an_extension: (
    extension: string,
    persona_named: post_value.persona,
  ) => AnExtensionsLeaves | undefined
  readonly routing: TheRoutingsReads
  readonly post: {
    readonly take_a_response: zz.CommandUseCasePort<typeof take_a_response>
    readonly mailbox: MailboxPort
  }
  readonly the_bond_to_answer_on: (caller: AFaceAtMyMailbox) => Promise<ABondToAnswerOn>
  readonly machine_of: (face_id: string) => Machine
  readonly trace: TheKernelsTrace
}

/** An envelope collected at a mailbox of mine, as the collector gives it: the mailbox's D and the envelope's text. */
export interface AnEnvelopeCollected {
  readonly came_to: post_value.deposit_address
  readonly envelope: string
}

/** A letter opened at a mailbox of mine (PST-4): the letter, the `Caller` `post` gave, the machine that opened it. */
interface ALetterOpened {
  readonly outcome: 'opened'
  readonly letter: post_value.letter
  readonly caller: post_value.caller
  readonly machine: Machine
}

/** A request, with who asks and where it came. */
interface ARequest {
  readonly request: post_value.request
  readonly caller: post_value.caller
  readonly came_to: post_value.deposit_address
  readonly machine: Machine
}

/** The first event of a stream, its rest let go; none for a stream that ends with none. */
const the_first_event_of = async (
  events: AsyncIterable<ALeafsEvent>,
): Promise<ALeafsEvent | undefined> => {
  for await (const event of events) return event
  return undefined
}

/** The last event of a stream, once it ends: a command's outcome. */
const the_last_of = async <event>(events: AsyncIterable<event>): Promise<event | undefined> => {
  let last: event | undefined = undefined
  for await (const event of events) last = event
  return last
}

/**
 * The persona's `Caller` from the post's (PER-23): a face, by its key, to
 * the mailbox of mine the letter came to; anonymous, its id and its
 * annotation, to that mailbox.
 */
const the_personas_caller = (
  caller: post_value.caller,
  came_to: post_value.deposit_address,
): persona_value.caller =>
  caller.is === 'a_face'
    ? { is: 'a_face', key: caller.key, to_my_mailbox: came_to }
    : { is: 'anonymous', id: caller.id, annotation: caller.annotation, to_my_mailbox: came_to }

/**
 * The kernel's entry (EXT-6; part 13.2), one envelope at a time:
 * 1. an envelope came: opened by the face of mine at the mailbox it came
 *    to; none, or every outcome of `post` but `opened`, traced
 *    (`an_envelope_not_opened`), never further (PST-4);
 * 2. a response came (F7, PST-7): an anonymous one never taken, traced;
 *    else taken under its identity in the entry's scope, and what is not
 *    applied traced (`a_response_not_awaited`, with what `post` answered);
 * 3. a request came: routed (`route`, F8; an anonymous `Caller`, or a face
 *    whose offers are not known, has none offered); silent, traced with
 *    its case; to the kernel, its persona's tree by the leaf's path; to an
 *    extension, its leaves mounted on that persona, none `invalid_request`,
 *    `not_a_leaf` (EXT-4), traced; the context the `Caller`, the version
 *    the request names, its operation (its identity, in the scope of the
 *    persona and who asks) and its correlation (its identity). The answer
 *    is the leaf's first event; an extension's invocation that throws (it
 *    fell, it is not running) answers nothing (F8, EXT-15), the request
 *    traced as not answered (F6), the fall the hosting's;
 * 4. the answer on the bond (F7, PST-9): only to a face; no bond with it at
 *    that mailbox, none; else the response written from my face to their
 *    mailbox, sealed for their key and deposited once under the
 *    operation of PST-11; not sealed, refused or unreachable, traced
 *    (`a_response_not_deposited`): the asker's sending again asks again
 *    (PST-6).
 * A fault of a port, the kernel's trees included, throws.
 */
export const the_kernels_entry = (
  wiring: TheKernelsEntryWiring,
): ((collected: AnEnvelopeCollected) => Promise<void>) => {
  const now = () => wiring.clock.now()
  const when = (): zz.RootContext => ({
    now: zz.in_zone(wiring.clock.time_zone)(wiring.clock.now()),
    time_zone: wiring.clock.time_zone,
  })

  /** 1. An envelope came (PST-4): the letter, its `Caller` and the machine that opened it, or why it goes no further. */
  const an_envelope_came = async (
    collected: AnEnvelopeCollected,
  ): Promise<ALetterOpened | AnEnvelopeNotOpened> => {
    const machine = await wiring.the_machine_at_my_mailbox(collected.came_to)
    if (machine === undefined) return { outcome: 'no_face_of_mine_at_the_mailbox' }
    const opened = await the_letter_in_an_envelope(machine)(collected.came_to, collected.envelope)
    switch (opened.outcome) {
      case 'opened':
        return { outcome: 'opened', letter: opened.letter, caller: opened.caller, machine }
      case 're_addressed':
        return {
          outcome: 're_addressed',
          letter: opened.letter.identity,
          signed_by: opened.signed_by,
        }
      default:
        return { outcome: opened.outcome }
    }
  }

  /** 2. A response came (F7, PST-7): taken under its identity, or annotated; never a persona. */
  const a_response_came = async (
    response: post_value.response,
    caller: post_value.caller,
  ): Promise<void> => {
    const as_it_came = { letter: response.identity, answers: response.answers, caller, now: now() }
    if (caller.is === 'anonymous') {
      wiring.trace({
        why: 'a_response_not_awaited',
        response: as_it_came,
        answered: 'anonymous, never taken',
      })
      return
    }
    const input = { request_id: response.answers, from: caller.key, event: response.event }
    const outcomes = wiring.post.take_a_response(
      {
        ...when(),
        operation: {
          id: zz.operation_id.parse(response.identity),
          scope: the_scope_of_the_kernels_entry,
        },
        // The chain of the request it answers (DOM-10), whose identity the port sent it under.
        correlation: zz.correlation.parse(response.answers),
        fingerprint: zz.fingerprint_of({ path: taking, input }),
      },
      input,
    )
    const taken = await the_last_of(outcomes)
    if (taken?.outcome === 'applied') return
    wiring.trace({
      why: 'a_response_not_awaited',
      response: as_it_came,
      answered: as_traced(taken),
    })
  }

  /** The extensions offered to the bond of who asks (EXT-6): none for an anonymous letter, nor for a face whose offers are not known (F8). */
  const offered_to = async (
    caller: post_value.caller,
    came_to: post_value.deposit_address,
  ): Promise<readonly string[]> => {
    if (caller.is === 'anonymous') return []
    const offered = await wiring.routing.offered_to_the_bond_of_the_caller({
      face: caller.key,
      mailbox: came_to,
    })
    return offered.answer === 'known' ? offered.value : []
  }

  /** The request routed by what it invokes (EXT-6, F8), before the gate. */
  const routed_by_what_it_invokes = async (asked: ARequest): Promise<Routed> => {
    const installed = await wiring.routing.installed()
    return route({
      invokes: asked.request.invokes,
      installed,
      active: await wiring.routing.the_active_among(installed),
      offered_to_the_bond_of_the_caller: await offered_to(asked.caller, asked.came_to),
    })
  }

  /**
   * 3. A request came (EXT-6, F8): its answer, the leaf's first event; none
   * for a silence, traced, or an extension's invocation that throws.
   */
  const a_request_came = async (asked: ARequest): Promise<ALeafsEvent | undefined> => {
    const { request, caller } = asked
    const as_it_came: ARequestAsItCame = {
      invokes: request.invokes,
      letter: request.identity,
      caller,
      now: now(),
      version: request.invokes.version,
    }
    const routed = await routed_by_what_it_invokes(asked)
    const context = {
      ...when(),
      caller: the_personas_caller(caller, asked.came_to),
      declared_at: request.declared_at,
      version: zz.semver.parse(request.invokes.version),
      operation: {
        id: zz.operation_id.parse(request.identity),
        scope: the_scope_of_a_letter(request.invokes.persona, caller),
      },
      correlation: zz.correlation.parse(request.identity),
    }
    const leaf = { leaf: request.invokes.use_case, input: request.input }
    switch (routed.routed) {
      case 'to_silence':
        wiring.trace({ why: routed.why, request: as_it_came })
        return undefined
      case 'to_the_kernel':
        return the_first_event_of(wiring.the_personas[request.invokes.persona](context, leaf))
      case 'to_an_extension': {
        const leaves = wiring.the_leaves_of_an_extension(routed.extension, request.invokes.persona)
        if (leaves === undefined) {
          wiring.trace({ why: 'not_a_leaf_of_the_extension', request: as_it_came })
          return { event: 'invalid_request', reason: 'not_a_leaf' }
        }
        try {
          return await the_first_event_of(leaves(context, leaf))
        } catch (fault) {
          // It fell, or it is not running: no response (F8, EXT-15). The hosting traces a fall;
          // the request unanswered is the entry's to trace (F6), a fall or not.
          wiring.trace({
            why: 'a_request_not_answered',
            request: as_it_came,
            because: fault instanceof Error ? fault.message : String(fault),
          })
          return undefined
        }
      }
    }
  }

  /** 4. The answer on the bond (F7, PST-9): written, sealed and deposited once, or traced. */
  const answered_on_the_bond = async (asked: ARequest, event: ALeafsEvent): Promise<void> => {
    const { request, caller, machine } = asked
    if (caller.is !== 'a_face') return
    const bond = await wiring.the_bond_to_answer_on({ face: caller.key, mailbox: asked.came_to })
    if (bond.bond === 'none') return
    const identity = the_identity_of_the_response_to(machine)(request.identity)
    const their_mailbox = bond.to.mailbox
    const response: post_value.letter = {
      is: 'a_response',
      schema: 1,
      identity,
      from: bond.from.key,
      to: their_mailbox.deposit_address,
      declared_at: now(),
      answers: request.identity,
      event,
    }
    const not_deposited = { letter: identity, answers: request.identity, caller, now: now() }
    const sealed = await a_letter_in_an_envelope(wiring.machine_of(bond.from.face_id))(
      response,
      bond.to.key,
    )
    if (sealed.outcome === 'not_sealed') {
      wiring.trace({
        why: 'a_response_not_deposited',
        response: not_deposited,
        answered: { outcome: 'not_sealed' },
      })
      return
    }
    const deposited = await wiring.post.mailbox.deposit({
      operation: the_operation_of_a_deposit(machine)(identity, their_mailbox.deposit_address),
      deposit_address: their_mailbox.deposit_address,
      relays: [...their_mailbox.relays],
      envelope: sealed.envelope,
    })
    switch (deposited.outcome) {
      case 'kept':
      case 'kept_already':
        return
      case 'refused':
      case 'unreachable':
        wiring.trace({
          why: 'a_response_not_deposited',
          response: not_deposited,
          answered: deposited,
        })
    }
  }

  return async (collected) => {
    const opened = await an_envelope_came(collected)
    if (opened.outcome !== 'opened') {
      // PST-4, F6: it goes no further, traced.
      wiring.trace({
        why: 'an_envelope_not_opened',
        came_to: collected.came_to,
        now: now(),
        opened,
      })
      return
    }
    const { letter, caller, machine } = opened
    if (letter.is === 'a_response') {
      await a_response_came(letter, caller)
      return
    }
    const asked: ARequest = { request: letter, caller, came_to: collected.came_to, machine }
    const answer = await a_request_came(asked)
    if (answer !== undefined) await answered_on_the_bond(asked, answer)
  }
}
