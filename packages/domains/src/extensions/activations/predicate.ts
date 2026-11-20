import { z } from 'zod'
import { predicate, address_book, id, value } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is the adapters', helped by dsl.ts. The manifests installed are
// the composition's, which the state adapter is given as data (EXT-7); a
// bond's existence is the address book's, which the state adapter reads in
// the same transaction (GR-3).

/** The extension is installed on the node, with whatever manifest: the composition has it (EXT-7). */
export const the_extension_is_installed = predicate({
  parameters: z.strictObject({
    name: id.extension_name,
  }),
})

/** The extension is installed with this manifest, the one the user is shown (EXT-7): its name, its version, all it declares. */
export const the_extension_is_installed_with_this_manifest = predicate({
  parameters: z.strictObject({
    manifest: value.manifest,
  }),
})

/** The user activated the extension, whatever its manifest installed now asks, and has not deactivated it since. */
export const the_extension_is_activated = predicate({
  parameters: z.strictObject({
    name: id.extension_name,
  }),
})

/** The user activated the extension accepting this manifest, and has not deactivated it since. */
export const the_extension_is_activated_with_this_manifest = predicate({
  parameters: z.strictObject({
    manifest: value.manifest,
  }),
})

/** The bond is one of the user's, in her address book and not removed (GR-3: over the address book's state, BND-6). */
export const the_bond_exists = predicate({
  parameters: z.strictObject({
    bond: address_book.id.bond_id,
  }),
})

/** The user withdrew the offer of the extension from the bond, and has not offered it again since. */
export const the_offer_is_withdrawn_from_the_bond = predicate({
  parameters: z.strictObject({
    name: id.extension_name,
    bond: address_book.id.bond_id,
  }),
})

/**
 * Each of these extensions is offered to the bond, with the majors its
 * installed surface on `known` speaks (EXT-8): a side tells only what it
 * offers the other.
 */
export const these_extensions_are_offered_to_the_bond = predicate({
  parameters: z.strictObject({
    bond: address_book.id.bond_id,
    offered: value.offered_extensions,
  }),
})

/** A question with this identity has been asked, whatever came back. */
export const a_question_has_this_id = predicate({
  parameters: z.strictObject({
    question_id: id.question_id,
  }),
})

/** This question waits for its answer: asked, nothing came back yet. */
export const the_question_waits = predicate({
  parameters: z.strictObject({
    question_id: id.question_id,
  }),
})

/**
 * What came back of a question is the extensions in common (EXT-8): a
 * predicate over what the return is given, its meaning the dsl's
 * (`the_extensions_in_common_came_back`), which tells the office's two
 * happenings apart.
 */
export const the_extensions_in_common_came_back = predicate({
  parameters: z.strictObject({
    what_came_back: value.what_came_back,
  }),
})
