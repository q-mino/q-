import { the_kernels_reads } from '@q-mino/adapters-common'
import * as boundary from '@q-mino/boundary'
import { describe, expect, test } from 'vitest'
import {
  a_phone,
  entries_of,
  greetings,
  last_of,
  type Manifest,
  type PhoneUnderTest,
} from './harness.ts'

// The stories of the extensions' office (`packages/domains/src/extensions/README.md`,
// § Stories to prove; EXT-7, EXT-8, EXT-10, GR-3, DOM-6), one test each,
// named as the README names it, on q-'s oracle: a phone's cell with the
// office and the address book (MBX-7), greetings installed as the kernel
// composed it from its `manifest.json`. A question's delivery is the
// story's: the kernel's port of requests and its leaf on `known` are step
// 13's.
//
// Anna's phone: her face F_a; bond L_b with Bruno, L_c with Carla. Bruno's
// phone: his face F_b; bond L_a with Anna. Friday 20 November 2026, 10:00
// in Rome.

const friday = (time: string): string => `2026-11-20T${time}+01:00`

/** Anna's phone, greetings installed (or what the story installs). */
const annas_phone = (installed: readonly Manifest[] = [greetings]) =>
  a_phone({
    face: 'F_a',
    bonds: [
      { id: 'L_b', name: 'Bruno' },
      { id: 'L_c', name: 'Carla' },
    ],
    installed,
    at: friday('10:00:00'),
  })

/** Bruno's phone, greetings installed. */
const brunos_phone = () =>
  a_phone({
    face: 'F_b',
    bonds: [{ id: 'L_a', name: 'Anna' }],
    installed: [greetings],
    at: friday('10:00:00'),
  })

/** The paths' last segments of the facts recorded, fact by fact. */
const named = async (phone: PhoneUnderTest): Promise<readonly string[]> =>
  (await phone.recorded()).flatMap((fact) =>
    fact.parts.map((part) => part.path.split('/').at(-1) ?? ''),
  )

/** A command's last event, as far as a refusal names its failures. */
interface Outcome {
  readonly outcome: string
  readonly failures?: readonly { readonly predicate: string }[]
}

/** The predicates a refusal names, by their names (DOM-6). */
const failed = (outcome: Outcome | undefined): readonly string[] => {
  if (outcome?.outcome !== 'rejected') throw new Error(`not a refusal: ${JSON.stringify(outcome)}`)
  return (outcome.failures ?? []).map((failure) => failure.predicate.split('/').at(-1) ?? '')
}

/** The state of an extension, as `an_extension` reads it; none for an extension not installed. */
const the_state_of = async (phone: PhoneUnderTest, name: string) =>
  entries_of(await phone.an_extension(name))[0]?.state

/** The names of the extensions offered to a bond. */
const offered_to = async (phone: PhoneUnderTest, bond: string) =>
  entries_of(await phone.the_extensions_offered_to_a_bond(bond)).map((offered) => offered.name)

/** Greetings, with the majors its surface on `known` speaks. */
const greetings_at_1 = { name: 'greetings', majors: [1] }

