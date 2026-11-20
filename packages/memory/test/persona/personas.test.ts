import { the_content_a_ticket_s_secret_signs } from '@q-mino/domains/bonds/address_book/_dsl.ts'
import type * as post_value from '@q-mino/domains/post/_value.ts'
import manifest_json from '@q-mino/greetings/manifest.json' with { type: 'json' }
import { describe, expect, test } from 'vitest'
import {
  a_node,
  a_story,
  bonded_by_a_link,
  bonded_in_person,
  shown,
  the_relay,
  type NodeUnderTest,
  type Signed,
} from '../node/harness.ts'

// The personas' stories (`packages/domains/src/persona/README.md`, § Stories
// to prove; PER-1..PER-14, PER-22..PER-25, EXT-6, EXT-8, F6, F7, F8), one
// test each, named as the README names it, on the node of q-'s oracle
// (`../node/harness.ts`): one cell per phone with the safe, the requests,
// the address book and the office of the extensions, its bonds made by
// tickets and introductions as the address book's stories make them. A
// remote caller writes a real letter: its node's post sends it as a request
// from its face (PST-5), deposited at the mailbox the story names, collected
// there and handed to the kernel's entry, its response deposited on the
// bond of the `Caller`'s key (PST-9), collected and taken by the asker's
// entry, read as the answer its post keeps (PST-8); a request whose `Caller`
// has no bond gets no response, and the answer stays `waiting`. An unsigned
// letter, or one whose signature does not hold, the story writes itself
// (PER-2). The user is Anna on her phone, `self` by path as her entry will
// invoke it (step 15). A story observes only what ports give: the answers,
// what is deposited, the trees' trace with its reason (F6), the kernel's
// trace, the facts recorded, the messages to greetings.
//
// Anna's phone, her face F_a "Anna"; her bond L_b with Bruno, the QR crossed
// (his key K_b, his mailbox D_b, hers for him D_mb); her bond L_c with
// Carla, Carla's link opened (K_c, D_c, D_mc); her ticket L_d, ready at
// D_md, sent to Dario in a link (K_d; his mailbox D_d, his ticket's for
// Anna). Bruno's phone, his bond L_a with Anna. Greetings preinstalled and
// activated on Anna's and Bruno's phones, offered to every bond. Friday 20
// November 2026, 10:00.

/** What a request invokes of the kernel (EXT-5): a use case of a persona at 1.0.0. */
const the_kernels = (persona: post_value.persona, use_case: string): post_value.invocation => ({
  of: 'the_kernel',
  persona,
  use_case,
  version: '1.0.0',
})

/** Greetings' leaf on `known` (EXT-5): a greeting asked back. */
const greetings_greet: post_value.invocation = {
  of: 'an_extension',
  extension: 'greetings',
  persona: 'known',
  use_case: 'usecase/greet',
  version: '1.0.0',
}

/** The kernel's read leaf of the extensions in common on `known` (EXT-8). */
const the_extensions_in_common = the_kernels('known', 'usecase/the_extensions_in_common')

/** The leaf of `unknown` an introduction invokes (PER-11). */
const introduce_myself = the_kernels('unknown', 'usecase/introduce_myself')

/** Greetings at major 1, as a side offers it in the persona's words (EXT-8). */
const greetings_at_1 = { extension: 'greetings', majors: [1] }

/** A mailbox at the story's relay. */
const at = (deposit_address: string) => ({ deposit_address, relays: [the_relay] })

/** Greetings' manifest seeing the peer's key and the bond's name on `known` (EXT-3): an update that asks more (EXT-10). */
const greetings_seeing_the_bond = {
  ...manifest_json,
  sees: { known: ['the_peer_key', 'the_name_of_the_bond'] },
}

/**
 * Anna's phone and her acquaintances, at 10:00 on Friday 20 November 2026
 * (or when the story opens Bruno's ticket, `opened_at`): L_b the QR crossed
 * with Bruno, his introduction carried to her unless the story keeps it
 * back (`not_yet`: Anna opened his ticket presenting L_b's, his
 * introduction not come); L_c, Carla's link, opened by Anna presenting
 * L_c's ticket; L_d, Anna's ticket, ready; Dario's ticket for Anna ready
 * (his mailbox D_d). Greetings active on Anna's and Bruno's phones.
 */
