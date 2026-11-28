// The node as the assistant uses it (AST-1): what a user's screens use of
// her node, and nothing else. Her activities asked and read back (USR-2);
// her faces and bonds read (the address book's reads on `self`); the
// extensions' manifests as shown, and whether active (EXT-7); a ticket as
// the phone shows it (BND-9); messaging's leaves on `self` (MSG-7): a chat,
// its glance, a message written under an operation the assistant names,
// the chat read up to a message. Its port is the one the turns are written
// over, so that the stories of the caps and the falls run over a node of
// test as well as over a phone of the stack. [Q, C, 28 Nov 2026]

import { the_manifest_to_accept } from '@q-mino/adapters-common'
import * as zz from '@q-mino/domains/library'
import type { their_ticket } from '@q-mino/domains/bonds/address_book/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { a_manifest } from '@q-mino/domains/user/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import type { APhonesPartitions, Phone } from '@q-mino/memory'
import { z } from 'zod'

/** The extensions the assistant carries (AST-2). */
export type AnExtensionCarried = 'messaging' | 'ping_pong'

/** A message of a chat, as the assistant reads it: oldest first (its place), whose it is. */
export interface AMessageOfAChat {
  readonly message_id: string
  readonly place: number
  readonly at: string
  readonly text: string
  readonly whose: 'mine' | 'theirs'
}

/** The node as the assistant uses it. */
export interface TheNodesSide {
  readonly now: () => string
  readonly my_faces: () => Promise<readonly string[]>
  readonly my_bonds: () => Promise<readonly string[]>
  readonly asks: (activity_id: string, what: activities_value.what_is_asked) => Promise<void>
  readonly the_end_of: (activity_id: string) => Promise<activities_value.how_it_ended | undefined>
  readonly the_manifest_shown: (extension: AnExtensionCarried) => user_value.a_manifest
  readonly is_active: (extension: AnExtensionCarried) => Promise<boolean>
  readonly the_ticket_shown: (bond: string) => Promise<their_ticket | undefined>
  /** A bond's chat, oldest first. */
  readonly a_chat: (bond: string) => Promise<readonly AMessageOfAChat[]>
  /** How many of theirs are to read in a bond's chat (MSG-7); none before their first message. */
  readonly to_read: (bond: string) => Promise<number>
  /** A message written on a bond under an operation the assistant names (DOM-11: the same again is the same message). */
  readonly writes: (bond: string, text: string, operation: string) => Promise<boolean>
  /** A chat read up to one of theirs (MSG-7). */
  readonly reads_up_to: (bond: string, up_to: string, operation: string) => Promise<boolean>
}

/** The zone of the assistant's clock (AST-2): Rome's. */
export const the_zone = zz.time_zone.parse('Europe/Rome')

const a_message = z.object({
  message_id: z.string(),
  place: z.number(),
  at: z.string(),
  text: z.string(),
  whose: z.object({ whose: z.enum(['mine', 'theirs']) }),
})

/** The node's side over a phone (STK-1), at its clock. */
export const over_a_phone = (node: Phone<APhonesPartitions>, clock: zz.Clock): TheNodesSide => {
  const when = (): zz.RootContext => ({ now: clock.now(), time_zone: clock.time_zone })
  const entries_of = async <entry>(
    events: AsyncIterable<
      | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
      | { readonly event: 'invalid_request' }
    >,
  ): Promise<readonly entry[]> => {
    for await (const event of events) return event.event === 'snapshot' ? event.entries : []
    return []
  }
  /** A context of the user on `self` (PER-23), as her parts ask messaging's leaves (MSG-7). */
  const as_the_user = (operation: string) => {
    const now = clock.now()
    return {
      now,
      time_zone: clock.time_zone,
      caller: { is: 'the_user' as const },
      declared_at: now,
      version: zz.semver.parse('1.0.0'),
      operation: { id: zz.operation_id.parse(operation), scope: 'self/the_user' },
      correlation: zz.correlation.parse(operation),
    }
  }
  const messaging = () => {
    const extension = node.the_extension('messaging')
    if (extension === undefined) throw new Error('the assistant’s node carries no messaging')
    return extension.on_self
  }
  /** The first event of a leaf on `self`, ended there (a read's snapshot, a command's answer). */
  const the_first_event = async (
    operation: string,
    leaf: string,
    input: unknown,
  ): Promise<unknown> => {
    for await (const event of messaging()(as_the_user(operation), { leaf, input })) return event
    return undefined
  }
  let reads = 0
  const a_read = (): string => {
    reads += 1
    return `assistant/read-only/${String(reads)}`
  }
  return {
    now: () => clock.now(),
    my_faces: async () =>
      (await entries_of(node.address_book.my_faces(when(), {}))).map((face) => face.id),
    my_bonds: async () =>
      (await entries_of(node.address_book.my_bonds(when(), {}))).map((bond) => bond.id),
    asks: async (activity_id, what) => {
      const input = { activity_id, what }
      const id = `assistant/activity/${activity_id}`
      const events = node.user.ask_for_an_activity(
        {
          ...when(),
          operation: { id: zz.operation_id.parse(id), scope: 'self/the_user' },
          correlation: zz.correlation.parse(id),
          fingerprint: zz.fingerprint_of({
            path: 'user/activities/usecase/ask_for_an_activity',
            input,
          }),
        },
        input,
      )
      // Its events read to their end: the activity is asked once it has answered.
      const iterator = events[Symbol.asyncIterator]()
      while (!(await iterator.next()).done) continue
    },
    the_end_of: async (activity_id) => {
      const [activity] = await entries_of(node.user.an_activity(when(), { activity_id }))
      return activity?.stage.stage === 'ended' ? activity.stage.how_it_ended : undefined
    },
    the_manifest_shown: (extension) => {
      const hosted = node.the_extension(extension)
      if (hosted === undefined) throw new Error(`the assistant’s node carries no ${extension}`)
      return a_manifest.parse(the_manifest_to_accept(hosted.composed.manifest))
    },
    is_active: (extension) => node.reads.is_active(extension),
    the_ticket_shown: (bond) => node.the_ticket_shown(bond),
    a_chat: async (bond) => {
      const snapshot = z
        .object({ event: z.literal('snapshot'), entries: z.array(a_message) })
        .safeParse(await the_first_event(a_read(), 'usecase/a_chat', { bond }))
      if (!snapshot.success) return []
      return snapshot.data.entries
        .map((message) => ({
          message_id: message.message_id,
          place: message.place,
          at: message.at,
          text: message.text,
          whose: message.whose.whose,
        }))
        .sort((one, other) => one.place - other.place)
    },
    to_read: async (bond) => {
      const glance = z
        .object({ entries: z.array(z.object({ to_read: z.number() })) })
        .safeParse(await the_first_event(a_read(), 'usecase/a_chat_at_a_glance', { bond }))
      return glance.success ? (glance.data.entries[0]?.to_read ?? 0) : 0
    },
    writes: async (bond, text, operation) =>
      z
        .object({ event: z.literal('the_message_is_written') })
        .safeParse(await the_first_event(operation, 'usecase/write_a_message', { bond, text }))
        .success,
    reads_up_to: async (bond, up_to, operation) =>
      z
        .object({ event: z.literal('the_chat_is_read') })
        .safeParse(await the_first_event(operation, 'usecase/read_a_chat', { bond, up_to }))
        .success,
  }
}
