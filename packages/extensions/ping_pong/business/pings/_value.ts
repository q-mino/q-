// generated

// The values of `business/pings` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * An instant, as the node's clock tells it to the office (ISO 8601, with its offset).
 *
 * @see {@link value.instant}
 */
export const instant = value.instant
export type instant = z.output<typeof instant>

/**
 * How long a ping waits for its pong, in seconds (F7, EXT-12): a value of
 * the business, at most the seven days a relay keeps a letter (MBX-2).
 *
 * @see {@link value.waiting_time}
 */
export const waiting_time = value.waiting_time
export type waiting_time = z.output<typeof waiting_time>

/**
 * What came back of a ping, the business's own closed set of meanings
 * (EXT-12, D108), never the peer's events: its pong; no response within its
 * time; a peer that cannot answer it (its node closed the request, refused
 * it as malformed or of a version it does not speak, or its office gave no
 * pong).
 *
 * @see {@link value.what_came_back}
 */
export const what_came_back = value.what_came_back
export type what_came_back = z.output<typeof what_came_back>

/**
 * Where a ping the node sent stands: waiting for what comes back, or closed with it, and when.
 *
 * @see {@link value.progress}
 */
export const progress = value.progress
export type progress = z.output<typeof progress>

/**
 * A ping the node sent to a bond: when it was sent, how long it waits, where it stands.
 *
 * @see {@link value.ping}
 */
export const ping = value.ping
export type ping = z.output<typeof ping>

/**
 * A pong the node gave back to a bond that pinged it, and when.
 *
 * @see {@link value.pong}
 */
export const pong = value.pong
export type pong = z.output<typeof pong>
