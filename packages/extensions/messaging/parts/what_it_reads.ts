import type * as boundary from '@q-mino/boundary'
import { z } from 'zod'
import * as value from '../persona/self/_value.ts'

// What the chat reads through its door (MSG-7, EXT-15; part M5): the
// events of its two reads on `self`, parsed by its own surface, and how
// each read stands after each of them; a follow kept while the part is
// shown, ended by the part when it goes (K-4). Pure but for the follow.

/** The version of `self` the part speaks (`persona/self/version.ts`). */
export const the_version = '1.0.0'

/** A message of a chat, as `a_chat` and `a_chat_at_a_glance` give it. */
export const a_message = z.object({
  message_id: z.string(),
  place: value.place,
  text: value.text,
  at: value.instant,
  whose: value.whose,
})
export type a_message = z.output<typeof a_message>

/** A chat at a glance: its last message, and how many of theirs are to read. */
export const a_glance = z.object({
  bond: z.string(),
  the_last_message: a_message,
  to_read: value.to_read,
})
export type a_glance = z.output<typeof a_glance>

/** Where her message stands (MSG-13). */
export type a_stage = value.stage

/**
 * The events of a read that streams (LIB-8, EXT-10's surface of G-1): its
 * snapshot, then each entry as it changes, enters or leaves; caught up; or
 * its position lost, which asks for the read again.
 */
const an_event_of = <entry extends z.ZodType>(entry: entry) =>
  z.discriminatedUnion('event', [
    z.object({ event: z.literal('snapshot'), entries: z.array(entry) }),
    z.object({ event: z.literal('fact'), entry }),
    z.object({ event: z.literal('entered'), entry }),
    z.object({ event: z.literal('left'), identity: z.string() }),
    z.object({ event: z.literal('caught_up') }),
    z.object({ event: z.literal('position_unavailable') }),
  ])

const an_event_of_a_chat = an_event_of(a_message)
const an_event_of_a_glance = an_event_of(a_glance)

/** Why a read is not read: the kernel did not serve it (EXT-4, EXT-15), or what came does not parse as its surface says. */
export type why_it_is_not_read =
  Extract<boundary.WhatAPartIsTold, { told: 'not_served' }>['because'] | 'not_understood'

/** A chat as the conversation reads it: being read, read with its messages by identity, or not read and why. */
export type a_chat_read =
  | { readonly read: 'reading' }
  | { readonly read: 'read'; readonly messages: ReadonlyMap<string, a_message> }
  | { readonly read: 'not_read'; readonly why: why_it_is_not_read }

/** A chat at a glance as its line reads it: being read, none before the chat's first message, read, or not read and why. */
export type a_glance_read =
  | { readonly read: 'reading' }
  | { readonly read: 'none' }
  | { readonly read: 'read'; readonly glance: a_glance }
  | { readonly read: 'not_read'; readonly why: why_it_is_not_read }

/** What a read asks after an event: nothing more, or to be read again from its start (its position lost). */
export type then = 'goes_on' | 'reads_again'

/**
 * The chat after what the door told (MSG-7): the snapshot its messages; a
 * fact or an entry, that message as it is now; a message left, gone;
 * caught up, the same; its position lost, read again.
 */
export const a_chat_after = (
  chat: a_chat_read,
  told: boundary.WhatAPartIsTold,
): { readonly chat: a_chat_read; readonly then: then } => {
  if (told.told === 'not_served')
    return { chat: { read: 'not_read', why: told.because }, then: 'goes_on' }
  const event = an_event_of_a_chat.safeParse(told.event)
  if (!event.success) return { chat: { read: 'not_read', why: 'not_understood' }, then: 'goes_on' }
  const messages = chat.read === 'read' ? chat.messages : new Map<string, a_message>()
  switch (event.data.event) {
    case 'snapshot':
      return {
        chat: {
          read: 'read',
          messages: new Map(event.data.entries.map((one) => [one.message_id, one])),
        },
        then: 'goes_on',
      }
    case 'fact':
    case 'entered':
      return {
        chat: {
          read: 'read',
          messages: new Map([...messages, [event.data.entry.message_id, event.data.entry]]),
        },
        then: 'goes_on',
      }
    case 'left': {
      const left = new Map(messages)
      left.delete(event.data.identity)
      return { chat: { read: 'read', messages: left }, then: 'goes_on' }
    }
    case 'caught_up':
      return { chat, then: 'goes_on' }
    case 'position_unavailable':
      return { chat, then: 'reads_again' }
  }
}