const annas_phone = async (
  options: {
    readonly brunos_introduction?: 'carried' | 'not_yet'
    readonly opened_at?: string
  } = {},
) => {
  const story = await a_story()
  const anna = await a_node(story, { phone: 1, face_id: 'F_a', name: 'Anna' })
  const bruno = await a_node(story, { phone: 2, face_id: 'F_b', name: 'Bruno' })
  const elsewhere = { greetings: 'not_installed' } as const
  const carla = await a_node(story, { phone: 3, face_id: 'F_c', name: 'Carla', ...elsewhere })
  const dario = await a_node(story, { phone: 4, face_id: 'F_d', name: 'Dario', ...elsewhere })
  if (options.opened_at !== undefined) story.at(options.opened_at)
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
  await dario.prepares_a_ticket('L_a')
  await anna.activates()
  await bruno.activates()
  const mailbox_of = async (node: NodeUnderTest, bond_id: string) =>
    (await node.my_mailbox_of(bond_id)).deposit_address
  return {
    story,
    anna,
    bruno,
    carla,
    dario,
    K_a: anna.key,
    K_b: bruno.key,
    K_c: carla.key,
    K_d: dario.key,
    D_mb: await mailbox_of(anna, 'L_b'),
    D_mc: await mailbox_of(anna, 'L_c'),
    D_md: await mailbox_of(anna, 'L_d'),
    D_b: await mailbox_of(bruno, 'L_a'),
    D_c: await mailbox_of(carla, 'L_a'),
    D_d: await mailbox_of(dario, 'L_a'),
  }
}

/** A letter a face writes: its id, the story's; the mailbox it is deposited at; what it invokes; its input. */
interface ALetter {
  readonly id: string
  readonly at: string
  readonly invokes: post_value.invocation
  readonly input: unknown
}

/** The identity of a story's letter (F7, PST-2): a request of the kernel's, keyed by the story's id. */
const the_identity_of = (node: NodeUnderTest, id: string): string =>
  node.the_kernels_request_of(id, 'story/a_letter')

/**
 * A face's letter, a real one: its node's post sends it as a request from
 * its face to the server's key at the mailbox the story names; the asker's
 * node runs (deposited), the server's serves (collected, handed to the
 * entry, its response deposited on the bond), the asker's collects (the
 * response taken by its entry). What the asker's post keeps under the
 * request's identity: `answered` with the event, or `waiting` when nothing
 * came back.
 */
const asks = async (asker: NodeUnderTest, server: NodeUnderTest, letter: ALetter) => {
  const request_id = the_identity_of(asker, letter.id)
  await asker.sends_a_request({
    request_id,
    to: { key: server.key, mailbox: at(letter.at) },
    invokes: letter.invokes,
    input: letter.input,
  })
  await asker.runs()
  await server.serves()
  await asker.collects()
  const [kept] = await asker.the_answer_to(request_id)
  if (kept === undefined) throw new Error(`${asker.name}'s post keeps no request ${letter.id}`)
  return kept.answer
}

/** The answer of a response that came: its event. */
const answered = (event: unknown) => ({ status: 'answered', event })

/** No response came: the request waits. */
const waiting = { status: 'waiting' }

/**
 * A letter a face writes itself (the code is free, F2; PER-2): signed by its
 * face, unsigned, or with a signature given, one that need not hold; sealed
 * for the server's key and deposited at the mailbox it is for, or at another
 * (re-addressed, PST-4); the server's node collects.
 */
const writes = async (
  writer: NodeUnderTest,
  server: NodeUnderTest,
  letter: ALetter,
  signed: (written: post_value.letter) => Promise<Signed>,
  deposited_at: string = letter.at,
): Promise<void> => {
  const written = writer.a_request({
    identity: the_identity_of(writer, letter.id),
    to: letter.at,
    invokes: letter.invokes,
    input: letter.input,
  })
  await writer.deposits(
    deposited_at,
    await writer.an_envelope_of(written, server.key, await signed(written)),
  )
  await server.collects()
}

/** The entries of the trees' trace a node kept since a count (F6, PER-14). */
const traced_since = (node: NodeUnderTest, count: number) => node.tree_traced.slice(count)

/** The facts a node recorded, by the paths and payloads of their parts, in order, those of a domain. */
const facts_of = async (node: NodeUnderTest, domain: string) =>
  (await node.recorded()).flatMap((fact) =>
    fact.parts
      .filter((part) => part.path.startsWith(domain))
      .map((part) => ({ path: part.path, payload: part.payload })),
  )

