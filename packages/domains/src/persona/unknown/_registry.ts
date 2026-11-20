// generated

// The path registry of `persona/unknown` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../library/index.ts'
import * as value from './_value.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/unknown/value/face_name': value.face_name,
  'persona/unknown/value/relay_address': value.relay_address,
  'persona/unknown/value/relays': value.relays,
  'persona/unknown/value/deposit_address': value.deposit_address,
  'persona/unknown/value/mailbox': value.mailbox,
  'persona/unknown/value/ticket_secret': value.ticket_secret,
  'persona/unknown/node/unknown': node.unknown,
  'persona/unknown/usecase/introduce_myself': usecase.introduce_myself,
  'persona/unknown/usecase/introduce_myself_input': usecase.introduce_myself_input,
  'persona/unknown/version/unknown': version.unknown,
} satisfies zz.Registry