/** The chat at a glance after what the door told: as `a_chat_after`, one entry by bond, none before the first message. */
export const a_glance_after = (
  glance: a_glance_read,
  told: boundary.WhatAPartIsTold,
): { readonly glance: a_glance_read; readonly then: then } => {
  if (told.told === 'not_served')
    return { glance: { read: 'not_read', why: told.because }, then: 'goes_on' }
  const event = an_event_of_a_glance.safeParse(told.event)
  if (!event.success)
    return { glance: { read: 'not_read', why: 'not_understood' }, then: 'goes_on' }
  switch (event.data.event) {
    case 'snapshot': {
      const [first] = event.data.entries
      return {
        glance: first === undefined ? { read: 'none' } : { read: 'read', glance: first },
        then: 'goes_on',
      }
    }
    case 'fact':
    case 'entered':
      return { glance: { read: 'read', glance: event.data.entry }, then: 'goes_on' }
    case 'left':
      return { glance: { read: 'none' }, then: 'goes_on' }
    case 'caught_up':
      return { glance, then: 'goes_on' }
    case 'position_unavailable':
      return { glance, then: 'reads_again' }
  }
}

/** The messages of a chat in its order (MSG-5): by the place her node filed each, the oldest first. */
export const in_its_order = (messages: ReadonlyMap<string, a_message>): readonly a_message[] =>
  [...messages.values()].sort((one, other) => one.place - other.place)

/** A stage after which «Invia di nuovo» writes the same text again, a message of its own (MSG-13): any but on its way and delivered. */
export const it_may_be_sent_again = (stage: a_stage): boolean =>
  stage.stage !== 'on_its_way' && stage.stage !== 'delivered'

/**
 * A read followed through the door while the part is shown (EXT-16, K-4):
 * each thing told handed to `hears`, in order, until the part stops it,
 * which ends the flow (`return()`), or the kernel ends it. A door that
 * throws is told as the extension out of reach.
 */
export const follows = (
  door: boundary.APartsDoor,
  asked: boundary.WhatAPartAsks,
  hears: (told: boundary.WhatAPartIsTold) => void,
): (() => void) => {
  const flow = door.follow(asked)[Symbol.asyncIterator]()
  // Stopped by the part, from outside the loop that reads it.
  const the_follow: { stopped: boolean } = { stopped: false }
  void (async () => {
    try {
      for (;;) {
        const next = await flow.next()
        if (the_follow.stopped || next.done === true) return
        hears(next.value)
      }
    } catch {
      if (!the_follow.stopped)
        hears({ told: 'not_served', because: 'the_extension_cannot_be_reached' })
    }
  })()
  return () => {
    the_follow.stopped = true
    void flow.return?.().catch(() => undefined)
  }
}

/** What a command answered through the door: its first event's name, or that the kernel did not serve it. */
export type what_it_answered =
  | { readonly answered: 'an_event'; readonly event: string; readonly payload: unknown }
  | { readonly answered: 'not_served' }

/** A command of the chat's invoked through the door: what its one event says (F7: a command answers in one event). */
export const invokes = async (
  door: boundary.APartsDoor,
  asked: boundary.WhatAPartAsks,
): Promise<what_it_answered> => {
  try {
    for await (const told of door.invoke(asked)) {
      if (told.told === 'not_served') return { answered: 'not_served' }
      return { answered: 'an_event', event: told.event.event, payload: told.event['payload'] }
    }
  } catch {
    return { answered: 'not_served' }
  }
  return { answered: 'not_served' }
}
