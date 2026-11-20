// generated

// The values of `business/greetings` from `value.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `value.ts`.

import { z } from 'zod'
import * as value from './value.ts'

/**
 * The words of a greeting, as a face writes them: what the peer's user reads.
 *
 * @see {@link value.words}
 */
export const words = value.words
export type words = z.output<typeof words>

/**
 * How long a greeting waits for its greeting back, in seconds (F7, EXT-12):
 * a value of the business, at most the seven days a relay keeps a letter
 * (MBX-2).
 *
 * @see {@link value.waiting_time}
 */
export const waiting_time = value.waiting_time
export type waiting_time = z.output<typeof waiting_time>

/**
 * What came back of a greeting, the business's own closed set of meanings
 * (EXT-12, D108), never the peer's events: its greeting back, with its
 * words; no response within its time; a peer that cannot answer it (its
 * node closed the request, or refused it as malformed or of a version it
 * does not speak).
 *
 * @see {@link value.outcome}
 */
export const outcome = value.outcome
export type outcome = z.output<typeof outcome>

/**
 * Where a greeting the node sent stands: waiting for what comes back, or closed with it.
 *
 * @see {@link value.progress}
 */
export const progress = value.progress
export type progress = z.output<typeof progress>

/**
 * A greeting the node sent to a bond, with its words and where it stands.
 *
 * @see {@link value.greeting}
 */
export const greeting = value.greeting
export type greeting = z.output<typeof greeting>

/**
 * A greeting back the node sent to a bond that greeted it: their words and its own.
 *
 * @see {@link value.greeting_back}
 */
export const greeting_back = value.greeting_back
export type greeting_back = z.output<typeof greeting_back>
