// generated

// The path registry of `desk/passer_by` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../library/index.ts'
import * as value from './_value.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'desk/passer_by/value/ticket': value.ticket,
  'desk/passer_by/usecase/the_invitations_on_a_stand': usecase.the_invitations_on_a_stand,
  'desk/passer_by/usecase/the_invitations_on_a_stand_input':
    usecase.the_invitations_on_a_stand_input,
  'desk/passer_by/usecase/take_an_invitation': usecase.take_an_invitation,
  'desk/passer_by/usecase/take_an_invitation_input': usecase.take_an_invitation_input,
  'desk/passer_by/usecase/the_invitation_taken': usecase.the_invitation_taken,
  'desk/passer_by/usecase/the_invitation_taken_input': usecase.the_invitation_taken_input,
  'desk/passer_by/version/passer_by': version.passer_by,
} satisfies zz.Registry
