// generated

// The majors of `member` (PER-17, A, 17 Nov 2026): the current's registry and
// each past major's, by number, from the folders. The only file of the
// current version that names a past major: the generator rewrites it when a
// folder is deleted. The configurator gives it to the tree's ports, where
// the library finds a leaf at the version a message carries (`tree_ports`).

import type * as wlib from '../../wlib.ts'
import { registry as major_2 } from './_registry.ts'
import { registry as major_1 } from './1/_registry.ts'

export const majors = { 2: major_2, 1: major_1 } satisfies wlib.Majors
