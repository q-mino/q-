// generated

// The path registry of `persona` (DOM-24): every path with its component, in
// the order of the twins. The configurator gives it to the library, which reads
// it in reverse, from a component to its path, by object identity.

import type * as wlib from '../wlib.ts'
import * as value from './_value.ts'
import * as node from './_node.ts'

export const registry = {
  'persona/value/caller': value.caller,
  'persona/node/persona': node.persona,
} satisfies wlib.Registry
