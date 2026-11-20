import type * as zz from '@q-mino/domains/library'
import * as user_value from '@q-mino/domains/user/_value.ts'
import { z } from 'zod'
import type { ANotice } from '../extensions/hosting.ts'
import type { ARequestAsItCame, TheKernelsTraced } from '../extensions/the_kernels_trace.ts'

// The port of `user`'s news (USR-8, F6, DOM-15; part 15.2): nothing happens
// in silence. What the executors and the reactions hold, what the
// extensions tell in their notices, what the kernel's and the trees' traces
// keep, told her in her words (`user/value.ts`), with exhaustive maps:
// every cause of a dead letter, every reason of the kernel's trace. The
// trace is eventual and without guarantees (F6, D54): these are no facts of
// hers, read from where they are kept. The paper's word is never shown
// (D67).

/** The name of a held letter of the kernel's (DOM-15): its effect's path and its entry's id, as an extension names its own (EXT-2). */
export const the_name_of_a_letter = (letter: {
  readonly entry: { readonly effect: string; readonly id: string }
}): string => `${letter.entry.effect}/${letter.entry.id}`

/** The name of a held part of a reaction's: its reaction's path, the fact's position and the part. */
export const the_name_of_a_part = (part: zz.ReactionDeadLetter): string =>
  `${part.reaction}/${String(part.position)}/${String(part.part)}`

