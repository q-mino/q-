import { z } from 'zod'
import {
  command,
  identity_of,
  NOT,
  pick,
  dsl,
  effect,
  fact,
  id,
  predicate,
  value,
} from './_scope_command.ts'

/** No greeting has this identity: the node has not sent it. */
export const the_greeting_is_new = NOT(predicate.a_greeting_has_this_id)

/**
 * Anna greets her bond with Bruno (EXT-12, EXT-16): from the action on
 * their bond's screen, which gives the bond alone, the office sends her
 * greeting, named by the operation that sends it, and asks Bruno's node for
 * a greeting back, waiting 60 seconds. Asked again under the same
 * operation, it is the recorded fact (DOM-11).
 */
export const greet_a_bond = command({
  input: z.strictObject({
    bond: id.bond,
  }),
  outcomes: {
    the_greeting_is_new_so_it_is_sent: [
      the_greeting_is_new,
      fact.a_bond_has_been_greeted,
      pick(effect, 'ask_for_a_greeting_back'),
    ],
  },
  creator: (context) => (input) => {
    const greeting_id = identity_of(id.greeting_id)(context.operation)
    return {
      the_greeting_is_new_so_it_is_sent: [
        { greeting_id },
        {
          greeting: {
            id: greeting_id,
            bond: input.bond,
            words: dsl.the_words_of_a_greeting,
            progress: { stage: 'waiting' },
          },
        },
        {
          ask_for_a_greeting_back: {
            id: greeting_id,
            payload: {
              greeting_id,
              bond: input.bond,
              words: dsl.the_words_of_a_greeting,
              waits: dsl.a_greeting_waits,
            },
          },
        },
      ],
    }
  },
})

/**
 * What came back of Anna's greeting closes it (EXT-12, DOM-13): Bruno's
 * greeting back, with its words; no response within its 60 seconds; or a
 * peer that cannot answer it. The return of `ask_for_a_greeting_back`, its
 * input the business's closed set, which the fact keeps as it is, as a
 * returned loan keeps its condition. A greeting that waits no more (closed,
 * or never sent) is refused: a dead letter of the executor, shown.
 */
export const close_a_greeting = command({
  input: z.strictObject({
    greeting_id: id.greeting_id,
    outcome: value.outcome,
  }),
  outcomes: {
    the_greeting_waits_so_it_is_closed: [
      predicate.the_greeting_waits,
      fact.a_greeting_has_been_closed,
    ],
  },
  creator: () => (input) => ({
    the_greeting_waits_so_it_is_closed: [
      { greeting_id: input.greeting_id },
      { greeting_id: input.greeting_id, outcome: input.outcome },
    ],
  }),
})

/** No greeting back has this identity: the node has not answered this request. */
export const the_greeting_back_is_new = NOT(predicate.a_greeting_back_has_this_id)

/**
 * Bruno's node greets Anna back (EXT-12, F7): her greeting came on their
 * bond, and the office answers it with its own words, named by the
 * operation of her request. Her request sent again is the same operation:
 * the recorded fact, the same greeting back (DOM-11).
 */
export const greet_a_bond_back = command({
  input: z.strictObject({
    bond: id.bond,
    their_words: value.words,
  }),
  outcomes: {
    the_greeting_back_is_new_so_it_is_sent: [
      the_greeting_back_is_new,
      fact.a_bond_has_been_greeted_back,
    ],
  },
  creator: (context) => (input) => {
    const greeting_back_id = identity_of(id.greeting_back_id)(context.operation)
    return {
      the_greeting_back_is_new_so_it_is_sent: [
        { greeting_back_id },
        {
          greeting_back: {
            id: greeting_back_id,
            bond: input.bond,
            their_words: input.their_words,
            words: dsl.the_words_of_a_greeting_back,
          },
        },
      ],
    }
  },
})
