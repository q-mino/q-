// generated

// The use cases of `persona/unknown` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Dario introduces himself to Carla's phone with the ticket she sent him
 * in a link (BND-10, PER-11): the secret, the name he is introduced as,
 * his mailbox for the bond. Her ticket ready and the secret its, they are
 * bonded; at the bond kept with his face (the QR crossed), it confirms it.
 *
 * @see {@link usecase.introduce_myself}
 */
export const introduce_myself = usecase.introduce_myself

/**
 * The input of `introduce_myself`, declared inline.
 *
 * @see {@link usecase.introduce_myself}
 */
export const introduce_myself_input = usecase.introduce_myself.input
export type introduce_myself_input = z.output<typeof introduce_myself_input>
