import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { afterEach, describe, expect, test } from 'vitest'
import { z } from 'zod'
import {
  a_story,
  send_my_introduction,
  until,
  type AFactory,
  type AFaultPlan,
  type APhoneOfTheStory,
  type AStory,
} from './harness.ts'

// The scenarios of stage 1 end to end on the `memory` stack (step 17;
// CFG-3, TST-1, TST-2, TST-4, F8; `README.md` here), one test each, named
// in her words: a suite parametrized by a factory (TST-1), run here on the
// oracle (`stack.test.ts`) and in steps 20, 21 and 25 on their adapters;
// every scenario under both fault plans, none and lossy (TST-4). Each
// story starts its own stack: the relay, and the phones of Anna, Bruno,
// Carla and Dario over it, on, with no face yet, ping pong preinstalled and
// off (PNG-1). Every gesture is one of her activities (USR-2), asked with an
// id the story draws. Friday 20 November 2026, 10:00 UTC; a story waits
// through a request's quarters when the plan loses a letter (PST-6).

/** Twelve hours, the quarter of an introduction's 48 (PST-6, BND-10). */
const an_introduction_s_quarter = 12 * 60 * 60

/** Fifteen seconds, the quarter of a ping's 60 and of a question's (PST-6, EXT-8). */
const a_ping_s_quarter = 15

/** Ping pong at its major, as Anna's phone offers it to a bond (EXT-8). */
const ping_pong_at_1 = { extension: 'ping_pong', majors: [1] }

/** The ping on a bond: Anna's tap on "Ping" (ping pong's action `ping`, EXT-16). */
const ping = (bond: string): activities_value.what_is_asked => ({
  activity: 'use_an_action',
  extension: 'ping_pong',
  action: 'ping',
  on: { place: 'a_bond', bond },
})

/** The question an activity asked (EXT-8): its id, as the end of `ask_a_bond_for_the_extensions_in_common` says it. */
const the_question_of = (ended: activities_value.how_it_ended): string => {
  expect(ended).toMatchObject({ ended: 'done', said: { event: 'the_bond_is_asked' } })
  return 'said' in ended
    ? z.object({ question_id: z.string() }).parse(ended.said.payload).question_id
    : ''
}

/** A side of a bond to be: the phone, its user's face, the bond's id there, the name she gives the other. */
interface ASide {
  readonly phone: APhoneOfTheStory
  readonly face: string
  readonly bond: string
  readonly name: string
}

/** An activity asked, and its end once it has ended (at most about two seconds; nothing settles meanwhile). */
const asks_and_it_ends = async (
  phone: APhoneOfTheStory,
  activity_id: string,
  what: activities_value.what_is_asked,
): Promise<activities_value.how_it_ended> => {
  await phone.asks(activity_id, what)
  await until(
    async () => (await phone.the_end_of(activity_id)) !== undefined,
    `the end of ${phone.name}'s ${activity_id}`,
  )
  const ended = await phone.the_end_of(activity_id)
  if (ended === undefined) throw new Error(`${phone.name}'s ${activity_id} did not end`)
  return ended
}

/** Her face made at her phone's first start (BND-8): asked, done, its keys made by the safe once the stack settles. */
const makes_her_first_face = async (story: AStory, phone: APhoneOfTheStory, face: string) => {
  expect(
    await asks_and_it_ends(phone, `first_face_${face}`, {
      activity: 'make_my_first_face',
      face,
      name: phone.name,
    }),
  ).toMatchObject({ ended: 'done', said: { event: 'your_face_is_being_made' } })
  await story.settles()
}

/** A ticket prepared for a bond to be (BND-8): asked, done, ready once the safe drew its mailbox's key. */
const prepares_a_ticket = async (story: AStory, side: ASide) => {
  expect(
    await asks_and_it_ends(side.phone, `ticket_${side.bond}`, {
      activity: 'prepare_a_ticket',
      bond: side.bond,
      face: side.face,
    }),
  ).toMatchObject({ ended: 'done', said: { event: 'your_ticket_is_being_prepared' } })
  await story.settles()
}

/** The ticket a side shows, read from its QR or its link as is (BND-9). */
const the_ticket_of = async (side: ASide) => {
  const shown = await side.phone.the_ticket_shown(side.bond)
  if (shown === undefined)
    throw new Error(`no ticket ${side.bond} ready on ${side.phone.name}'s phone`)
  return shown
}

