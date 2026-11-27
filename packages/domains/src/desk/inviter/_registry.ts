// generated

// The path registry of `desk/inviter` (DOM-24): every path with its component,
// in the order of the twins. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as zz from '../../library/index.ts'
import * as value from './_value.ts'
import * as node from './_node.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'desk/inviter/value/ticket': value.ticket,
  'desk/inviter/node/inviter': node.inviter,
  'desk/inviter/usecase/leave_an_invitation': usecase.leave_an_invitation,
  'desk/inviter/usecase/leave_an_invitation_input': usecase.leave_an_invitation_input,
  'desk/inviter/version/inviter': version.inviter,
} satisfies zz.Registry
