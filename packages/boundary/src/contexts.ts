import * as z from 'zod'

// The contexts the kernel's node gives at a folder mounted below it (EXT-11,
// EXT-3; part 12.3): each an object schema, named as the manifest's `sees`
// names what it lets the extension see, which the configuration of the
// extension's tree composes into the point's `_node.ts` (`mounted_of`).

/** A bond, as the kernel names it to an extension: opaque, the kernel's identity (EXT-2, EXT-11). */
export const bond = z.string().min(1).brand<'boundary/bond'>()
export type bond = z.output<typeof bond>

/** The bond a request came on, which every leaf on `known` sees (EXT-3, EXT-11): `context.bond`. */
export const the_bond = z.strictObject({ bond })

/** The peer's face key, which a leaf on `known` sees only if its manifest declares it (EXT-3): `context.peer_key`. */
export const the_peer_key = z.strictObject({ peer_key: z.string().min(1) })

/** The name the user gave the bond, which a leaf on `known` sees only if its manifest declares it (EXT-3): `context.bond_name`. */
export const the_name_of_the_bond = z.strictObject({ bond_name: z.string().min(1) })

/** What a manifest may declare it sees on `known` beside the bond (EXT-3, EXT-10: `sees: { known: [...] }`), a closed set of the boundary's. */
export const seen_on_known = z.enum(['the_peer_key', 'the_name_of_the_bond'])
export type seen_on_known = z.output<typeof seen_on_known>
