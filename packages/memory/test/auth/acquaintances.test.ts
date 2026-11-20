import * as zz from '@q-mino/domains/library'
import {
  bond_of_a_face,
  extensions_offered,
  ticket_a_face_presents,
} from '@q-mino/domains/auth/acquaintances/_value.ts'
import { a_face_at_my_mailbox } from '@q-mino/domains/persona/_dsl.ts'
import type * as persona_value from '@q-mino/domains/persona/_value.ts'
import { describe, expect, test } from 'vitest'
import {
  a_key_never_seen,
  a_node,
  a_story,
  all,
  bonded_by_a_link,
  bonded_in_person,
  carried,
  shown,
  type NodeUnderTest,
} from '../node/harness.ts'

// Auth's stories (`packages/domains/src/auth/README.md`, § Stories to
// prove; PER-9, PER-22, GR-4, F6, PER-14), one test each, named as the
// README names it, on the node of q-'s oracle (`../node/harness.ts`):
// Anna's phone, one cell with the safe, the address book and the office of
// the extensions, her bonds made by tickets and introductions as the
// address book's stories make them. The lookups are auth's, through
// `zz.lookup_ports` over the adapters of part 13.2 (`the_acquaintances`),
// entered with the key as the kernel's entry gives it: the `Caller` of a
// face's letter at a mailbox of mine (PER-23), keyed as the persona's nodes
// key it (`a_face_at_my_mailbox`).
//
// Anna's face F_a "Anna"; her bond L_b with Bruno, crossed in person (his
// key K_b, his mailbox D_b, hers for him D_mb); her bond L_c with Carla,
// Carla's link opened (K_c, D_c, D_mc); her ticket L_d, ready at D_md, sent
// to Dario in a link (K_d, a face her phone never saw); K_e, Elena's, a
// face no phone of the story made. Greetings preinstalled on Anna's phone.

/** The key of auth's lookups as the kernel's entry gives it: a face's letter at a mailbox of mine, its `Caller` (PER-23), keyed as the nodes key it. */
const a_face_at = (face: string, mailbox: string) => {
  const caller: persona_value.caller = { is: 'a_face', key: face, to_my_mailbox: mailbox }
  const key = a_face_at_my_mailbox({ caller })
  if (key.answer !== 'known') throw new Error('a face at my mailbox not known')
  return key.value
}

/** Nothing known: the whole answer of a lookup whose key leads to no value (D30). */
const not_known = { answer: 'not_known' }

/**
 * Anna's acquaintances: her phone, Bruno's, Carla's and Dario's, at 10:00 on
 * Friday 20 November 2026. L_b, the QR crossed with Bruno, his introduction
 * carried to her, unless the story keeps it back (`not_yet`: Anna opened
 * his ticket presenting L_b's, his introduction not come); L_c, Carla's
 * link, opened by Anna presenting L_c's ticket; L_d, Anna's ticket, ready.
 */
const annas_acquaintances = async (
  options: { readonly brunos_introduction?: 'carried' | 'not_yet' } = {},
) => {
  const story = await a_story()
  const anna = await a_node(story, { phone: 1, face_id: 'F_a', name: 'Anna' })
  const elsewhere = { greetings: 'not_installed' } as const
  const bruno = await a_node(story, { phone: 2, face_id: 'F_b', name: 'Bruno', ...elsewhere })
  const carla = await a_node(story, { phone: 3, face_id: 'F_c', name: 'Carla', ...elsewhere })
  const dario = await a_node(story, { phone: 4, face_id: 'F_d', name: 'Dario', ...elsewhere })
  await bonded_in_person(
    { node: anna, bond_id: 'L_b', name: 'Bruno' },
    { node: bruno, bond_id: 'L_a', name: 'Anna' },
    options.brunos_introduction === 'not_yet' ? 'not_the_second_s' : 'both',
  )
  await bonded_by_a_link(
    { node: carla, bond_id: 'L_a', name: 'Anna' },
    { node: anna, bond_id: 'L_c', name: 'Carla' },
  )
  await anna.prepares_a_ticket('L_d')
  const mailbox_of = async (node: NodeUnderTest, bond_id: string) =>
    (await node.my_mailbox_of(bond_id)).deposit_address
  return {
    story,
    anna,
    bruno,
    carla,
    dario,
    /** Auth's lookups on Anna's node, as the trees invoke them. */
    lookups: anna.acquaintances(),
    K_b: bruno.key,
    K_c: carla.key,
    K_d: dario.key,
    K_e: a_key_never_seen(story.primitives, 5),
    D_mb: await mailbox_of(anna, 'L_b'),
    D_mc: await mailbox_of(anna, 'L_c'),
    D_md: await mailbox_of(anna, 'L_d'),
    D_b: await mailbox_of(bruno, 'L_a'),
  }
}

