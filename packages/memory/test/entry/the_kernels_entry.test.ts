import { the_content_a_ticket_s_secret_signs } from '@q-mino/domains/bonds/address_book/_dsl.ts'
import { content_of } from '@q-mino/domains/post/_dsl.ts'
import { sealed_for } from '@q-mino/domains/seals/safe/_dsl.ts'
import manifest_json from '@q-mino/greetings/manifest.json' with { type: 'json' }
import { TheRelayIsOutOfReach } from '@q-mino/adapters-common'
import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import {
  annas_phone,
  answered,
  asks,
  at,
  deposited_for,
  facts_of,
  greetings_at_1,
  greetings_greet,
  greetings_on,
  introduce_myself,
  the_extensions_in_common,
  the_identity_of,
  the_kernels,
  traced_since,
  waiting,
  writes,
  type AnnasGreetings,
} from '../node/annas_phone.ts'
import { a_node, shown, until, type NodeUnderTest } from '../node/harness.ts'

// The kernel's entry's stories (`packages/adapters-common/src/entry/README.md`,
// § Stories to prove; PER-25, EXT-6, F6, F7, F8, PST-4, PST-6, PST-7,
// PST-9), one test each, named as the README names it, on the node of q-'s
// oracle (`../node/harness.ts`): Anna's phone and her acquaintances, the
// letters they write, real or written by the story itself
// (`../node/annas_phone.ts`). A remote caller's letter is collected at a
// mailbox of Anna's and handed to the kernel's entry; its response,
// deposited on the bond of the `Caller`'s key, is collected and taken by the
// asker's entry, read as the answer its post keeps (PST-8); where nothing
// must come back, nothing is at the asker's mailboxes. A story observes only
// what ports give: the answers, what is deposited and carried, the trees'
// trace with its path and reason (PER-14), the kernel's trace with its
// `why` (EXT-6), the facts recorded, greetings' partition and the messages
// to it. Greetings, the test extension, in place of ping pong (step 14),
// active on Anna's and Bruno's phones and offered to every bond, unless a
// story says otherwise. Friday 20 November 2026, 10:00.

/** The greeting back to a greeting's words, as greetings' leaf on `known` answers it (its `dsl`, provisional texts). */
const greeted_back = { event: 'greeted_back', payload: { words: 'ciao anche a te' } }

/** An input of the extensions in common that is no list. */
const no_list = { offered: 'greetings' }

/** The quarters of a greeting's 60 seconds at which the asker's post sends again, and its end (PST-6). */
const the_quarters = ['10:00:15', '10:00:30', '10:00:45', '10:01:00'] as const

/** How a greeting stands, as greetings keeps it. */
const closed_with = (outcome: unknown) => ({ progress: { stage: 'closed', outcome } })

/**
 * A node greets a bond on its phone (greetings' leaf on `self`), and its
 * post deposits the request: the greeting. The count of requests its post
 * has sent once this one is.
 */
const greets = async (asker: NodeUnderTest, bond: string, requests = 1): Promise<string> => {
  const greeting = await asker.greets(bond)
  await until(async () => (await asker.sent()).length >= requests, 'the request sent')
  await asker.runs()
  return greeting
}

/**
 * The asker's time runs to its end (PST-6): at each quarter the clock moves
 * and the asker's post sends again, the server's node serving each copy if
 * it is on; at the end the asker collects; its greeting closed.
 */
const to_the_end_of_its_time = async (
  story: { readonly at: (time_of_day: string) => void },
  asker: NodeUnderTest,
  greeting: string,
  server: NodeUnderTest | 'off',
): Promise<void> => {
  for (const quarter of the_quarters) {
    story.at(quarter)
    await asker.runs()
    if (server !== 'off') await server.serves()
  }
  await asker.collects()
  await until(() => asker.is_closed(greeting), 'the greeting closed')
}

/** The invocations of greetings' leaves on a node (EXT-2). */
const invocations_on = (node: NodeUnderTest) =>
  node.to_the_extension.filter((message) => message.message === 'invoke')

/** A fact as greetings' partition keeps it: its parts' paths and payloads. */
const a_fact_kept = z.object({
  parts: z.array(z.object({ path: z.string(), payload: z.unknown() })),
})

/** The closings greetings recorded in a node's partition, in order: each greeting's id and outcome. */
const the_closings_of_greetings = (node: NodeUnderTest): readonly unknown[] =>
  [...node.storage.kept('greetings')]
    .filter(([key]) => key.startsWith('fact/'))
    .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .flatMap(([, value]) => a_fact_kept.parse(value).parts)
    .filter((part) => part.path.endsWith('/fact/a_greeting_has_been_closed'))
    .map((part) => part.payload)

/** What the office learned of a question about the extensions in common (EXT-8), as far as a story reads it. */
const what_was_learned = z.object({ in_common: z.array(z.unknown()) })

