import { z } from 'zod'
import { fact, id, value } from './_scope_fact.ts'

/** A bond has been greeted (EXT-12): the greeting sent, waiting for what comes back. */
export const a_bond_has_been_greeted = fact({
  payload: z.strictObject({
    greeting: value.greeting,
  }),
})

/** A greeting has been closed with what came back (EXT-12, D108): its greeting back, no response, or a peer that cannot answer. */
export const a_greeting_has_been_closed = fact({
  payload: z.strictObject({
    greeting_id: id.greeting_id,
    outcome: value.outcome,
  }),
})

/** A bond that greeted the node has been greeted back: their words and the node's. */
export const a_bond_has_been_greeted_back = fact({
  payload: z.strictObject({
    greeting_back: value.greeting_back,
  }),
})
