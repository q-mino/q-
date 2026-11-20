// generated

// The identities of `business/greetings` from `id.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * A bond of the node, as the kernel names it to the extension (EXT-2,
 * EXT-11): opaque, the kernel's identity, which the office keeps as it is
 * given and never reads.
 *
 * @see {@link id.bond}
 */
export const bond = id.bond.brand<'business/greetings/id/bond'>()
export type bond = z.output<typeof bond>

/**
 * A greeting the node sends to a bond: Anna's to Bruno, on Tuesday. Chosen
 * by `greetings` from the operation that sends it (D75.8, `identity_of`):
 * the user's gesture on a bond names no greeting, and a retry of it is the
 * same greeting.
 *
 * @see {@link id.greeting_id}
 */
export const greeting_id = id.greeting_id.brand<'business/greetings/id/greeting_id'>()
export type greeting_id = z.output<typeof greeting_id>

/**
 * A greeting back the node sends to a bond that greeted it: Bruno's to
 * Anna. Chosen by `greetings` from the operation of the peer's request
 * (`identity_of`), whose identity the kernel composes (F7), so that the
 * request sent again is the same greeting back.
 *
 * @see {@link id.greeting_back_id}
 */
export const greeting_back_id =
  id.greeting_back_id.brand<'business/greetings/id/greeting_back_id'>()
export type greeting_back_id = z.output<typeof greeting_back_id>
