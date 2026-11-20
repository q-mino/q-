import { z } from 'zod'
import { effect, address_book, id, value } from './_scope_effect.ts'

/**
 * Ask a bond for the extensions in common (EXT-8, F7): a request to the
 * kernel's read leaf `the_extensions_in_common` on the peer's `known`
 * (`{ of: 'the_kernel', … }`), with what the node offers the bond; its
 * delivery the kernel's, over its port of requests (step 13), which maps
 * what the peer answers onto the office's closed set, the input of its
 * return, `learn_the_extensions_in_common`. Its key is the question. Its
 * deliveries are in flight together, none waiting for another's response
 * (F7, SC-56): a dead letter holds none behind it.
 */
export const ask_for_the_extensions_in_common = effect({
  payload: z.strictObject({
    question_id: id.question_id,
    bond: address_book.id.bond_id,
    offered: value.offered_extensions,
    waits: value.waiting_time,
  }),
  order: 'any',
})
