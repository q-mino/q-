import { z } from 'zod'
import { fact, address_book, id, value } from './_scope_fact.ts'

/** An extension has been activated (EXT-7): the user's conscious act, which records the manifest she accepted, at its version. */
export const an_extension_has_been_activated = fact({
  payload: z.strictObject({
    activated_extension: value.activated_extension,
  }),
})

/** An extension already active with this manifest has been activated again: nothing changes (DOM-6). */
export const an_extension_has_been_activated_again = fact({
  payload: z.strictObject({
    name: id.extension_name,
  }),
})

/** An extension has been deactivated (EXT-7): it runs nothing, serves nothing, until the user activates it again. */
export const an_extension_has_been_deactivated = fact({
  payload: z.strictObject({
    deactivated_extension: value.deactivated_extension,
  }),
})

/** An extension not activated has been deactivated again: nothing changes (DOM-6). */
export const an_extension_has_been_deactivated_again = fact({
  payload: z.strictObject({
    name: id.extension_name,
  }),
})

/** The offer of an extension has been withdrawn from a bond (EXT-7): the node neither serves it there nor asks with it. */
export const the_offer_of_an_extension_has_been_withdrawn_from_a_bond = fact({
  payload: z.strictObject({
    withdrawn_offer: value.withdrawn_offer,
  }),
})

/** The offer of an extension, withdrawn from a bond already, has been withdrawn again: nothing changes (DOM-6). */
export const the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again = fact({
  payload: z.strictObject({
    name: id.extension_name,
    bond: address_book.id.bond_id,
  }),
})

/** An extension whose offer was withdrawn from a bond has been offered to it again (EXT-7): a change, so no `again`. */
export const an_extension_has_been_offered_to_a_bond = fact({
  payload: z.strictObject({
    name: id.extension_name,
    bond: address_book.id.bond_id,
  }),
})

/** An extension offered to a bond already has been offered to it again: nothing changes (DOM-6). */
export const an_extension_has_been_offered_to_a_bond_again = fact({
  payload: z.strictObject({
    name: id.extension_name,
    bond: address_book.id.bond_id,
  }),
})

/** A bond has been asked for the extensions in common (EXT-8): the question, with what the node offers it, waiting for what comes back. */
export const a_bond_has_been_asked_for_the_extensions_in_common = fact({
  payload: z.strictObject({
    question: value.question,
  }),
})

/** The extensions in common with a bond have been learned (EXT-8): those of the node's the peer offers back, with the majors it serves. */
export const the_extensions_in_common_with_a_bond_have_been_learned = fact({
  payload: z.strictObject({
    question_id: id.question_id,
    in_common: value.offered_extensions,
  }),
})

/** A question about the extensions in common had no answer (EXT-8): no response in its time, or a peer that cannot answer it. */
export const a_question_about_the_extensions_in_common_had_no_answer = fact({
  payload: z.strictObject({
    question_id: id.question_id,
    why: value.no_answer,
  }),
})
