import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of the choices (USR-6, DOM-24).

/** A choice of hers, by what it chooses: in stage 1 the active face only. */
export const choice = id({ format: z.enum(['the_active_face']) })
