// generated

// The identities of `business/chats` from `id.ts` (DOM-25): the same objects
// under the same names, branded with their path (DOM-24), each schema with its
// output type under the same name, so that one import gives both. Only this
// module imports `id.ts`.

import { z } from 'zod'
import * as id from './id.ts'

/**
 * A bond of the node, as the kernel names it to the extension (EXT-2,
 * EXT-11): opaque, the kernel's identity, which the office keeps as it is
 * given and never reads. A bond has its chat (MSG-1): the chat's identity is
 * the bond's.
 *
 * @see {@link id.bond}
 */
export const bond = id.bond.brand<'business/chats/id/bond'>()
export type bond = z.output<typeof bond>

/**
 * A message of a chat, written there or received there: Anna's «Ciao Bruno»
 * this morning. Chosen by `chats` from the operation that records it (D75.8,
 * `identity_of`): her tap names no message, and a retry of it is the same
 * message; on the served side the operation is the request's identity (F7),
 * so that a request sent again is the same message (MSG-2, MSG-3).
 *
 * @see {@link id.message_id}
 */
export const message_id = id.message_id.brand<'business/chats/id/message_id'>()
export type message_id = z.output<typeof message_id>
