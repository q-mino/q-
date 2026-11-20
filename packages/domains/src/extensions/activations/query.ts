import { z } from 'zod'
import { query, AND, extension_selection, address_book, id, value } from './_scope_query.ts'

/**
 * Greetings on Anna's phone (EXT-7): its manifest as installed, what she
 * is shown at its activation, and whether it is active, not active, or
 * waiting for her to accept an update that asks more, with what it asks
 * more. The kernel reads it before it routes a request to the extension,
 * loads it or serves its calls (EXT-6, EXT-15). No entry for an extension
 * the node does not have.
 */
export const an_extension = query({
  input: z.strictObject({
    name: id.extension_name,
  }),
  fields: value.extension_card,
  identity: 'name',
  selection: extension_selection.the_extension_has_this_name,
  order: { name: 'ascending' },
  creator: () => (input) => ({
    selection: { name: input.name },
  }),
})

/**
 * The extensions Anna's node offers Bruno (EXT-7), by name, with the majors
 * of their surfaces on known faces: every active one, but those whose offer
 * she withdrew from their bond. What auth's lookup tells the kernel's
 * routing (`the_extensions_offered_to_the_bond_of_a_key`, PER-9, step 13),
 * what the port of requests reads before it asks on a bond (EXT-2), and
 * what her phone tells Bruno's when it asks for the extensions in common.
 */
export const the_extensions_offered_to_a_bond = query({
  input: z.strictObject({
    bond: address_book.id.bond_id,
  }),
  fields: value.offered_extension,
  identity: 'name',
  selection: extension_selection.the_extension_is_offered_to_this_bond,
  order: { name: 'ascending' },
  creator: () => (input) => ({
    selection: { bond: input.bond },
  }),
})

/** The extension is offered to the bond, and the peer named it. */
export const it_is_offered_back = AND({
  it_is_offered_to_the_bond: extension_selection.the_extension_is_offered_to_this_bond,
  the_peer_named_it: extension_selection.the_extension_is_one_of_these,
})

/**
 * The extensions in common, as Bruno's node answers Anna's question (EXT-8):
 * of those her phone says it offers him (a claim, F2), the ones his node
 * offers back to their bond, with the majors it serves. Each side tells only
 * what it offers the other: one withdrawn from Anna is not named, and a
 * list that claims more learns only what a request for each would learn.
 * The bond is the one the kernel's node gives the leaf on `known` (step
 * 13), never the asker's word.
 */
export const the_extensions_in_common = query({
  input: z.strictObject({
    bond: address_book.id.bond_id,
    offered: value.offered_extensions,
  }),
  fields: value.offered_extension,
  identity: 'name',
  selection: it_is_offered_back,
  order: { name: 'ascending' },
  creator: () => (input) => ({
    selection: {
      it_is_offered_to_the_bond: { bond: input.bond },
      the_peer_named_it: { names: input.offered.map((offered) => offered.name) },
    },
  }),
})
