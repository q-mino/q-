import package_json from '../package.json' with { type: 'json' }
import { semver } from './values.ts'

// The boundary's name and version (EXT-9), its package's: never written by
// hand a second time, so that the package and what an extension's build
// writes into its manifest cannot tell two versions (EXT-10). The kernel
// speaks a window of its majors; within a major, expand-contract, readers
// first.

/** The module the boundary is imported from (`@q-mino/boundary`), as the generated point of a mounted folder imports it (EXT-11). */
export const name: string = package_json.name

/** The boundary version, its package's (EXT-9): what an extension's build writes into its manifest and its `ready` says. */
export const version: semver = semver.parse(package_json.version)
