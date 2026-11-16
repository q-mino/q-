import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of `tools`: the values that name an instance (DOM-24). Their
// shape only: the generator brands them with their path in `_id.ts`, where
// every module, and every other domain, takes them from.

export const tool_id = id({ format: z.string().min(1) })

/**
 * A stay of a tool in repair: the drill Marta returned damaged on Tuesday,
 * and again in December, Luigi's. Chosen by `tools` from the operation that
 * sends the tool to repair (D75.8, `identity_of`), whoever sends it.
 */
export const repair_id = id({ format: z.string().min(1) })
