// The boundary between the kernel and its extensions (EXT-2, EXT-9; GR-10):
// the kernel's contract with them, schemas and types, no domain. It imports
// zod only, and is imported by the extensions, by the kernel's adapters and
// configurators that host or compose them, and by the repository's
// configuration (`generator.config.ts`), never by `domains`. Its version is
// its package's: the kernel speaks a window of its majors (EXT-9).
//
// Since part 12.3, the contexts the kernel's node gives at a folder mounted
// below it (EXT-11); since part 12.4, the rest of the contract: the
// manifest's declaration and its data form (EXT-10), the mounted folders it
// gives the generator's configuration (EXT-11), the places (EXT-16), the
// ports typed by `touches` (EXT-2, EXT-3, EXT-14), the kernel's node above
// the mounted folders (EXT-5), the messages (EXT-2, EXT-15, EXT-16) and the
// extension's side of them, which every extension's configurator speaks
// through (`the_extensions_side`).

export * from './contexts.ts'
export * from './manifest.ts'
export * from './messages.ts'
export * from './mounted.ts'
export * from './places.ts'
export * from './ports.ts'
export * from './the_extensions_side.ts'
export * from './the_kernels_node.ts'
export * from './values.ts'
export * from './version.ts'
