import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { z } from 'zod'
import type { ask_for_a_pong } from '../business/pings/_effect.ts'
import type { close_a_ping_input } from '../business/pings/_command.ts'
import { ping } from '../persona/known/_usecase.ts'
import { known } from '../persona/known/_version.ts'

// The delivery of `ask_for_a_pong` (PNG-6, EXT-12, F7; part 14.1): its
// world is the peer's leaf `ping` on `known`, reached through the kernel's
// port of requests, which sends the request on the bond and answers with
// the peer's response, `no_response` at its time, the bond gone, or a
// refusal (EXT-2). Every case maps onto the business's closed set, the
// input of its return, or exhausts the delivery with its reason, a dead
// letter shown (DOM-15); never an exception, so that one peer's response
// never stops the effect toward the other bonds (EXT-12).

/** The effect this delivery delivers, by its path (DOM-24). */
export const the_effect = 'business/pings/effect/ask_for_a_pong'

/** What the business makes of a ping's request: the input of its return, `close_a_ping`. */
type returned = z.input<typeof close_a_ping_input>

/** What came back of a ping, in the business's words. */
type what_came_back = returned['what_came_back']

const the_events_of_ping = ping[zz.$UseCase].events

/** A whole event of `ping`, as the peer's node gives it (`{ event, payload }`). */
const whole = <const name extends string, payload extends z.ZodType>(
  name: name,
  payload: payload,
) => z.strictObject({ event: z.literal(name), payload })

/**
 * What each event of `ping` means to the office (EXT-12): exhaustive by the
 * leaf's events, as its tree types them, so that an event added to `ping`
 * does not compile here until the business says what it means.
 */
const the_meanings_of_ping: {
  readonly [name in keyof typeof the_events_of_ping]: (event: unknown) => what_came_back | undefined
} = {
  pong: (event) =>
    whole('pong', the_events_of_ping.pong).safeParse(event).success
      ? 'the_pong_came_back'
      : undefined,
  no_pong: (event) =>
    whole('no_pong', the_events_of_ping.no_pong).safeParse(event).success
      ? 'the_peer_cannot_answer'
      : undefined,
}

/**
 * The meaning of a peer's response, a claim (F2): one of `ping`'s events,
 * or the kernel's above it (its node's closing, a base event: the peer
 * cannot answer, EXT-5); none for a response that is neither.
 */
const the_meaning_of = (event: boundary.Json): what_came_back | undefined =>
  boundary.the_kernels_events_on_known.safeParse(event).success
    ? 'the_peer_cannot_answer'
    : Object.values(the_meanings_of_ping)
        .map((meaning) => meaning(event))
        .find((meant) => meant !== undefined)

/**
 * The delivery of a request for a pong (EXT-12): the port of requests
 * called with the bond, `ping` at the version of `known` it speaks (its
 * current, EXT-5), no input, the effect's path and the entry's id (from
 * which the kernel composes the request's identity, F7), and the time the
 * ping waits. `responded` with an event of `ping` or of the kernel's,
 * `no_response`, and a refusal for ping pong not active or not offered to
 * the bond (her own gesture, a ping called off: a meaning, EXT-12; A, 21
 * Nov 2026) are delivered to the return; a response that is neither is
 * exhausted with the peer's event kept; the faults, the bond gone and a
 * refusal of the call undeclared or too large for a letter, are exhausted
 * with their reason: no meaning of the business's, a dead letter the user
 * sees in the extension's mark and may redeliver (EXT-2).
 */
export const the_delivery_of_a_request_for_a_pong =
  (port: boundary.Ports['the_port_of_requests']) =>
  async (entry: {
    readonly id: zz.entry_id
    readonly payload: z.output<typeof ask_for_a_pong>
  }): Promise<zz.Delivered<returned>> => {
    const answer = await port({
      bond: boundary.bond.parse(entry.payload.bond),
      invokes: { persona: 'known', use_case: 'usecase/ping', version: known[zz.$Version] },
      input: {},
      effect: the_effect,
      id: entry.id,
      waits: entry.payload.waits,
    })
    const returned = (meant: what_came_back): zz.Delivered<returned> => ({
      outcome: 'delivered',
      returns: { ping_id: entry.payload.ping_id, what_came_back: meant },
    })
    switch (answer.answer) {
      case 'responded': {
        const meant = the_meaning_of(answer.event)
        return meant === undefined
          ? {
              outcome: 'exhausted',
              reason: `the peer's response is no event of ping: ${JSON.stringify(answer.event)}`,
            }
          : returned(meant)
      }
      case 'no_response':
        return returned('the_ping_had_no_response')
      case 'the_bond_is_gone':
        return { outcome: 'exhausted', reason: 'the bond is gone' }
      case 'refused':
        switch (answer.why) {
          case 'not_active':
          case 'not_offered_to_the_bond':
            return returned('the_ping_was_called_off')
          case 'not_declared':
          case 'too_large_for_a_letter':
            return {
              outcome: 'exhausted',
              reason: `the port of requests refused it: ${answer.why}`,
            }
        }
    }
  }
