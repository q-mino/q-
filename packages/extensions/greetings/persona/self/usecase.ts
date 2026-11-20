import { z } from 'zod'
import { command_use_case_over, greetings } from './_scope_usecase.ts'

// The use cases of `self`, the leaves the test extension adds to the local
// user's persona (EXT-1, EXT-16), below the kernel's node, which gives the
// root's context alone (EXT-11).

/**
 * Anna taps "Saluta" on the screen of her bond with Bruno (EXT-16): the
 * action invokes this leaf with the place's data, the bond, and her greeting
 * goes, waiting for Bruno's greeting back.
 */
export const greet_a_bond = command_use_case_over({
  use_case: greetings.usecase.greet_a_bond,
  input: z.strictObject({ bond: greetings.id.bond }),
  creator: () => (input) => ({ bond: input.bond }),
  events: {
    the_greeting_is_sent: z.strictObject({ greeting_id: greetings.id.greeting_id }),
    /** Never in the test extension: a greeting is named by its operation; a leaf still names its rejection. */
    the_greeting_cannot_be_sent: z.strictObject({}),
  },
  projection: {
    the_greeting_is_new_so_it_is_sent: (fact) => ({
      event: 'the_greeting_is_sent',
      payload: { greeting_id: fact.greeting.id },
    }),
    rejected: () => ({ event: 'the_greeting_cannot_be_sent', payload: {} }),
  },
})
