import { describe, expect, test } from 'vitest'
import * as value from '@q-mino/domains/bonds/address_book/_value.ts'
import { the_content_a_ticket_s_secret_signs } from '@q-mino/domains/bonds/address_book/_dsl.ts'
import { the_signature_holds, type Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'
import {
  a_phone,
  a_phone_with,
  entries_of,
  last_of,
  the_relay,
  type PhoneUnderTest,
  type Shown,
} from './harness.ts'

// The address book's stories (`packages/domains/src/bonds/README.md`, §
// Stories to prove; BND-1..BND-12, DOM-23, GR-9, PER-11, PER-21, DOM-12, the
// invariants of § 4), one test each, named as the README names it: a suite
// parametrized by the primitives port (TST-1), the fake's (`address_book.test.ts`),
// libsodium's from step 18. Each phone is a cell of q-'s oracle with
// `bonds` and `seals` (MBX-7), its reactions and its executors; the faces
// and bonds the stories start from are made through the first start, the
// ticket and the introduction, as stories 10–21 make them. A letter of
// introduction goes from one phone to the other by hand: what `post` would
// carry (step 10), given to the other phone as the entry of `unknown` would
// give it (step 13).
//
// Anna's phone: her face F_a "Anna", its key K_a; bond L_b with Bruno
// (his face K_b, his mailbox D_b, hers for him D_mb), crossed in person on
// Monday 10:00; bond L_c with Carla (K_c, D_c, D_mc), her link opened on
// Tuesday 18:30. Bruno's phone: F_b "Bruno", his bond with Anna L_a, whose
// ticket is T_b; Carla's: F_c "Carla", L_a, its ticket T_c.

/** An instant on Monday 16, Tuesday 17, Wednesday 18 November 2026, by the phones' clocks (UTC). */
const monday = (time: string): string => `2026-11-16T${time}+00:00`
const tuesday = (time: string): string => `2026-11-17T${time}+00:00`
const wednesday = (time: string): string => `2026-11-18T${time}+00:00`

/** The same instant, however it is told. */
const instant = (text: string | undefined): number => Date.parse(text ?? '')

/** The relays of a mailbox on the stories' relay. */
const on_the_relay = [the_relay]

/** The paths of the parts of the facts recorded, fact by fact. */
const paths_of = (facts: Awaited<ReturnType<PhoneUnderTest['recorded']>>) =>
  facts.map((fact) => fact.parts.map((part) => part.path))

/** A command's last event, as far as a refusal names its failures. */
interface Outcome {
  readonly outcome: string
  readonly failures?: readonly { readonly predicate: string }[]
}

/** The predicates a refusal names, branch by branch, by their names (DOM-6). */
const failed = (outcome: Outcome | undefined): readonly string[] => {
  if (outcome?.outcome !== 'rejected') throw new Error(`not a refusal: ${JSON.stringify(outcome)}`)
  return (outcome.failures ?? []).map((failure) => failure.predicate.split('/').at(-1) ?? '')
}

/** The ticket a phone shows, which the story needs. */
const shown = async (phone: PhoneUnderTest, bond_id: string): Promise<Shown> => {
  const ticket = await phone.shows(bond_id)
  if (ticket === undefined) throw new Error(`no ticket ${bond_id} to show`)
  return ticket
}

/** The one letter of introduction a phone handed to `post` last. */
const the_last_letter = (phone: PhoneUnderTest) => {
  const letter = phone.letters().at(-1)
  if (letter === undefined) throw new Error('no letter of introduction')
  return letter
}

/** The face key a phone's first face has, as `my_faces` gives it. */
const the_key_of = async (phone: PhoneUnderTest): Promise<string> => {
  const [face] = entries_of(await phone.my_faces())
  if (face === undefined) throw new Error('no face')
  return face.public_key
}

/** Anna, Bruno and Carla's phones, each through its first start and a ticket on Monday 10:00 (BND-8): Carla's she sends as a link. */
const three_phones = async (primitives: Primitives) => ({
  anna: await a_phone_with(primitives, {
    phone: 1,
    at: monday('10:00:00'),
    face_id: 'F_a',
    name: 'Anna',
    tickets: ['L_b'],
  }),
  bruno: await a_phone_with(primitives, {
    phone: 2,
    at: monday('10:00:00'),
    face_id: 'F_b',
    name: 'Bruno',
    tickets: ['L_a'],
  }),
  carla: await a_phone_with(primitives, {
    phone: 3,
    at: monday('10:00:00'),
    face_id: 'F_c',
    name: 'Carla',
    tickets: ['L_a'],
  }),
})

/** An introduction carried from one phone to the other and taken there, at an instant of the other's clock. */
const carried = async (from: PhoneUnderTest, to: PhoneUnderTest, at: string) => {
  const introduction = await from.carries(the_last_letter(from))
  to.at(at)
  const taken = await to.receives(introduction)
  return { introduction, taken: taken === undefined ? undefined : last_of(taken) }
}

/**
 * Anna's address book of the stories 1–9: the QR crossed with Bruno on
 * Monday 10:00, both phones opening the other's ticket and taking the
 * other's introduction at 10:00, in person; Carla's link opened on Tuesday
 * 18:30, presenting a ticket prepared for it, at a distance.
 */
const annas_address_book = async (primitives: Primitives) => {
  const { anna, bruno, carla } = await three_phones(primitives)
  const T_b = await shown(bruno, 'L_a')
  const T_mb = await shown(anna, 'L_b')
  await anna.open_their_ticket({ bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' })
  await bruno.open_their_ticket({ bond_id: 'L_a', their_ticket: T_mb, name: 'Anna' })
  await anna.runs()
  await bruno.runs()
  await carried(anna, bruno, monday('10:00:00'))
  await carried(bruno, anna, monday('10:00:00'))
  const T_c = await shown(carla, 'L_a')
  anna.at(tuesday('18:30:00'))
  await anna.prepare_a_ticket({ bond_id: 'L_c', face_id: 'F_a', relays: on_the_relay })
  await anna.runs()
  const T_mc = await shown(anna, 'L_c')
  await anna.open_their_ticket({ bond_id: 'L_c', their_ticket: T_c, name: 'Carla' })
  await anna.runs()
  await carried(anna, carla, tuesday('18:31:00'))
  return {
    anna,
    bruno,
    carla,
    K_a: await the_key_of(anna),
    K_b: T_b.key,
    K_c: T_c.key,
    D_b: T_b.mailbox.deposit_address,
    D_mb: T_mb.mailbox.deposit_address,
    D_c: T_c.mailbox.deposit_address,
    D_mc: T_mc.mailbox.deposit_address,
  }
}

export const stories_of_the_address_book = (name: string, primitives: Primitives) => {
  describe(`the address book, ${name}`, () => {
    test('my faces are the made ones, with their place and key', async () => {
      const anna = await a_phone(primitives, { phone: 1, at: monday('09:00:00') })
      await anna.make_my_first_face({ face_id: 'F_a', name: 'Anna' })
      expect(entries_of(await anna.my_faces())).toEqual([])
      await anna.runs()
      expect(entries_of(await anna.my_faces())).toEqual([
        {
          id: 'F_a',
          name: 'Anna',
          position: { place: 'at_the_top' },
          public_key: await anna.the_safe_s_key_of('F_a'),
        },
      ])
    })

    test('my bonds are listed by the name I give, each with one face of mine', async () => {
      const { anna, K_b, K_c } = await annas_address_book(primitives)
      expect(entries_of(await anna.my_bonds())).toEqual([
        {
          id: 'L_b',
          name: 'Bruno',
          my_face_id: 'F_a',
          their_face: { key: K_b, introduced_as: 'Bruno' },
          confirmation: { state: 'received', at: monday('10:00:00') },
        },
        {
          id: 'L_c',
          name: 'Carla',
          my_face_id: 'F_a',
          their_face: { key: K_c, introduced_as: 'Carla' },
          confirmation: { state: 'awaited' },
        },
      ])
    })

    test('a bond reads whole, their mailbox and mine', async () => {
      const { anna, K_b, D_b, D_mb } = await annas_address_book(primitives)
      expect(entries_of(await anna.a_bond('L_b'))).toEqual([
        {
          id: 'L_b',
          name: 'Bruno',
          my_face_id: 'F_a',
          their_face: { key: K_b, introduced_as: 'Bruno' },
          their_mailbox: { deposit_address: D_b, relays: on_the_relay },
          my_mailbox: { deposit_address: D_mb, relays: on_the_relay },
          handshake: { way: 'in_person', at: monday('10:00:00') },
          confirmation: { state: 'received', at: monday('10:00:00') },
        },
      ])
      // My mailbox of the bond is the one the safe drew under its id (BND-7).
      expect((await anna.the_safe_s_mailbox_of('L_b'))?.deposit_address).toBe(D_mb)
    })

    test('a bond renamed keeps the name they are introduced as', async () => {
      const { anna } = await annas_address_book(primitives)
      const letters = anna.letters().length
      const queued = anna.queued().length
      const renamed = last_of(await anna.rename_a_bond({ bond_id: 'L_b', name: 'Bru' }))
      expect(renamed).toMatchObject({
        outcome: 'applied',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/a_bond_has_been_renamed',
              payload: { renamed_bond: { id: 'L_b', name: 'Bru' } },
            },
          ],
        },
      })
      const listed = entries_of(await anna.my_bonds())
      expect(listed.map((bond) => bond.name)).toEqual(['Bru', 'Carla'])
      expect(listed[0]?.their_face.introduced_as).toBe('Bruno')
      // Nothing for Bruno: the name is hers.
      await anna.runs()
      expect(anna.letters()).toHaveLength(letters)
      expect(anna.queued()).toHaveLength(queued)
    })

    test('a rename sent again is the same rename', async () => {
      const { anna } = await annas_address_book(primitives)
      const first = await anna.rename_a_bond(
        { bond_id: 'L_b', name: 'Bru' },
        { operation: 'bruno-is-bru' },
      )
      const facts = (await anna.recorded()).length
      const again = await anna.rename_a_bond(
        { bond_id: 'L_b', name: 'Bru' },
        { operation: 'bruno-is-bru' },
      )
      expect(again).toEqual(first)
      expect(await anna.recorded()).toHaveLength(facts)
    })

    test('a letter at my mailbox finds its bond, the face that opens it and the key that signs it', async () => {
      const { anna, K_b, K_c, D_mb, D_mc } = await annas_address_book(primitives)
      expect(entries_of(await anna.the_bond_at_my_mailbox(D_mb))).toEqual([
        { id: 'L_b', my_face_id: 'F_a', their_face: { key: K_b, introduced_as: 'Bruno' } },
      ])
      expect(entries_of(await anna.the_bond_at_my_mailbox(D_mc))).toEqual([
        { id: 'L_c', my_face_id: 'F_a', their_face: { key: K_c, introduced_as: 'Carla' } },
      ])
    })

    test('an address of no mailbox of mine finds no bond', async () => {
      const { anna, D_b, D_c } = await annas_address_book(primitives)
      // Bruno's mailbox and Carla's are theirs, where Anna deposits: not hers.
      expect(entries_of(await anna.the_bond_at_my_mailbox(D_b))).toEqual([])
      expect(entries_of(await anna.the_bond_at_my_mailbox(D_c))).toEqual([])
      expect(entries_of(await anna.the_bond_at_my_mailbox('no-mailbox-of-hers'))).toEqual([])
    })

    test('a bond removed leaves the list, and its mailbox finds it no more', async () => {
      const { anna, D_mc } = await annas_address_book(primitives)
      const letters = anna.letters().length
      const queued = anna.queued().length
      anna.at(wednesday('09:00:00'))
      const removed = last_of(await anna.remove_a_bond({ bond_id: 'L_c' }))
      expect(removed).toMatchObject({
        outcome: 'applied',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/a_bond_has_been_removed',
              payload: {
                removed_bond: { id: 'L_c', status: 'removed', removed_at: wednesday('09:00:00') },
              },
            },
          ],
        },
      })
      expect(entries_of(await anna.my_bonds()).map((bond) => bond.id)).toEqual(['L_b'])
      expect(entries_of(await anna.a_bond('L_c'))).toEqual([])
      expect(entries_of(await anna.the_bond_at_my_mailbox(D_mc))).toEqual([])
      // Its mailbox is collected no more (BND-11), and nothing goes to Carla.
      expect(entries_of(await anna.the_mailboxes_i_collect()).map((each) => each.id)).toEqual([
        'L_b',
      ])
      await anna.runs()
      expect(anna.letters()).toHaveLength(letters)
      expect(anna.queued()).toHaveLength(queued)
    })

    test('a bond removed again changes nothing', async () => {
      const { anna } = await annas_address_book(primitives)
      await anna.remove_a_bond({ bond_id: 'L_c' })
      const before = {
        bonds: await anna.my_bonds(),
        collected: await anna.the_mailboxes_i_collect(),
      }
      const again = last_of(await anna.remove_a_bond({ bond_id: 'L_c' }))
      expect(again).toMatchObject({
        outcome: 'applied',
        branch: 'the_bond_is_removed_already_so_nothing_changes',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/a_bond_has_been_removed_again',
              payload: { bond_id: 'L_c' },
            },
          ],
        },
      })
      expect(entries_of(await anna.my_bonds())).toEqual(entries_of(before.bonds))
      expect(entries_of(await anna.the_mailboxes_i_collect())).toEqual(entries_of(before.collected))
    })

    test('a bond removed cannot be renamed', async () => {
      const { anna } = await annas_address_book(primitives)
      await anna.remove_a_bond({ bond_id: 'L_c' })
      const facts = (await anna.recorded()).length
      const renamed = last_of(await anna.rename_a_bond({ bond_id: 'L_c', name: 'Carlotta' }))
      expect(renamed).toEqual({
        outcome: 'rejected',
        failures: [
          {
            branch: 'the_bond_is_kept_so_it_is_renamed',
            components: [],
            predicate: 'bonds/address_book/predicate/the_bond_is_kept',
          },
        ],
      })
      expect(await anna.recorded()).toHaveLength(facts)
    })

    test('every bond belongs to exactly one of my faces', async () => {
      const { anna, bruno, carla, D_mb, D_mc } = await annas_address_book(primitives)
      for (const phone of [anna, bruno, carla]) {
        const faces = entries_of(await phone.my_faces()).map((face) => face.id)
        const bonds = entries_of(await phone.my_bonds())
        expect(bonds.length).toBeGreaterThan(0)
        for (const bond of bonds) {
          expect(typeof bond.my_face_id).toBe('string')
          expect(faces).toContain(bond.my_face_id)
        }
      }
      for (const at of [D_mb, D_mc]) {
        for (const bond of entries_of(await anna.the_bond_at_my_mailbox(at))) {
          expect(bond.my_face_id).toBe('F_a')
        }
      }
      // A bond with no face, or with a list of faces, is not a bond of the address book.
      const [whole] = entries_of(await anna.a_bond('L_b'))
      if (whole === undefined) throw new Error('no bond L_b')
      const kept = {
        ...whole,
        status: 'kept',
        expires_at: monday('10:00:00'),
        my_introduction: { state: 'sent', at: monday('10:00:00') },
        their_introduction: { state: 'received', declared_at: monday('10:00:00') },
      }
      expect(value.kept_bond.safeParse(kept).success).toBe(true)
      const with_no_face = Object.fromEntries(
        Object.entries(kept).filter(([field]) => field !== 'my_face_id'),
      )
      expect(value.kept_bond.safeParse(with_no_face).success).toBe(false)
      expect(value.kept_bond.safeParse({ ...kept, my_face_id: ['F_a'] }).success).toBe(false)
      expect(value.kept_bond.safeParse({ ...kept, my_face_ids: ['F_a'] }).success).toBe(false)
    })

    test('a name empty or too long, or an address out of its form, is not taken', async () => {
      const { anna } = await annas_address_book(primitives)
      const facts = (await anna.recorded()).length
      for (const name of ['', 'x'.repeat(81)]) {
        expect(await anna.rename_a_bond({ bond_id: 'L_b', name })).toEqual([
          { outcome: 'invalid_request' },
        ])
      }
      for (const deposit_address of ['not base64url!', 'A'.repeat(129)]) {
        expect(await anna.the_bond_at_my_mailbox(deposit_address)).toEqual([
          { event: 'invalid_request', reason: 'input_not_in_schema' },
        ])
      }
      expect(await anna.recorded()).toHaveLength(facts)
      // The longest name is taken.
      expect(
        last_of(await anna.rename_a_bond({ bond_id: 'L_b', name: 'x'.repeat(80) })),
      ).toMatchObject({ outcome: 'applied' })
    })

    test('no read of the address book gives a secret', async () => {
      const { anna, D_mb, D_mc } = await annas_address_book(primitives)
      // The safe's secrets, as its facts carry them (SEA-1, SEA-7): the seed,
      // the face's private key and chain code, the mailboxes' collect
      // secrets; every long value of its facts but the public ones.
      const K_a = await anna.the_safe_s_key_of('F_a')
      const public_values = new Set([K_a, D_mb, D_mc])
      const all_secrets = (await anna.recorded())
        .flatMap((fact) => fact.parts)
        .filter((part) => part.path.startsWith('seals/'))
        .flatMap((part) => JSON.stringify(part.payload).match(/[A-Za-z0-9_-]{40,}/g) ?? [])
        .filter((each) => !public_values.has(each))
      const R_mb = (await anna.the_safe_s_mailbox_of('L_b'))?.collect_secret
      expect(all_secrets).toContain(R_mb)
      expect(all_secrets.length).toBeGreaterThan(4)
      const entries = [
        ...entries_of(await anna.my_faces()),
        ...entries_of(await anna.my_bonds()),
        ...entries_of(await anna.a_bond('L_b')),
        ...entries_of(await anna.the_bond_at_my_mailbox(D_mb)),
        ...entries_of(await anna.the_mailboxes_i_collect()),
      ]
      for (const entry of entries) {
        const told = JSON.stringify(entry)
        for (const secret of all_secrets) expect(told).not.toContain(secret)
        expect(told).not.toMatch(/secret|seed|private|chain|index/)
      }
      // A ticket's reads give its face's key and its mailbox, never a secret:
      // the ticket's is the safe's to make when it is shown (BND-9).
      await anna.prepare_a_ticket({ bond_id: 'L_d', face_id: 'F_a', relays: on_the_relay })
      await anna.runs()
      const [ticket] = entries_of(await anna.my_ticket('L_d'))
      if (ticket === undefined) throw new Error('no ticket L_d')
      expect(Object.keys(ticket).toSorted()).toEqual(
        ['expires_at', 'id', 'introduced_as', 'key', 'my_face_id', 'my_mailbox'].toSorted(),
      )
      const at_the_mailbox = entries_of(
        await anna.the_ticket_at_my_mailbox(ticket.my_mailbox.deposit_address),
      )
      for (const entry of [ticket, ...at_the_mailbox]) {
        const told = JSON.stringify(entry)
        for (const secret of all_secrets) expect(told).not.toContain(secret)
        expect(told).not.toMatch(/secret|seed|private|chain|index/)
      }
    })

    test('the first start makes my face, its key from the safe', async () => {
      const anna = await a_phone(primitives, { phone: 1, at: monday('09:00:00') })
      const asked = last_of(await anna.make_my_first_face({ face_id: 'F_a', name: 'Anna' }))
      expect(asked).toMatchObject({
        outcome: 'applied',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/a_first_face_has_been_asked_for',
              payload: {
                face_being_made: {
                  id: 'F_a',
                  status: 'being_made',
                  name: 'Anna',
                  position: { place: 'at_the_top' },
                },
              },
            },
          ],
        },
      })
      await anna.runs()
      const facts = await anna.recorded()
      expect(paths_of(facts)).toEqual([
        ['bonds/address_book/fact/a_first_face_has_been_asked_for'],
        ['seals/safe/fact/a_face_has_been_asked_for'],
        ['seals/safe/fact/a_face_has_been_made_from_a_new_seed'],
        ['bonds/address_book/fact/a_face_has_been_made'],
      ])
      const K_a = await anna.the_safe_s_key_of('F_a')
      expect(K_a).toBeDefined()
      expect(facts[3]?.parts[0]?.payload).toEqual({
        made_face: { id: 'F_a', status: 'made', public_key: K_a },
      })
      expect(entries_of(await anna.my_faces())).toEqual([
        { id: 'F_a', name: 'Anna', position: { place: 'at_the_top' }, public_key: K_a },
      ])
      expect(anna.held()).toEqual([])
    })

    test('a second first face is refused', async () => {
      const anna = await a_phone(primitives, { phone: 1, at: monday('09:00:00') })
      await anna.make_my_first_face({ face_id: 'F_a', name: 'Anna' })
      const refused = {
        outcome: 'rejected',
        failures: [
          {
            branch: 'the_user_has_no_face_so_her_first_is_asked_for',
            components: [],
            predicate: 'bonds/address_book/predicate/the_user_has_a_face',
          },
        ],
      }
      // While the safe makes the first, and once it is made.
      expect(last_of(await anna.make_my_first_face({ face_id: 'F_2', name: 'Anna B' }))).toEqual(
        refused,
      )
      await anna.runs()
      expect(last_of(await anna.make_my_first_face({ face_id: 'F_2', name: 'Anna B' }))).toEqual(
        refused,
      )
      expect(entries_of(await anna.my_faces()).map((face) => face.id)).toEqual(['F_a'])
    })

    test('a ticket is ready once the safe drew its mailbox, for 48 hours', async () => {
      const anna = await a_phone_with(primitives, {
        phone: 1,
        at: monday('10:00:00'),
        face_id: 'F_a',
        name: 'Anna',
      })
      const asked = last_of(
        await anna.prepare_a_ticket({ bond_id: 'L_b', face_id: 'F_a', relays: on_the_relay }),
      )
      expect(asked).toMatchObject({
        outcome: 'applied',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/a_ticket_has_been_asked_for',
              payload: {
                ticket_being_prepared: {
                  id: 'L_b',
                  status: 'ticket_being_prepared',
                  my_face_id: 'F_a',
                  my_mailbox: { relays: on_the_relay },
                },
              },
            },
          ],
        },
      })
      const wait = anna
        .queued()
        .find((entry) => entry.effect === 'bonds/address_book/effect/wait_until_the_ticket_expires')
      expect(wait?.payload).toEqual({ bond_id: 'L_b' })
      expect(instant(wait?.not_before)).toBe(instant(wednesday('10:00:00')))
      expect(entries_of(await anna.my_ticket('L_b'))).toEqual([])
      expect(entries_of(await anna.the_mailboxes_i_collect())).toEqual([])
      await anna.runs()
      const facts = await anna.recorded()
      expect(paths_of(facts).slice(-3)).toEqual([
        ['seals/safe/fact/a_mailbox_key_has_been_asked_for'],
        ['seals/safe/fact/a_mailbox_key_has_been_drawn'],
        ['bonds/address_book/fact/a_ticket_has_been_prepared'],
      ])
      const D_mb = (await anna.the_safe_s_mailbox_of('L_b'))?.deposit_address
      expect(D_mb).toBeDefined()
      expect(facts.at(-1)?.parts[0]?.payload).toEqual({ bond_id: 'L_b', deposit_address: D_mb })
      const [ticket] = entries_of(await anna.my_ticket('L_b'))
      expect(ticket).toMatchObject({
        id: 'L_b',
        my_face_id: 'F_a',
        key: await anna.the_safe_s_key_of('F_a'),
        introduced_as: 'Anna',
        my_mailbox: { deposit_address: D_mb, relays: on_the_relay },
      })
      expect(instant(ticket?.expires_at)).toBe(instant(wednesday('10:00:00')))
      expect(entries_of(await anna.the_mailboxes_i_collect())).toEqual([
        { id: 'L_b', my_mailbox: { deposit_address: D_mb, relays: on_the_relay } },
      ])
      // Ready until it expires: on Wednesday 9:59 it is still shown.
      anna.at(wednesday('09:59:00'))
      await anna.runs()
      expect(entries_of(await anna.my_ticket('L_b'))).toHaveLength(1)
    })

    test('a ticket on a face not made is refused', async () => {
      const anna = await a_phone(primitives, { phone: 1, at: monday('10:00:00') })
      await anna.make_my_first_face({ face_id: 'F_a', name: 'Anna' })
      // The safe is still making F_a; F_x is no face of hers.
      for (const face_id of ['F_a', 'F_x']) {
        expect(
          last_of(await anna.prepare_a_ticket({ bond_id: 'L_b', face_id, relays: on_the_relay })),
        ).toEqual({
          outcome: 'rejected',
          failures: [
            {
              branch: 'the_face_is_made_so_a_ticket_is_asked_for',
              components: ['the_face_is_made'],
              predicate: 'bonds/address_book/predicate/the_face_is_made',
            },
          ],
        })
      }
      await anna.runs()
      await anna.prepare_a_ticket({ bond_id: 'L_b', face_id: 'F_a', relays: on_the_relay })
      // Under the id of a bond there already.
      expect(
        last_of(
          await anna.prepare_a_ticket({ bond_id: 'L_b', face_id: 'F_a', relays: on_the_relay }),
        ),
      ).toEqual({
        outcome: 'rejected',
        failures: [
          {
            branch: 'the_face_is_made_so_a_ticket_is_asked_for',
            components: ['the_bond_is_new'],
            predicate: 'bonds/address_book/predicate/a_bond_has_this_id',
          },
        ],
      })
    })

    test("a ticket's secret is my face's signature over its mailbox", async () => {
      const { anna, bruno } = await three_phones(primitives)
      await anna.prepare_a_ticket({ bond_id: 'L_c', face_id: 'F_a', relays: on_the_relay })
      await anna.runs()
      const T_mb = await shown(anna, 'L_b')
      const T_mc = await shown(anna, 'L_c')
      const D_mb = T_mb.mailbox.deposit_address
      const K_a = await the_key_of(anna)
      // The safe's signature by F_a over the content its D makes, by K_a alone.
      expect(T_mb.secret).toBe(await anna.signs('F_a', the_content_a_ticket_s_secret_signs(D_mb)))
      expect(
        the_signature_holds(primitives)(
          K_a,
          the_content_a_ticket_s_secret_signs(D_mb),
          T_mb.secret,
        ),
      ).toBe(true)
      const bruno_s = {
        their_face: { key: await the_key_of(bruno), introduced_as: 'Bruno' },
        their_mailbox: (await shown(bruno, 'L_a')).mailbox,
        declared_at: monday('10:00:00'),
      }
      // Not a signature of the same content by another face, nor the secret of another ticket of hers.
      const by_another_face = await bruno.signs('F_b', the_content_a_ticket_s_secret_signs(D_mb))
      if (by_another_face === undefined) throw new Error('Bruno signs nothing')
      for (const secret of [by_another_face, T_mc.secret]) {
        expect(
          failed(
            last_of(await anna.accept_their_introduction({ bond_id: 'L_b', secret, ...bruno_s })),
          ),
        ).toContain('the_secret_is_the_ticket_s')
      }
      expect(entries_of(await anna.my_bonds())).toEqual([])
      // Its own secret holds.
      expect(
        last_of(
          await anna.accept_their_introduction({ bond_id: 'L_b', secret: T_mb.secret, ...bruno_s }),
        ),
      ).toMatchObject({
        outcome: 'applied',
        branch: 'my_ticket_is_ready_with_its_secret_so_we_are_bonded',
      })
    })

    test('crossed QR: I open theirs, their introduction comes within two minutes, in person', async () => {
      const { anna, bruno } = await three_phones(primitives)
      // Monday 10:00: Bruno's ticket and Anna's on the two screens.
      const T_b = await shown(bruno, 'L_a')
      const T_mb = await shown(anna, 'L_b')
      anna.at(monday('10:00:05'))
      const opened = last_of(
        await anna.open_their_ticket({ bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' }),
      )
      expect(opened).toMatchObject({
        outcome: 'applied',
        branch: 'my_ticket_is_ready_so_we_are_bonded',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/a_bond_has_been_made_by_opening_their_ticket',
              payload: {
                opened_bond: {
                  id: 'L_b',
                  status: 'kept',
                  name: 'Bruno',
                  their_face: { key: T_b.key, introduced_as: 'Bruno' },
                  their_mailbox: T_b.mailbox,
                  handshake: { way: 'at_a_distance', at: monday('10:00:05') },
                  confirmation: { state: 'awaited' },
                  my_introduction: { state: 'sent', at: monday('10:00:05') },
                  their_introduction: { state: 'not_received' },
                },
              },
            },
          ],
        },
      })
      expect(
        anna
          .queued()
          .filter((entry) => entry.effect === 'bonds/address_book/effect/send_my_introduction'),
      ).toMatchObject([{ id: 'L_b', payload: { bond_id: 'L_b', their_ticket: T_b } }])
      await anna.runs()
      expect(anna.letters()).toEqual([{ bond_id: 'L_b', their_ticket: T_b }])
      // Bruno opened Anna's at 10:00:15; his introduction to L_b's ticket comes at 10:00:20.
      bruno.at(monday('10:00:15'))
      await bruno.open_their_ticket({ bond_id: 'L_a', their_ticket: T_mb, name: 'Anna' })
      await bruno.runs()
      const { introduction, taken } = await carried(bruno, anna, monday('10:00:20'))
      expect(introduction.secret).toBe(T_mb.secret)
      expect(introduction.at).toBe(T_mb.mailbox.deposit_address)
      expect(taken).toMatchObject({
        outcome: 'applied',
        branch: 'i_opened_their_ticket_within_the_window_of_a_crossing_so_we_met_in_person',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/their_introduction_has_come_in_person',
              payload: {
                met_bond: {
                  id: 'L_b',
                  handshake: { way: 'in_person', at: monday('10:00:20') },
                  confirmation: { state: 'received', at: monday('10:00:20') },
                  their_introduction: { state: 'received', declared_at: monday('10:00:15') },
                },
              },
            },
          ],
        },
      })
      expect(entries_of(await anna.a_bond('L_b'))).toMatchObject([
        {
          handshake: { way: 'in_person', at: monday('10:00:20') },
          confirmation: { state: 'received', at: monday('10:00:20') },
        },
      ])
    })

    test('crossed QR: their introduction comes first, I open theirs within two minutes, in person', async () => {
      const { anna, bruno } = await three_phones(primitives)
      const T_b = await shown(bruno, 'L_a')
      const T_mb = await shown(anna, 'L_b')
      anna.at(monday('10:00:05'))
      await anna.open_their_ticket({ bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' })
      await anna.runs()
      // 10:00:10: Anna's introduction to his ticket comes first.
      const { taken } = await carried(anna, bruno, monday('10:00:10'))
      expect(taken).toMatchObject({
        outcome: 'applied',
        branch: 'my_ticket_is_ready_with_its_secret_so_we_are_bonded',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/a_bond_has_been_made_by_their_introduction',
              payload: {
                introduced_bond: {
                  id: 'L_a',
                  status: 'kept',
                  name: 'Anna',
                  their_face: { key: T_mb.key, introduced_as: 'Anna' },
                  their_mailbox: T_mb.mailbox,
                  handshake: { way: 'at_a_distance', at: monday('10:00:10') },
                  confirmation: { state: 'received', at: monday('10:00:10') },
                  my_introduction: { state: 'not_sent' },
                  their_introduction: { state: 'received', declared_at: monday('10:00:05') },
                },
              },
            },
          ],
        },
      })
      expect(bruno.letters()).toEqual([])
      // 10:00:30: his phone opens Anna's ticket, presenting his.
      bruno.at(monday('10:00:30'))
      const opened = last_of(
        await bruno.open_their_ticket({ bond_id: 'L_a', their_ticket: T_mb, name: 'Anna' }),
      )
      expect(opened).toMatchObject({
        outcome: 'applied',
        branch: 'their_introduction_came_within_the_window_of_a_crossing_so_we_met_in_person',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/their_ticket_has_been_opened_in_person',
              payload: {
                met_bond: {
                  id: 'L_a',
                  handshake: { way: 'in_person', at: monday('10:00:30') },
                  my_introduction: { state: 'sent', at: monday('10:00:30') },
                },
              },
            },
          ],
        },
      })
      await bruno.runs()
      expect(bruno.letters()).toEqual([{ bond_id: 'L_a', their_ticket: T_mb }])
    })

    test('the crossed QR is one bond, the same on both phones', async () => {
      // The same flow on both phones, in any order (BND-10): both open the
      // other's ticket first; Anna opens first and Bruno takes her
      // introduction first; the reverse.
      const orders = [
        ['anna opens', 'bruno opens', 'anna takes', 'bruno takes'],
        ['anna opens', 'bruno takes', 'bruno opens', 'anna takes'],
        ['bruno opens', 'anna takes', 'anna opens', 'bruno takes'],
      ] as const
      for (const order of orders) {
        const { anna, bruno } = await three_phones(primitives)
        const T_b = await shown(bruno, 'L_a')
        const T_mb = await shown(anna, 'L_b')
        const steps = {
          'anna opens': async (at: string) => {
            anna.at(at)
            await anna.open_their_ticket({ bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' })
            await anna.runs()
          },
          'bruno opens': async (at: string) => {
            bruno.at(at)
            await bruno.open_their_ticket({ bond_id: 'L_a', their_ticket: T_mb, name: 'Anna' })
            await bruno.runs()
          },
          'anna takes': async (at: string) => {
            await carried(bruno, anna, at)
          },
          'bruno takes': async (at: string) => {
            await carried(anna, bruno, at)
          },
        }
        for (const [second, step] of order.entries()) {
          await steps[step](monday(`10:00:${String(10 * (second + 1)).padStart(2, '0')}`))
        }
        const [annas] = entries_of(await anna.my_bonds())
        const [brunos] = entries_of(await bruno.my_bonds())
        expect(entries_of(await anna.my_bonds())).toHaveLength(1)
        expect(entries_of(await bruno.my_bonds())).toHaveLength(1)
        const [on_anna_s] = entries_of(await anna.a_bond(annas?.id ?? ''))
        const [on_bruno_s] = entries_of(await bruno.a_bond(brunos?.id ?? ''))
        expect(on_anna_s).toMatchObject({
          id: 'L_b',
          name: 'Bruno',
          their_face: { key: T_b.key, introduced_as: 'Bruno' },
          their_mailbox: T_b.mailbox,
          my_mailbox: T_mb.mailbox,
          handshake: { way: 'in_person' },
          confirmation: { state: 'received' },
        })
        expect(on_bruno_s).toMatchObject({
          id: 'L_a',
          name: 'Anna',
          their_face: { key: T_mb.key, introduced_as: 'Anna' },
          their_mailbox: T_mb.mailbox,
          my_mailbox: T_b.mailbox,
          handshake: { way: 'in_person' },
          confirmation: { state: 'received' },
        })
        // Crosswise: each deposits on the D the other collects.
        expect(on_anna_s?.their_mailbox).toEqual(on_bruno_s?.my_mailbox)
        expect(on_bruno_s?.their_mailbox).toEqual(on_anna_s?.my_mailbox)
        // Each sent its introduction once.
        expect(anna.letters()).toHaveLength(1)
        expect(bruno.letters()).toHaveLength(1)
        // Each collects its ticket's mailbox, now the bond's.
        expect(entries_of(await anna.the_mailboxes_i_collect())).toEqual([
          { id: 'L_b', my_mailbox: T_mb.mailbox },
        ])
        expect(entries_of(await bruno.the_mailboxes_i_collect())).toEqual([
          { id: 'L_a', my_mailbox: T_b.mailbox },
        ])
        expect([...anna.held(), ...bruno.held()]).toEqual([])
      }
    })

    test('a link opened makes a bond at a distance, awaiting their confirmation', async () => {
      const { anna, carla } = await three_phones(primitives)
      const T_c = await shown(carla, 'L_a')
      anna.at(tuesday('18:30:00'))
      await anna.prepare_a_ticket({ bond_id: 'L_c', face_id: 'F_a', relays: on_the_relay })
      await anna.runs()
      const T_mc = await shown(anna, 'L_c')
      const opened = last_of(
        await anna.open_their_ticket({ bond_id: 'L_c', their_ticket: T_c, name: 'Carla' }),
      )
      expect(opened).toMatchObject({
        outcome: 'applied',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/a_bond_has_been_made_by_opening_their_ticket',
              payload: {
                opened_bond: {
                  id: 'L_c',
                  handshake: { way: 'at_a_distance', at: tuesday('18:30:00') },
                  confirmation: { state: 'awaited' },
                  my_introduction: { state: 'sent', at: tuesday('18:30:00') },
                },
              },
            },
          ],
        },
      })
      await anna.runs()
      // On Carla's phone, whenever it collects her introduction.
      const { taken } = await carried(anna, carla, tuesday('19:45:00'))
      expect(taken).toMatchObject({
        outcome: 'applied',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/a_bond_has_been_made_by_their_introduction',
              payload: {
                introduced_bond: {
                  id: 'L_a',
                  name: 'Anna',
                  their_mailbox: T_mc.mailbox,
                  handshake: { way: 'at_a_distance', at: tuesday('19:45:00') },
                  confirmation: { state: 'received', at: tuesday('19:45:00') },
                  my_introduction: { state: 'not_sent' },
                },
              },
            },
          ],
        },
      })
      await carla.runs()
      expect(carla.letters()).toEqual([])
      expect(entries_of(await anna.a_bond('L_c'))).toMatchObject([
        { handshake: { way: 'at_a_distance' }, confirmation: { state: 'awaited' } },
      ])
    })

    test('tickets crossed later than two minutes stay at a distance', async () => {
      // Anna opens Bruno's at 10:00:05; his introduction comes at 10:03.
      const first = await three_phones(primitives)
      const T_b = await shown(first.bruno, 'L_a')
      const T_mb = await shown(first.anna, 'L_b')
      first.anna.at(monday('10:00:05'))
      await first.anna.open_their_ticket({ bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' })
      first.bruno.at(monday('10:02:50'))
      await first.bruno.open_their_ticket({ bond_id: 'L_a', their_ticket: T_mb, name: 'Anna' })
      await first.bruno.runs()
      const later = await carried(first.bruno, first.anna, monday('10:03:00'))
      expect(later.taken).toMatchObject({
        outcome: 'applied',
        branch: 'i_opened_their_ticket_outside_the_window_of_a_crossing_so_they_have_me_now',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/their_introduction_has_come',
              payload: {
                confirmed_bond: {
                  id: 'L_b',
                  confirmation: { state: 'received', at: monday('10:03:00') },
                },
              },
            },
          ],
        },
      })
      expect(entries_of(await first.anna.a_bond('L_b'))).toMatchObject([
        { handshake: { way: 'at_a_distance', at: monday('10:00:05') } },
      ])
      // Bruno's introduction comes first, at 10:00:10; Anna opens his ticket at 10:03.
      const second = await three_phones(primitives)
      const T_b2 = await shown(second.bruno, 'L_a')
      const T_mb2 = await shown(second.anna, 'L_b')
      await second.bruno.open_their_ticket({ bond_id: 'L_a', their_ticket: T_mb2, name: 'Anna' })
      await second.bruno.runs()
      await carried(second.bruno, second.anna, monday('10:00:10'))
      second.anna.at(monday('10:03:00'))
      expect(
        last_of(
          await second.anna.open_their_ticket({
            bond_id: 'L_b',
            their_ticket: T_b2,
            name: 'Bruno',
          }),
        ),
      ).toMatchObject({
        outcome: 'applied',
        branch: 'their_introduction_came_outside_the_window_of_a_crossing_so_mine_goes_now',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/their_ticket_has_been_opened_after_their_introduction',
              payload: {
                introduced_bond: {
                  id: 'L_b',
                  my_introduction: { state: 'sent', at: monday('10:03:00') },
                },
              },
            },
          ],
        },
      })
      await second.anna.runs()
      expect(second.anna.letters()).toEqual([{ bond_id: 'L_b', their_ticket: T_b2 }])
      expect(entries_of(await second.anna.a_bond('L_b'))).toMatchObject([
        { handshake: { way: 'at_a_distance', at: monday('10:00:10') } },
      ])
    })

    test('a crossing is measured from the time their introduction declares, whenever it is taken', async () => {
      // Anna opens Bruno's at 10:00:05, his phone opens hers at 10:00:15;
      // her phone, closed, takes his introduction at 10:30: in person all the same.
      const late = await three_phones(primitives)
      const T_b = await shown(late.bruno, 'L_a')
      const T_mb = await shown(late.anna, 'L_b')
      late.anna.at(monday('10:00:05'))
      await late.anna.open_their_ticket({ bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' })
      late.bruno.at(monday('10:00:15'))
      await late.bruno.open_their_ticket({ bond_id: 'L_a', their_ticket: T_mb, name: 'Anna' })
      await late.bruno.runs()
      const taken_late = await carried(late.bruno, late.anna, monday('10:30:00'))
      expect(taken_late.introduction.declared_at).toBe(monday('10:00:15'))
      expect(taken_late.taken).toMatchObject({
        outcome: 'applied',
        branch: 'i_opened_their_ticket_within_the_window_of_a_crossing_so_we_met_in_person',
      })
      expect(entries_of(await late.anna.a_bond('L_b'))).toMatchObject([
        { handshake: { way: 'in_person' } },
      ])
      // Bruno's introduction, declared at 10:00:05, taken by her phone at
      // 10:30:00, and she opens his ticket at 10:30:10: half an hour after
      // he opened hers, at a distance, however close the two takings are.
      const opened_late = await three_phones(primitives)
      const T_b2 = await shown(opened_late.bruno, 'L_a')
      const T_mb2 = await shown(opened_late.anna, 'L_b')
      opened_late.bruno.at(monday('10:00:05'))
      await opened_late.bruno.open_their_ticket({
        bond_id: 'L_a',
        their_ticket: T_mb2,
        name: 'Anna',
      })
      await opened_late.bruno.runs()
      await carried(opened_late.bruno, opened_late.anna, monday('10:30:00'))
      opened_late.anna.at(monday('10:30:10'))
      expect(
        last_of(
          await opened_late.anna.open_their_ticket({
            bond_id: 'L_b',
            their_ticket: T_b2,
            name: 'Bruno',
          }),
        ),
      ).toMatchObject({
        outcome: 'applied',
        branch: 'their_introduction_came_outside_the_window_of_a_crossing_so_mine_goes_now',
      })
      expect(entries_of(await opened_late.anna.a_bond('L_b'))).toMatchObject([
        { handshake: { way: 'at_a_distance', at: monday('10:30:00') } },
      ])
    })

    test('an opening or an introduction again changes nothing', async () => {
      const { anna, bruno } = await annas_address_book(primitives)
      const T_b = anna.letters()[0]?.their_ticket
      if (T_b === undefined) throw new Error('no ticket of Bruno')
      const bond = await anna.a_bond('L_b')
      const letters = anna.letters().length
      const queued = anna.queued().length
      const again = last_of(
        await anna.open_their_ticket({ bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' }),
      )
      expect(again).toMatchObject({
        outcome: 'applied',
        branch: 'my_introduction_was_sent_already_so_nothing_changes',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/their_ticket_has_been_opened_again',
              payload: { bond_id: 'L_b' },
            },
          ],
        },
      })
      await anna.runs()
      expect(anna.queued()).toHaveLength(queued)
      expect(anna.letters()).toHaveLength(letters)
      // His introduction again: the same letter, collected twice.
      const his = await bruno.carries(the_last_letter(bruno))
      const taken = last_of((await anna.receives(his)) ?? [])
      expect(taken).toMatchObject({
        outcome: 'applied',
        branch: 'their_introduction_came_already_so_nothing_changes',
        fact: {
          parts: [
            {
              path: 'bonds/address_book/fact/their_introduction_has_come_again',
              payload: { bond_id: 'L_b' },
            },
          ],
        },
      })
      expect(entries_of(await anna.a_bond('L_b'))).toEqual(entries_of(bond))
      // Sent again under the same operation, each is its recorded fact (DOM-11).
      const opening = { bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' }
      const once = await anna.open_their_ticket(opening, { operation: 'bruno-s-qr-again' })
      expect(await anna.open_their_ticket(opening, { operation: 'bruno-s-qr-again' })).toEqual(once)
      const taking = await anna.receives(his, { operation: 'bruno-s-letter-again' })
      expect(await anna.receives(his, { operation: 'bruno-s-letter-again' })).toEqual(taking)
    })

    test('a ticket used by another face is refused', async () => {
      const { anna, bruno, carla } = await three_phones(primitives)
      // Carla saw Anna's QR too, on Monday 10:00, before Bruno used it.
      const T_b = await shown(bruno, 'L_a')
      const T_mb = await shown(anna, 'L_b')
      await anna.open_their_ticket({ bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' })
      await anna.runs()
      await bruno.open_their_ticket({ bond_id: 'L_a', their_ticket: T_mb, name: 'Anna' })
      await bruno.runs()
      await carried(bruno, anna, monday('10:00:20'))
      carla.at(monday('10:05:00'))
      await carla.open_their_ticket({ bond_id: 'L_a', their_ticket: T_mb, name: 'Anna' })
      await carla.runs()
      const facts = (await anna.recorded()).length
      const { introduction, taken } = await carried(carla, anna, monday('10:05:10'))
      expect(introduction.at).toBe(T_mb.mailbox.deposit_address)
      const refused = failed(taken)
      expect(refused).toContain('the_ticket_is_ready')
      expect(refused).toContain('the_bond_is_with_this_face')
      expect(await anna.recorded()).toHaveLength(facts)
      expect(entries_of(await anna.my_bonds()).map((bond) => bond.id)).toEqual(['L_b'])
      // On a bond removed, refused the same: its mailbox finds no bond, and the command refuses.
      await anna.remove_a_bond({ bond_id: 'L_b' })
      const removed = (await anna.recorded()).length
      expect(await anna.receives(introduction)).toBeUndefined()
      const on_the_removed = failed(
        last_of(
          await anna.accept_their_introduction({
            bond_id: 'L_b',
            secret: introduction.secret,
            their_face: introduction.their_face,
            their_mailbox: introduction.their_mailbox,
            declared_at: introduction.declared_at,
          }),
        ),
      )
      expect(on_the_removed).toContain('the_ticket_is_ready')
      expect(on_the_removed).toContain('the_bond_is_kept')
      expect(await anna.recorded()).toHaveLength(removed)
    })

    test("an introduction with a secret not the ticket's is refused", async () => {
      const { anna, carla } = await three_phones(primitives)
      anna.at(tuesday('18:30:00'))
      await anna.prepare_a_ticket({ bond_id: 'L_c', face_id: 'F_a', relays: on_the_relay })
      await anna.runs()
      const T_mb = await shown(anna, 'L_b')
      const T_mc = await shown(anna, 'L_c')
      const T_c = await shown(carla, 'L_a')
      const by_another_face = await carla.signs(
        'F_c',
        the_content_a_ticket_s_secret_signs(T_mc.mailbox.deposit_address),
      )
      if (by_another_face === undefined) throw new Error('Carla signs nothing')
      const facts = (await anna.recorded()).length
      for (const secret of [T_mb.secret, by_another_face]) {
        const refused = last_of(
          await anna.accept_their_introduction({
            bond_id: 'L_c',
            secret,
            their_face: { key: T_c.key, introduced_as: 'Carla' },
            their_mailbox: T_c.mailbox,
            declared_at: tuesday('18:30:00'),
          }),
        )
        expect(failed(refused)).toContain('the_secret_is_the_ticket_s')
      }
      expect(await anna.recorded()).toHaveLength(facts)
      expect(entries_of(await anna.my_bonds())).toEqual([])
      expect(entries_of(await anna.my_ticket('L_c'))).toHaveLength(1)
    })

    test('a ticket unused for 48 hours expires, and is refused after', async () => {
      const { anna, bruno } = await three_phones(primitives)
      // Monday 10:00: L_b used by Bruno, L_x shown to no one, L_y whose mailbox the safe has not drawn.
      const T_b = await shown(bruno, 'L_a')
      await anna.open_their_ticket({ bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' })
      await anna.prepare_a_ticket({ bond_id: 'L_x', face_id: 'F_a', relays: on_the_relay })
      await anna.runs()
      const T_mx = await shown(anna, 'L_x')
      await anna.prepare_a_ticket({ bond_id: 'L_y', face_id: 'F_a', relays: on_the_relay })
      // Wednesday 10:00: the waits come back, before the safe draws L_y's mailbox.
      anna.at(wednesday('10:00:00'))
      await anna.the_waits_come_back()
      const expired = (await anna.recorded()).slice(-3)
      expect(
        expired.map((fact) => [fact.parts[0]?.path.split('/').at(-1), fact.parts[0]?.payload]),
      ).toEqual([
        ['the_ticket_was_used_before_it_expired', { bond_id: 'L_b' }],
        ['a_ticket_has_expired', { expired_ticket: { id: 'L_x', status: 'ticket_expired' } }],
        ['a_ticket_has_expired', { expired_ticket: { id: 'L_y', status: 'ticket_expired' } }],
      ])
      expect(entries_of(await anna.my_ticket('L_x'))).toEqual([])
      expect(entries_of(await anna.my_bonds()).map((bond) => bond.id)).toEqual(['L_b'])
      // The safe's key for L_y comes after: nothing changes, L_y stays expired.
      await anna.runs()
      expect(paths_of(await anna.recorded()).at(-1)).toEqual([
        'bonds/address_book/fact/a_mailbox_has_come_for_an_expired_ticket',
      ])
      expect(entries_of(await anna.my_ticket('L_y'))).toEqual([])
      expect(entries_of(await anna.the_mailboxes_i_collect()).map((each) => each.id)).toEqual([
        'L_b',
      ])
      // An introduction to the expired ticket: its mailbox finds nothing, and the command refuses.
      const introduction = {
        at: T_mx.mailbox.deposit_address,
        secret: T_mx.secret,
        their_face: { key: T_b.key, introduced_as: 'Bruno' },
        their_mailbox: T_b.mailbox,
        declared_at: wednesday('10:05:00'),
      }
      expect(await anna.receives(introduction)).toBeUndefined()
      const facts = (await anna.recorded()).length
      expect(
        failed(
          last_of(
            await anna.accept_their_introduction({
              bond_id: 'L_x',
              secret: introduction.secret,
              their_face: introduction.their_face,
              their_mailbox: introduction.their_mailbox,
              declared_at: introduction.declared_at,
            }),
          ),
        ),
      ).toContain('the_ticket_is_ready')
      expect(await anna.recorded()).toHaveLength(facts)
      expect(anna.held()).toEqual([])
    })

    test("a bond's relays are those its peer declared", async () => {
      const { anna, bruno } = await three_phones(primitives)
      const T_b = await shown(bruno, 'L_a')
      const T_mb = await shown(anna, 'L_b')
      await anna.open_their_ticket({ bond_id: 'L_b', their_ticket: T_b, name: 'Bruno' })
      await anna.runs()
      await bruno.open_their_ticket({ bond_id: 'L_a', their_ticket: T_mb, name: 'Anna' })
      await bruno.runs()
      // Bruno's introduction declares another mailbox, on another relay: the bond keeps his ticket's.
      const his = await bruno.carries(the_last_letter(bruno))
      const elsewhere = {
        ...his,
        their_mailbox: { deposit_address: 'another-mailbox', relays: ['https://other.relay.test'] },
      }
      expect(last_of((await anna.receives(elsewhere)) ?? [])).toMatchObject({
        outcome: 'applied',
        branch: 'i_opened_their_ticket_within_the_window_of_a_crossing_so_we_met_in_person',
      })
      expect(entries_of(await anna.a_bond('L_b'))).toMatchObject([
        { their_mailbox: { deposit_address: T_b.mailbox.deposit_address, relays: on_the_relay } },
      ])
      // On Bruno's, Anna's mailbox is the one her introduction declared.
      await carried(anna, bruno, monday('10:00:20'))
      expect(entries_of(await bruno.a_bond('L_a'))).toMatchObject([
        { their_mailbox: { deposit_address: T_mb.mailbox.deposit_address, relays: on_the_relay } },
      ])
      // A later introduction declaring another changes nothing.
      const hers = await anna.carries(the_last_letter(anna))
      expect(
        last_of(
          (await bruno.receives({
            ...hers,
            their_mailbox: { deposit_address: 'another', relays: ['https://other.relay.test'] },
          })) ?? [],
        ),
      ).toMatchObject({ branch: 'their_introduction_came_already_so_nothing_changes' })
      expect(entries_of(await bruno.a_bond('L_a'))).toMatchObject([
        { their_mailbox: { deposit_address: T_mb.mailbox.deposit_address, relays: on_the_relay } },
      ])
    })

    test('a ticket with a relay out of its form is not taken', async () => {
      const { anna, bruno } = await three_phones(primitives)
      const T_b = await shown(bruno, 'L_a')
      const facts = (await anna.recorded()).length
      const out_of_form = [
        ['http://relay.q-mino.test'],
        ['relay.q-mino.test'],
        [the_relay, 'https://other.relay.test'],
        [],
      ]
      for (const relays of out_of_form) {
        expect(
          await anna.open_their_ticket({
            bond_id: 'L_b',
            their_ticket: { ...T_b, mailbox: { ...T_b.mailbox, relays } },
            name: 'Bruno',
          }),
        ).toEqual([{ outcome: 'invalid_request' }])
        expect(await anna.prepare_a_ticket({ bond_id: 'L_z', face_id: 'F_a', relays })).toEqual([
          { outcome: 'invalid_request' },
        ])
        expect(
          await anna.accept_their_introduction({
            bond_id: 'L_b',
            secret: T_b.secret,
            their_face: { key: T_b.key, introduced_as: 'Bruno' },
            their_mailbox: { ...T_b.mailbox, relays },
            declared_at: monday('10:00:00'),
          }),
        ).toEqual([{ outcome: 'invalid_request' }])
      }
      expect(await anna.recorded()).toHaveLength(facts)
    })
  })
}
