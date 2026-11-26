import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of `chats`: the values that name an instance (DOM-24).
// Their shape only: the generator brands them with their path in `_id.ts`.

/**
 * A bond of the node, as the kernel names it to the extension (EXT-2,
 * EXT-11): opaque, the kernel's identity, which the office keeps as it is
 * given and never reads. A bond has its chat (MSG-1): the chat's identity is
 * the bond's.
 */
export const bond = id({ format: z.string().min(1) })

/**
 * A message of a chat, written there or received there: Anna's «Ciao Bruno»
 * this morning. Chosen by `chats` from the operation that records it (D75.8,
 * `identity_of`): her tap names no message, and a retry of it is the same
 * message; on the served side the operation is the request's identity (F7),
 * so that a request sent again is the same message (MSG-2, MSG-3).
 */
export const message_id = id({ format: z.string().min(1) })
