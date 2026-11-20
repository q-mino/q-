import * as boundary from '@q-mino/boundary'
import type * as post_value from '@q-mino/domains/post/_value.ts'

// The kernel's trace (EXT-6, "The kernel's trace"; F6, F8; part 12.4): the
// entry of the kernel keeps a trace of its own beside the trees' (PER-14),
// since what it traces stands before every tree or around an extension,
// with no leaf of the kernel's read. Its entries are the kernel's type,
// never the library's (`zz.Traced` knows no extension, § 3): each tells
// what came (a request as it came, a call, an event, a frame's message) and
// why, a closed set. A port required at wiring; eventual and without
// guarantees (D54): the fact counts, never the trace. Its reader is the
// user (F6), on the screens of step 15, what concerns an extension in its
// mark (EXT-16). The routing of a letter's request is a pure function here
// (`route`), which the kernel's entry of step 13 wires.

/**
 * A request as it came to the kernel's entry (EXT-6): what it invokes, the
 * letter's identity, the `Caller` `post` gave, the instant, and the version
 * of the surface the asker speaks.
 */
export interface ARequestAsItCame {
  readonly invokes: post_value.invocation
  readonly letter: string
  readonly caller: post_value.caller
  readonly now: string
  readonly version: string
}

/** F8's three cases, the one place where they differ: the request goes no further, and the node stays silent. */
export type ASilence =
  | 'the_extension_is_not_installed'
  | 'the_extension_is_not_active'
  | 'the_extension_is_not_offered_to_the_bond'

/**
 * Why a frame's message was not served (EXT-4, "A frame's fence"): its
 * extension not active, the frame not shown (placed in no screen the user
 * has open), or no message of a frame's (EXT-2).
 */
export type AFence =
  'the_extension_is_not_active' | 'the_frame_is_not_shown' | 'not_a_frames_message'

/**
 * Why an envelope collected at a mailbox of mine went no further (PST-4):
 * no face of mine at that mailbox to open it; else what `post` answered,
 * every outcome but `opened`, a re-addressed letter with its identity and
 * the face whose signature holds.
 */
export type AnEnvelopeNotOpened =
  | {
      readonly outcome:
        'no_face_of_mine_at_the_mailbox' | 'not_an_envelope' | 'not_opened' | 'not_a_letter'
    }
  | { readonly outcome: 're_addressed'; readonly letter: string; readonly signed_by: string }

/**
 * Why a response was not deposited (PST-9, PST-10): their key takes no
 * seal; the relay refused it, with what it said; or no answer came.
 */
export type AResponseNotDeposited =
  | { readonly outcome: 'not_sealed' }
  | { readonly outcome: 'refused'; readonly why: string }
  | { readonly outcome: 'unreachable' }

/**
 * An entry of the kernel's trace (EXT-6), an ADT by `why`, a closed set:
 * - the three silences of F8, with the request as it came;
 * - `a_call_not_declared`: a call of a port its manifest does not touch (EXT-4);
 * - `a_call_not_answered`: a call the kernel could not serve, a fault of the
 *   node's (its storage) or a request `post` does not send (PST-12): the
 *   kernel's, unanswered, so that the extension's delivery waits until its
 *   next load (EXT-15);
 * - `an_event_not_in_the_surface`: an event its surface does not type, or a
 *   second event from a leaf on `known`, which answers in one (EXT-15);
 * - `the_extension_has_fallen`: its first fall (loaded again) or its second
 *   (left stopped, EXT-15);
 * - `a_response_not_awaited`: a response F7 annotates (a second, a late, a
 *   malformed one, one to no request of the node's or from another face),
 *   with what `post` answered (PST-7; step 13);
 * - `a_frame_fenced`: a frame's message the fence refused (EXT-4);
 * - `a_message_not_in_the_boundary`: a message of the extension's that does
 *   not parse, or that pairs no exchange in flight (EXT-2);
 * - `an_envelope_not_opened`: an envelope collected at a mailbox of mine
 *   that goes no further (PST-4, F6): no face of mine at that mailbox, or
 *   what `post` answered, not an envelope, not opened, not a letter, or
 *   re-addressed (the letter's identity and the face that signed it);
 * - `not_a_leaf_of_the_extension`: a request routed to an extension that
 *   has no surface on the persona it names, answered `invalid_request`,
 *   `not_a_leaf` (EXT-4), with the request as it came;
 * - `a_response_not_deposited`: a response the entry wrote and could not
 *   deposit (PST-9): not sealed for their key, refused by the relay (with
 *   what it said), or no answer came; the asker's sending again asks
 *   again (PST-6);
 * - `a_request_not_answered`: a request routed to an extension whose
 *   invocation threw (it fell while serving, or it is not running, EXT-15),
 *   with the request as it came and why: nothing goes back (F8), and the
 *   user sees which request had no answer (F6), beside the fall the
 *   hosting traces.
 */
