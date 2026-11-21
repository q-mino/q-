import { the_delivery_of_an_activity } from '@q-mino/adapters-common'
import * as zz from '@q-mino/domains/library'
import { carry_out_an_activity } from '@q-mino/domains/user/activities/_effect.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'
import { afterEach, describe, expect, test } from 'vitest'
import { the_relay } from '../node/harness.ts'
import {
  annas_story,
  asks_and_it_ends,
  composed_from,
  opens_the_app,
  ping,
  ping_pong_manifest,
  the_apps_close,
  the_manifest_shown,
  the_request_goes,
  until,
  type AFactory,
  type AnnasStory,
} from './harness.ts'

// The stories of `user` (packages/domains/src/user/README.md; USR-1..USR-8,
// GR-7, ADP-2, ADP-7, DOM-12, DOM-15, LIB-12, F6; parts 15.2, 21.2), each a
// test named after its story, over a node: a suite parametrized by the
// factory of the phones' storage (TST-1), run on q-'s oracle
// (`user.test.ts`) and on an adapter's storage as its conformance suite
// (`on_indexeddb.test.ts`). Anna's phone with `user`'s offices beside the
// kernel's, her activities carried out by `user`'s executor through the
// port toward `self` while her app is open, Bruno's and Carla's phones
// beside hers (`harness.ts`).

/** The facts of a command's events, by the last segment of each part's path. */
const the_facts_of = (events: readonly unknown[]): readonly string[] =>
  JSON.stringify(events)
    .match(/"path":"[a-z_/]+\/fact\/[a-z_]+"/g)
    ?.map((path) => path.slice(0, -1).split('/').at(-1) ?? '') ?? []

/** The quarters of a ping's 60 seconds at which Anna's post sends again, and its end (PST-6). */
const the_quarters = ['10:00:15', '10:00:30', '10:00:45', '10:01:00'] as const

/** Anna's post at each quarter of the ping's time, Bruno's phone off. */
const to_the_end_of_its_time = async (story: AnnasStory): Promise<void> => {
  for (const quarter of the_quarters) {
    story.at(quarter)
    await story.anna.runs()
  }
}

