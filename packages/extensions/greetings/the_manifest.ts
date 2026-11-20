import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import package_json from './package.json' with { type: 'json' }
import { manifest } from './manifest.ts'
import { majors as known_majors } from './persona/known/_majors.ts'
import { majors as self_majors } from './persona/self/_majors.ts'

// The manifest of the test extension as data (EXT-10; part 12.4), the one
// form the kernel reads: its declaration (`manifest.ts`), its package's
// version, and the surfaces its tree adds to each persona, derived from its
// majors (`_majors.ts`, the generator's) by the library (`the_surface_of`)
// and set below the kernel's node by the boundary (`below_the_kernels_node`):
// never written by hand. Its build writes it into `manifest.json`
// (`pnpm --filter @q-mino/greetings manifest`), which a test keeps equal to
// this.

/** The surface the extension adds to a persona, from its majors, below the kernel's node there. */
const the_surface_of = (persona: 'self' | 'known', majors: zz.Majors) =>
  boundary.below_the_kernels_node(persona)(zz.the_surface_of({ majors, at: `persona/${persona}` }))

/** The manifest of `greetings` as data (EXT-10). */
export const the_manifest_of_greetings: boundary.the_manifest = boundary.the_manifest_as_data({
  declaration: manifest,
  version: package_json.version,
  surfaces: {
    self: the_surface_of('self', self_majors),
    known: the_surface_of('known', known_majors),
  },
})
