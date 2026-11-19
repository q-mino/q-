// generated

// The majors of `loans` (DOM-22, PER-17): the current's registry and each past
// major's, by number, from the folders. The only file of the current version
// that names a past major: the generator rewrites it when a folder is deleted.
// The configurator gives it where a version picks a major: the versions of a
// store (`wlib.versions`), the ports of a tree (`wlib.tree_ports`).

import type * as wlib from '../../../../src/library/index.ts'
import { registry as major_2 } from './_registry.ts'
import { registry as major_1 } from './1/_registry.ts'

export const majors = { 2: major_2, 1: major_1 } satisfies wlib.Majors
