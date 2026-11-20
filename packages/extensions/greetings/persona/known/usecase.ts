import { z } from 'zod'
import { command_use_case_over, greetings, value } from './_scope_usecase.ts'

// The use cases of `known`, the leaves the test extension adds to a bonded
// face's persona (EXT-1), below the kernel's node, which gives the bond the
// request came on (`context.bond`, EXT-11). Each answers in one event: no
// `follows` (F7).

/**
 * Anna's greeting reaches Bruno's node on their bond (F7): the office
 * greets her back, and the leaf answers with its words, the response to her
 * request.
 */
export const greet = command_use_case_over({
  use_case: greetings.usecase.greet_a_bond_back,
  input: z.strictObject({ words: value.words }),
  creator: (context) => (input) => ({ bond: context.bond, their_words: input.words }),
  events: {
    greeted_back: z.strictObject({ words: value.words }),
    /** Never in the test extension: a greeting back is named by its request; a leaf still names its rejection. */
    not_greeted_back: z.strictObject({}),
  },
  projection: {
    the_greeting_back_is_new_so_it_is_sent: (fact) => ({
      event: 'greeted_back',
      payload: { words: fact.greeting_back.words },
    }),
    rejected: () => ({ event: 'not_greeted_back', payload: {} }),
  },
})
