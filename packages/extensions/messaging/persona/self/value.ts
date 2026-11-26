import { z } from 'zod'

// The values of `self` in messaging (EXT-11, D45): what its leaves give the
// local user's part, in its own words: a message of a chat with its stage,
// a chat at a glance. The identities are the business's, the shapes are
// written here again, so that what leaves the leaf is what it declares
// (PER-18).

/** An instant as her node tells it: ISO 8601 in UTC, to the millisecond. */
export const instant = z.iso.datetime({ precision: 3 })

/** The text of a message, as she writes it (MSG-4). */
export const text = z.string().min(1).max(4_000)

/** Where her message stands (MSG-13), as the chat tells it. */
export const stage = z.discriminatedUnion('stage', [
  z.strictObject({ stage: z.literal('on_its_way') }),
  z.strictObject({ stage: z.literal('delivered'), at: instant }),
  z.strictObject({ stage: z.literal('no_receipt'), at: instant }),
  z.strictObject({ stage: z.literal('could_not_be_delivered'), at: instant }),
  z.strictObject({ stage: z.literal('called_off'), at: instant }),
  z.strictObject({ stage: z.literal('held') }),
  z.strictObject({ stage: z.literal('put_aside') }),
])

/** Whose a message is: hers, with its stage, or theirs, with the time its letter declares (MSG-6). */
export const whose = z.discriminatedUnion('whose', [
  z.strictObject({ whose: z.literal('mine'), stage }),
  z.strictObject({ whose: z.literal('theirs'), declared_at: instant }),
])

/** Where a message is filed in its chat (MSG-5). */
export const place = z.number().int().min(1)

/** How many messages of theirs are to read. */
export const to_read = z.number().int().min(0)
