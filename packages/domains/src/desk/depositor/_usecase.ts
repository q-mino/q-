// generated

// The use cases of `desk/depositor` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Anna's phone leaves its letter to Bruno on his D, which their bond gave
 * it: the relay keeps it seven days, and says when it received it. A retry
 * of the same deposit is told the same (DOM-11).
 *
 * @see {@link usecase.deposit_an_envelope}
 */
export const deposit_an_envelope = usecase.deposit_an_envelope

/**
 * The input of `deposit_an_envelope`, declared inline.
 *
 * @see {@link usecase.deposit_an_envelope}
 */
export const deposit_an_envelope_input = usecase.deposit_an_envelope.input
export type deposit_an_envelope_input = z.output<typeof deposit_an_envelope_input>
