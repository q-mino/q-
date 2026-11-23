// generated

// The path registry of `persona/self` (DOM-24): every path with its component,
// in the order of the twins. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as zz from '../../../../domains/src/library/index.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/self/usecase/send_a_ping': usecase.send_a_ping,
  'persona/self/usecase/send_a_ping_input': usecase.send_a_ping_input,
  'persona/self/version/self': version.self,
} satisfies zz.Registry
