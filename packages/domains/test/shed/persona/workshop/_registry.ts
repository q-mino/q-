// generated

// The path registry of `persona/workshop` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as wlib from '../../wlib.ts'
import * as value from './_value.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/workshop/value/notification_id': value.notification_id,
  'persona/workshop/node/workshop': node.workshop,
  'persona/workshop/usecase/close_a_job': usecase.close_a_job,
  'persona/workshop/usecase/close_a_job_input': usecase.close_a_job_input,
  'persona/workshop/version/workshop': version.workshop,
} satisfies wlib.Registry
