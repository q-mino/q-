import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { z } from 'zod'
import type { ask_for_a_greeting_back } from '../business/greetings/_effect.ts'
import type { close_a_greeting_input } from '../business/greetings/_command.ts'
import { greet } from '../persona/known/_usecase.ts'
import { known } from '../persona/known/_version.ts'

// The delivery of `ask_for_a_greeting_back` (EXT-12, F7; part 12.4): its
// world is the peer's leaf `greet` on `known`, reached through the kernel's
// port of requests, which sends the request on the bond and answers with
// the peer's response, `no_response` at its time, the bond gone, or a
// refusal (EXT-2). Every case maps onto the business's closed set, the
// input of its return, a refusal of the user's own gesture included (not
// active, not offered to the bond: a meaning, EXT-12), or exhausts the
// delivery with its reason, a dead letter shown (DOM-15), only for a fault;
// never an exception, so that one peer's response never stops the effect
// toward the other bonds (EXT-12).

/** The effect this delivery delivers, by its path (DOM-24). */
export const the_effect = 'business/greetings/effect/ask_for_a_greeting_back'

/** What the business makes of a greeting's request: the input of its return, `close_a_greeting`. */
type returned = z.input<typeof close_a_greeting_input>

/** What came back of a greeting, in the business's words. */
type outcome = returned['outcome']

const the_events_of_greet = greet[zz.$UseCase].events

/** A whole event of `greet`, as the peer's node gives it (`{ event, payload }`). */
const whole = <const name extends string, payload extends z.ZodType>(
  name: name,
  payload: payload,
) => z.strictObject({ event: z.literal(name), payload })

/**
 * What each event of `greet` means to the office (EXT-12): exhaustive by
 * the leaf's events, as its tree types them, so that an event added to
 * `greet` does not compile here until the business says what it means.
 */
const the_meanings_of_greet: {
  readonly [name in keyof typeof the_events_of_greet]: (event: unknown) => outcome | undefined
} = {
  greeted_back: (event) => {
    const parsed = whole('greeted_back', the_events_of_greet.greeted_back).safeParse(event)
    return parsed.success
      ? { outcome: 'the_greeting_came_back', words: parsed.data.payload.words }
      : undefined
  },
  not_greeted_back: (event) =>
    whole('not_greeted_back', the_events_of_greet.not_greeted_back).safeParse(event).success
      ? { outcome: 'the_peer_cannot_answer' }
      : undefined,
}

/**
 * The meaning of a peer's response, a claim (F2): one of `greet`'s events,
 * or the kernel's above it (its node's closing, a base event: the peer
 * cannot answer, EXT-5); none for a response that is neither.
 */
const the_meaning_of = (event: boundary.Json): outcome | undefined =>
  boundary.the_kernels_events_on_known.safeParse(event).success
    ? { outcome: 'the_peer_cannot_answer' }
    : Object.values(the_meanings_of_greet)
        .map((meaning) => meaning(event))
        .find((meant) => meant !== undefined)

/**
 * The delivery of a request for a greeting back (EXT-12): the port of
 * requests called with the bond, `greet` at the version of `known` it
 * speaks (its current, EXT-5), the greeting's words, the effect's path and
 * the entry's id (from which the kernel composes the request's identity,
 * F7), and the time the greeting waits. `responded` with an event of
 * `greet` or of the kernel's, `no_response`, and a refusal for the
 * extension not active or not offered to the bond (a greeting called off,
 * A, 21 Nov 2026) are delivered to the return; a response that is neither
 * is exhausted with the peer's event kept; the faults, the bond gone and a
 * refusal of the call undeclared or too large for a letter, are exhausted
 * with their reason.
 */
export const the_delivery_of_a_request_for_a_greeting_back =
  (port: boundary.Ports['the_port_of_requests']) =>
  async (entry: {
    readonly id: zz.entry_id
    readonly payload: z.output<typeof ask_for_a_greeting_back>
  }): Promise<zz.Delivered<returned>> => {
    const answer = await port({
      bond: boundary.bond.parse(entry.payload.bond),
      invokes: { persona: 'known', use_case: 'usecase/greet', version: known[zz.$Version] },
      input: { words: entry.payload.words },
      effect: the_effect,
      id: entry.id,
      waits: entry.payload.waits,
    })
    const returned = (meant: outcome): zz.Delivered<returned> => ({
      outcome: 'delivered',
      returns: { greeting_id: entry.payload.greeting_id, outcome: meant },
    })
    switch (answer.answer) {
      case 'responded': {
        const meant = the_meaning_of(answer.event)
        return meant === undefined
          ? {
              outcome: 'exhausted',
              reason: `the peer's response is no event of greet: ${JSON.stringify(answer.event)}`,
            }
          : returned(meant)
      }
      case 'no_response':
        return returned({ outcome: 'the_greeting_had_no_response' })
      case 'the_bond_is_gone':
        return { outcome: 'exhausted', reason: 'the bond is gone' }
      case 'refused':
        switch (answer.why) {
          case 'not_active':
          case 'not_offered_to_the_bond':
            return returned({ outcome: 'the_greeting_was_called_off' })
          case 'not_declared':
          case 'too_large_for_a_letter':
            return {
              outcome: 'exhausted',
              reason: `the port of requests refused it: ${answer.why}`,
            }
        }
    }
  }
