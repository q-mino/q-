import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of `loans`: the values that name an instance (DOM-24). Their
// shape only: the generator brands them with their path in `_id.ts`, where
// every module, and every other domain, takes them from.

export const loan_id = id({ format: z.string().min(1) })

/** A member of the shed. Who may act as one is the persona's (step 6), not this domain's. */
export const member_id = id({ format: z.string().min(1) })

export const reservation_id = id({ format: z.string().min(1) })
