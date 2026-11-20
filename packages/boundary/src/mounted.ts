import type { seen_on_known } from './contexts.ts'
import type { Declaration } from './manifest.ts'
import { name } from './version.ts'

// What the configuration of an extension's tree writes under `mounted`
// (EXT-11, "What `mounted` writes"): the manifest's `sees` translated by
// name into the context of each mounted folder, the names of the boundary's
// context schemas, never the manifest's type (the cycle EXT-11 rejects). The
// generator writes the point's `_node.ts` from them, importing the schemas
// from the module named here; it knows no boundary (§ 2).

/** A context of the boundary's, by the name it is exported under (`the_bond`). */
export type a_context = 'the_bond' | seen_on_known

/**
 * A mounted folder's context, as the generator's configuration takes it
 * (`Mount`): the module its schemas come from and their names. A plain
 * type, structurally the generator's, which the boundary does not import.
 */
export interface Mount {
  readonly from: string
  readonly context: readonly a_context[]
}

/**
 * The mounted folders of an extension's tree with their contexts, from its
 * declaration (EXT-11): on `known` the bond, and what `sees.known` lists; on
 * `self` the root's alone (one face, PER-3).
 */
export const mounted_of = (
  declaration: Declaration,
): { readonly 'persona/known': Mount; readonly 'persona/self': Mount } => ({
  'persona/known': { from: name, context: ['the_bond', ...(declaration.sees?.known ?? [])] },
  'persona/self': { from: name, context: [] },
})
