// generated

// The path registry of `persona` (DOM-24): every path with its component, in
// the order of the twins. The configurator gives it to the library, which reads
// it in reverse, from a component to its path, by object identity.

import type * as zz from '../library/index.ts'
import * as value from './_value.ts'
import * as node from './_node.ts'

export const registry = {
  'persona/value/face_key': value.face_key,
  'persona/value/deposit_address': value.deposit_address,
  'persona/value/annotation': value.annotation,
  'persona/value/caller': value.caller,
  'persona/value/declared_at': value.declared_at,
  'persona/node/persona': node.persona,
} satisfies zz.Registry
