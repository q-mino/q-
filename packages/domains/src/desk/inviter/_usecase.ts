// generated

// The use cases of `desk/inviter` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * The assistant leaves a ticket on the stand `assistente`, takeable for a
 * day (AST-13): the relay keeps it, and says when it received it. A leave
 * sent again is told the same (DOM-11). On a stand it is not the inviter
 * of: refused.
 *
 * @see {@link usecase.leave_an_invitation}
 */
export const leave_an_invitation = usecase.leave_an_invitation

/**
 * The input of `leave_an_invitation`, declared inline.
 *
 * @see {@link usecase.leave_an_invitation}
 */
export const leave_an_invitation_input = usecase.leave_an_invitation.input
export type leave_an_invitation_input = z.output<typeof leave_an_invitation_input>