/** The stories of `user`, over phones kept as a factory keeps them (TST-1). */
export const stories_of_user = (name: string, factory: AFactory): void => {
  describe(`user, ${name}`, () => {
    afterEach(the_apps_close)

    test('an activity asked is in progress, its carrying out queued', async () => {
      const { anna } = await annas_story(factory, { app: 'closed' })
      const rename = { activity: 'rename_a_bond', bond: 'L_b', name: 'Bruno B.' } as const
      expect(the_facts_of(await anna.asks('A1', rename))).toEqual(['an_activity_has_been_asked'])
      expect(await anna.the_activities_in_progress()).toEqual([
        {
          activity_id: 'A1',
          what: rename,
          asked_at: '2026-11-20T10:00:00+00:00',
          stage: { stage: 'in_progress' },
        },
      ])
      expect(await anna.queued('user/activities/effect/carry_out_an_activity')).toEqual(['A1'])
      // A tap repeated: the same id, nothing changes, one entry still.
      expect(the_facts_of(await anna.asks('A1', rename))).toEqual([
        'an_activity_has_been_asked_again',
      ])
      expect(await anna.queued('user/activities/effect/carry_out_an_activity')).toEqual(['A1'])
    })

    test('a kernel’s activity is carried out on self under its id, and ends done with what the leaf said', async () => {
      const { anna } = await annas_story(factory)
      expect(
        await asks_and_it_ends(anna, 'A1', {
          activity: 'rename_a_bond',
          bond: 'L_b',
          name: 'Bruno B.',
        }),
      ).toEqual({
        ended: 'done',
        said: { event: 'the_bond_is_renamed', payload: { bond_id: 'L_b', name: 'Bruno B.' } },
      })
      expect(await anna.the_activities_in_progress()).toEqual([])
      expect((await anna.my_bonds()).find((bond) => bond.id === 'L_b')?.name).toBe('Bruno B.')
      // `self`'s leaf ran under the operation A1, as the user.
      const renamed = (await anna.recorded()).find((fact) =>
        fact.parts.some((part) => part.path.endsWith('/fact/a_bond_has_been_renamed')),
      )
      expect(renamed?.operation).toEqual({ id: 'A1', scope: 'self/the_user' })
    })

    test('each event of a kernel’s leaf ends as the port’s map says', async () => {
      const { anna } = await annas_story(factory, { anna: 'not_activated' })
      const ends = async (id: string, what: activities_value.what_is_asked) => {
        const how = await asks_and_it_ends(anna, id, what)
        return how.ended === 'done' ||
          how.ended === 'done_already' ||
          how.ended === 'cannot_be_done'
          ? [how.ended, how.said.event]
          : [how.ended]
      }
      const pp = 'ping_pong'
      expect(await ends('A1', { activity: 'remove_a_bond', bond: 'L_b' })).toEqual([
        'done',
        'the_bond_is_removed',
      ])
      expect(await ends('A2', { activity: 'remove_a_bond', bond: 'L_b' })).toEqual([
        'done_already',
        'the_bond_was_removed_already',
      ])
      expect(await ends('A3', { activity: 'rename_a_bond', bond: 'L_x', name: 'X' })).toEqual([
        'cannot_be_done',
        'there_is_no_such_bond',
      ])
      const manifest = the_manifest_shown()
      expect(await ends('A4', { activity: 'activate_an_extension', manifest })).toEqual([
        'done',
        'the_extension_is_active',
      ])
      expect(await ends('A5', { activity: 'activate_an_extension', manifest })).toEqual([
        'done_already',
        'the_extension_was_active_already',
      ])
      const withdraw = {
        activity: 'withdraw_the_offer_from_a_bond',
        extension: pp,
        bond: 'L_c',
      } as const
      expect(await ends('A6', withdraw)).toEqual(['done', 'the_offer_is_withdrawn'])
      expect(await ends('A7', withdraw)).toEqual([
        'done_already',
        'the_offer_was_withdrawn_already',
      ])
      const deactivate = { activity: 'deactivate_an_extension', extension: pp } as const
      expect(await ends('A8', deactivate)).toEqual(['done', 'the_extension_is_deactivated'])
      expect(await ends('A9', deactivate)).toEqual(['done_already', 'the_extension_was_not_active'])
    })

    test('activating with the manifest shown ends done; one shown before an update cannot be done', async () => {
      const first = await annas_story(factory, { anna: 'not_activated' })
      const manifest = the_manifest_shown()
      expect(
        await asks_and_it_ends(first.anna, 'A1', { activity: 'activate_an_extension', manifest }),
      ).toMatchObject({ ended: 'done', said: { event: 'the_extension_is_active' } })
      expect(await first.anna.reads.is_active('ping_pong')).toBe(true)
      // On a phone whose ping pong is 0.2.0, which also sees the bond's name: the manifest of 0.1.0.
      const { anna } = await annas_story(factory, { anna: 'not_activated' })
      const manifest_json = composed_from(ping_pong_manifest).manifest
      await anna.updated_to({
        ...manifest_json,
        version: '0.2.0',
        sees: { known: [...manifest_json.sees.known, 'the_name_of_the_bond'] },
      })
      expect(
        await asks_and_it_ends(anna, 'A2', { activity: 'activate_an_extension', manifest }),
      ).toMatchObject({
        ended: 'cannot_be_done',
        said: { event: 'the_manifest_is_not_the_installed_one' },
      })
      expect(await anna.reads.is_active('ping_pong')).toBe(false)
    })

    test('an action of ping pong on a bond is invoked on self with the bond, and ends with the extension’s answer', async () => {
      const story = await annas_story(factory)
      const { anna, bruno } = story
      await anna.asks('A2', ping('L_b'))
      await the_request_goes(anna)
      await bruno.collects()
      await anna.collects()
      const a2 = await anna.how_it_ended('A2')
      expect(a2).toMatchObject({
        ended: 'the_extension_told_how_it_ended',
        said: { event: 'pong' },
      })
      // The action's leaf from the composed manifest, on ping pong's `self`, with the bond, under A2.
      const invoked = anna.to_the_extension.find(
        (message) => message.message === 'invoke' && message.persona === 'self',
      )
      expect(invoked).toMatchObject({
        use_case: 'usecase/send_a_ping',
        operation: { id: 'A2', scope: 'self/the_user' },
        input: { bond: 'L_b' },
      })
      // Bruno's phone off: after the ping's 60 seconds, no response.
      await anna.asks('A3', ping('L_b'))
      await the_request_goes(anna, 2)
      await to_the_end_of_its_time(story)
      expect(await anna.how_it_ended('A3')).toMatchObject({
        ended: 'the_extension_told_how_it_ended',
        said: { event: 'no_response' },
      })
    })

    test('a leaf’s wait over before its end ends no longer followed', async () => {
      const { anna, at } = await annas_story(factory)
      await anna.asks('A4', ping('L_b'))
      await the_request_goes(anna)
      // Bruno's pong held; the screen's 70 seconds end before the ping closes.
      at('10:01:10')
      expect(await anna.how_it_ended('A4')).toEqual({ ended: 'no_longer_followed' })
      // The ping's own closing comes later, in ping pong's partition, never in A4.
      await anna.runs()
      await until(
        async () => (await anna.facts_of_ping_pong()).includes('a_ping_has_had_no_response'),
        'the ping closed',
      )
      expect(await anna.how_it_ended('A4')).toEqual({ ended: 'no_longer_followed' })
    })

    test('an action of an extension not active, or stopped, ends the extension cannot be reached', async () => {
      const deactivated = await annas_story(factory)
      await deactivated.anna.deactivates()
      const invocations = deactivated.anna.to_the_extension.length
      expect(await asks_and_it_ends(deactivated.anna, 'A5', ping('L_b'))).toEqual({
        ended: 'the_extension_cannot_be_reached',
        because: 'it_is_not_active',
      })
      expect(deactivated.anna.to_the_extension).toHaveLength(invocations)
      // Ping pong fallen twice: tried again after each fall, then stopped.
      const { anna, at } = await annas_story(factory)
      anna.its_partition_will('refused', 'refused')
      await anna.asks('A6', ping('L_b'))
      await until(() => anna.whys().length === 1, 'the first fall')
      await until(() => anna.the_hosted().life().life === 'running', 'loaded again')
      at('10:00:05')
      await until(() => anna.the_hosted().life().life === 'stopped', 'the second fall')
      at('10:00:10')
      expect(await anna.how_it_ended('A6')).toEqual({
        ended: 'the_extension_cannot_be_reached',
        because: 'it_has_stopped',
      })
      expect(anna.whys()).toEqual(['the_extension_has_fallen', 'the_extension_has_fallen'])
    })

    test('a fall while an activity is carried out is tried again under the same id, and meets the recorded fact', async () => {
      const { anna, bruno, at } = await annas_story(factory)
      anna.its_partition_will('refused')
      await anna.asks('A7', ping('L_b'))
      await until(() => anna.whys().length === 1, 'the fall')
      expect(await anna.the_activity('A7')).toMatchObject({ stage: { stage: 'in_progress' } })
      await until(() => anna.the_hosted().life().life === 'running', 'loaded again')
      // Tried again after the executor's pause, under A7.
      at('10:00:05')
      await the_request_goes(anna)
      await bruno.collects()
      await anna.collects()
      expect(await anna.how_it_ended('A7')).toMatchObject({
        ended: 'the_extension_told_how_it_ended',
        said: { event: 'pong' },
      })
      expect(await anna.facts_of_ping_pong()).toEqual([
        'a_ping_has_been_sent',
        'a_pong_has_been_received',
      ])
      expect(await bruno.pongs()).toHaveLength(1)
      // The app closed while A8 is in flight, its ping recorded: opened again, A8 meets it.
      await anna.asks('A8', ping('L_b'))
      await until(
        async () => (await anna.facts_of_ping_pong()).length === 3,
        'the second ping recorded',
      )
      await anna.closes_the_app()
      opens_the_app(anna)
      await the_request_goes(anna, 2)
      await bruno.collects()
      await anna.collects()
      expect(await anna.how_it_ended('A8')).toMatchObject({
        ended: 'the_extension_told_how_it_ended',
        said: { event: 'pong' },
      })
      expect(
        (await anna.facts_of_ping_pong()).filter((fact) => fact === 'a_ping_has_been_sent'),
      ).toHaveLength(2)
      const sends = anna.to_the_extension.filter(
        (message) => message.message === 'invoke' && message.operation?.id === 'A8',
      )
      expect(sends.length).toBeGreaterThanOrEqual(2)
      expect(await bruno.pongs()).toHaveLength(2)
    })

    test('an activity that waits holds no other behind it', async () => {
      const story = await annas_story(factory)
      const { anna } = story
      await anna.asks('A8', ping('L_b'))
      await anna.asks('A9', { activity: 'rename_a_bond', bond: 'L_c', name: 'Carla C.' })
      expect(await anna.how_it_ended('A9')).toMatchObject({ ended: 'done' })
      expect(await anna.the_activity('A8')).toMatchObject({ stage: { stage: 'in_progress' } })
      await the_request_goes(anna)
      await to_the_end_of_its_time(story)
      expect(await anna.how_it_ended('A8')).toMatchObject({
        ended: 'the_extension_told_how_it_ended',
        said: { event: 'no_response' },
      })
    })

    test('a base event of self ends the app cannot do it', async () => {
      const { story, anna } = await annas_story(factory)
      const their_ticket = {
        key: 'not a key',
        introduced_as: 'Dario',
        mailbox: { deposit_address: 'D', relays: [the_relay] },
        secret: 'S',
      }
      const opens = {
        activity: 'open_their_ticket',
        bond: 'L_d',
        their_ticket,
        name: 'Dario',
      } as const
      expect(await asks_and_it_ends(anna, 'A10', opens)).toMatchObject({
        ended: 'the_app_cannot_do_it',
        said: { event: 'invalid_request' },
      })
      // A version of `self` the node does not speak: the same.
      const the_port = the_delivery_of_an_activity({
        clock: story.clock,
        self: (context, request) => anna.personas().self(context, request),
        speaks: zz.semver.parse('9.0.0'),
        relays: [the_relay],
        the_extension: () => undefined,
        the_kernels_letters: {
          held: () => Promise.resolve([]),
          redeliver: () => Promise.resolve('not_held'),
          discard: () => Promise.resolve('not_held'),
        },
      })
      expect(
        await the_port({
          id: zz.entry_id.parse('A11'),
          payload: carry_out_an_activity.parse({
            activity_id: 'A11',
            what: { activity: 'rename_a_bond', bond: 'L_b', name: 'Bruno B.' },
          }),
        }),
      ).toMatchObject({
        outcome: 'delivered',
        returns: {
          activity_id: 'A11',
          how_it_ended: { ended: 'the_app_cannot_do_it', said: { event: 'version_not_supported' } },
        },
      })
    })

    test('an end for an activity not in progress is refused, a held letter of user', async () => {
      const { anna } = await annas_story(factory, { app: 'closed' })
      await anna.asks('A1', { activity: 'rename_a_bond', bond: 'L_b', name: 'Bruno B.' })
      const first = {
        ended: 'done',
        said: { event: 'the_bond_is_renamed', payload: { bond_id: 'L_b', name: 'Bruno B.' } },
      } as const
      expect(the_facts_of(await anna.ends('A1', first))).toEqual(['an_activity_has_ended'])
      // Another end for A1, ended already: refused.
      const refused = await anna.ends('A1', { ended: 'no_longer_followed' })
      expect(refused).toMatchObject([{ outcome: 'rejected' }])
      expect(JSON.stringify(refused)).toContain('the_activity_is_in_progress')
      // The app opens: the executor carries A1 out, its return refused, a held letter of `user`'s.
      opens_the_app(anna)
      await until(async () => (await anna.held_letters()).length === 1, 'the held letter')
      expect(await anna.held_letters()).toEqual([
        {
          whose: { of: 'the_kernel', office: 'user/activities' },
          letter: 'user/activities/effect/carry_out_an_activity/A1',
          what: 'carry_out_an_activity',
          why: { why: 'what_came_back_was_refused' },
        },
      ])
      expect(await anna.the_activity('A1')).toMatchObject({
        stage: { stage: 'ended', how_it_ended: first },
      })
    })

    test('a draft is kept by what it is for, and read back', async () => {
      const { anna } = await annas_story(factory)
      const for_l_b = { for: 'the_name_i_give_a_bond', bond: 'L_b' } as const
      expect(the_facts_of(await anna.keeps_a_draft(for_l_b, 'Bruno'))).toEqual([
        'a_draft_has_been_kept',
      ])
      expect(await anna.a_draft(for_l_b)).toEqual({
        draft_id: 'the_name_i_give_a_bond/L_b',
        for: for_l_b,
        text: 'Bruno',
        kept_at: '2026-11-20T10:00:00+00:00',
      })
      expect(the_facts_of(await anna.keeps_a_draft(for_l_b, 'Bruno'))).toEqual([
        'a_draft_has_been_kept_again',
      ])
      expect(the_facts_of(await anna.keeps_a_draft(for_l_b, 'Bruno B.'))).toEqual([
        'a_draft_has_been_kept',
      ])
      expect((await anna.a_draft(for_l_b))?.text).toBe('Bruno B.')
    })

    test('a draft dropped is no longer read; none kept, nothing changes', async () => {
      const { anna } = await annas_story(factory)
      const for_l_b = { for: 'the_name_i_give_a_bond', bond: 'L_b' } as const
      const for_my_face = { for: 'the_name_of_my_first_face' } as const
      await anna.keeps_a_draft(for_l_b, 'Bruno')
      await anna.keeps_a_draft(for_my_face, 'Anna')
      expect(the_facts_of(await anna.drops_a_draft(for_l_b))).toEqual(['a_draft_has_been_dropped'])
      expect(await anna.a_draft(for_l_b)).toBeUndefined()
      expect(the_facts_of(await anna.drops_a_draft(for_l_b))).toEqual([
        'a_draft_has_been_dropped_again',
      ])
      // The draft of her first face's name is another.
      expect((await anna.a_draft(for_my_face))?.text).toBe('Anna')
    })

    test('no active face before the first, then the one she changed to', async () => {
      const { anna } = await annas_story(factory)
      expect(await anna.the_active_face()).toBeUndefined()
      expect(the_facts_of(await anna.changes_face('F_a'))).toEqual([
        'the_active_face_has_been_changed',
      ])
      expect(await anna.the_active_face()).toEqual({
        choice: 'the_active_face',
        face: 'F_a',
        since: '2026-11-20T10:00:00+00:00',
      })
      expect(the_facts_of(await anna.changes_face('F_a'))).toEqual([
        'the_active_face_has_been_changed_again',
      ])
    })

    test('a held letter of ping pong is told in her words, and sent again', async () => {
      const { anna } = await annas_story(factory)
      await asks_and_it_ends(anna, 'A1', { activity: 'remove_a_bond', bond: 'L_b' })
      // A ping to Bruno, the bond gone: ping pong's delivery cannot be made, a dead letter.
      await anna.asks('A10', ping('L_b'))
      await until(async () => (await anna.held_letters()).length === 1, 'the held letter')
      const [held] = await anna.held_letters()
      expect(held).toMatchObject({
        whose: { of: 'an_extension', extension: 'ping_pong' },
        what: 'ask_for_a_pong',
        why: { why: 'it_could_not_be_delivered' },
      })
      expect(held?.letter).toMatch(/^business\/pings\/effect\/ask_for_a_pong\//)
      const letter = held?.letter ?? ''
      expect(
        await asks_and_it_ends(anna, 'A11', {
          activity: 'send_a_held_letter_again',
          whose: { of: 'an_extension', extension: 'ping_pong' },
          letter,
        }),
      ).toMatchObject({ ended: 'done' })
      expect(anna.to_the_extension).toContainEqual({ message: 'redeliver', letter })
      // Held again (the bond still gone): told again.
      await until(
        () => anna.notices.filter((notice) => notice.notice.message === 'dead_letter').length === 2,
        'held again',
      )
      expect((await anna.held_letters()).map((each) => each.letter)).toEqual([letter])
    })

    test('a held letter put aside is no longer held', async () => {
      const { anna } = await annas_story(factory)
      await asks_and_it_ends(anna, 'A1', { activity: 'remove_a_bond', bond: 'L_b' })
      await anna.asks('A10', ping('L_b'))
      await until(async () => (await anna.held_letters()).length === 1, 'the held letter')
      const letter = (await anna.held_letters())[0]?.letter ?? ''
      const aside = {
        activity: 'put_a_held_letter_aside',
        whose: { of: 'an_extension', extension: 'ping_pong' },
        letter,
        because: 'Bruno is no longer my bond',
      } as const
      expect(await asks_and_it_ends(anna, 'A12', aside)).toMatchObject({ ended: 'done' })
      expect(anna.to_the_extension).toContainEqual({
        message: 'discard',
        letter,
        by: 'the_user',
        reason: 'Bruno is no longer my bond',
      })
      await until(async () => (await anna.held_letters()).length === 0, 'released')
      expect(await asks_and_it_ends(anna, 'A13', aside)).toMatchObject({
        ended: 'done_already',
        said: { event: 'the_letter_is_no_longer_held' },
      })
    })

    test('a silence of her node is told her with its case', async () => {
      const { anna, carla } = await annas_story(factory)
      await asks_and_it_ends(anna, 'A1', {
        activity: 'withdraw_the_offer_from_a_bond',
        extension: 'ping_pong',
        bond: 'L_c',
      })
      await carla.pings('L_a')
      await the_request_goes(carla)
      await anna.collects()
      expect(anna.what_happened()).toContainEqual({
        happened: 'a_request_met_silence',
        extension: 'ping_pong',
        because: 'the_extension_is_not_offered_to_the_bond',
      })
      await anna.deactivates()
      await carla.pings('L_a')
      await the_request_goes(carla, 2)
      await anna.collects()
      expect(anna.what_happened()).toContainEqual({
        happened: 'a_request_met_silence',
        extension: 'ping_pong',
        because: 'the_extension_is_not_active',
      })
    })
  })
}
