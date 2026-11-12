import { z } from 'zod'

// The identities of `tools`: the values that name an instance (DOM-24). Their
// shape only: the generator brands them with their path in `id.ts`, where
// every module, and every other domain, takes them from.

export const tool_id = z.string().min(1)
