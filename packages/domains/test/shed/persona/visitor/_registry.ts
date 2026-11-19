// generated

// The path registry of `persona/visitor` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as wlib from '../../wlib.ts'
import * as value from './_value.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/visitor/value/category': value.category,
  'persona/visitor/value/categories': value.categories,
  'persona/visitor/value/tool_name': value.tool_name,
  'persona/visitor/value/page_size': value.page_size,
  'persona/visitor/usecase/the_catalogue': usecase.the_catalogue,
  'persona/visitor/usecase/the_catalogue_input': usecase.the_catalogue_input,
  'persona/visitor/version/visitor': version.visitor,
} satisfies wlib.Registry