describe('the extensions’ office (EXT-7, EXT-8)', () => {
  test('a preinstalled extension is off until the user activates it', async () => {
    const anna = await annas_phone()
    const [card] = entries_of(await anna.an_extension('greetings'))
    expect(card).toEqual({ name: 'greetings', manifest: greetings, state: { is: 'not_active' } })
    expect(await offered_to(anna, 'L_b')).toEqual([])
    expect(entries_of(await anna.an_extension('ping_pong'))).toEqual([])
  })

  test('activated with the manifest shown, it is active and offered to every bond', async () => {
    const anna = await annas_phone()
    const activated = last_of(await anna.activate_an_extension(greetings))
    expect(activated.outcome).toBe('applied')
    expect(await the_state_of(anna, 'greetings')).toEqual({ is: 'active' })
    expect(entries_of(await anna.the_extensions_offered_to_a_bond('L_b'))).toEqual([greetings_at_1])
    expect(await offered_to(anna, 'L_c')).toEqual(['greetings'])
    const [fact] = await anna.recorded()
    expect(fact?.parts[0]?.payload).toEqual({
      activated_extension: {
        name: 'greetings',
        status: 'activated',
        accepted: greetings,
        at: friday('10:00:00'),
      },
    })
    await anna.activate_an_extension(greetings)
    expect(await named(anna)).toEqual([
      'an_extension_has_been_activated',
      'an_extension_has_been_activated_again',
    ])
  })

  test('a manifest other than the installed one is refused', async () => {
    const anna = await annas_phone()
    const older = { ...greetings, version: '0.0.9' }
    expect(failed(last_of(await anna.activate_an_extension(older)))).toContain(
      'the_extension_is_installed_with_this_manifest',
    )
    const not_installed = { ...greetings, name: 'ping_pong' }
    expect(failed(last_of(await anna.activate_an_extension(not_installed)))).toContain(
      'the_extension_is_installed_with_this_manifest',
    )
    expect(await named(anna)).toEqual([])
    expect(await the_state_of(anna, 'greetings')).toEqual({ is: 'not_active' })
  })

  test('deactivated, it is not active and offered to no bond', async () => {
    const anna = await annas_phone()
    await anna.deactivate_an_extension('greetings')
    await anna.activate_an_extension(greetings)
    anna.at(friday('11:00:00'))
    await anna.deactivate_an_extension('greetings')
    expect(await the_state_of(anna, 'greetings')).toEqual({ is: 'not_active' })
    expect(await offered_to(anna, 'L_b')).toEqual([])
    await anna.deactivate_an_extension('greetings')
    expect(await named(anna)).toEqual([
      'an_extension_has_been_deactivated_again',
      'an_extension_has_been_activated',
      'an_extension_has_been_deactivated',
      'an_extension_has_been_deactivated_again',
    ])
    const facts = await anna.recorded()
    expect(facts[2]?.parts[0]?.payload).toEqual({
      deactivated_extension: { name: 'greetings', status: 'deactivated', at: friday('11:00:00') },
    })
  })

  test('an update that asks more waits for the new manifest until accepted', async () => {
    const before = await annas_phone()
    await before.activate_an_extension(greetings)
    const sees_the_names = {
      ...greetings,
      version: '0.2.0',
      sees: { known: ['the_name_of_the_bond'] },
    }
    const anna = before.updated_to([sees_the_names])
    expect(await the_state_of(anna, 'greetings')).toEqual({
      is: 'waiting_for_the_new_manifest',
      asks_more: [{ asks: 'to_see_on_known', name: 'the_name_of_the_bond' }],
    })
    expect(await offered_to(anna, 'L_b')).toEqual([])
    expect(failed(last_of(await anna.activate_an_extension(greetings)))).toContain(
      'the_extension_is_installed_with_this_manifest',
    )
    expect(last_of(await anna.activate_an_extension(sees_the_names)).outcome).toBe('applied')
    expect(await the_state_of(anna, 'greetings')).toEqual({ is: 'active' })
    expect(await offered_to(anna, 'L_b')).toEqual(['greetings'])
  })

  test('an update that asks no more keeps it active', async () => {
    const before = await annas_phone()
    await before.activate_an_extension(greetings)
    const at_a_new_major = {
      ...greetings,
      version: '0.2.0',
      majors: { self: [1, 2], known: [1, 2] },
    }
    const anna = before.updated_to([at_a_new_major])
    expect(await the_state_of(anna, 'greetings')).toEqual({ is: 'active' })
    expect(entries_of(await anna.the_extensions_offered_to_a_bond('L_b'))).toEqual([
      { name: 'greetings', majors: [1, 2] },
    ])
    const one_more_leaf_on_known = {
      ...greetings,
      version: '0.3.0',
      leaves_on_known: [...greetings.leaves_on_known, 'usecase/greet_twice'],
    }
    expect(await the_state_of(before.updated_to([one_more_leaf_on_known]), 'greetings')).toEqual({
      is: 'waiting_for_the_new_manifest',
      asks_more: [{ asks: 'a_leaf_on_known', leaf: 'usecase/greet_twice' }],
    })
  })

  test('the offer withdrawn from one bond, still offered to the others', async () => {
    const anna = await annas_phone()
    await anna.activate_an_extension(greetings)
    const withdrawn = last_of(
      await anna.withdraw_the_offer_from_a_bond({ name: 'greetings', bond: 'L_c' }),
    )
    expect(withdrawn.outcome).toBe('applied')
    expect(await offered_to(anna, 'L_c')).toEqual([])
    expect(await offered_to(anna, 'L_b')).toEqual(['greetings'])
    expect(await the_state_of(anna, 'greetings')).toEqual({ is: 'active' })
    await anna.withdraw_the_offer_from_a_bond({ name: 'greetings', bond: 'L_c' })
    expect((await named(anna)).slice(1)).toEqual([
      'the_offer_of_an_extension_has_been_withdrawn_from_a_bond',
      'the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again',
    ])
  })

  test('offered again after a withdrawal, a change; offered already, again', async () => {
    const anna = await annas_phone()
    await anna.activate_an_extension(greetings)
    await anna.withdraw_the_offer_from_a_bond({ name: 'greetings', bond: 'L_c' })
    await anna.offer_an_extension_to_a_bond({ name: 'greetings', bond: 'L_c' })
    expect(await offered_to(anna, 'L_c')).toEqual(['greetings'])
    await anna.offer_an_extension_to_a_bond({ name: 'greetings', bond: 'L_b' })
    expect((await named(anna)).slice(2)).toEqual([
      'an_extension_has_been_offered_to_a_bond',
      'an_extension_has_been_offered_to_a_bond_again',
    ])
  })

  test('withdrawing from a bond that does not exist is refused', async () => {
    const anna = await annas_phone()
    await anna.activate_an_extension(greetings)
    expect(
      failed(
        last_of(await anna.withdraw_the_offer_from_a_bond({ name: 'greetings', bond: 'L_x' })),
      ),
    ).toContain('the_bond_exists')
    await anna.remove_a_bond('L_c')
    expect(
      failed(
        last_of(await anna.withdraw_the_offer_from_a_bond({ name: 'greetings', bond: 'L_c' })),
      ),
    ).toContain('the_bond_exists')
    expect(
      failed(last_of(await anna.offer_an_extension_to_a_bond({ name: 'greetings', bond: 'L_c' }))),
    ).toContain('the_bond_exists')
    expect(
      failed(
        last_of(await anna.withdraw_the_offer_from_a_bond({ name: 'ping_pong', bond: 'L_b' })),
      ),
    ).toContain('the_extension_is_installed')
    expect(await named(anna)).toEqual([
      'an_extension_has_been_activated',
      'a_bond_has_been_removed',
    ])
  })

  test('a withdrawal stays across a deactivation', async () => {
    const anna = await annas_phone()
    await anna.activate_an_extension(greetings)
    await anna.withdraw_the_offer_from_a_bond({ name: 'greetings', bond: 'L_c' })
    await anna.deactivate_an_extension('greetings')
    await anna.activate_an_extension(greetings)
    expect(await offered_to(anna, 'L_c')).toEqual([])
    expect(await offered_to(anna, 'L_b')).toEqual(['greetings'])
  })

  test('the extensions in common: those offered back, with their majors', async () => {
    const bruno = await brunos_phone()
    await bruno.activate_an_extension(greetings)
    expect(entries_of(await bruno.the_extensions_in_common('L_a', [greetings_at_1]))).toEqual([
      greetings_at_1,
    ])
  })

  test('the extensions in common: empty after the offer is withdrawn, or the extension deactivated', async () => {
    const bruno = await brunos_phone()
    await bruno.activate_an_extension(greetings)
    await bruno.withdraw_the_offer_from_a_bond({ name: 'greetings', bond: 'L_a' })
    expect(entries_of(await bruno.the_extensions_in_common('L_a', [greetings_at_1]))).toEqual([])
    await bruno.offer_an_extension_to_a_bond({ name: 'greetings', bond: 'L_a' })
    await bruno.deactivate_an_extension('greetings')
    expect(entries_of(await bruno.the_extensions_in_common('L_a', [greetings_at_1]))).toEqual([])
  })

  test('the extensions in common: a claim of more learns no more', async () => {
    const bruno = await brunos_phone()
    await bruno.activate_an_extension(greetings)
    const claimed = [
      { name: 'ping_pong', majors: [1] },
      { name: 'greetings', majors: [7] },
      { name: 'waves', majors: [1, 2] },
    ]
    expect(entries_of(await bruno.the_extensions_in_common('L_a', claimed))).toEqual([
      greetings_at_1,
    ])
    expect(entries_of(await bruno.the_extensions_in_common('L_a', []))).toEqual([])
  })

  test('the asker’s question and what came back, recorded', async () => {
    const anna = await annas_phone()
    const bruno = await brunos_phone()
    await anna.activate_an_extension(greetings)
    await bruno.activate_an_extension(greetings)
    // What step 13 wires: Anna's request reaches Bruno's leaf on `known` with
    // their bond, which reads his office; the snapshot comes back.
    anna.answers(async (question) => ({
      outcome: 'the_extensions_in_common_came_back',
      in_common: [...entries_of(await bruno.the_extensions_in_common('L_a', question.offered))],
    }))
    const offered = entries_of(await anna.the_extensions_offered_to_a_bond('L_b'))
    const asked = last_of(
      await anna.ask_a_bond_for_the_extensions_in_common({ bond: 'L_b', offered }),
    )
    expect(asked.outcome).toBe('applied')
    const [, question] = await anna.recorded()
    const the_question = question?.parts[0]?.payload
    expect(the_question).toMatchObject({
      question: { bond: 'L_b', offered: [greetings_at_1], progress: { stage: 'waiting' } },
    })
    await anna.runs()
    expect(anna.questions()).toMatchObject([{ bond: 'L_b', offered: [greetings_at_1], waits: 60 }])
    const facts = await anna.recorded()
    expect(facts.map((fact) => fact.parts[0]?.path.split('/').at(-1))).toEqual([
      'an_extension_has_been_activated',
      'a_bond_has_been_asked_for_the_extensions_in_common',
      'the_extensions_in_common_with_a_bond_have_been_learned',
    ])
    expect(facts[2]?.parts[0]?.payload).toMatchObject({ in_common: [greetings_at_1] })
    // Bruno withdraws the offer from Anna: the next answer is empty.
    await bruno.withdraw_the_offer_from_a_bond({ name: 'greetings', bond: 'L_a' })
    await anna.ask_a_bond_for_the_extensions_in_common({ bond: 'L_b', offered })
    await anna.runs()
    expect((await anna.recorded()).at(-1)?.parts[0]?.payload).toMatchObject({ in_common: [] })
  })

  test('no response: the question had no answer', async () => {
    const anna = await annas_phone()
    await anna.activate_an_extension(greetings)
    anna.answers(() => Promise.resolve({ outcome: 'no_answer_came_back', why: 'no_response' }))
    await anna.ask_a_bond_for_the_extensions_in_common({ bond: 'L_b', offered: [greetings_at_1] })
    await anna.runs()
    const last = (await anna.recorded()).at(-1)?.parts[0]
    expect(last?.path).toBe(
      'extensions/activations/fact/a_question_about_the_extensions_in_common_had_no_answer',
    )
    expect(last?.payload).toMatchObject({ why: 'no_response' })
    expect(anna.held()).toEqual([])
  })

  test('a question tells only what the node offers the bond', async () => {
    const anna = await annas_phone()
    expect(
      failed(
        last_of(
          await anna.ask_a_bond_for_the_extensions_in_common({
            bond: 'L_b',
            offered: [greetings_at_1],
          }),
        ),
      ),
    ).toContain('these_extensions_are_offered_to_the_bond')
    await anna.activate_an_extension(greetings)
    await anna.withdraw_the_offer_from_a_bond({ name: 'greetings', bond: 'L_c' })
    expect(
      failed(
        last_of(
          await anna.ask_a_bond_for_the_extensions_in_common({
            bond: 'L_c',
            offered: [greetings_at_1],
          }),
        ),
      ),
    ).toContain('these_extensions_are_offered_to_the_bond')
    expect(
      failed(
        last_of(
          await anna.ask_a_bond_for_the_extensions_in_common({
            bond: 'L_b',
            offered: [{ name: 'greetings', majors: [1, 2] }],
          }),
        ),
      ),
    ).toContain('these_extensions_are_offered_to_the_bond')
    expect(
      failed(
        last_of(
          await anna.ask_a_bond_for_the_extensions_in_common({
            bond: 'L_x',
            offered: [],
          }),
        ),
      ),
    ).toContain('the_bond_exists')
    expect(
      last_of(await anna.ask_a_bond_for_the_extensions_in_common({ bond: 'L_c', offered: [] }))
        .outcome,
    ).toBe('applied')
  })
})