/** A side opens the other's ticket as shown, presenting its own (BND-10): asked, done. */
const opens_their_ticket = async (
  side: ASide,
  their_ticket: activities_value.their_ticket,
): Promise<void> => {
  expect(
    await asks_and_it_ends(side.phone, `open_${side.bond}`, {
      activity: 'open_their_ticket',
      bond: side.bond,
      their_ticket,
      name: side.name,
    }),
  ).toMatchObject({ ended: 'done' })
}

/** The introduction a side sent (BND-10): its request's identity, the kernel's, keyed by the bond. */
const the_introduction_of = (side: ASide): string =>
  side.phone.the_kernels_request(side.face, send_my_introduction, side.bond)

/** Whether a request is closed with an answer. */
const is_answered = async (phone: APhoneOfTheStory, request: string): Promise<boolean> =>
  (await phone.the_answer_to(request))?.status === 'answered'

/**
 * The QR crossed (BND-10, BND-11): each prepares a ticket, each opens the
 * other's within the two minutes; the stack settles through the
 * introductions' quarters until both are answered.
 */
const bonded_in_person = async (story: AStory, first: ASide, second: ASide) => {
  await prepares_a_ticket(story, first)
  await prepares_a_ticket(story, second)
  // Each scans the other's QR, both shown at once.
  const firsts = await the_ticket_of(first)
  const seconds = await the_ticket_of(second)
  await opens_their_ticket(first, seconds)
  await opens_their_ticket(second, firsts)
  await story.settles_through_the_quarters(
    an_introduction_s_quarter,
    'its_last_sending',
    async () =>
      (await is_answered(first.phone, the_introduction_of(first))) &&
      (await is_answered(second.phone, the_introduction_of(second))),
  )
}

/**
 * A bond made at a distance (BND-10): the holder's ticket goes in a link,
 * passed as it shows it; the opener prepares a ticket of its own and opens
 * the holder's; the stack settles through the quarters until the opener's
 * introduction is answered.
 */
const bonded_by_a_link = async (story: AStory, holder: ASide, opener: ASide) => {
  await prepares_a_ticket(story, holder)
  await prepares_a_ticket(story, opener)
  await opens_their_ticket(opener, await the_ticket_of(holder))
  await story.settles_through_the_quarters(an_introduction_s_quarter, 'its_last_sending', () =>
    is_answered(opener.phone, the_introduction_of(opener)),
  )
}

/** Ping pong activated, its manifest accepted as shown (EXT-7): asked, done, loaded once the stack settles (EXT-15). */
const activates_ping_pong = async (story: AStory, phone: APhoneOfTheStory) => {
  expect(
    await asks_and_it_ends(phone, 'activate_ping_pong', {
      activity: 'activate_an_extension',
      manifest: phone.the_manifest_shown(),
    }),
  ).toMatchObject({ ended: 'done', said: { event: 'the_extension_is_active' } })
  await story.settles()
}

/**
 * The faults the plan injected since a point of the story (TST-4): none
 * under the plan `none`; under the lossy plan, one on a deposit of each
 * phone named (its letters, requests or responses, met a fault on their
 * way) and one on a collect.
 */
const met_the_faults = (
  story: AStory,
  plan: AFaultPlan,
  met: { readonly since: number; readonly deposits_of: readonly string[] },
): void => {
  const since = story.the_faults_met().slice(met.since)
  if (plan === 'none') {
    expect(story.the_faults_met()).toEqual([])
    return
  }
  for (const whose of met.deposits_of)
    expect(since).toContainEqual(expect.objectContaining({ phone: whose, on: 'a_deposit' }))
  expect(since).toContainEqual(expect.objectContaining({ on: 'a_collect' }))
}

