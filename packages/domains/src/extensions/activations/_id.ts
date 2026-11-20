// generated

// The identities of `extensions/activations` from `id.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * An extension, by the name its manifest gives it (EXT-3): a business name
 * in snake_case, unique among the extensions of a node, the key of what the
 * user chose about it (`greetings`).
 *
 * @see {@link id.extension_name}
 */
export const extension_name = id.extension_name.brand<'extensions/activations/id/extension_name'>()
export type extension_name = z.output<typeof extension_name>

/**
 * A question the node asks a bond about the extensions in common (EXT-8):
 * Anna's phone asking Bruno's, on Tuesday. Chosen by the office from the
 * operation that asks it (D75.8, `identity_of`): the user's gesture names
 * no question, and a retry of it is the same question.
 *
 * @see {@link id.question_id}
 */
export const question_id = id.question_id.brand<'extensions/activations/id/question_id'>()
export type question_id = z.output<typeof question_id>
