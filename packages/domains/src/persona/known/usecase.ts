import { z } from 'zod'
import { read_use_case_over, value, activations } from './_scope_usecase.ts'

// The kernel's use cases on `known`, the leaves of its tree a bonded face
// reaches (PER-6, EXT-1): the bond is the one the node gives
// (`context.bond`), never the asker's word (PER-8). The leaves of the
// active extensions are mounted here at wiring (`zz.mounted_leaf_ports`,
// EXT-11): nothing of theirs is written in this folder. A leaf served to a
// peer answers in one event (F7): no stream.

/**
 * Bruno's phone answers Anna's question on their bond (EXT-8): of what her
 * phone says it offers him (a claim, F2), the extensions his node offers
 * back to L_a, with the majors it serves; greetings at major 1. One page,
 * every entry.
 */
export const the_extensions_in_common = read_use_case_over({
  use_case: activations.usecase.the_extensions_in_common,
  input: z.strictObject({
    offered: value.offered_extensions,
  }),
  creator: (context) => (input) => ({
    query: {
      bond: context.bond.bond_id,
      offered: input.offered.map((offered) => ({
        name: offered.extension,
        majors: offered.majors,
      })),
    },
  }),
  entry: z.strictObject({
    extension: activations.id.extension_name,
    majors: value.majors,
  }),
  projection: (entry) => ({ extension: entry.name, majors: entry.majors }),
})
