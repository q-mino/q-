// generated

// The identities of `business/pings` from `id.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * A bond of the node, as the kernel names it to the extension (EXT-2,
 * EXT-11): opaque, the kernel's identity, which the office keeps as it is
 * given and never reads.
 *
 * @see {@link id.bond}
 */
export const bond = id.bond.brand<'business/pings/id/bond'>()
export type bond = z.output<typeof bond>

/**
 * A ping the node sends to a bond: Anna's to Bruno, this morning. Chosen by
 * `pings` from the operation that sends it (D75.8, `identity_of`): the
 * user's tap on a bond names no ping, and a retry of it is the same ping.
 *
 * @see {@link id.ping_id}
 */
export const ping_id = id.ping_id.brand<'business/pings/id/ping_id'>()
export type ping_id = z.output<typeof ping_id>

/**
 * A pong the node gives back to a bond that pinged it: Bruno's to Anna.
 * Chosen by `pings` from the operation of the peer's request
 * (`identity_of`), whose identity the kernel composes (F7), so that the
 * request sent again is the same pong.
 *
 * @see {@link id.pong_id}
 */
export const pong_id = id.pong_id.brand<'business/pings/id/pong_id'>()
export type pong_id = z.output<typeof pong_id>
