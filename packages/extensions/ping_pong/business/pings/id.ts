import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of `pings`: the values that name an instance (DOM-24).
// Their shape only: the generator brands them with their path in `_id.ts`.

/**
 * A bond of the node, as the kernel names it to the extension (EXT-2,
 * EXT-11): opaque, the kernel's identity, which the office keeps as it is
 * given and never reads.
 */
export const bond = id({ format: z.string().min(1) })

/**
 * A ping the node sends to a bond: Anna's to Bruno, this morning. Chosen by
 * `pings` from the operation that sends it (D75.8, `identity_of`): the
 * user's tap on a bond names no ping, and a retry of it is the same ping.
 */
export const ping_id = id({ format: z.string().min(1) })

/**
 * A pong the node gives back to a bond that pinged it: Bruno's to Anna.
 * Chosen by `pings` from the operation of the peer's request
 * (`identity_of`), whose identity the kernel composes (F7), so that the
 * request sent again is the same pong.
 */
export const pong_id = id({ format: z.string().min(1) })