export type TheKernelsTraced =
  | { readonly why: ASilence; readonly request: ARequestAsItCame }
  | {
      readonly why: 'a_call_not_declared' | 'a_call_not_answered'
      readonly extension: string
      readonly now: string
      readonly call: {
        readonly port: boundary.port
        readonly request: boundary.Json
      }
      readonly fault?: string
    }
  | {
      readonly why: 'an_event_not_in_the_surface'
      readonly extension: string
      readonly now: string
      readonly persona: 'self' | 'known'
      readonly leaf: string
      readonly version: string
      readonly event: boundary.Json
      readonly the_event_is: 'not_typed' | 'after_the_answer'
    }
  | {
      readonly why: 'the_extension_has_fallen'
      readonly extension: string
      readonly now: string
      readonly fall: 'the_first' | 'the_second'
      readonly because: string
    }
  | {
      readonly why: 'a_response_not_awaited'
      readonly response: {
        readonly letter: string
        readonly answers: string
        readonly caller: post_value.caller
        readonly now: string
      }
      readonly answered: boundary.Json
    }
  | {
      readonly why: 'a_frame_fenced'
      readonly extension: string
      readonly now: string
      readonly fence: AFence
      readonly message: boundary.Json
    }
  | {
      readonly why: 'a_message_not_in_the_boundary'
      readonly extension: string
      readonly now: string
      readonly message: boundary.Json
      readonly the_message: 'does_not_parse' | 'pairs_no_exchange'
    }
  | {
      readonly why: 'an_envelope_not_opened'
      readonly came_to: string
      readonly now: string
      readonly opened: AnEnvelopeNotOpened
    }
  | { readonly why: 'not_a_leaf_of_the_extension'; readonly request: ARequestAsItCame }
  | {
      readonly why: 'a_request_not_answered'
      readonly request: ARequestAsItCame
      readonly because: string
    }
  | {
      readonly why: 'a_response_not_deposited'
      readonly response: {
        readonly letter: string
        readonly answers: string
        readonly caller: post_value.caller
        readonly now: string
      }
      readonly answered: AResponseNotDeposited
    }

/** The kernel's trace, a port required at wiring (EXT-6): served by the adapter of the trees' trace, eventual. */
export type TheKernelsTrace = (entry: TheKernelsTraced) => void

/**
 * Where the kernel's entry sends a request (EXT-6, F8), an ADT: to the
 * kernel's persona (its use cases are never silent, D78.2); to an
 * extension's leaf, by its name, through the boundary; or nowhere, the
 * node silent, with the case its trace keeps.
 */
export type Routed =
  | { readonly routed: 'to_the_kernel' }
  | { readonly routed: 'to_an_extension'; readonly extension: string }
  | { readonly routed: 'to_silence'; readonly why: ASilence }

/**
 * The routing of a request by what it invokes (EXT-6, F8), before the gate
 * and before any check that answers: one to the kernel goes to its persona;
 * one to an extension goes on only if the extension is installed (the
 * composition's), active, and offered to the bond of the `Caller`'s key
 * (what auth's lookup tells, `the_extensions_offered_to_the_bond_of_a_key`:
 * none for an `anonymous` letter); else silence, in that order of cases.
 */
export const route = (given: {
  readonly invokes: post_value.invocation
  readonly installed: readonly string[]
  readonly active: readonly string[]
  readonly offered_to_the_bond_of_the_caller: readonly string[]
}): Routed => {
  if (given.invokes.of === 'the_kernel') return { routed: 'to_the_kernel' }
  const extension = given.invokes.extension
  if (!given.installed.includes(extension)) {
    return { routed: 'to_silence', why: 'the_extension_is_not_installed' }
  }
  if (!given.active.includes(extension)) {
    return { routed: 'to_silence', why: 'the_extension_is_not_active' }
  }
  if (!given.offered_to_the_bond_of_the_caller.includes(extension)) {
    return { routed: 'to_silence', why: 'the_extension_is_not_offered_to_the_bond' }
  }
  return { routed: 'to_an_extension', extension }
}

/** A value's JSON text; nothing for `undefined` or a function, which `JSON.stringify`'s type does not tell. */
const stringified = (value: unknown): string | undefined => JSON.stringify(value)

/** A value as the trace keeps it: JSON as `JSON.stringify` writes it (a field `undefined` left out), or its text where it is none. */
export const as_traced = (value: unknown): boundary.Json => {
  try {
    const written = boundary.json.safeParse(JSON.parse(stringified(value) ?? 'null'))
    return written.success ? written.data : String(value)
  } catch {
    return String(value)
  }
}
