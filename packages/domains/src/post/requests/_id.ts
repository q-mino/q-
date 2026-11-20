// generated

// The identities of `post/requests` from `id.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * A request the port of requests sent (F7, PST-5): its identity, the one its
 * letter carries, which the kernel composes and hashes (`dsl.the_identity_of_a_request`
 * of the post): 32 bytes in base64url.
 *
 * @see {@link id.request_id}
 */
export const request_id = id.request_id.brand<'post/requests/id/request_id'>()
export type request_id = z.output<typeof request_id>
