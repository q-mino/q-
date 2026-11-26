import { z } from 'zod'
import { command_use_case_over, chats, value } from './_scope_usecase.ts'

// The use cases of `known`, the leaves messaging adds to a bonded face's
// persona (EXT-1), below the kernel's node, which gives the bond the request
// came on and, as the manifest declares it, the time the request declares
// (`context.bond`, `context.declared_at`, EXT-11, MSG-8). Each answers in one
// event: no `follows` (F7).

/**
 * Anna's message reaches Bruno's node on their bond (MSG-3, F7): the office
 * receives it, and the leaf's projection is the receipt, the response to her
 * request, which makes her message delivered.
 */
export const message = command_use_case_over({
  use_case: chats.usecase.receive_a_message,
  input: z.strictObject({ text: value.text }),
  creator: (context) => (input) => ({
    bond: context.bond,
    text: input.text,
    declared_at: context.declared_at,
  }),
  events: {
    received: z.strictObject({}),
    /** Never in messaging: a message is named by its request; a leaf still names its rejection. */
    not_received: z.strictObject({}),
  },
  projection: {
    the_message_is_new_so_it_is_received: () => ({ event: 'received', payload: {} }),
    rejected: () => ({ event: 'not_received', payload: {} }),
  },
})
