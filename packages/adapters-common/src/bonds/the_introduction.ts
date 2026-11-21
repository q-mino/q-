import * as zz from '@q-mino/domains/library'
import { the_content_a_ticket_s_secret_signs } from '@q-mino/domains/bonds/address_book/_dsl.ts'
import type { send_my_introduction } from '@q-mino/domains/bonds/address_book/_effect.ts'
import type { registry as address_book_registry } from '@q-mino/domains/bonds/address_book/_registry.ts'
import type * as address_book_value from '@q-mino/domains/bonds/address_book/_value.ts'
import { unknown } from '@q-mino/domains/persona/unknown/_version.ts'
import type { Machine } from '@q-mino/domains/post/_dsl.ts'
import { z } from 'zod'
import type { AKernelsRequest, AnAnswerToTheKernelsRequest } from '../extensions/index.ts'

// The kernel's adapters of the address book's handshake (BND-8, BND-9,
// BND-10, F7; step 17): the delivery of `send_my_introduction`, a request of
// the kernel's to the leaf `introduce_myself` of the peer's `unknown`,
// through the kernel's own port of requests (EXT-8's model); and the ticket
// as its holder shows it, in a QR or a link, its secret the safe's
// signature. Their wiring is functions over the address book's read ports
// and the post's machine, so that the oracle and the phone wire them alike.

/** A read's events as the kernel reads them: its snapshot's entries, or a refusal of its input. */
type ARead<entry> = AsyncIterable<
  | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
  | { readonly event: 'invalid_request' }
>

/** The entries of a read's snapshot, its first event; none for a refused input. */
const the_entries_of = async <entry>(events: ARead<entry>): Promise<readonly entry[]> => {
  for await (const event of events) return event.event === 'snapshot' ? event.entries : []
  return []
}

/** A mailbox as a bond or a ticket declares it: its D, its relays (BND-4). */
interface AMailbox {
  readonly deposit_address: string
  readonly relays: readonly string[]
}

/**
 * The address book's reads the introduction needs (BND-10): a bond kept, my
 * face of it and my mailbox; my faces, by id with the name each is
 * introduced as.
 */
export interface TheIntroductionsReads {
  readonly a_bond: (
    context: zz.RootContext,
    input: { readonly bond_id: string },
  ) => ARead<{ readonly my_face_id: string; readonly my_mailbox: AMailbox }>
  readonly my_faces: (
    context: zz.RootContext,
    input: Readonly<Record<string, never>>,
  ) => ARead<{ readonly id: string; readonly name: string }>
}

/**
 * The wiring of the introduction's delivery: the node's clock, for the
 * reads; the address book's reads; the kernel's own port of requests
 * (`the_kernels_port_of_requests`).
 */
export interface TheIntroductionsWiring {
  readonly clock: zz.Clock
  readonly address_book: TheIntroductionsReads
  readonly the_kernels_port: (request: AKernelsRequest) => Promise<AnAnswerToTheKernelsRequest>
}

/** The effect this delivery delivers, by its path (DOM-24). */
const the_effect =
  'bonds/address_book/effect/send_my_introduction' satisfies keyof typeof address_book_registry

/** The leaf it invokes on the peer's `unknown`, by its path in the surface (EXT-5, PER-11). */
const the_leaf = 'usecase/introduce_myself'

/** How long an introduction waits for its answer, in seconds: the 48 hours of the ticket it goes to (BND-8). */
export const the_time_an_introduction_waits = 172_800

/** The events of `introduce_myself` that say the bond is made or confirmed on the peer's node (PER-11): the introduction is delivered. */
const bonded = new Set([
  'you_are_bonded',
  'you_met_in_person',
  'the_bond_is_confirmed',
  'you_introduced_yourself_already',
])

/** A response's event as the delivery reads it, a claim (F2): its name, if it has one. */
const an_event = z.object({ event: z.string() })

/** My side of a bond, as my introduction carries it: the name my face is introduced as, my mailbox of the bond. */
type MySide =
  | { readonly side: 'read'; readonly introduced_as: string; readonly mailbox: AMailbox }
  | { readonly side: 'not_found'; readonly why: string }

/**
 * The delivery of `send_my_introduction` (BND-10, F7): my side of the bond
 * read now (the bond kept, my face of it and its name, my mailbox of the
 * bond); then the kernel's port of requests called with the effect's path
 * and the entry's id (the request's identity, F7), the bond, the leaf
 * `introduce_myself` of `unknown` at the version the node speaks (its
 * current, PER-17), their ticket's secret, my face's name and my mailbox,
 * waiting the ticket's 48 hours. The effect has no return: a response that
 * says the bond is made or confirmed delivers it; any other answer
 * exhausts it with its reason, a dead letter shown to the user (DOM-15,
 * F6): a ticket that cannot be used, a closing of the peer's node, no
 * response in time, the bond gone, my side not found.
 */