describe('what the kernel reads of the office (EXT-6, EXT-7)', () => {
  test('is_active, is_offered and the lists of the routing, over the office’s read ports', async () => {
    const anna = await annas_phone()
    const reads = the_kernels_reads({ clock: anna.clock, office: anna.office })
    const bond = (id: string) => boundary.bond.parse(id)
    expect(await reads.is_active('greetings')).toBe(false)
    expect(await reads.the_active_among(['greetings', 'ping_pong'])).toEqual([])
    await anna.activate_an_extension(greetings)
    await anna.withdraw_the_offer_from_a_bond({ name: 'greetings', bond: 'L_c' })
    expect(await reads.is_active('greetings')).toBe(true)
    expect(await reads.is_active('ping_pong')).toBe(false)
    expect(await reads.is_active('Not A Name')).toBe(false)
    expect(await reads.the_active_among(['greetings', 'ping_pong'])).toEqual(['greetings'])
    expect(await reads.is_offered('greetings', bond('L_b'))).toBe(true)
    expect(await reads.is_offered('greetings', bond('L_c'))).toBe(false)
    expect(await reads.the_extensions_offered_to(bond('L_b'))).toEqual(['greetings'])
    expect(await reads.the_extensions_offered_to(bond('L_c'))).toEqual([])
  })
})
