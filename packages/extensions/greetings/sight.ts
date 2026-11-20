import type * as zz from '../../domains/src/library/index.ts'

// What each folder of the test extension's tree sees of the others (DOM-25,
// EXT-11): its personas, `self` and `known`, mounted below the kernel's
// nodes (generator.config.ts, `mounted`). Part 12.3 wrote the tree's
// mounted points alone, to prove the generator and the cruiser on an
// extension's tree; its business and its leaves come with part 12.4.

export const sight = {
  /** The leaves it adds to the kernel's personas (EXT-1): `self` and `known` only. */
  persona: {},
} as const satisfies zz.Sight