/** The suite of the stack (TST-1), under a factory, every scenario under each fault plan. */
export const stories_of_the_stack = (
  name: string,
  factory: AFactory,
  plans: readonly AFaultPlan[] = ['none', 'lossy'],
): void => {
  for (const plan of plans) {
    describe(`the memory stack, ${name}, faults ${plan}`, () => {
      let running: AStory | undefined = undefined
      /** The story's stack, stopped after the test (`afterEach`): nothing outlives it. */
      const the_story = async (): Promise<AStory> => {
        running = await a_story(factory, plan)
        return running
      }
      afterEach(async () => {
        const story = running
        running = undefined
        await story?.stops()
      })

      /** Anna, Bruno, Carla and Dario on their phones, with their faces made (BND-8). */
      const the_cast = async (
        story: AStory,
        names: readonly ('Anna' | 'Bruno' | 'Carla' | 'Dario')[],
      ) => {
        const faces = { Anna: 'F_a', Bruno: 'F_b', Carla: 'F_c', Dario: 'F_d' } as const
        const numbers = { Anna: 1, Bruno: 2, Carla: 3, Dario: 4 } as const
        const phones = new Map<string, APhoneOfTheStory>()
        for (const each of names) {
          const phone = await story.a_phone({ phone: numbers[each], name: each })
          await makes_her_first_face(story, phone, faces[each])
          phones.set(each, phone)
        }
        const the = (who: 'Anna' | 'Bruno' | 'Carla' | 'Dario'): APhoneOfTheStory => {
          const phone = phones.get(who)
          if (phone === undefined) throw new Error(`${who} is not in the story`)
          return phone
        }
        return the
      }

      /** Anna and Bruno, their QR crossed: her L_b, his L_a. */
      const anna_and_bruno_in_person = async (story: AStory) => {
        const the = await the_cast(story, ['Anna', 'Bruno'])
        const anna: ASide = { phone: the('Anna'), face: 'F_a', bond: 'L_b', name: 'Bruno' }
        const bruno: ASide = { phone: the('Bruno'), face: 'F_b', bond: 'L_a', name: 'Anna' }
        await bonded_in_person(story, anna, bruno)
        return { anna, bruno }
      }

      test('Anna makes her first face', async () => {
        const story = await the_story()
        const anna = await story.a_phone({ phone: 1, name: 'Anna' })
        expect(await anna.my_faces()).toEqual([])
        expect(
          await asks_and_it_ends(anna, 'A1', {
            activity: 'make_my_first_face',
            face: 'F_a',
            name: 'Anna',
          }),
        ).toEqual({
          ended: 'done',
          said: { event: 'your_face_is_being_made', payload: { face_id: 'F_a' } },
        })
        await story.settles()
        // Her face, made with the key the safe drew for it (SEA-3, BND-8).
        const key = await anna.the_key_in_the_safe('F_a')
        expect(key).toEqual(expect.any(String))
        expect(await anna.my_faces()).toMatchObject([{ id: 'F_a', name: 'Anna', public_key: key }])
        // A second first face: she has hers (stage 1, one face).
        expect(
          await asks_and_it_ends(anna, 'A2', {
            activity: 'make_my_first_face',
            face: 'F_a2',
            name: 'Anna',
          }),
        ).toEqual({
          ended: 'done_already',
          said: { event: 'you_have_a_face_already', payload: {} },
        })
        await story.settles()
        expect(await anna.my_faces()).toMatchObject([{ id: 'F_a', name: 'Anna', public_key: key }])
        expect(anna.held_letters()).toEqual([])
      })

      test('Anna and Bruno cross their QR: bonded in person, each confirmed', async () => {
        const story = await the_story()
        const { anna, bruno } = await anna_and_bruno_in_person(story)
        const [annas_face] = await anna.phone.my_faces()
        const [brunos_face] = await bruno.phone.my_faces()
        const her_card = await anna.phone.a_bond('L_b')
        const his_card = await bruno.phone.a_bond('L_a')
        expect(her_card).toMatchObject({
          name: 'Bruno',
          my_face_id: 'F_a',
          their_face: { key: brunos_face?.public_key, introduced_as: 'Bruno' },
          their_mailbox: his_card?.my_mailbox,
          handshake: { way: 'in_person' },
          confirmation: { state: 'received' },
        })
        expect(his_card).toMatchObject({
          name: 'Anna',
          my_face_id: 'F_b',
          their_face: { key: annas_face?.public_key, introduced_as: 'Anna' },
          their_mailbox: her_card?.my_mailbox,
          handshake: { way: 'in_person' },
          confirmation: { state: 'received' },
        })
        // The two introductions' requests closed with an answer; no letter held on either phone.
        expect(await anna.phone.the_answer_to(the_introduction_of(anna))).toMatchObject({
          status: 'answered',
        })
        expect(await bruno.phone.the_answer_to(the_introduction_of(bruno))).toMatchObject({
          status: 'answered',
        })
        expect(anna.phone.held_letters()).toEqual([])
        expect(bruno.phone.held_letters()).toEqual([])
        met_the_faults(story, plan, { since: 0, deposits_of: ['Anna', 'Bruno'] })
      })

      test('Carla opens Anna’s link: bonded at a distance, Anna confirmed', async () => {
        const story = await the_story()
        const the = await the_cast(story, ['Anna', 'Carla'])
        const anna: ASide = { phone: the('Anna'), face: 'F_a', bond: 'L_c', name: 'Carla' }
        const carla: ASide = { phone: the('Carla'), face: 'F_c', bond: 'L_a', name: 'Anna' }
        await bonded_by_a_link(story, anna, carla)
        const [annas_face] = await anna.phone.my_faces()
        const [carlas_face] = await carla.phone.my_faces()
        const her_card = await anna.phone.a_bond('L_c')
        const carlas_card = await carla.phone.a_bond('L_a')
        // Anna's bond, named as Carla is introduced, at a distance: Carla's introduction is her confirmation.
        expect(her_card).toMatchObject({
          name: 'Carla',
          their_face: { key: carlas_face?.public_key, introduced_as: 'Carla' },
          their_mailbox: carlas_card?.my_mailbox,
          handshake: { way: 'at_a_distance' },
          confirmation: { state: 'received' },
        })
        // Carla's, at a distance, its confirmation awaited: Anna's answer is not written as one (open point).
        expect(carlas_card).toMatchObject({
          name: 'Anna',
          their_face: { key: annas_face?.public_key, introduced_as: 'Anna' },
          their_mailbox: her_card?.my_mailbox,
          handshake: { way: 'at_a_distance' },
          confirmation: { state: 'awaited' },
        })
        expect(await carla.phone.the_answer_to(the_introduction_of(carla))).toMatchObject({
          status: 'answered',
          event: { event: 'you_are_bonded', payload: {} },
        })
        expect(anna.phone.held_letters()).toEqual([])
        expect(carla.phone.held_letters()).toEqual([])
        met_the_faults(story, plan, { since: 0, deposits_of: ['Anna', 'Carla'] })
      })

      test('Anna and Bruno activate ping pong: loaded, offered to their bond', async () => {
        const story = await the_story()
        const { anna, bruno } = await anna_and_bruno_in_person(story)
        expect(anna.phone.ping_pong_s_life()).toBe('unloaded')
        await activates_ping_pong(story, anna.phone)
        await activates_ping_pong(story, bruno.phone)
        expect(anna.phone.ping_pong_s_life()).toBe('running')
        expect(bruno.phone.ping_pong_s_life()).toBe('running')
        expect(await anna.phone.offers_ping_pong_to('L_b')).toBe(true)
        expect(await bruno.phone.offers_ping_pong_to('L_a')).toBe(true)
        met_the_faults(story, plan, { since: 0, deposits_of: ['Anna', 'Bruno'] })
      })

      test('Anna pings Bruno: his pong comes back within the ping’s 60 seconds', async () => {
        const story = await the_story()
        const { anna, bruno } = await anna_and_bruno_in_person(story)
        await activates_ping_pong(story, anna.phone)
        await activates_ping_pong(story, bruno.phone)
        const before_the_ping = story.the_faults_met().length
        const his_deposits = bruno.phone.deposited().length
        await anna.phone.asks('A1', ping('L_b'))
        await story.settles_through_the_quarters(
          a_ping_s_quarter,
          'its_last_sending',
          async () => (await anna.phone.the_end_of('A1')) !== undefined,
        )
        expect(await anna.phone.the_end_of('A1')).toMatchObject({
          ended: 'the_extension_answered',
          said: { event: 'pong' },
        })
        // One pong in Bruno's partition, however many copies of the ping came (DOM-11): under
        // the lossy plan his response's deposit aborts, and his entry meets the ping again.
        expect(bruno.phone.pongs()).toHaveLength(1)
        if (plan === 'lossy')
          expect(bruno.phone.deposited().slice(his_deposits)).toContainEqual(
            expect.objectContaining({ fault: 'aborted' }),
          )
        expect(anna.phone.held_letters()).toEqual([])
        expect(bruno.phone.held_letters()).toEqual([])
        met_the_faults(story, plan, { since: before_the_ping, deposits_of: ['Anna', 'Bruno'] })
      })

      test('Anna pings Carla, whose ping pong is not active: Carla’s node stays silent', async () => {
        const story = await the_story()
        const the = await the_cast(story, ['Anna', 'Carla'])
        const anna: ASide = { phone: the('Anna'), face: 'F_a', bond: 'L_c', name: 'Carla' }
        const carla: ASide = { phone: the('Carla'), face: 'F_c', bond: 'L_a', name: 'Anna' }
        await bonded_by_a_link(story, anna, carla)
        await activates_ping_pong(story, anna.phone)
        expect(carla.phone.ping_pong_s_life()).toBe('unloaded')
        const collected = carla.phone.collected().length
        const deposited = carla.phone.deposited().length
        const before_the_ping = story.the_faults_met().length
        await anna.phone.asks('A1', ping('L_c'))
        await story.settles_through_the_quarters(
          a_ping_s_quarter,
          'its_end',
          async () => (await anna.phone.the_end_of('A1')) !== undefined,
        )
        expect(await anna.phone.the_end_of('A1')).toMatchObject({
          ended: 'the_extension_answered',
          said: { event: 'no_response' },
        })
        // Carla's phone collected the ping, her kernel traced the silence (EXT-6), and nothing went back.
        expect(carla.phone.collected().length).toBeGreaterThan(collected)
        const silences = carla.phone
          .traced()
          .filter((each) => each.why === 'the_extension_is_not_active')
        expect(silences.length).toBeGreaterThan(0)
        expect(silences[0]).toMatchObject({
          request: { invokes: { of: 'an_extension', extension: 'ping_pong' } },
        })
        expect(carla.phone.deposited().slice(deposited)).toEqual([])
        met_the_faults(story, plan, { since: before_the_ping, deposits_of: ['Anna'] })
      })

      test('Anna tells Carla’s silence from Dario’s phone off: the kernel answers, a node off does not', async () => {
        const story = await the_story()
        const the = await the_cast(story, ['Anna', 'Carla', 'Dario'])
        const anna_c: ASide = { phone: the('Anna'), face: 'F_a', bond: 'L_c', name: 'Carla' }
        const anna_d: ASide = { phone: the('Anna'), face: 'F_a', bond: 'L_d', name: 'Dario' }
        const carla: ASide = { phone: the('Carla'), face: 'F_c', bond: 'L_a', name: 'Anna' }
        const dario: ASide = { phone: the('Dario'), face: 'F_d', bond: 'L_a', name: 'Anna' }
        const anna = anna_c.phone
        await bonded_by_a_link(story, anna_c, carla)
        await bonded_by_a_link(story, anna_d, dario)
        await activates_ping_pong(story, anna)
        await activates_ping_pong(story, dario.phone)
        const collected_by_dario = dario.phone.collected().length
        await dario.phone.off()
        // Her pings to both: no response from either, a silence and a node off alike (F8).
        await anna.asks('A1', ping('L_c'))
        await anna.asks('A2', ping('L_d'))
        await story.settles_through_the_quarters(
          a_ping_s_quarter,
          'its_end',
          async () =>
            (await anna.the_end_of('A1')) !== undefined &&
            (await anna.the_end_of('A2')) !== undefined,
        )
        const no_response = { ended: 'the_extension_answered', said: { event: 'no_response' } }
        expect(await anna.the_end_of('A1')).toMatchObject(no_response)
        expect(await anna.the_end_of('A2')).toMatchObject(no_response)
        // She asks both for the extensions in common (EXT-8): the kernel is never silent.
        const ask = (bond: string): activities_value.what_is_asked => ({
          activity: 'ask_a_bond_for_the_extensions_in_common',
          bond,
          offered: [ping_pong_at_1],
        })
        const before_the_questions = story.the_faults_met().length
        const to_carla = the_question_of(await asks_and_it_ends(anna, 'A3', ask('L_c')))
        const to_dario = the_question_of(await asks_and_it_ends(anna, 'A4', ask('L_d')))
        const closed = async () =>
          (await anna.facts_of('extensions/activations/fact/')).filter(
            (fact) =>
              fact.path.endsWith('/the_extensions_in_common_with_a_bond_have_been_learned') ||
              fact.path.endsWith('/a_question_about_the_extensions_in_common_had_no_answer'),
          )
        await story.settles_through_the_quarters(
          a_ping_s_quarter,
          'its_end',
          async () => (await closed()).length === 2,
        )
        // Carla's node answers, ping pong not among those in common: the asker learns no more (EXT-8).
        // Dario's, off, gives nothing back: no response at the question's time.
        expect(await closed()).toHaveLength(2)
        expect(await closed()).toContainEqual({
          path: 'extensions/activations/fact/the_extensions_in_common_with_a_bond_have_been_learned',
          payload: { question_id: to_carla, in_common: [] },
        })
        expect(await closed()).toContainEqual({
          path: 'extensions/activations/fact/a_question_about_the_extensions_in_common_had_no_answer',
          payload: { question_id: to_dario, why: 'no_response' },
        })
        expect(dario.phone.collected()).toHaveLength(collected_by_dario)
        met_the_faults(story, plan, { since: before_the_questions, deposits_of: ['Anna', 'Carla'] })
      })
    })
  }
}
