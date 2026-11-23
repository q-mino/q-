import { id } from './_scope_id.ts'
import { z } from 'zod'

// The identities of the requests: the values that name an instance (DOM-24).
// Their shape only: the generator brands them with their path in `_id.ts`.

/**
 * A request the port of requests sent (F7, PST-5): its identity, the one its
 * letter carries, which the kernel composes and hashes (`dsl.the_identity_of_a_request`
 * of the post): 32 bytes in base64url.
 */
export const request_id = id({ format: z.string().regex(/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/) })
