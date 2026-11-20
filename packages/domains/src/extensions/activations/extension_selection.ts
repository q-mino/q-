import { z } from 'zod'
import { selection, address_book, id } from './_scope_selection.ts'

// The selections over an installed extension, the subject of this file
// (DOM-18): predicates over the extension a query looks at, with what the
// user chose of it, which they do not name. Their value is the adapters'.

/** The extension has this name. */
export const the_extension_has_this_name = selection({
  subject: 'extension',
  parameters: z.strictObject({
    name: id.extension_name,
  }),
})

/** The extension is offered to this bond (EXT-7): active, and its offer not withdrawn from the bond. */
export const the_extension_is_offered_to_this_bond = selection({
  subject: 'extension',
  parameters: z.strictObject({
    bond: address_book.id.bond_id,
  }),
})

/** The extension is one of these, by name: those a peer offers (EXT-8), a claim (F2). */
export const the_extension_is_one_of_these = selection({
  subject: 'extension',
  parameters: z.strictObject({
    names: z.array(id.extension_name).max(64),
  }),
})
