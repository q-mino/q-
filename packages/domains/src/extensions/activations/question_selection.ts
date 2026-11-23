import { z } from 'zod'
import { selection, address_book } from './_scope_selection.ts'

// The selections over a question the node asked a bond about the extensions
// in common, the subject of this file (DOM-18): predicates over the question
// a query looks at. Their value is the adapters'.

/** The question was asked of this bond (EXT-8). */
export const the_question_was_asked_of_this_bond = selection({
  subject: 'question',
  parameters: z.strictObject({
    bond: address_book.id.bond_id,
  }),
})
