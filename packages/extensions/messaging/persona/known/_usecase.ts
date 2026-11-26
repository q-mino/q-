// generated

// The use cases of `persona/known` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Anna's message reaches Bruno's node on their bond (MSG-3, F7): the office
 * receives it, and the leaf's projection is the receipt, the response to her
 * request, which makes her message delivered.
 *
 * @see {@link usecase.message}
 */
export const message = usecase.message

/**
 * The input of `message`, declared inline.
 *
 * @see {@link usecase.message}
 */
export const message_input = usecase.message.input
export type message_input = z.output<typeof message_input>
