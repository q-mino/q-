import * as z from 'zod'

// The boundary between the kernel and its extensions (EXT-2, EXT-9; GR-10):
// the kernel's contract with them, schemas and types, no domain. It imports
// zod only, and is imported by the extensions, by the kernel's adapters and
// configurators that host or compose them, and by the repository's
// configuration (`generator.config.ts`), never by `domains`. Its version is
// its package's: the kernel speaks a window of its majors (EXT-9).
//
// Since part 12.3, the contexts the kernel's node gives at a folder mounted
// below it (EXT-11, EXT-3): each an object schema, named as the manifest's
// `sees` names what it lets the extension see, which the configuration of
// the extension's tree composes into the point's `_node.ts` (`mounted`).
// The rest of the contract (the manifest, the messages, the ports, the
// places) comes with part 12.4.

/** A bond, as the kernel names it to an extension: opaque, the kernel's identity (EXT-2, EXT-11). */
export const bond = z.string().min(1).brand<'boundary/bond'>()
export type bond = z.output<typeof bond>

/** The bond a request came on, which every leaf on `known` sees (EXT-3, EXT-11): `context.bond`. */
export const the_bond = z.strictObject({ bond })

/** The peer's face key, which a leaf on `known` sees only if its manifest declares it (EXT-3): `context.peer_key`. */
export const the_peer_key = z.strictObject({ peer_key: z.string().min(1) })

/** The name the user gave the bond, which a leaf on `known` sees only if its manifest declares it (EXT-3): `context.bond_name`. */
export const the_name_of_the_bond = z.strictObject({ bond_name: z.string().min(1) })
