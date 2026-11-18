// generated

// The path registry of `workshop` (DOM-24): every path with its component, in
// the order of the files. The hat is the persona's segment, after its kind's
// folder (PER-7, DOM-25).

import type * as wlib from '../../wlib.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as value from './_value.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/workshop/version/workshop': version.workshop,
  'persona/workshop/node/workshop': node.workshop,
  'persona/workshop/value/notification_id': value.notification_id,
  'persona/workshop/usecase/close_a_job': usecase.close_a_job,
  'persona/workshop/usecase/close_a_job_input': usecase.close_a_job_input,
} satisfies wlib.Registry
