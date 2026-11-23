// generated

// The identities of `user/choices` from `id.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * A choice of hers, by what it chooses: in stage 1 the active face only.
 *
 * @see {@link id.choice}
 */
export const choice = id.choice.brand<'user/choices/id/choice'>()
export type choice = z.output<typeof choice>
