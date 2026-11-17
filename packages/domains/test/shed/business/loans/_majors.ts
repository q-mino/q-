// generated

// The majors of `loans` (DOM-22, A, 17 Nov 2026): the current's registry and
// each past major's, by number, from the folders. The only file of the
// current version that names a past major: the generator rewrites it when a
// folder is deleted. The configurator composes it into the versions of the
// store that keeps the data of `loans` (`wlib.versions`).

import type * as wlib from '../../wlib.ts'
import { registry as major_2 } from './_registry.ts'
import { registry as major_1 } from './1/_registry.ts'

export const majors = { 2: major_2, 1: major_1 } satisfies wlib.Majors
