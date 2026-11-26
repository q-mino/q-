import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { z } from 'zod'
import type { deliver_a_message } from '../business/chats/_effect.ts'
import type { close_a_message_input } from '../business/chats/_command.ts'
import { message } from '../persona/known/_usecase.ts'
import { known } from '../persona/known/_version.ts'

// The delivery of `deliver_a_message` (MSG-11, EXT-12, F7; part M2), on ping
// pong's model (PNG-6): its world is the peer's leaf `message` on `known`,
// reached through the kernel's port of requests, which sends the request on
// the bond and answers with the peer's response, `no_response` at its time,
// the bond gone, or a refusal (EXT-2). Every case maps onto the office's
// closed set, the input of its return, or exhausts the delivery with its
// reason, a dead letter shown (DOM-15), which the chat tells on the message
// as held (MSG-13); never an exception, so that one peer's response never
// stops the effect toward the other bonds (EXT-12).

/** The effect this delivery delivers, by its path (DOM-24). */
export const the_effect = 'business/chats/effect/deliver_a_message'

/** What the office makes of a message's request: the input of its return, `close_a_message`. */
type returned = z.input<typeof close_a_message_input>

/** What came back of a message, in the office's words. */
type what_came_back = returned['what_came_back']

const the_events_of_message = message[zz.$UseCase].events

/** A whole event of `message`, as the peer's node gives it (`{ event, payload }`). */
const whole = <const name extends string, payload extends z.ZodType>(
  name: name,
  payload: payload,
) => z.strictObject({ event: z.literal(name), payload })

/**
 * What each event of `message` means to the office (EXT-12): exhaustive by
 * the leaf's events, as its tree types them, so that an event added to
 * `message` does not compile here until the business says what it means.
 */
const the_meanings_of_message: {
  readonly [name in keyof typeof the_events_of_message]: (
    event: unknown,
  ) => what_came_back | undefined
} = {
  received: (event) =>
    whole('received', the_events_of_message.received).safeParse(event).success
      ? 'the_message_was_received'
      : undefined,
  not_received: (event) =>
    whole('not_received', the_events_of_message.not_received).safeParse(event).success
      ? 'the_peer_cannot_receive_it'
      : undefined,
}

/**
 * The meaning of a peer's response, a claim (F2): one of `message`'s
 * events, or the kernel's above it (its node's closing, a base event: the
 * peer cannot receive it, EXT-5); none for a response that is neither.
 */
const the_meaning_of = (event: boundary.Json): what_came_back | undefined =>
  boundary.the_kernels_events_on_known.safeParse(event).success
    ? 'the_peer_cannot_receive_it'
    : Object.values(the_meanings_of_message)
        .map((meaning) => meaning(event))
        .find((meant) => meant !== undefined)

/**
 * The delivery of a message (MSG-11): the port of requests called with the
 * bond, `message` at the version of `known` it speaks (its current, EXT-5),
 * the text, the effect's path and the entry's id, the message (from which
 * the kernel composes the request's identity, F7), and its seven days.
 * `responded` with an event of `message` or of the kernel's, `no_response`,
 * and a refusal for messaging not active or not offered to the bond (her own
 * gesture, a message called off: a meaning, EXT-12) are delivered to the
 * return; a response that is neither is exhausted with the peer's event
 * kept; the faults, the bond gone and a refusal of the call undeclared or
 * too large for a letter, are exhausted with their reason: no meaning of
 * the office's, a dead letter the user sees in the extension's mark and on
 * the message, held (MSG-13).
 */
export const the_delivery_of_a_message =
  (port: boundary.Ports['the_port_of_requests']) =>
  async (entry: {
    readonly id: zz.entry_id
    readonly payload: z.output<typeof deliver_a_message>
  }): Promise<zz.Delivered<returned>> => {
    const answer = await port({
      bond: boundary.bond.parse(entry.payload.bond),
      invokes: { persona: 'known', use_case: 'usecase/message', version: known[zz.$Version] },
      input: { text: entry.payload.text },
      effect: the_effect,
      id: entry.id,
      waits: entry.payload.waits,
    })
    const returned = (meant: what_came_back): zz.Delivered<returned> => ({
      outcome: 'delivered',
      returns: {
        bond: entry.payload.bond,
        message_id: entry.payload.message_id,
        what_came_back: meant,
      },
    })
    switch (answer.answer) {
      case 'responded': {
        const meant = the_meaning_of(answer.event)
        return meant === undefined
          ? {
              outcome: 'exhausted',
              reason: `the peer's response is no event of message: ${JSON.stringify(answer.event)}`,
            }
          : returned(meant)
      }
      case 'no_response':
        return returned('the_message_had_no_receipt')
      case 'the_bond_is_gone':
        return { outcome: 'exhausted', reason: 'the bond is gone' }
      case 'refused':
        switch (answer.why) {
          case 'not_active':
          case 'not_offered_to_the_bond':
            return returned('the_message_was_called_off')
          case 'not_declared':
          case 'too_large_for_a_letter':
            return {
              outcome: 'exhausted',
              reason: `the port of requests refused it: ${answer.why}`,
            }
        }
    }
  }