export const the_delivery_of_my_introduction =
  (wiring: TheIntroductionsWiring) =>
  async (entry: {
    readonly id: zz.entry_id
    readonly payload: send_my_introduction
  }): Promise<zz.Delivered<never>> => {
    const now = (): zz.RootContext => ({
      now: zz.in_zone(wiring.clock.time_zone)(wiring.clock.now()),
      time_zone: wiring.clock.time_zone,
    })
    const my_side = async (): Promise<MySide> => {
      const [bond] = await the_entries_of(
        wiring.address_book.a_bond(now(), { bond_id: entry.payload.bond_id }),
      )
      if (bond === undefined)
        return { side: 'not_found', why: `no bond ${entry.payload.bond_id} kept` }
      const face = (await the_entries_of(wiring.address_book.my_faces(now(), {}))).find(
        (mine) => mine.id === bond.my_face_id,
      )
      if (face === undefined) return { side: 'not_found', why: `no face ${bond.my_face_id} made` }
      return { side: 'read', introduced_as: face.name, mailbox: bond.my_mailbox }
    }
    const mine = await my_side()
    if (mine.side === 'not_found') return { outcome: 'exhausted', reason: mine.why }
    const answer = await wiring.the_kernels_port({
      effect: the_effect,
      id: entry.id,
      bond: entry.payload.bond_id,
      invokes: { persona: 'unknown', use_case: the_leaf, version: unknown[zz.$Version] },
      input: {
        secret: entry.payload.their_ticket.secret,
        introduced_as: mine.introduced_as,
        mailbox: {
          deposit_address: mine.mailbox.deposit_address,
          relays: [...mine.mailbox.relays],
        },
      },
      waits: the_time_an_introduction_waits,
    })
    switch (answer.answer) {
      case 'responded': {
        const said = an_event.safeParse(answer.event)
        if (!said.success) return { outcome: 'exhausted', reason: 'they answered no event' }
        return bonded.has(said.data.event)
          ? { outcome: 'delivered' }
          : { outcome: 'exhausted', reason: `they answered ${said.data.event}` }
      }
      case 'no_response':
        return { outcome: 'exhausted', reason: 'no response in 48 hours' }
      case 'the_bond_is_gone':
        return { outcome: 'exhausted', reason: 'the bond is gone' }
    }
  }

/** The address book's read of my ticket (BND-8): my face of it, its key and name, my mailbox of the bond to be. */
export interface TheTicketsRead {
  readonly my_ticket: (
    context: zz.RootContext,
    input: { readonly bond_id: string },
  ) => ARead<{
    readonly my_face_id: string
    readonly key: string
    readonly introduced_as: string
    readonly my_mailbox: AMailbox
  }>
}

/**
 * The ticket of a bond as its holder shows it, in a QR or after `#` in a
 * link (BND-8, BND-9): my ticket ready, read now, with its secret, my face's
 * signature over its D (`the_content_a_ticket_s_secret_signs`), made by the
 * safe through the post's machine and kept nowhere; none for a ticket not
 * ready. In the address book's words, `their_ticket` as the other node opens
 * it.
 */
export const the_ticket_shown =
  (wiring: {
    readonly clock: zz.Clock
    readonly address_book: TheTicketsRead
    readonly machine_of: (face_id: string) => Pick<Machine, 'sign'>
  }) =>
  async (bond_id: string): Promise<address_book_value.their_ticket | undefined> => {
    const [ticket] = await the_entries_of(
      wiring.address_book.my_ticket(
        {
          now: zz.in_zone(wiring.clock.time_zone)(wiring.clock.now()),
          time_zone: wiring.clock.time_zone,
        },
        { bond_id },
      ),
    )
    if (ticket === undefined) return undefined
    const secret = await wiring
      .machine_of(ticket.my_face_id)
      .sign(the_content_a_ticket_s_secret_signs(ticket.my_mailbox.deposit_address))
    return {
      key: ticket.key,
      introduced_as: ticket.introduced_as,
      mailbox: {
        deposit_address: ticket.my_mailbox.deposit_address,
        relays: [...ticket.my_mailbox.relays],
      },
      secret,
    }
  }
