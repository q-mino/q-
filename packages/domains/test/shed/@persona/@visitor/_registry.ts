// generated

// The path registry of `visitor` (DOM-24): every path with its component, in
// the order of the files. The hat is the persona's segment, after its kind's
// folder (PER-7, DOM-25).

import type * as wlib from '../../wlib.ts'
import * as usecase from './_usecase.ts'
import * as value from './_value.ts'

export const registry = {
  'persona/visitor/value/category': value.category,
  'persona/visitor/value/categories': value.categories,
  'persona/visitor/value/tool_name': value.tool_name,
  'persona/visitor/usecase/the_catalogue': usecase.the_catalogue,
  'persona/visitor/usecase/the_catalogue_input': usecase.the_catalogue_input,
} satisfies wlib.Registry
