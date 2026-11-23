// generated

// The path registry of `persona/known` (DOM-24): every path with its component,
// in the order of the twins. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as zz from '../../../../domains/src/library/index.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/known/usecase/ping': usecase.ping,
  'persona/known/usecase/ping_input': usecase.ping_input,
  'persona/known/version/known': version.known,
} satisfies zz.Registry
