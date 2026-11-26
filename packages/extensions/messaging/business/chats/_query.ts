// generated

// The queries of `business/chats` from `query.ts` (DOM-25): the same objects
// under the same names, each schema with its output type under the same name,
// so that one import gives both. Only this module imports `query.ts`.

import { z } from 'zod'
import * as query from './query.ts'

/**
 * Anna's chat with Bruno: its messages, written and received, the newest
 * first, in the order her node filed them (MSG-5), each of hers with its
 * stage (MSG-13), each of his with the time his letter declared.
 *
 * @see {@link query.a_chat}
 */
export const a_chat = query.a_chat

/**
 * The input of `a_chat`, declared inline.
 *
 * @see {@link query.a_chat}
 */
export const a_chat_input = query.a_chat.input
export type a_chat_input = z.output<typeof a_chat_input>

/**
 * Anna's chat with Bruno at a glance, for his row in her contacts (MSG-7):
 * the last message, and how many of his she has to read. None before the
 * chat's first message.
 *
 * @see {@link query.a_chat_at_a_glance}
 */
export const a_chat_at_a_glance = query.a_chat_at_a_glance

/**
 * The input of `a_chat_at_a_glance`, declared inline.
 *
 * @see {@link query.a_chat_at_a_glance}
 */
export const a_chat_at_a_glance_input = query.a_chat_at_a_glance.input
export type a_chat_at_a_glance_input = z.output<typeof a_chat_at_a_glance_input>
