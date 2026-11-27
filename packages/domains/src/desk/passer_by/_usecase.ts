// generated

// The use cases of `desk/passer_by` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * The invitations on the stand `assistente`, the oldest first: each one's
 * id and until when it can be taken, never its ticket (INV-5). What the
 * assistant reads to top the stand up (AST-13), and the page to take the
 * oldest (INV-3).
 *
 * @see {@link usecase.the_invitations_on_a_stand}
 */
export const the_invitations_on_a_stand = usecase.the_invitations_on_a_stand

/**
 * The input of `the_invitations_on_a_stand`, declared inline.
 *
 * @see {@link usecase.the_invitations_on_a_stand}
 */
export const the_invitations_on_a_stand_input = usecase.the_invitations_on_a_stand.input
export type the_invitations_on_a_stand_input = z.output<typeof the_invitations_on_a_stand_input>

/**
 * Bea takes the oldest invitation on the stand, by its id (INV-3): hers,
 * under her take. Another passer-by took it meanwhile, or its time is
 * over: refused, and the page tries the next.
 *
 * @see {@link usecase.take_an_invitation}
 */
export const take_an_invitation = usecase.take_an_invitation

/**
 * The input of `take_an_invitation`, declared inline.
 *
 * @see {@link usecase.take_an_invitation}
 */
export const take_an_invitation_input = usecase.take_an_invitation.input
export type take_an_invitation_input = z.output<typeof take_an_invitation_input>

/**
 * Bea reads the ticket she took, by her take (INV-3): its link is the one
 * the page shows her. Nobody else can name her take.
 *
 * @see {@link usecase.the_invitation_taken}
 */
export const the_invitation_taken = usecase.the_invitation_taken

/**
 * The input of `the_invitation_taken`, declared inline.
 *
 * @see {@link usecase.the_invitation_taken}
 */
export const the_invitation_taken_input = usecase.the_invitation_taken.input
export type the_invitation_taken_input = z.output<typeof the_invitation_taken_input>
