// generated

// The path registry of `desk/holder` (DOM-24): every path with its component,
// in the order of the twins. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as zz from '../../library/index.ts'
import * as value from './_value.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'desk/holder/value/envelope': value.envelope,
  'desk/holder/node/holder': node.holder,
  'desk/holder/usecase/collect_the_envelopes': usecase.collect_the_envelopes,
  'desk/holder/usecase/collect_the_envelopes_input': usecase.collect_the_envelopes_input,
  'desk/holder/version/holder': version.holder,
} satisfies zz.Registry