/** The office a path is of: what stands before its kind's segment (`user/activities` of `user/activities/effect/…`). */
const the_office_of = (path: string): string =>
  path.split(/\/(?:effect|reaction)\//)[0] ?? path

/** The last segment of a path: what the letter was. */
const the_last_of = (path: string): string => path.split('/').at(-1) ?? path

/** Why an executor's dead letter is held (DOM-15), in her words: one case per cause. */
const why_an_entry_is_held = (
  cause: zz.EffectDeadLetter['cause'],
): user_value.why_it_is_held => {
  switch (cause.cause) {
    case 'exhausted':
      return { why: 'it_could_not_be_delivered', because: cause.reason.slice(0, 1024) }
    case 'rejected':
      return { why: 'what_came_back_was_refused' }
    case 'identity_already_used':
      return { why: 'it_was_done_otherwise_before' }
    case 'invalid_request':
      return { why: 'the_app_could_not_read_what_came_back' }
  }
}

/** Why a reaction's dead letter is held, in her words: what it did was refused, done otherwise before, or not read. */
const why_a_part_is_held = (cause: zz.ReactionDeadLetter['cause']): user_value.why_it_is_held => {
  switch (cause.cause) {
    case 'rejected':
      return { why: 'what_came_back_was_refused' }
    case 'identity_already_used':
      return { why: 'it_was_done_otherwise_before' }
    case 'invalid_request':
      return { why: 'the_app_could_not_read_what_came_back' }
  }
}

/** A dead letter of the kernel's executors (DOM-15), `user`'s own among them, as she is told it. */
export const a_held_letter_of_an_executor = (
  letter: zz.EffectDeadLetter,
): user_value.a_held_letter => ({
  whose: { of: 'the_kernel', office: the_office_of(letter.entry.effect) },
  letter: the_name_of_a_letter(letter),
  what: the_last_of(letter.entry.effect),
  why: why_an_entry_is_held(letter.cause),
})

/** A dead letter of the kernel's reactions (DOM-16), as she is told it. */
export const a_held_letter_of_a_reaction = (
  part: zz.ReactionDeadLetter,
): user_value.a_held_letter => ({
  whose: { of: 'the_kernel', office: the_office_of(part.reaction) },
  letter: the_name_of_a_part(part),
  what: the_last_of(part.reaction),
  why: why_a_part_is_held(part.cause),
})

/** The cause an extension claims for its dead letter (EXT-2, F2): the library's, as JSON; any other, a delivery that could not be read. */
const an_extensions_cause = z.discriminatedUnion('cause', [
  z.object({ cause: z.literal('exhausted'), reason: z.string() }),
  z.object({ cause: z.literal('rejected') }),
  z.object({ cause: z.literal('identity_already_used') }),
  z.object({ cause: z.literal('invalid_request') }),
])

/** Why an extension's letter is held, from the cause it claims (F2: told, not checked). */
const why_its_letter_is_held = (cause: unknown): user_value.why_it_is_held => {
  const claimed = an_extensions_cause.safeParse(cause)
  if (!claimed.success) return { why: 'it_could_not_be_delivered', because: '' }
  switch (claimed.data.cause) {
    case 'exhausted':
      return { why: 'it_could_not_be_delivered', because: claimed.data.reason.slice(0, 1024) }
    case 'rejected':
      return { why: 'what_came_back_was_refused' }
    case 'identity_already_used':
      return { why: 'it_was_done_otherwise_before' }
    case 'invalid_request':
      return { why: 'the_app_could_not_read_what_came_back' }
  }
}

/** A dead letter an extension's notices tell (EXT-2), shown in its mark (EXT-16). */
type ADeadLetterNotice = Extract<ANotice['notice'], { readonly message: 'dead_letter' }>

/**
 * The letters an extension holds, as its notices tell them (EXT-2): each
 * `dead_letter` not `released` since, the last told of each, in the order
 * they were first told.
 */
export const the_letters_an_extension_holds = (
  notices: readonly ANotice[],
): readonly { readonly extension: string; readonly notice: ADeadLetterNotice }[] => {
  const held = new Map<string, { readonly extension: string; readonly notice: ADeadLetterNotice }>()
  for (const told of notices) {
    const notice = told.notice
    if (notice.message === 'dead_letter')
      held.set(`${told.extension}\u0000${notice.letter}`, { extension: told.extension, notice })
    else if (notice.message === 'released') held.delete(`${told.extension}\u0000${notice.letter}`)
  }
  return [...held.values()]
}

/** An extension's held letter, as she is told it. */
export const a_held_letter_of_an_extension = (held: {
  readonly extension: string
  readonly notice: ADeadLetterNotice
}): user_value.a_held_letter =>
  user_value.a_held_letter.parse({
    whose: { of: 'an_extension', extension: held.extension },
    letter: held.notice.letter,
    what: the_last_of(held.notice.path),
    why: why_its_letter_is_held(held.notice.cause),
  })

/**
 * Every letter held on the node, as she is told them (USR-8): the
 * executors' dead letters (an entry waiting behind one is not a letter of
 * its own), the reactions', the extensions' by their notices.
 */
export const the_held_letters = (held: {
  readonly entries: readonly zz.HeldEntry[]
  readonly parts: readonly zz.HeldPart[]
  readonly notices: readonly ANotice[]
}): readonly user_value.a_held_letter[] => [
  ...held.entries.flatMap((entry) =>
    entry.held === 'dead_letter' ? [a_held_letter_of_an_executor(entry)] : [],
  ),
  ...held.parts.flatMap((part) =>
    part.held === 'dead_letter' ? [a_held_letter_of_a_reaction(part)] : [],
  ),
  ...the_letters_an_extension_holds(held.notices).map(a_held_letter_of_an_extension),
]

/** The extension a request invokes, if it invokes one (EXT-6). */
const the_extension_invoked = (request: ARequestAsItCame): string =>
  request.invokes.of === 'an_extension' ? request.invokes.extension : ''

/**
 * An entry of the kernel's trace in her words (USR-8, EXT-6), one case per
 * reason, exhaustive: a request that met silence (with its case, F8), a
 * letter that could not be opened, a response that came unasked, a letter
 * refused, a response not sent, an extension doing what it does not
 * declare, an extension's fall, a request not answered.
 */
export const what_happened_in_the_kernel = (
  traced: TheKernelsTraced,
): user_value.what_happened_without_a_fact => {
  switch (traced.why) {
    case 'the_extension_is_not_installed':
    case 'the_extension_is_not_active':
    case 'the_extension_is_not_offered_to_the_bond':
      return {
        happened: 'a_request_met_silence',
        extension: the_extension_invoked(traced.request),
        because: traced.why,
      }
    case 'an_envelope_not_opened':
      return { happened: 'a_letter_could_not_be_opened' }
    case 'a_response_not_awaited':
      return { happened: 'a_response_came_unasked' }
    case 'not_a_leaf_of_the_extension':
      return {
        happened: 'a_letter_was_refused',
        leaf: traced.request.invokes.use_case.slice(0, 256),
      }
    case 'a_response_not_deposited':
      return { happened: 'a_response_could_not_be_sent' }
    case 'a_call_not_declared':
    case 'an_event_not_in_the_surface':
    case 'a_frame_fenced':
    case 'a_message_not_in_the_boundary':
      return { happened: 'an_extension_did_what_it_does_not_declare', extension: traced.extension }
    case 'the_extension_has_fallen':
      return { happened: 'an_extension_fell', extension: traced.extension, fall: traced.fall }
    case 'a_call_not_answered':
      return { happened: 'a_request_was_not_answered', extension: traced.extension }
    case 'a_request_not_answered':
      return {
        happened: 'a_request_was_not_answered',
        extension: the_extension_invoked(traced.request),
      }
  }
}

/**
 * An entry of a tree's trace in her words (PER-14): a letter refused by the
 * persona it named, its leaf. One of `self`'s is her own request, which
 * the end of her activity tells her (USR-3): none here.
 */
export const what_happened_in_a_tree = (
  traced: zz.Traced<unknown>,
): user_value.what_happened_without_a_fact | undefined =>
  traced.operation?.scope === 'self/the_user' || traced.path.startsWith('persona/self/')
    ? undefined
    : { happened: 'a_letter_was_refused', leaf: traced.path.slice(0, 256) }
