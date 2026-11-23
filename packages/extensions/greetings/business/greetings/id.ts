import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of `greetings`: the values that name an instance (DOM-24).
// Their shape only: the generator brands them with their path in `_id.ts`.

/**
 * A bond of the node, as the kernel names it to the extension (EXT-2,
 * EXT-11): opaque, the kernel's identity, which the office keeps as it is
 * given and never reads.
 */
export const bond = id({ format: z.string().min(1) })

/**
 * A greeting the node sends to a bond: Anna's to Bruno, on Tuesday. Chosen
 * by `greetings` from the operation that sends it (D75.8, `identity_of`):
 * the user's gesture on a bond names no greeting, and a retry of it is the
 * same greeting.
 */
export const greeting_id = id({ format: z.string().min(1) })

/**
 * A greeting back the node sends to a bond that greeted it: Bruno's to
 * Anna. Chosen by `greetings` from the operation of the peer's request
 * (`identity_of`), whose identity the kernel composes (F7), so that the
 * request sent again is the same greeting back.
 */
export const greeting_back_id = id({ format: z.string().min(1) })
