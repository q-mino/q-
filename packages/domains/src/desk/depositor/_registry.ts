// generated

// The path registry of `desk/depositor` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../library/index.ts'
import * as value from './_value.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'desk/depositor/value/envelope': value.envelope,
  'desk/depositor/usecase/deposit_an_envelope': usecase.deposit_an_envelope,
  'desk/depositor/usecase/deposit_an_envelope_input': usecase.deposit_an_envelope_input,
  'desk/depositor/version/depositor': version.depositor,
} satisfies zz.Registry