/** The deposits a node's transport carried, by their D and their fault. */
const carried_by = (node: NodeUnderTest) =>
  node.carried().map((deposit) => ({ at: deposit.deposit_address, fault: deposit.fault }))

describe('the kernel’s entry (PER-25, EXT-6, F7, F8)', () => {
  test('every entry check answers in its order', async () => {
    const { anna, bruno, K_b, D_mb, D_mc, D_b } = await annas_phone()
    const before = anna.tree_traced.length
    const brunos = (version: string, use_case = 'usecase/the_extensions_in_common') =>
      the_kernels('known', use_case, version)
    // At 9.0.0, its leaf not one and its input no list: the gate answers first.
    expect(
      await asks(bruno, anna, {
        id: 'B1',
        at: D_mb,
        invokes: brunos('9.0.0', 'usecase/the_extensions_we_share'),
        input: no_list,
      }),
    ).toEqual(answered({ event: 'version_not_supported', current: '1.0.0', oldest: 1 }))
    expect(
      await asks(bruno, anna, { id: 'B2', at: D_mb, invokes: brunos('9.0.0'), input: no_list }),
    ).toEqual(answered({ event: 'version_not_supported', current: '1.0.0', oldest: 1 }))
    // At a leaf `known` has not, its input no list: the leaf, before the input.
    expect(
      await asks(bruno, anna, {
        id: 'B3',
        at: D_mb,
        invokes: brunos('1.0.0', 'usecase/the_extensions_we_share'),
        input: no_list,
      }),
    ).toEqual(answered({ event: 'invalid_request', reason: 'not_a_leaf' }))
    // With an input that is no list: the input.
    const not_in_schema = answered({ event: 'invalid_request', reason: 'input_not_in_schema' })
    expect(
      await asks(bruno, anna, { id: 'B4', at: D_mb, invokes: brunos('1.0.0'), input: no_list }),
    ).toEqual(not_in_schema)
    // Written to D_mc, the mailbox of Anna's bond with Carla: the input before the node (PER-6), never not_found.
    expect(
      await asks(bruno, anna, { id: 'B5', at: D_mc, invokes: brunos('1.0.0'), input: no_list }),
    ).toEqual(not_in_schema)
    const by_bruno_at = (mailbox: string) => ({
      caller: { is: 'a_face', key: K_b, to_my_mailbox: mailbox },
    })
    const in_common = 'persona/known/usecase/the_extensions_in_common'
    const the_gate = { closed_by: 'the_gate', current: '1.0.0', oldest: 1 }
    expect(traced_since(anna, before)).toMatchObject([
      {
        path: 'persona/known/usecase/the_extensions_we_share',
        given: by_bruno_at(D_mb),
        version: '9.0.0',
        answered: { event: 'version_not_supported' },
        why: the_gate,
      },
      { path: in_common, given: by_bruno_at(D_mb), version: '9.0.0', why: the_gate },
      {
        path: 'persona/known/usecase/the_extensions_we_share',
        given: by_bruno_at(D_mb),
        version: '1.0.0',
        answered: { event: 'invalid_request', reason: 'not_a_leaf' },
        why: { closed_by: 'not_a_leaf', major: 1 },
      },
      {
        path: in_common,
        given: by_bruno_at(D_mb),
        answered: { event: 'invalid_request', reason: 'input_not_in_schema' },
        why: { closed_by: 'the_input' },
      },
      {
        path: in_common,
        given: by_bruno_at(D_mc),
        answered: { event: 'invalid_request', reason: 'input_not_in_schema' },
        why: { closed_by: 'the_input' },
      },
    ])
    // Each answered on L_b, at the mailbox Bruno declared.
    expect(carried_by(anna)).toEqual(Array(5).fill({ at: D_b, fault: 'none' }))
    // To greetings on L_b at 2.0.0: its gate, with greetings' version on known, not the kernel's.
    const greetings_gate = {
      event: 'version_not_supported',
      current: manifest_json.surfaces.known.version,
      oldest: 1,
    }
    const at_greetings = anna.tree_traced.length
    expect(
      await asks(bruno, anna, {
        id: 'B6',
        at: D_mb,
        invokes: greetings_on('known', 'usecase/greet', '2.0.0'),
        input: { words: 'ciao' },
      }),
    ).toEqual(answered(greetings_gate))
    expect(traced_since(anna, at_greetings)).toMatchObject([
      {
        path: 'persona/known/greetings/usecase/greet',
        given: by_bruno_at(D_mb),
        version: '2.0.0',
        answered: greetings_gate,
        why: { closed_by: 'the_gate', current: manifest_json.surfaces.known.version, oldest: 1 },
      },
    ])
    expect(invocations_on(anna)).toEqual([])
    // Greetings withdrawn from L_b, at 2.0.0: silence, the routing before the gate (EXT-6).
    await anna.withdraws_the_offer_from('L_b')
    const withdrawn = anna.tree_traced.length
    expect(
      await asks(bruno, anna, {
        id: 'B7',
        at: D_mb,
        invokes: greetings_on('known', 'usecase/greet', '2.0.0'),
        input: { words: 'ciao' },
      }),
    ).toEqual(waiting)
    expect(anna.traced).toMatchObject([
      {
        why: 'the_extension_is_not_offered_to_the_bond',
        request: {
          invokes: { extension: 'greetings', version: '2.0.0' },
          letter: the_identity_of(bruno, 'B7'),
          caller: { is: 'a_face', key: K_b },
          version: '2.0.0',
        },
      },
    ])
    expect(traced_since(anna, withdrawn)).toEqual([])
    expect(carried_by(anna)).toHaveLength(6)
  })

  test('a known key outside its bond is not found to the peer and shown to the user', async () => {
    const { anna, bruno, K_b, D_mc, D_b } = await annas_phone()
    const before = anna.tree_traced.length
    // Bruno's letter, signed K_b, at D_mc: not found, no reason; answered on L_b, his key's bond.
    expect(
      await asks(bruno, anna, {
        id: 'B1',
        at: D_mc,
        invokes: the_extensions_in_common,
        input: { offered: [greetings_at_1] },
      }),
    ).toEqual(answered({ event: 'not_found' }))
    expect(carried_by(anna)).toEqual([{ at: D_b, fault: 'none' }])
    // Anna sees why (F6): her trees' trace keeps it at the node of known, K_b at D_mc.
    expect(traced_since(anna, before)).toMatchObject([
      {
        path: 'persona/known/usecase/the_extensions_in_common',
        given: { caller: { is: 'a_face', key: K_b, to_my_mailbox: D_mc } },
        answered: { event: 'not_found' },
        why: {
          closed_by: 'a_lookup',
          node: 'persona/known/node/known',
          lookups: [{ lookup: 'the_bond_of_the_caller', not_known: 'value' }],
        },
      },
    ])
    // The same letter to greetings: silence; K_b has no bond at D_mc, so nothing is offered to it.
    const for_bruno = await deposited_for(bruno)
    const at_greetings = anna.tree_traced.length
    expect(
      await asks(bruno, anna, {
        id: 'B2',
        at: D_mc,
        invokes: greetings_greet,
        input: { words: 'ciao' },
      }),
    ).toEqual(waiting)
    expect(anna.traced).toMatchObject([
      {
        why: 'the_extension_is_not_offered_to_the_bond',
        request: { letter: the_identity_of(bruno, 'B2'), caller: { is: 'a_face', key: K_b } },
      },
    ])
    expect(traced_since(anna, at_greetings)).toEqual([])
    expect(invocations_on(anna)).toEqual([])
    expect(await deposited_for(bruno)).toBe(for_bruno)
  })

  test('an extension not installed, not active or not offered stays silent, the same from outside', async () => {
    /**
     * Bruno greets Anna and, with it, asks her the extensions in common from
     * his phone (EXT-8): Anna's node serves both once, then her phone is
     * off; his time runs to its end. What Bruno sees, and what Anna's node
     * keeps.
     */
    const as_seen = async (annas: AnnasGreetings | 'withdrawn') => {
      const { story, anna, bruno } = await annas_phone({
        greetings: annas === 'withdrawn' ? 'active' : annas,
      })
      if (annas === 'withdrawn') await anna.withdraws_the_offer_from('L_b')
      const traced_before = anna.tree_traced.length
      const greeting = await greets(bruno, 'L_a')
      const [asked] = await bruno.the_user('usecase/ask_a_bond_for_the_extensions_in_common', {
        bond_id: 'L_a',
        offered: [greetings_at_1],
      })
      expect(asked).toMatchObject({ event: 'the_bond_is_asked' })
      await bruno.runs()
      const served_at = story.clock.now()
      await anna.serves()
      await bruno.collects()
      await bruno.runs()
      await to_the_end_of_its_time(story, bruno, greeting, 'off')
      return {
        bruno: {
          greeting: bruno.the_greeting(greeting),
          answer: await bruno.the_answer_to(bruno.the_request_of(greeting)),
          in_common: (
            await facts_of(
              bruno,
              'extensions/activations/fact/the_extensions_in_common_with_a_bond_have_been_learned',
            )
          ).map((fact) => what_was_learned.parse(fact.payload).in_common),
          collected: bruno.collected().length,
          traced: bruno.traced,
        },
        anna: {
          traced: anna.traced,
          tree_traced: traced_since(anna, traced_before),
          invocations: invocations_on(anna),
          carried: carried_by(anna),
        },
        the_request: {
          letter: bruno.the_request_of(greeting),
          caller: { is: 'a_face', key: bruno.key },
          now: served_at,
          version: '1.0.0',
          invokes: greetings_greet,
        },
        D_b: (await bruno.my_mailbox_of('L_a')).deposit_address,
      }
    }
    const not_installed = await as_seen('not_installed')
    const not_active = await as_seen('installed')
    const not_offered = await as_seen('withdrawn')
    // Bruno reads no_response at his time; the extensions in common come back, without greetings.
    expect(not_installed.bruno).toMatchObject({
      greeting: closed_with({ outcome: 'the_greeting_had_no_response' }),
      answer: [{ answer: { status: 'no_response' } }],
      in_common: [[]],
      collected: 1,
      traced: [],
    })
    expect(not_active.bruno).toEqual(not_installed.bruno)
    expect(not_offered.bruno).toEqual(not_installed.bruno)
    // Anna's node: each case once in the kernel's trace, with the request as it came; no tree,
    // no extension invoked; one deposit, the answer to the question, on L_b.
    for (const [seen, why] of [
      [not_installed, 'the_extension_is_not_installed'],
      [not_active, 'the_extension_is_not_active'],
      [not_offered, 'the_extension_is_not_offered_to_the_bond'],
    ] as const) {
      expect(seen.anna).toEqual({
        traced: [{ why, request: seen.the_request }],
        tree_traced: [],
        invocations: [],
        carried: [{ at: seen.D_b, fault: 'none' }],
      })
    }
  })

  test('an anonymous letter is annotated and never answered', async () => {
    const { anna, bruno, dario, K_b, D_mb } = await annas_phone()
    const for_bruno = await deposited_for(bruno)
    const before = anna.tree_traced.length
    /** The id of an anonymous letter at Anna's node (PER-4): the hash of its envelope. */
    const the_id_of = (envelope: string) => anna.machine_of('F_a').hash(envelope)
    const unsigned = () => Promise.resolve('unsigned' as const)
    // Unsigned, on known: not found, at its node.
    const on_known = await writes(
      bruno,
      anna,
      { id: 'B1', at: D_mb, invokes: the_extensions_in_common, input: { offered: [] } },
      unsigned,
    )
    // Unsigned, on anonymous: no leaf there.
    const on_anonymous = await writes(
      bruno,
      anna,
      {
        id: 'B2',
        at: D_mb,
        invokes: the_kernels('anonymous', 'usecase/the_extensions_in_common'),
        input: { offered: [] },
      },
      unsigned,
    )
    // Unsigned, to greetings: silence, nothing offered to an anonymous letter.
    const to_greetings = await writes(
      bruno,
      anna,
      { id: 'B3', at: D_mb, invokes: greetings_greet, input: { words: 'ciao' } },
      unsigned,
    )
    // Claiming K_b, with a signature of another face's: anonymous, never Bruno.
    const claiming = await writes(
      bruno,
      anna,
      { id: 'B4', at: D_mb, invokes: the_extensions_in_common, input: { offered: [] } },
      async (written) => ({ signature: await dario.signs(written) }),
    )
    const none = { signature: 'none' }
    const does_not_hold = { signature: 'does_not_hold', claimed_face: K_b }
    const anonymous = (envelope: string, annotation: unknown) => ({
      caller: { is: 'anonymous', id: the_id_of(envelope), annotation, to_my_mailbox: D_mb },
    })
    // An anonymous `Caller` gives the node's lookup no key (PER-23): not known.
    const not_found_on_known = {
      path: 'persona/known/usecase/the_extensions_in_common',
      answered: { event: 'not_found' },
      why: {
        closed_by: 'a_lookup',
        node: 'persona/known/node/known',
        lookups: [{ lookup: 'the_bond_of_the_caller', not_known: 'key' }],
      },
    }
    expect(traced_since(anna, before)).toMatchObject([
      { ...not_found_on_known, given: anonymous(on_known, none) },
      {
        path: 'persona/anonymous/usecase/the_extensions_in_common',
        given: anonymous(on_anonymous, none),
        answered: { event: 'invalid_request', reason: 'not_a_leaf' },
        why: { closed_by: 'not_a_leaf', major: 1 },
      },
      { ...not_found_on_known, given: anonymous(claiming, does_not_hold) },
    ])
    expect(anna.traced).toMatchObject([
      {
        why: 'the_extension_is_not_offered_to_the_bond',
        request: {
          invokes: greetings_greet,
          letter: the_identity_of(bruno, 'B3'),
          caller: { is: 'anonymous', id: the_id_of(to_greetings), annotation: none },
          version: '1.0.0',
        },
      },
    ])
    expect(invocations_on(anna)).toEqual([])
    // Nothing deposited for any.
    expect(carried_by(anna)).toEqual([])
    expect(await deposited_for(bruno)).toBe(for_bruno)
    // An unsigned response naming Anna's greeting of Bruno, his phone off: never taken.
    const greeting = await greets(anna, 'L_b')
    const response = bruno.a_response({
      answers: anna.the_request_of(greeting),
      to: D_mb,
      event: greeted_back,
    })
    const unsigned_response = await bruno.an_envelope_of(response, anna.key, 'unsigned')
    await bruno.deposits(D_mb, unsigned_response)
    await anna.collects()
    expect(anna.traced.at(-1)).toMatchObject({
      why: 'a_response_not_awaited',
      response: {
        letter: response.identity,
        answers: anna.the_request_of(greeting),
        caller: { is: 'anonymous', id: the_id_of(unsigned_response), annotation: none },
      },
      answered: 'anonymous, never taken',
    })
    expect(await anna.the_answer_to(anna.the_request_of(greeting))).toMatchObject([
      { answer: waiting },
    ])
    expect(anna.is_closed(greeting)).toBe(false)
  })

  test('the extensions in common are answered on the bond, from the bond the node gives', async () => {
    const { anna, bruno, D_mb, D_b } = await annas_phone()
    // Greetings withdrawn from L_c, kept on L_b: what Bruno reads is L_b's.
    await anna.withdraws_the_offer_from('L_c')
    const for_bruno = await deposited_for(bruno)
    const hats_at_2 = { extension: 'hats', majors: [2] }
    expect(
      await asks(bruno, anna, {
        id: 'B1',
        at: D_mb,
        invokes: the_extensions_in_common,
        input: { offered: [greetings_at_1, hats_at_2] },
      }),
    ).toMatchObject(answered({ event: 'snapshot', entries: [greetings_at_1], total: 1 }))
    // Deposited once, on D_b.
    expect(carried_by(anna)).toEqual([{ at: D_b, fault: 'none' }])
    expect(await deposited_for(bruno)).toBe(for_bruno + 1)
    // An input that names a bond is no input of the leaf: the bond is the node's, never his word.
    expect(
      await asks(bruno, anna, {
        id: 'B2',
        at: D_mb,
        invokes: the_extensions_in_common,
        input: { offered: [greetings_at_1, hats_at_2], bond: 'L_c' },
      }),
    ).toEqual(answered({ event: 'invalid_request', reason: 'input_not_in_schema' }))
    // Anna withdraws greetings from L_b: the next answer is an empty list.
    await anna.withdraws_the_offer_from('L_b')
    expect(
      await asks(bruno, anna, {
        id: 'B3',
        at: D_mb,
        invokes: the_extensions_in_common,
        input: { offered: [greetings_at_1, hats_at_2] },
      }),
    ).toMatchObject(answered({ event: 'snapshot', entries: [], total: 0 }))
    expect(anna.traced).toEqual([])
  })

  test('an introduction is a request, answered once its bond is made', async () => {
    const { story, anna, dario, K_d, D_mb, D_md, D_d } = await annas_phone()
    const ticket = await shown(anna, 'L_d')
    const before = anna.tree_traced.length
    const for_dario = await deposited_for(dario)
    // With a secret not L_d's, his letter signed K_d: the ticket cannot be used, traced; no
    // bond, nothing deposited.
    await writes(
      dario,
      anna,
      {
        id: 'D1',
        at: D_md,
        invokes: introduce_myself,
        input: {
          secret: await dario.machine_of('F_d').sign(the_content_a_ticket_s_secret_signs(D_md)),
          introduced_as: 'Dario',
          mailbox: at(D_d),
        },
      },
      () => Promise.resolve('by_my_face' as const),
    )
    expect(traced_since(anna, before)).toMatchObject([
      {
        path: 'persona/unknown/usecase/introduce_myself',
        given: { caller: { is: 'a_face', key: K_d, to_my_mailbox: D_md } },
        answered: { event: 'the_ticket_cannot_be_used' },
        why: { closed_by: 'the_business', outcome: { outcome: 'rejected' } },
      },
    ])
    expect(carried_by(anna)).toEqual([])
    expect(await deposited_for(dario)).toBe(for_dario)
    // With L_d's secret, "Dario" and D_d: the bond made, answered on it at D_d; the response
    // lost on its way, the relay out of reach: the entry throws, the collector leaves the request
    // unseen, and its next pass hands it again (MSG-14, K-11): the same event, from the fact
    // recorded, deposited again, before his post sends his request again (PST-6).
    const request_id = the_identity_of(dario, 'D2')
    await dario.sends_a_request({
      request_id,
      to: { key: anna.key, mailbox: at(D_md) },
      invokes: introduce_myself,
      input: { secret: ticket.secret, introduced_as: 'Dario', mailbox: at(D_d) },
    })
    await dario.runs()
    anna.will('lost')
    await expect(anna.serves()).rejects.toThrow(TheRelayIsOutOfReach)
    await dario.collects()
    expect(await dario.the_answer_to(request_id)).toMatchObject([{ answer: waiting }])
    expect(anna.traced).toEqual([])
    await anna.collects()
    await dario.collects()
    expect(await dario.the_answer_to(request_id)).toMatchObject([
      { answer: answered({ event: 'you_are_bonded', payload: {} }) },
    ])
    expect(carried_by(anna)).toEqual([
      { at: D_d, fault: 'lost' },
      { at: D_d, fault: 'none' },
    ])
    expect(
      await facts_of(anna, 'bonds/address_book/fact/a_bond_has_been_made_by_their_introduction'),
    ).toMatchObject([
      {
        payload: {
          introduced_bond: {
            id: 'L_d',
            status: 'kept',
            their_face: { key: K_d, introduced_as: 'Dario' },
            their_mailbox: at(D_d),
          },
        },
      },
    ])
    // Elena, a face Anna never met, introduces herself at D_mb: not found, nothing deposited.
    const elena = await a_node(story, {
      phone: 5,
      face_id: 'F_e',
      name: 'Elena',
      installed: 'not_installed',
    })
    await elena.prepares_a_ticket('L_a')
    const D_e = (await elena.my_mailbox_of('L_a')).deposit_address
    const at_elena = anna.tree_traced.length
    expect(
      await asks(elena, anna, {
        id: 'E1',
        at: D_mb,
        invokes: introduce_myself,
        input: { secret: ticket.secret, introduced_as: 'Elena', mailbox: at(D_e) },
      }),
    ).toEqual(waiting)
    expect(traced_since(anna, at_elena)).toMatchObject([
      {
        path: 'persona/unknown/usecase/introduce_myself',
        given: { caller: { is: 'a_face', key: elena.key, to_my_mailbox: D_mb } },
        answered: { event: 'not_found' },
        why: {
          closed_by: 'a_lookup',
          node: 'persona/unknown/node/unknown',
          lookups: [{ lookup: 'the_ticket_of_the_caller', not_known: 'value' }],
        },
      },
    ])
    expect(carried_by(anna)).toHaveLength(2)
    expect(await deposited_for(elena)).toBe(0)
  })

  test('a response is taken only as the return of a request sent to that face', async () => {
    const { story, anna, bruno, carla, K_b, K_c, D_mb, D_mc } = await annas_phone()
    // Anna greets Bruno (P1).
    const p1 = await greets(anna, 'L_b')
    const P1 = anna.the_request_of(p1)
    // Carla's response naming P1, signed K_c, on her bond with Anna: P1 went to Bruno's face.
    await carla.deposits(
      D_mc,
      await carla.an_envelope_of(
        carla.a_response({ answers: P1, to: D_mc, event: greeted_back }),
        anna.key,
      ),
    )
    await anna.collects()
    expect(anna.traced).toMatchObject([
      {
        why: 'a_response_not_awaited',
        response: { answers: P1, caller: { is: 'a_face', key: K_c } },
        answered: {
          outcome: 'rejected',
          failures: [
            {
              branch: 'the_request_waits_for_this_face_so_it_is_answered',
              components: ['it_went_to_this_face'],
              predicate: 'post/requests/predicate/the_request_went_to_this_face',
            },
          ],
        },
      },
    ])
    // His response, signed K_b: taken; P1 answered, greetings' return records it.
    await bruno.serves()
    await anna.collects()
    await until(() => anna.is_closed(p1), 'P1 closed')
    expect(await anna.the_answer_to(P1)).toEqual([{ id: P1, answer: answered(greeted_back) }])
    expect(anna.traced).toHaveLength(1)
    // A copy of it: the fact recorded, nothing new.
    const his_response = anna
      .collected()
      .filter((each) => each.came_to === D_mb)
      .at(-1)
    if (his_response === undefined) throw new Error('no response of Bruno’s collected')
    const recorded = (await anna.recorded()).length
    await bruno.deposits(D_mb, his_response.envelope, 'a copy of his response')
    await anna.collects()
    expect(anna.collected().at(-1)).toEqual(his_response)
    expect((await anna.recorded()).length).toBe(recorded)
    expect(anna.traced).toHaveLength(1)
    // His response naming no request of Anna's.
    const never_sent = anna.the_request_of('a greeting never sent')
    await bruno.deposits(
      D_mb,
      await bruno.an_envelope_of(
        bruno.a_response({ answers: never_sent, to: D_mb, event: greeted_back }),
        anna.key,
      ),
    )
    await anna.collects()
    // Anna greets Bruno again (P2), his phone off: no_response at its time; then his greeting back.
    const p2 = await greets(anna, 'L_b', 2)
    await to_the_end_of_its_time(story, anna, p2, 'off')
    story.at('10:01:30')
    await bruno.serves()
    await anna.collects()
    const P2 = anna.the_request_of(p2)
    const it_is_not_waiting = { predicate: 'post/requests/predicate/the_request_is_waiting' }
    const it_went_to_another_face = {
      predicate: 'post/requests/predicate/the_request_went_to_this_face',
    }
    expect(anna.traced.slice(1)).toMatchObject([
      {
        // No request of Anna's: none waits, none went to his face.
        why: 'a_response_not_awaited',
        response: { answers: never_sent, caller: { is: 'a_face', key: K_b } },
        answered: { outcome: 'rejected', failures: [it_is_not_waiting, it_went_to_another_face] },
      },
      {
        // P2 went to his face, and waits no more.
        why: 'a_response_not_awaited',
        response: { answers: P2, caller: { is: 'a_face', key: K_b } },
        answered: { outcome: 'rejected', failures: [it_is_not_waiting] },
      },
    ])
    expect(await anna.the_answer_to(P2)).toEqual([{ id: P2, answer: { status: 'no_response' } }])
    // None a fact of greetings: its partition keeps P1's return once, and P2's no response.
    expect(the_closings_of_greetings(anna)).toMatchObject([
      { greeting_id: p1, outcome: { outcome: 'the_greeting_came_back', words: 'ciao anche a te' } },
      { greeting_id: p2, outcome: { outcome: 'the_greeting_had_no_response' } },
    ])
  })

  test('an envelope that does not open is traced and goes no further', async () => {
    const { story, anna, bruno, K_b, K_c, D_mb, D_mc } = await annas_phone()
    const before = anna.tree_traced.length
    const for_bruno = await deposited_for(bruno)
    const a_letter = (to: string) =>
      bruno.a_request({
        identity: the_identity_of(bruno, `B-${to}`),
        to,
        invokes: the_extensions_in_common,
        input: { offered: [greetings_at_1] },
      })
    const not_opened = (opened: unknown) => ({
      why: 'an_envelope_not_opened',
      came_to: D_mb,
      opened,
    })
    /** A text Bruno deposits on D_mb, collected by Anna's node: what her kernel's trace keeps of it. */
    const deposited_on_d_mb = async (text: string) => {
      await bruno.deposits(D_mb, text)
      await anna.collects()
      return anna.traced.at(-1)
    }
    // A text that is no envelope.
    expect(await deposited_on_d_mb(content_of('a postcard, no envelope'))).toMatchObject(
      not_opened({ outcome: 'not_an_envelope' }),
    )
    // An envelope sealed for Carla's face.
    expect(await deposited_on_d_mb(await bruno.an_envelope_of(a_letter(D_mb), K_c))).toMatchObject(
      not_opened({ outcome: 'not_opened' }),
    )
    // An envelope whose content is no letter.
    const sealing = sealed_for(story.primitives)(anna.key, content_of({ a: 'postcard' }))
    if (sealing.outcome !== 'sealed') throw new Error('Anna’s key takes no seal')
    expect(
      await deposited_on_d_mb(content_of({ format: 1, sealed: sealing.sealed_content })),
    ).toMatchObject(not_opened({ outcome: 'not_a_letter' }))
    // A letter Bruno signed for D_mc, deposited on D_mb.
    const for_d_mc = a_letter(D_mc)
    expect(await deposited_on_d_mb(await bruno.an_envelope_of(for_d_mc, anna.key))).toMatchObject(
      not_opened({ outcome: 're_addressed', letter: for_d_mc.identity, signed_by: K_b }),
    )
    expect(anna.whys()).toEqual(Array(4).fill('an_envelope_not_opened'))
    expect(anna.collected()).toHaveLength(4)
    // No persona invoked, no extension, nothing deposited.
    expect(traced_since(anna, before)).toEqual([])
    expect(invocations_on(anna)).toEqual([])
    expect(carried_by(anna)).toEqual([])
    expect(await deposited_for(bruno)).toBe(for_bruno)
  })

  test('a request whose extension falls is answered by nothing', async () => {
    // Anna's partition full: greetings falls while it serves Bruno's greeting on known.
    const { story, anna, bruno } = await annas_phone({ characters: 200 })
    const greeting = await greets(bruno, 'L_a')
    await anna.serves()
    expect(anna.traced).toMatchObject([
      { why: 'the_extension_has_fallen', extension: 'greetings', fall: 'the_first' },
      {
        why: 'a_request_not_answered',
        request: { letter: bruno.the_request_of(greeting) },
      },
    ])
    expect(carried_by(anna)).toEqual([])
    // Each copy his post sends again meets it fallen again, then stopped: nothing, each time.
    await until(() => anna.the_hosted().life().life === 'running', 'loaded again')
    await to_the_end_of_its_time(story, bruno, greeting, anna)
    expect(bruno.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_had_no_response' }),
    )
    expect(await bruno.the_answer_to(bruno.the_request_of(greeting))).toMatchObject([
      { answer: { status: 'no_response' } },
    ])
    // The copy at 15 seconds makes it fall again; those at 30 and 45 seconds meet it stopped:
    // each answered by nothing and traced as a request not answered, beside the hosting's
    // falls (PER-25, 4; F6, part 13.3).
    expect(anna.whys()).toEqual([
      'the_extension_has_fallen',
      'a_request_not_answered',
      'the_extension_has_fallen',
      'a_request_not_answered',
      'a_request_not_answered',
      'a_request_not_answered',
    ])
    expect(anna.the_hosted().life()).toEqual({ life: 'stopped', why: 'it_fell_twice' })
    // Four copies collected (0, 15, 30 and 45 seconds), none answered.
    expect(anna.collected()).toHaveLength(4)
    expect(carried_by(anna)).toEqual([])
    expect(bruno.collected()).toEqual([])
  })

  test('a request to a persona the extension does not serve reads not_a_leaf', async () => {
    const { anna, bruno, K_b, D_mb, D_b } = await annas_phone()
    const before = anna.tree_traced.length
    expect(
      await asks(bruno, anna, {
        id: 'B1',
        at: D_mb,
        invokes: greetings_on('unknown'),
        input: { words: 'ciao' },
      }),
    ).toEqual(answered({ event: 'invalid_request', reason: 'not_a_leaf' }))
    expect(carried_by(anna)).toEqual([{ at: D_b, fault: 'none' }])
    expect(anna.traced).toMatchObject([
      {
        why: 'not_a_leaf_of_the_extension',
        request: {
          invokes: greetings_on('unknown'),
          letter: the_identity_of(bruno, 'B1'),
          caller: { is: 'a_face', key: K_b },
          version: '1.0.0',
        },
      },
    ])
    expect(traced_since(anna, before)).toEqual([])
    expect(invocations_on(anna)).toEqual([])
  })

  test('a response over what a letter carries is traced and never deposited: the asker reads no response at its time', async () => {
    // Anna's code changed (F2): greetings' greeting back carries 40 000 characters, over the 32 KiB of PST-12.
    const { story, anna, bruno, K_b } = await annas_phone()
    anna.tampers_with_its_responses(() => ({
      event: 'greeted_back',
      payload: { words: 'x'.repeat(40_000) },
    }))
    const greeting = await greets(bruno, 'L_a')
    const request = bruno.the_request_of(greeting)
    await anna.serves()
    expect(anna.traced).toMatchObject([
      {
        why: 'a_response_not_deposited',
        response: {
          letter: anna.the_response_to(request),
          answers: request,
          caller: { is: 'a_face', key: K_b },
        },
        answered: { outcome: 'too_large_for_a_letter' },
      },
    ])
    expect(carried_by(anna)).toEqual([])
    // Each copy his post sends again meets the same: traced, nothing deposited (A, 23 Nov 2026).
    await to_the_end_of_its_time(story, bruno, greeting, anna)
    expect(bruno.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_had_no_response' }),
    )
    expect(await bruno.the_answer_to(request)).toMatchObject([
      { answer: { status: 'no_response' } },
    ])
    expect(anna.whys()).toEqual(Array.from({ length: 4 }, () => 'a_response_not_deposited'))
    expect(carried_by(anna)).toEqual([])
    expect(bruno.collected()).toEqual([])
  })

  test('a response the relay refuses is traced, and asked again', async () => {
    const { story, anna, bruno, K_b, D_b } = await annas_phone()
    const greeting = await greets(bruno, 'L_a')
    const request = bruno.the_request_of(greeting)
    anna.will('refused')
    await anna.serves()
    expect(anna.traced).toMatchObject([
      {
        why: 'a_response_not_deposited',
        response: {
          letter: anna.the_response_to(request),
          answers: request,
          caller: { is: 'a_face', key: K_b },
        },
        answered: { outcome: 'refused', why: 'invalid_request' },
      },
    ])
    await bruno.collects()
    expect(bruno.is_closed(greeting)).toBe(false)
    // His port sends his request again (PST-6): Anna's leaf answers from its recorded fact, deposited.
    story.at('10:00:15')
    await bruno.runs()
    await anna.serves()
    await bruno.collects()
    await until(() => bruno.is_closed(greeting), 'the greeting closed')
    expect(bruno.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_came_back', words: 'ciao anche a te' }),
    )
    expect(carried_by(anna)).toEqual([
      { at: D_b, fault: 'refused' },
      { at: D_b, fault: 'none' },
    ])
    expect(anna.greetings_back()).toHaveLength(1)
    expect(
      anna.facts_of_greetings().filter((fact) => fact === 'a_bond_has_been_greeted_back'),
    ).toHaveLength(1)
    expect(anna.traced).toHaveLength(1)
  })
})