describe('auth, the acquaintances (PER-22)', () => {
  test('the bond of a face at my mailbox is the bond kept there with that face', async () => {
    const { anna, lookups, K_b, K_c, D_mb, D_mc } = await annas_acquaintances()
    expect(await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_b, D_mb))).toEqual({
      answer: 'known',
      value: { bond_id: 'L_b', my_face_id: 'F_a', their_key: K_b, name: 'Bruno' },
    })
    // Renamed "Bru": the name follows, read at the instant it is asked.
    expect(await anna.renames('L_b', 'Bru')).toMatchObject([
      { event: 'the_bond_is_renamed', payload: { bond_id: 'L_b', name: 'Bru' } },
    ])
    expect(await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_b, D_mb))).toEqual({
      answer: 'known',
      value: { bond_id: 'L_b', my_face_id: 'F_a', their_key: K_b, name: 'Bru' },
    })
    expect(await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_c, D_mc))).toEqual({
      answer: 'known',
      value: { bond_id: 'L_c', my_face_id: 'F_a', their_key: K_c, name: 'Carla' },
    })
  })

  test('a face at a mailbox of another bond is not known', async () => {
    const { anna, lookups, K_b, K_c, D_b, D_mc } = await annas_acquaintances()
    // K_b at D_mc, the mailbox of Anna's bond with Carla: a known key outside its bond.
    expect(await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_b, D_mc))).toEqual(not_known)
    // K_b at D_b, his own mailbox, not hers.
    expect(await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_b, D_b))).toEqual(not_known)
    // K_c at D_mc once Anna removed L_c.
    expect(await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_c, D_mc))).toMatchObject({
      answer: 'known',
    })
    expect(await anna.removes_a_bond('L_c')).toMatchObject([
      { event: 'the_bond_is_removed', payload: { bond_id: 'L_c' } },
    ])
    expect(await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_c, D_mc))).toEqual(not_known)
  })

  test('a ready ticket of mine is what any face presents at its mailbox', async () => {
    const { anna, story, lookups, K_d, D_md, D_mb } = await annas_acquaintances()
    // K_d at D_md: the bond to be, Anna's face, the key the lookup was asked with.
    expect(await lookups.the_ticket_a_face_presents_at_my_mailbox(a_face_at(K_d, D_md))).toEqual({
      answer: 'known',
      value: { bond_id: 'L_d', my_face_id: 'F_a', their_key: K_d },
    })
    // K_d at D_mb, a mailbox of a bond kept with another face.
    expect(await lookups.the_ticket_a_face_presents_at_my_mailbox(a_face_at(K_d, D_mb))).toEqual(
      not_known,
    )
    // Once L_d expired, its 48 hours over (BND-8).
    story.at_the_instant('2026-11-22T10:00:01Z')
    await anna.runs()
    expect(await anna.my_ticket('L_d')).toBeUndefined()
    expect(await lookups.the_ticket_a_face_presents_at_my_mailbox(a_face_at(K_d, D_md))).toEqual(
      not_known,
    )
  })

  test('a bond kept with that face is what it presents at its mailbox', async () => {
    const { anna, bruno, dario, lookups, K_b, K_c, K_d, K_e, D_mb, D_md } =
      await annas_acquaintances({ brunos_introduction: 'not_yet' })
    // Anna opened Bruno's ticket presenting L_b's: his introduction, at D_mb, is for L_b.
    expect((await anna.a_bond('L_b'))?.confirmation).toEqual({ state: 'awaited' })
    expect(await lookups.the_ticket_a_face_presents_at_my_mailbox(a_face_at(K_b, D_mb))).toEqual({
      answer: 'known',
      value: { bond_id: 'L_b', my_face_id: 'F_a', their_key: K_b },
    })
    expect(await lookups.the_ticket_a_face_presents_at_my_mailbox(a_face_at(K_c, D_mb))).toEqual(
      not_known,
    )
    // His introduction completes it.
    await carried(bruno, anna)
    expect((await anna.a_bond('L_b'))?.confirmation).toMatchObject({ state: 'received' })
    // Dario opens L_d's link presenting a ticket of his; his introduction makes L_d.
    await dario.prepares_a_ticket('L_a')
    await dario.opens_their_ticket({
      bond_id: 'L_a',
      their_ticket: await shown(anna, 'L_d'),
      name: 'Anna',
    })
    await carried(dario, anna)
    expect((await anna.a_bond('L_d'))?.their_face).toEqual({ key: K_d, introduced_as: 'Dario' })
    expect(await lookups.the_ticket_a_face_presents_at_my_mailbox(a_face_at(K_d, D_md))).toEqual({
      answer: 'known',
      value: { bond_id: 'L_d', my_face_id: 'F_a', their_key: K_d },
    })
    // A ticket is used once: K_e, another face, at D_md.
    expect(await lookups.the_ticket_a_face_presents_at_my_mailbox(a_face_at(K_e, D_md))).toEqual(
      not_known,
    )
  })

  test('the extensions offered to the bond of a key: a list, empty, or not known', async () => {
    const { anna, lookups, K_b, K_d, D_mb, D_mc, D_md } = await annas_acquaintances()
    const offered_to = (face: string, mailbox: string) =>
      lookups.the_extensions_offered_to_the_bond_of_a_key(a_face_at(face, mailbox))
    // Greetings not active yet: offered to no bond.
    expect(await offered_to(K_b, D_mb)).toEqual({ answer: 'known', value: [] })
    expect(
      await anna.the_user('usecase/activate_an_extension', { manifest: anna.shown() }),
    ).toMatchObject([{ event: 'the_extension_is_active' }])
    expect(await offered_to(K_b, D_mb)).toEqual({
      answer: 'known',
      value: [{ extension: 'greetings', majors: [1] }],
    })
    // Anna withdraws its offer from L_b: an empty list.
    expect(await anna.withdraws_the_offer_from('L_b')).toMatchObject([
      { event: 'the_offer_is_withdrawn' },
    ])
    expect(await offered_to(K_b, D_mb)).toEqual({ answer: 'known', value: [] })
    // Offered again, then greetings deactivated: an empty list.
    await anna.offers_again_to('L_b')
    expect(await offered_to(K_b, D_mb)).toEqual({
      answer: 'known',
      value: [{ extension: 'greetings', majors: [1] }],
    })
    expect(
      await anna.the_user('usecase/deactivate_an_extension', { extension: 'greetings' }),
    ).toMatchObject([{ event: 'the_extension_is_deactivated' }])
    expect(await offered_to(K_b, D_mb)).toEqual({ answer: 'known', value: [] })
    // K_b at D_mc, or K_d at D_md (a ticket, no bond): not known, so the routing stays silent (F8).
    expect(await offered_to(K_b, D_mc)).toEqual(not_known)
    expect(await offered_to(K_d, D_md)).toEqual(not_known)
  })

  test('the acquaintances answer with data', async () => {
    const { anna, story, lookups, K_b, K_c, K_d, K_e, D_b, D_mb, D_mc, D_md } =
      await annas_acquaintances()
    await anna.the_user('usecase/activate_an_extension', { manifest: anna.shown() })
    const bond_at_another_s = await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_b, D_mc))
    const bond_at_no_bond = await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_b, D_b))
    const known_answers = [
      [await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_b, D_mb)), bond_of_a_face],
      [
        await lookups.the_ticket_a_face_presents_at_my_mailbox(a_face_at(K_d, D_md)),
        ticket_a_face_presents,
      ],
      [
        await lookups.the_extensions_offered_to_the_bond_of_a_key(a_face_at(K_b, D_mb)),
        extensions_offered,
      ],
    ] as const
    await anna.removes_a_bond('L_c')
    const bond_removed = await lookups.the_bond_of_a_face_at_my_mailbox(a_face_at(K_c, D_mc))
    const not_known_answers = [
      bond_at_another_s,
      bond_at_no_bond,
      bond_removed,
      await lookups.the_ticket_a_face_presents_at_my_mailbox(a_face_at(K_e, D_mb)),
      await lookups.the_extensions_offered_to_the_bond_of_a_key(a_face_at(K_d, D_md)),
    ]
    // Each value known is the one its schema declares, whole (its strict parse), and nothing beside it.
    for (const [answer, schema] of known_answers) {
      expect(answer).toStrictEqual({
        answer: 'known',
        value: schema.parse(answer.answer === 'known' ? answer.value : undefined),
      })
    }
    // "Not known", the same whatever the reason (another face, no bond, removed): no reason, no list.
    for (const answer of not_known_answers) expect(answer).toStrictEqual(not_known)
    // Why is the trace's: the node of `known` that reads it keeps the `Caller`, its key and its mailbox (F6, PER-14).
    const asked_on_known = (face: string, mailbox: string) =>
      all(
        anna.personas().known(
          {
            now: zz.in_zone(story.clock.time_zone)(story.clock.now()),
            time_zone: story.clock.time_zone,
            caller: { is: 'a_face', key: face, to_my_mailbox: mailbox },
            version: zz.semver.parse('1.0.0'),
          },
          { leaf: 'usecase/the_extensions_in_common', input: { offered: [] } },
        ),
      )
    expect(await asked_on_known(K_b, D_mc)).toEqual([{ event: 'not_found' }])
    expect(await asked_on_known(K_c, D_mc)).toEqual([{ event: 'not_found' }])
    expect(anna.tree_traced.slice(-2)).toMatchObject([
      {
        path: 'persona/known/usecase/the_extensions_in_common',
        given: { caller: { is: 'a_face', key: K_b, to_my_mailbox: D_mc } },
        why: {
          closed_by: 'a_lookup',
          node: 'persona/known/node/known',
          lookups: [{ lookup: 'the_bond_of_the_caller', not_known: 'value' }],
        },
      },
      {
        given: { caller: { is: 'a_face', key: K_c, to_my_mailbox: D_mc } },
        why: { closed_by: 'a_lookup' },
      },
    ])
  })
})
