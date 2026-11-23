import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of the activations: the values that name an instance
// (DOM-24). Their shape only: the generator brands them with their path in
// `_id.ts`. A bond is the address book's (`address_book.id.bond_id`, GR-3).

/**
 * An extension, by the name its manifest gives it (EXT-3): a business name
 * in snake_case, unique among the extensions of a node, the key of what the
 * user chose about it (`greetings`).
 */
export const extension_name = id({
  format: z
    .string()
    .max(64)
    .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/),
})

/**
 * A question the node asks a bond about the extensions in common (EXT-8):
 * Anna's phone asking Bruno's, on Tuesday. Chosen by the office from the
 * operation that asks it (D75.8, `identity_of`): the user's gesture names
 * no question, and a retry of it is the same question.
 */
export const question_id = id({ format: z.string().min(1) })
