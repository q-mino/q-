// generated

// The use cases of `persona/known` from `usecase.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Anna's ping reaches Bruno's node on their bond (PNG-3, F7): the office
 * answers it, and the leaf's projection is the pong, the response to her
 * request.
 *
 * @see {@link usecase.ping}
 */
export const ping = usecase.ping

/**
 * The input of `ping`, declared inline.
 *
 * @see {@link usecase.ping}
 */
export const ping_input = usecase.ping.input
export type ping_input = z.output<typeof ping_input>
