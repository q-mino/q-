// A node of test for the assistant's turns (AST-16): the node's side as the
// assistant uses it (`the_node_s_side.ts`), over a model in memory of what
// its user sees: a face, the extensions active, the bonds and their chats
// (each message at its place, the read mark, MSG-5, MSG-7), a write under
// an operation the same message again (DOM-11), a ticket ready at once. The
// stories of the caps, the falls and the answerer's faults run over it in a
// few milliseconds; those of the node itself run over a phone of the stack
// (`the_node.test.ts`). [Q, C, 28 Nov 2026]

import { their_ticket } from '@q-mino/domains/bonds/address_book/_value.ts'
import { a_manifest } from '@q-mino/domains/user/_value.ts'
import type { AMessageOfAChat, TheNodesSide } from '../src/the_assistant/index.ts'

/** A chat of the node of test: its messages, oldest first, and where it is read up to. */
interface AChat {
  readonly messages: AMessageOfAChat[]
  read_up_to: number
}

/** A node of test, at a clock the story moves. */
export const a_node_of_test = (start = '2026-11-28T09:00:00.000Z') => {
  let now = start
  const faces: string[] = []
  const active = new Set<string>()
  const chats = new Map<string, AChat>()
  const operations = new Map<string, string>()
  const ended = new Map<string, 'done'>()
  const tickets = new Set<string>()
  let places = 0
  /** What the node was asked to do, in order: each write and each read mark, by its operation. */
  const did: string[] = []
  /** Writes that fail, once each, by their text (a fall between the reply kept and its writing). */
  const failing: string[] = []

  const a_chat = (bond: string): AChat => {
    const chat = chats.get(bond)
    if (chat === undefined) throw new Error(`no bond ${bond}`)
    return chat
  }
  const filed = (bond: string, whose: 'mine' | 'theirs', text: string): string => {
    places += 1
    const message_id = `M${String(places)}`
    a_chat(bond).messages.push({ message_id, place: places, at: now, text, whose })
    return message_id
  }

  const side: TheNodesSide = {
    now: () => now,
    my_faces: () => Promise.resolve([...faces]),
    my_bonds: () => Promise.resolve([...chats.keys()]),
    asks: (activity_id, what) => {
      if (what.activity === 'make_my_first_face') faces.push(what.face)
      if (what.activity === 'activate_an_extension') active.add(what.manifest.name)
      if (what.activity === 'prepare_a_ticket') tickets.add(what.bond)
      ended.set(activity_id, 'done')
      return Promise.resolve()
    },
    the_end_of: (activity_id) =>
      Promise.resolve(
        ended.has(activity_id)
          ? { ended: 'done' as const, said: { event: 'done', payload: {} } }
          : undefined,
      ),
    the_manifest_shown: (extension) =>
      a_manifest.parse({
        name: extension,
        version: '0.1.0',
        sees: { known: [] },
        touches: [],
        extension_points: [],
        leaves_on_known: [],
        majors: { self: [], known: [] },
      }),
    is_active: (extension) => Promise.resolve(active.has(extension)),
    the_ticket_shown: (bond) =>
      Promise.resolve(
        tickets.has(bond)
          ? their_ticket.parse({
              key: 'A'.repeat(43),
              introduced_as: 'Assistente di Cumino',
              mailbox: { deposit_address: bond, relays: ['https://relay.q-mino.test'] },
              secret: 'A'.repeat(86),
            })
          : undefined,
      ),
    a_chat: (bond) => Promise.resolve([...a_chat(bond).messages]),
    to_read: (bond) => {
      const chat = a_chat(bond)
      return Promise.resolve(
        chat.messages.filter((each) => each.whose === 'theirs' && each.place > chat.read_up_to)
          .length,
      )
    },
    writes: (bond, text, operation) => {
      const at = failing.indexOf(text)
      if (at >= 0) {
        failing.splice(at, 1)
        return Promise.reject(new Error('the node fell before the write'))
      }
      did.push(`write ${operation}`)
      if (!operations.has(operation)) operations.set(operation, filed(bond, 'mine', text))
      return Promise.resolve(true)
    },
    reads_up_to: (bond, up_to, operation) => {
      did.push(`read ${operation}`)
      const chat = a_chat(bond)
      const message = chat.messages.find((each) => each.message_id === up_to)
      if (message?.whose !== 'theirs') return Promise.resolve(false)
      chat.read_up_to = Math.max(chat.read_up_to, message.place)
      return Promise.resolve(true)
    },
  }

  return {
    side,
    did,
    /** A bond kept, its chat empty (BND-10). */
    bonded: (bond: string): void => {
      chats.set(bond, { messages: [], read_up_to: 0 })
    },
    /** A message of theirs received on a bond, at the clock's instant: its id. */
    receives: (bond: string, text: string): string => filed(bond, 'theirs', text),
    /** A bond's chat as its texts, oldest first, each whose it is. */
    the_chat: (bond: string): readonly string[] =>
      a_chat(bond).messages.map((each) => `${each.whose}: ${each.text}`),
    to_read: (bond: string): Promise<number> => side.to_read(bond),
    /** The clock moved on. */
    at: (instant: string): void => {
      now = instant
    },
    /** The next write of this text fails, once. */
    the_write_of_fails: (text: string): void => {
      failing.push(text)
    },
    faces,
    active,
    tickets,
  }
}
