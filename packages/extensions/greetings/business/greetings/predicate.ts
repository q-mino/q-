import { z } from 'zod'
import { predicate, id } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is the adapters', helped by dsl.ts.

/** A greeting with this identity has been sent, whatever came back. */
export const a_greeting_has_this_id = predicate({
  parameters: z.strictObject({
    greeting_id: id.greeting_id,
  }),
})

/** This greeting waits for what comes back: sent, not closed. */
export const the_greeting_waits = predicate({
  parameters: z.strictObject({
    greeting_id: id.greeting_id,
  }),
})

/** A greeting back with this identity has been sent. */
export const a_greeting_back_has_this_id = predicate({
  parameters: z.strictObject({
    greeting_back_id: id.greeting_back_id,
  }),
})