/** The envelopes the relay keeps at a node's mailboxes: what was deposited for it. */
const deposited_for = async (node: NodeUnderTest): Promise<number> =>
  (await node.at_my_mailboxes()).length

describe('the personas (PER-1..PER-14, PER-25)', () => {
  test('self is worn by the user only', async () => {
    const { anna, bruno, K_b, K_c, D_mb } = await annas_phone()
    // Anna on her phone: her bonds, in her words.
    expect(await anna.the_user('usecase/my_bonds', {})).toMatchObject([
      {
        event: 'snapshot',
        entries: [
          {
            bond_id: 'L_b',
            name: 'Bruno',
            my_face_id: 'F_a',
            their_face: { key: K_b, introduced_as: 'Bruno' },
            confirmation: { state: 'received' },
          },
          {
            bond_id: 'L_c',
            name: 'Carla',
            my_face_id: 'F_a',
            their_face: { key: K_c, introduced_as: 'Carla' },
            // Anna opened Carla's link: Carla has her, and no introduction of Carla's comes back to confirm it.
            confirmation: { state: 'awaited' },
          },
        ],
      },
    ])
    // Bruno's letter at D_mb, invoking `my_bonds` on `self`: not found, no reason; why is the trace's.
    const before = anna.tree_traced.length
    expect(
      await asks(bruno, anna, {
        id: 'B1',
        at: D_mb,
        invokes: the_kernels('self', 'usecase/my_bonds'),
        input: {},
      }),
    ).toEqual(answered({ event: 'not_found' }))
    // An unsigned letter likewise, and nothing deposited for it.
    const for_bruno = await deposited_for(bruno)
    await writes(
      bruno,
      anna,
      { id: 'B2', at: D_mb, invokes: the_kernels('self', 'usecase/my_bonds'), input: {} },
      () => Promise.resolve('unsigned'),
    )
    const closed_by_self = {
      path: 'persona/self/usecase/my_bonds',
      answered: { event: 'not_found' },
      why: {
        closed_by: 'a_perimeter',
        node: 'persona/self/node/self',
        perimeter: 'the_caller_is_the_user',
      },
    }
    expect(traced_since(anna, before)).toMatchObject([
      {
        ...closed_by_self,
        given: { caller: { is: 'a_face', key: K_b, to_my_mailbox: D_mb } },
      },
      {
        ...closed_by_self,
        given: {
          caller: { is: 'anonymous', annotation: { signature: 'none' }, to_my_mailbox: D_mb },
        },
      },
    ])
    expect(await deposited_for(bruno)).toBe(for_bruno)
  })

  test('the user’s gestures on self are told in her words', async () => {
    const { anna } = await annas_phone()
    const recorded = async () => (await anna.recorded()).length
    /** The facts the gesture recorded, by the paths of their parts. */
    const recorded_by = async (gesture: () => Promise<unknown>) => {
      const before = await recorded()
      const told = await gesture()
      const facts = (await anna.recorded()).slice(before)
      return {
        told,
        facts: facts.flatMap((fact) =>
          fact.parts.map((part) => ({ path: part.path, payload: part.payload })),
        ),
      }
    }
    expect(await recorded_by(() => anna.renames('L_b', 'Bru'))).toMatchObject({
      told: [{ event: 'the_bond_is_renamed', payload: { bond_id: 'L_b', name: 'Bru' } }],
      facts: [
        {
          path: 'bonds/address_book/fact/a_bond_has_been_renamed',
          payload: { renamed_bond: { id: 'L_b', name: 'Bru' } },
        },
      ],
    })
    expect(await recorded_by(() => anna.removes_a_bond('L_c'))).toMatchObject({
      told: [{ event: 'the_bond_is_removed', payload: { bond_id: 'L_c' } }],
      facts: [
        {
          path: 'bonds/address_book/fact/a_bond_has_been_removed',
          payload: { removed_bond: { id: 'L_c', status: 'removed' } },
        },
      ],
    })
    expect(await recorded_by(() => anna.removes_a_bond('L_c'))).toMatchObject({
      told: [{ event: 'the_bond_was_removed_already', payload: { bond_id: 'L_c' } }],
      facts: [
        {
          path: 'bonds/address_book/fact/a_bond_has_been_removed_again',
          payload: { bond_id: 'L_c' },
        },
      ],
    })
    const before = anna.tree_traced.length
    expect(await recorded_by(() => anna.renames('L_c', 'Carla C.'))).toEqual({
      told: [{ event: 'there_is_no_such_bond', payload: {} }],
      facts: [],
    })
    expect(traced_since(anna, before)).toMatchObject([
      {
        path: 'persona/self/usecase/rename_a_bond',
        given: { caller: { is: 'the_user' } },
        answered: { event: 'there_is_no_such_bond' },
        why: { closed_by: 'the_business', outcome: { outcome: 'rejected' } },
      },
    ])
    expect(await recorded_by(() => anna.withdraws_the_offer_from('L_b'))).toMatchObject({
      told: [
        { event: 'the_offer_is_withdrawn', payload: { extension: 'greetings', bond_id: 'L_b' } },
      ],
      facts: [
        {
          path: 'extensions/activations/fact/the_offer_of_an_extension_has_been_withdrawn_from_a_bond',
          payload: { withdrawn_offer: { name: 'greetings', bond: 'L_b' } },
        },
      ],
    })
    expect(await recorded_by(() => anna.offers_again_to('L_b'))).toMatchObject({
      told: [
        {
          event: 'the_extension_is_offered_again',
          payload: { extension: 'greetings', bond_id: 'L_b' },
        },
      ],
      facts: [
        {
          path: 'extensions/activations/fact/an_extension_has_been_offered_to_a_bond',
          payload: { name: 'greetings', bond: 'L_b' },
        },
      ],
    })
  })

  test('a face’s letter on its bond reaches known with the bond whole', async () => {
    const { anna, bruno, K_b, D_mb } = await annas_phone()
    /** The invocations of greetings' leaves since a count of the messages to it (EXT-2). */
    const invocations_since = (count: number) =>
      anna.to_the_extension.slice(count).filter((message) => message.message === 'invoke')
    // The kernel's leaf, for the bond the node found: greetings, offered to L_b.
    expect(
      await asks(bruno, anna, {
        id: 'B1',
        at: D_mb,
        invokes: the_extensions_in_common,
        input: { offered: [greetings_at_1] },
      }),
    ).toMatchObject(answered({ event: 'snapshot', entries: [greetings_at_1], total: 1 }))
    // An extension's leaf below the node: greetings is given L_b, and its business greets L_b back.
    const messages = anna.to_the_extension.length
    expect(
      await asks(bruno, anna, {
        id: 'B2',
        at: D_mb,
        invokes: greetings_greet,
        input: { words: 'ciao' },
      }),
    ).toEqual(answered({ event: 'greeted_back', payload: { words: 'ciao anche a te' } }))
    expect(invocations_since(messages)).toMatchObject([
      {
        message: 'invoke',
        persona: 'known',
        use_case: 'usecase/greet',
        context: { bond: 'L_b' },
        operation: { scope: 'known/L_b' },
      },
    ])
    // Greetings' manifest updated to see the peer's key and the bond's name, accepted: the
    // message carries the bond as the node gave it, whole. Greetings' code, built for its
    // manifest that sees nothing, falls on a context it does not take (EXT-15): no response.
    expect(await anna.updated_to(greetings_seeing_the_bond)).toEqual({ loaded: 'not_active' })
    expect(await anna.activates()).toEqual({ loaded: 'running' })
    const seeing = anna.to_the_extension.length
    expect(
      await asks(bruno, anna, {
        id: 'B3',
        at: D_mb,
        invokes: greetings_greet,
        input: { words: 'ciao di nuovo' },
      }),
    ).toEqual(waiting)
    expect(invocations_since(seeing)).toMatchObject([
      { message: 'invoke', context: { bond: 'L_b', peer_key: K_b, bond_name: 'Bruno' } },
    ])
    expect(anna.whys().at(-1)).toBe('the_extension_has_fallen')
  })

  test('a known key at the mailbox of another bond is not found, traced', async () => {
    const { anna, bruno, carla, K_b, D_mc } = await annas_phone()
    const not_found_on_known = {
      path: 'persona/known/usecase/the_extensions_in_common',
      answered: { event: 'not_found' },
      why: {
        closed_by: 'a_lookup',
        node: 'persona/known/node/known',
        lookups: [{ lookup: 'the_bond_of_the_caller', not_known: 'value' }],
      },
    }
    // Bruno's letter at D_mc, the mailbox of Anna's bond with Carla: not found, no reason; its response on L_b.
    const before = anna.tree_traced.length
    expect(
      await asks(bruno, anna, {
        id: 'B1',
        at: D_mc,
        invokes: the_extensions_in_common,
        input: { offered: [greetings_at_1] },
      }),
    ).toEqual(answered({ event: 'not_found' }))
    expect(traced_since(anna, before)).toMatchObject([
      {
        ...not_found_on_known,
        given: { caller: { is: 'a_face', key: K_b, to_my_mailbox: D_mc } },
      },
    ])
    // Carla's bond removed: its mailbox is no longer collected (BND-11), so her letter at D_mc
    // never comes to the entry, and nothing comes back.
    await anna.removes_a_bond('L_c')
    const removed = anna.tree_traced.length
    const collected = anna.collected().length
    const for_carla = await deposited_for(carla)
    expect(
      await asks(carla, anna, {
        id: 'C1',
        at: D_mc,
        invokes: the_extensions_in_common,
        input: { offered: [] },
      }),
    ).toEqual(waiting)
    expect(anna.collected()).toHaveLength(collected)
    expect(traced_since(anna, removed)).toEqual([])
    expect(await deposited_for(carla)).toBe(for_carla)
  })

  test('the extensions in common on known: the bond from the node, never the input', async () => {
    const { anna, bruno, carla, D_b } = await annas_phone()
    /**
     * Anna asks Bruno on her phone (EXT-8): the office's executor delivers
     * the question on L_b over the kernel's port of requests, Bruno's entry
     * answers from `the_extensions_in_common`, Anna's takes the response,
     * and her return records what came back.
     */
    const anna_asks_bruno = async () => {
      const [asked] = await anna.the_user('usecase/ask_a_bond_for_the_extensions_in_common', {
        bond_id: 'L_b',
        offered: [greetings_at_1],
      })
      expect(asked).toMatchObject({ event: 'the_bond_is_asked' })
      const question_id: unknown = Reflect.get(
        Object(Reflect.get(Object(asked), 'payload')),
        'question_id',
      )
      if (typeof question_id !== 'string') throw new Error('no question asked')
      await anna.runs()
      await bruno.serves()
      await anna.collects()
      await anna.runs()
      return question_id
    }
    const q1 = await anna_asks_bruno()
    // The request is the kernel's, keyed by the question (F7); Bruno's response, taken by Anna's entry.
    expect(await anna.sent()).toEqual([anna.the_kernels_request_of(q1)])
    expect(await anna.the_answer_to(anna.the_kernels_request_of(q1))).toMatchObject([
      {
        answer: answered({
          event: 'snapshot',
          entries: [{ extension: 'greetings', majors: [1] }],
          total: 1,
        }),
      },
    ])
    expect(anna.whys()).toEqual([])
    expect(await facts_of(anna, 'extensions/activations/fact/the_extensions_in_common')).toEqual([
      {
        path: 'extensions/activations/fact/the_extensions_in_common_with_a_bond_have_been_learned',
        payload: { question_id: q1, in_common: [{ name: 'greetings', majors: [1] }] },
      },
    ])
    // Bruno withdraws greetings from L_a: read for L_a, the bond his node gave, none in common.
    await bruno.withdraws_the_offer_from('L_a')
    const q2 = await anna_asks_bruno()
    expect(
      (await facts_of(anna, 'extensions/activations/fact/the_extensions_in_common')).at(-1),
    ).toEqual({
      path: 'extensions/activations/fact/the_extensions_in_common_with_a_bond_have_been_learned',
      payload: { question_id: q2, in_common: [] },
    })
    // An input that names a bond, or a field beyond `offered`: invalid_request, before any node.
    const before = bruno.tree_traced.length
    for (const [id, input] of [
      ['A1', { offered: [greetings_at_1], bond: 'L_a' }],
      ['A2', { offered: [greetings_at_1], more: true }],
    ] as const) {
      expect(
        await asks(anna, bruno, { id, at: D_b, invokes: the_extensions_in_common, input }),
      ).toEqual(answered({ event: 'invalid_request', reason: 'input_not_in_schema' }))
    }
    // From Carla, who has no bond with Bruno, at D_b: the input judged before the node of known, nothing back.
    expect(
      await asks(carla, bruno, {
        id: 'C1',
        at: D_b,
        invokes: the_extensions_in_common,
        input: { offered: [], bond: 'L_a' },
      }),
    ).toEqual(waiting)
    const the_input = {
      path: 'persona/known/usecase/the_extensions_in_common',
      answered: { event: 'invalid_request', reason: 'input_not_in_schema' },
      why: { closed_by: 'the_input' },
    }
    expect(traced_since(bruno, before)).toMatchObject([
      { ...the_input, given: { caller: { is: 'a_face', key: anna.key } } },
      { ...the_input, given: { caller: { is: 'a_face', key: anna.key } } },
      { ...the_input, given: { caller: { is: 'a_face', key: carla.key, to_my_mailbox: D_b } } },
    ])
  })

  test('an introduction at a ready ticket makes the bond, with the signer’s key', async () => {
    const { anna, dario, K_d, D_md, D_d } = await annas_phone()
    const ticket = await shown(anna, 'L_d')
    expect(
      await asks(dario, anna, {
        id: 'D1',
        at: D_md,
        invokes: introduce_myself,
        input: { secret: ticket.secret, introduced_as: 'Dario', mailbox: at(D_d) },
      }),
    ).toEqual(answered({ event: 'you_are_bonded', payload: {} }))
    expect(
      await facts_of(anna, 'bonds/address_book/fact/a_bond_has_been_made_by_their_introduction'),
    ).toMatchObject([
      {
        payload: {
          introduced_bond: {
            id: 'L_d',
            status: 'kept',
            name: 'Dario',
            their_face: { key: K_d, introduced_as: 'Dario' },
            their_mailbox: at(D_d),
            handshake: { way: 'at_a_distance' },
            confirmation: { state: 'received' },
          },
        },
      },
    ])
    // His next letter at D_md is known, on L_d.
    expect(
      await asks(dario, anna, {
        id: 'D2',
        at: D_md,
        invokes: the_extensions_in_common,
        input: { offered: [greetings_at_1] },
      }),
    ).toMatchObject(answered({ event: 'snapshot', entries: [greetings_at_1], total: 1 }))
  })

  test('an introduction at the mailbox of a bond kept with that face confirms it', async () => {
    /** Bruno's introduction, as his address book handed it to `post` when he opened Anna's ticket: its secret, his name, his mailbox. */
    const his_introduction = async (bruno: NodeUnderTest) => {
      const letter = bruno.letters().at(-1)
      if (letter === undefined) throw new Error('no introduction of Bruno’s')
      const carried = await bruno.carries(letter)
      return {
        secret: carried.secret,
        introduced_as: carried.their_face.introduced_as,
        mailbox: carried.their_mailbox,
      }
    }
    // Anna opened Bruno's ticket presenting L_b's at 10:00:05: L_b kept at D_mb, the confirmation awaited.
    const in_person = await annas_phone({ brunos_introduction: 'not_yet', opened_at: '10:00:05' })
    expect(await in_person.anna.the_user('usecase/a_bond', { bond_id: 'L_b' })).toMatchObject([
      {
        event: 'snapshot',
        entries: [
          {
            bond_id: 'L_b',
            my_mailbox: { deposit_address: in_person.D_mb },
            confirmation: { state: 'awaited' },
          },
        ],
      },
    ])
    // His introduction at D_mb at 10:00:10, signed K_b, on unknown: they met in person.
    in_person.story.at('10:00:10')
    expect(
      await asks(in_person.bruno, in_person.anna, {
        id: 'B1',
        at: in_person.D_mb,
        invokes: introduce_myself,
        input: await his_introduction(in_person.bruno),
      }),
    ).toEqual(answered({ event: 'you_met_in_person', payload: {} }))
    // At 10:03, later than two minutes: it confirms the bond; again, nothing changes.
    const later = await annas_phone({ brunos_introduction: 'not_yet', opened_at: '10:00:05' })
    later.story.at('10:03:00')
    const introduction = await his_introduction(later.bruno)
    expect(
      await asks(later.bruno, later.anna, {
        id: 'B1',
        at: later.D_mb,
        invokes: introduce_myself,
        input: introduction,
      }),
    ).toEqual(answered({ event: 'the_bond_is_confirmed', payload: {} }))
    expect(
      await asks(later.bruno, later.anna, {
        id: 'B2',
        at: later.D_mb,
        invokes: introduce_myself,
        input: introduction,
      }),
    ).toEqual(answered({ event: 'you_introduced_yourself_already', payload: {} }))
    expect(await later.anna.the_user('usecase/a_bond', { bond_id: 'L_b' })).toMatchObject([
      { event: 'snapshot', entries: [{ bond_id: 'L_b', confirmation: { state: 'received' } }] },
    ])
  })

  test('an introduction at a mailbox with no ticket is not found', async () => {
    const { story, anna, bruno, carla, dario, K_d, D_mb, D_md, D_b, D_c, D_d } = await annas_phone()
    const ticket = await shown(anna, 'L_d')
    const dario_s = { secret: ticket.secret, introduced_as: 'Dario', mailbox: at(D_d) }
    const no_ticket_there = (mailbox: string) => ({
      path: 'persona/unknown/usecase/introduce_myself',
      given: { caller: { is: 'a_face', key: K_d, to_my_mailbox: mailbox } },
      answered: { event: 'not_found' },
      why: {
        closed_by: 'a_lookup',
        node: 'persona/unknown/node/unknown',
        lookups: [{ lookup: 'the_ticket_of_the_caller', not_known: 'value' }],
      },
    })
    const before = anna.tree_traced.length
    const anna_s_facts = (await anna.recorded()).length
    // At D_b, a mailbox not Anna's: her node never collects it, and Bruno's cannot open it (PST-4).
    expect(
      await asks(dario, anna, { id: 'D1', at: D_b, invokes: introduce_myself, input: dario_s }),
    ).toEqual(waiting)
    await bruno.collects()
    expect(bruno.traced.at(-1)).toMatchObject({
      why: 'an_envelope_not_opened',
      came_to: D_b,
      opened: { outcome: 'not_opened' },
    })
    // Written for D_b and deposited at D_md: re-addressed, it goes no further (PST-4).
    const re_addressed = { id: 'D0', at: D_b, invokes: introduce_myself, input: dario_s }
    await writes(dario, anna, re_addressed, () => Promise.resolve('by_my_face'), D_md)
    expect(anna.traced.at(-1)).toMatchObject({
      why: 'an_envelope_not_opened',
      came_to: D_md,
      opened: {
        outcome: 're_addressed',
        letter: the_identity_of(dario, 'D0'),
        signed_by: K_d,
      },
    })
    // At D_mb, the mailbox of a bond kept with another face: not found.
    expect(
      await asks(dario, anna, { id: 'D2', at: D_mb, invokes: introduce_myself, input: dario_s }),
    ).toEqual(waiting)
    // At D_md, once Carla used L_d (a ticket used twice): not found.
    expect(
      await asks(carla, anna, {
        id: 'C1',
        at: D_md,
        invokes: introduce_myself,
        input: { secret: ticket.secret, introduced_as: 'Carla', mailbox: at(D_c) },
      }),
    ).toEqual(answered({ event: 'you_are_bonded', payload: {} }))
    expect(
      await asks(dario, anna, { id: 'D3', at: D_md, invokes: introduce_myself, input: dario_s }),
    ).toEqual(waiting)
    expect(traced_since(anna, before)).toMatchObject([no_ticket_there(D_mb), no_ticket_there(D_md)])
    // No fact of Dario's: only Carla's bond made.
    expect(
      (await anna.recorded())
        .slice(anna_s_facts)
        .flatMap((fact) => fact.parts.map((part) => part.path))
        .filter((path) => path.startsWith('bonds/')),
    ).toEqual(['bonds/address_book/fact/a_bond_has_been_made_by_their_introduction'])
    // At the mailbox of a ticket expired, its 48 hours over (BND-8): no longer collected (BND-11), nothing comes to her node.
    await anna.prepares_a_ticket('L_e')
    const expired = await shown(anna, 'L_e')
    story.at_the_instant('2026-11-22T10:00:01Z')
    await anna.runs()
    const collected = anna.collected().length
    expect(
      await asks(dario, anna, {
        id: 'D4',
        at: expired.mailbox.deposit_address,
        invokes: introduce_myself,
        input: { secret: expired.secret, introduced_as: 'Dario', mailbox: at(D_d) },
      }),
    ).toEqual(waiting)
    expect(anna.collected().length).toBe(collected)
  })

  test('an introduction refused by the address book is told so, traced', async () => {
    const { anna, dario, K_d, D_md, D_d } = await annas_phone()
    await anna.prepares_a_ticket('L_e')
    const another_ticket_s = (await shown(anna, 'L_e')).secret
    const signed_by_dario = await dario
      .machine_of('F_d')
      .sign(the_content_a_ticket_s_secret_signs(D_md))
    const before = anna.tree_traced.length
    const anna_s_facts = (await anna.recorded()).length
    for (const [id, secret] of [
      ['D1', another_ticket_s],
      ['D2', signed_by_dario],
    ] as const) {
      // Dario has no bond with Anna: no response comes back; what he was told is the trace's.
      expect(
        await asks(dario, anna, {
          id,
          at: D_md,
          invokes: introduce_myself,
          input: { secret, introduced_as: 'Dario', mailbox: at(D_d) },
        }),
      ).toEqual(waiting)
    }
    const traced = traced_since(anna, before)
    expect(traced).toMatchObject([
      {
        path: 'persona/unknown/usecase/introduce_myself',
        given: { caller: { is: 'a_face', key: K_d, to_my_mailbox: D_md } },
        answered: { event: 'the_ticket_cannot_be_used' },
        why: { closed_by: 'the_business', outcome: { outcome: 'rejected' } },
      },
      { answered: { event: 'the_ticket_cannot_be_used' } },
    ])
    // Of the branch of a ready ticket, only its secret failed (F6): the predicate the trace names.
    for (const entry of traced) {
      const failures =
        entry.why.closed_by === 'the_business' && entry.why.outcome.outcome === 'rejected'
          ? entry.why.outcome.failures
          : []
      expect(
        failures.filter(
          (failure) => failure.branch === 'my_ticket_is_ready_with_its_secret_so_we_are_bonded',
        ),
      ).toEqual([
        {
          branch: 'my_ticket_is_ready_with_its_secret_so_we_are_bonded',
          components: ['the_secret_is_the_ticket_s'],
          predicate: 'bonds/address_book/predicate/the_secret_is_the_ticket_s',
        },
      ])
    }
    expect(
      (await anna.recorded())
        .slice(anna_s_facts)
        .flatMap((fact) => fact.parts.map((part) => part.path))
        .filter((path) => path.startsWith('bonds/')),
    ).toEqual([])
  })

  test('an unsigned letter, or one whose signature does not hold, is anonymous', async () => {
    const { anna, bruno, dario, K_b, D_mb, D_b } = await annas_phone()
    const ticket = await shown(anna, 'L_d')
    const ways: readonly {
      readonly signed: (written: post_value.letter) => Promise<Signed>
      readonly annotation: unknown
    }[] = [
      { signed: () => Promise.resolve('unsigned'), annotation: { signature: 'none' } },
      {
        // Bruno's letter, claiming K_b, with a signature of another face's.
        signed: async (written) => ({ signature: await dario.signs(written) }),
        annotation: { signature: 'does_not_hold', claimed_face: K_b },
      },
    ]
    const leaves = [
      {
        invokes: the_extensions_in_common,
        input: { offered: [greetings_at_1] },
        traced: {
          path: 'persona/known/usecase/the_extensions_in_common',
          answered: { event: 'not_found' },
          why: { closed_by: 'a_lookup', node: 'persona/known/node/known' },
        },
      },
      {
        invokes: introduce_myself,
        input: { secret: ticket.secret, introduced_as: 'Bruno', mailbox: at(D_b) },
        traced: {
          path: 'persona/unknown/usecase/introduce_myself',
          answered: { event: 'not_found' },
          why: { closed_by: 'a_lookup', node: 'persona/unknown/node/unknown' },
        },
      },
      {
        invokes: the_kernels('anonymous', 'usecase/the_extensions_in_common'),
        input: { offered: [] },
        traced: {
          path: 'persona/anonymous/usecase/the_extensions_in_common',
          answered: { event: 'invalid_request', reason: 'not_a_leaf' },
          why: { closed_by: 'not_a_leaf' },
        },
      },
    ]
    const for_bruno = await deposited_for(bruno)
    const before = anna.tree_traced.length
    let letters = 0
    for (const way of ways) {
      for (const leaf of leaves) {
        letters += 1
        await writes(
          bruno,
          anna,
          { id: `B${String(letters)}`, at: D_mb, invokes: leaf.invokes, input: leaf.input },
          way.signed,
        )
      }
    }
    expect(traced_since(anna, before)).toMatchObject(
      ways.flatMap((way) =>
        leaves.map((leaf) => ({
          ...leaf.traced,
          given: {
            caller: { is: 'anonymous', annotation: way.annotation, to_my_mailbox: D_mb },
          },
        })),
      ),
    )
    // Never known as Bruno: nothing deposited for him.
    expect(await deposited_for(bruno)).toBe(for_bruno)
  })
})
