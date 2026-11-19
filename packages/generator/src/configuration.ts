import type { Sight } from '@q-mino/domains/library'

// The generator's configuration, `generator.config.ts` at the repository's
// root (DOM-25): the trees it writes.

/** A tree the generator writes. */
export interface TreeConfiguration {
  /** Its root, from the repository's (`packages/domains/test/shed`). */
  readonly root: string
  /** Its map (`sight.ts`): what the folders under a first segment see of the others. */
  readonly sight: Sight
  /** The module its generated files import the library from, from its root (Shed's `../../src/library/index.ts`). */
  readonly library: string
  /**
   * Whether CI compares its registries with `main`'s, by direction (DOM-24,
   * PER-17): a tree released to clients; not a test tree, which changes as
   * design (Shed).
   */
  readonly compared_with_main: boolean
  /**
   * Generated files kept as written while a decision on them is pending, by
   * their path from the tree's root: the generator neither writes nor
   * compares them, and says so at every run; it fails on one it would write
   * the same, or does not write at all, so that the list never outlives the
   * decision (DOM-25, provisional: A to confirm).
   */
  readonly held?: readonly string[]
}

/** The generator's configuration: its trees. */
export interface Configuration {
  readonly trees: readonly TreeConfiguration[]
}
