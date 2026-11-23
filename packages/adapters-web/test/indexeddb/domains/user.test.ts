import * as zz from '@q-mino/domains/library'
import { majors as activities_majors } from '@q-mino/domains/user/activities/_majors.ts'
import { majors as choices_majors } from '@q-mino/domains/user/choices/_majors.ts'
import { majors as drafts_majors } from '@q-mino/domains/user/drafts/_majors.ts'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, expect, test } from 'vitest'
import {
  ARecordOutOfItsForm,
  the_node_s_storage,
  the_store_of,
  user_ports_on_indexeddb,
} from '../../../src/index.ts'

// The smoke test of `user` on IndexedDB (part 21.2, WEB-8, WEB-9), on
// fake-indexeddb in Node: Anna's three offices in a node's database, each
// its own store, in the node's one order. An activity asked and read back;
// the same operation again, its recorded fact; an end refused, which writes
// nothing; a draft and her face, beside the activities; a record an older
// test release wrote, out of its form, told as such (WEB-8). The stories
// themselves are the oracle's (`memory/test/user`).

const time_zone = zz.time_zone.parse('UTC')
const instant = zz.date_time.parse('2026-11-21T10:00:00.000Z')
const the_scope_of_the_user = 'self/the_user'

/** Every event of a port, in order. */
const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}

/** The writers the tests took, let go after each: the lock is the database's, process-wide. */
const writers: (() => void)[] = []

afterEach(() => {
  for (const let_go of writers.splice(0)) let_go()
})

/** Anna's node, its three offices' stores opened, this tab its writer; her ports over it. */
const annas_node = async () => {
  const opened = await the_node_s_storage({
    indexed_db: new IDBFactory(),
    key_range: IDBKeyRange,
    locks: navigator.locks,
  })(
    {
      name: `user ${crypto.randomUUID()}`,
      paths: ['user/activities', 'user/drafts', 'user/choices'],
      extensions: [],
      characters: 1000,
    },
    'if_no_tab_is',
  )
  if (opened.writer !== 'this_tab') throw new Error('another tab writes the node')
  writers.push(opened.let_go)
  const versions = await zz.versions([activities_majors, drafts_majors, choices_majors])({
    stored: opened.stored_versions,
  })
  const when = (): zz.RootContext => ({ now: instant, time_zone })
  /** The context of a command sent under an operation (DOM-11), its fingerprint over its use case's path and its input. */
  const sent_as =
    (path: string, input: unknown) =>
    (operation: string): zz.CommandRootContext => ({
      ...when(),
      operation: { id: zz.operation_id.parse(operation), scope: the_scope_of_the_user },
      correlation: zz.correlation.parse(`correlation-${operation}`),
      fingerprint: zz.fingerprint_of({ path, input }),
    })
  return { opened, user: user_ports_on_indexeddb(opened)(versions), when, sent_as }
}

const rename = {
  activity_id: 'A1',
  what: { activity: 'rename_a_bond', bond: 'L_b', name: 'Bruno B.' },
} as const

const the_card_in_progress = {
  activity_id: 'A1',
  what: rename.what,
  asked_at: '2026-11-21T10:00:00.000Z',
  stage: { stage: 'in_progress' },
}

test('an activity asked is read back in progress, by its id and among those in progress', async () => {
  const { opened, user, when, sent_as } = await annas_node()
  const asked = await all(
    user.ask_for_an_activity(
      sent_as('user/activities/usecase/ask_for_an_activity', rename)('op-1'),
      rename,
    ),
  )
  expect(asked).toMatchObject([
    { outcome: 'applied', branch: 'the_activity_is_new_so_it_is_asked', position: '1' },
  ])
  expect(await all(user.an_activity(when(), { activity_id: 'A1' }))).toEqual([
    { event: 'snapshot', entries: [the_card_in_progress], position: '1', total: 1 },
  ])
  expect(await all(user.the_activities_in_progress(when(), {}))).toMatchObject([
    { event: 'snapshot', entries: [the_card_in_progress] },
  ])
  expect(String(await opened.position())).toBe('1')
})

test('the same operation again gives back its recorded fact, at its position; a new tap changes nothing', async () => {
  const { opened, user, when, sent_as } = await annas_node()
  const ask = (operation: string) =>
    all(
      user.ask_for_an_activity(
        sent_as('user/activities/usecase/ask_for_an_activity', rename)(operation),
        rename,
      ),
    )
  const first = await ask('op-1')
  expect(await ask('op-1')).toEqual(first)
  expect(String(await opened.position())).toBe('1')
  expect(await ask('op-2')).toMatchObject([
    {
      outcome: 'applied',
      branch: 'the_activity_was_asked_already_so_nothing_changes',
      position: '2',
    },
  ])
  expect(await all(user.the_activities_in_progress(when(), {}))).toMatchObject([
    { event: 'snapshot', entries: [the_card_in_progress], position: '2' },
  ])
})

test('an end refused writes no fact; an end of one in progress ends it', async () => {
  const { opened, user, when, sent_as } = await annas_node()
  await all(
    user.ask_for_an_activity(
      sent_as('user/activities/usecase/ask_for_an_activity', rename)('op-1'),
      rename,
    ),
  )
  const how_it_ended = { ended: 'no_longer_followed' } as const
  const end = (activity_id: string, operation: string) => {
    const input = { activity_id, how_it_ended }
    return all(
      user.end_an_activity(
        sent_as('user/activities/usecase/end_an_activity', input)(operation),
        input,
      ),
    )
  }
  expect(await end('A9', 'op-2')).toMatchObject([{ outcome: 'rejected' }])
  expect(String(await opened.position())).toBe('1')
  expect(await end('A1', 'op-3')).toMatchObject([
    { outcome: 'applied', branch: 'the_activity_is_in_progress_so_it_ends', position: '2' },
  ])
  expect(await all(user.an_activity(when(), { activity_id: 'A1' }))).toMatchObject([
    {
      event: 'snapshot',
      entries: [
        {
          activity_id: 'A1',
          stage: { stage: 'ended', how_it_ended, ended_at: '2026-11-21T10:00:00.000Z' },
        },
      ],
    },
  ])
  expect(await all(user.the_activities_in_progress(when(), {}))).toMatchObject([
    { event: 'snapshot', entries: [], total: 0 },
  ])
  expect(await end('A1', 'op-4')).toMatchObject([{ outcome: 'rejected' }])
  expect(String(await opened.position())).toBe('2')
})

test('a draft kept and dropped, her face changed: each office its store, one order', async () => {
  const { opened, user, when, sent_as } = await annas_node()
  const purpose = { for: 'the_name_i_give_a_bond', bond: 'L_b' } as const
  const keep = { for: purpose, text: 'Bruno' }
  expect(
    await all(user.keep_a_draft(sent_as('user/drafts/usecase/keep_a_draft', keep)('op-1'), keep)),
  ).toMatchObject([{ outcome: 'applied', position: '1' }])
  const face = { face: 'F_a' }
  const change = (operation: string) =>
    all(user.change_face(sent_as('user/choices/usecase/change_face', face)(operation), face))
  expect(await change('op-2')).toMatchObject([
    { outcome: 'applied', branch: 'another_face_so_it_is_changed', position: '2' },
  ])
  expect(await change('op-3')).toMatchObject([
    { outcome: 'applied', branch: 'the_same_face_so_nothing_changes', position: '3' },
  ])
  expect(await all(user.a_draft(when(), { for: purpose }))).toMatchObject([
    {
      event: 'snapshot',
      entries: [{ draft_id: 'the_name_i_give_a_bond/L_b', for: purpose, text: 'Bruno' }],
    },
  ])
  expect(await all(user.the_active_face(when(), {}))).toMatchObject([
    {
      event: 'snapshot',
      entries: [{ choice: 'the_active_face', face: 'F_a', since: '2026-11-21T10:00:00.000Z' }],
    },
  ])
  const drop = { for: purpose }
  const dropped = (operation: string) =>
    all(user.drop_a_draft(sent_as('user/drafts/usecase/drop_a_draft', drop)(operation), drop))
  expect(await dropped('op-4')).toMatchObject([
    { outcome: 'applied', branch: 'a_draft_is_kept_so_it_is_dropped', position: '4' },
  ])
  expect(await dropped('op-5')).toMatchObject([
    { outcome: 'applied', branch: 'no_draft_is_kept_so_nothing_changes', position: '5' },
  ])
  expect(await all(user.a_draft(when(), { for: purpose }))).toMatchObject([
    { event: 'snapshot', entries: [], total: 0 },
  ])
  expect(String(await opened.position())).toBe('5')
})

test('her face as an older test release kept it, its instant with an offset, is a record out of its form (WEB-8)', async () => {
  const { opened, user, when } = await annas_node()
  // The record as the build of 22 Nov 2026 wrote it: `date_time` then took an offset, now only `Z`.
  const store = the_store_of('user/choices')
  const transaction = opened.database.transaction(store, 'readwrite')
  transaction
    .objectStore(store)
    .put({ choice: 'the_active_face', face: 'F_a', since: '2026-11-22T10:00:00.000+01:00' }, [
      'state',
      'active_face',
    ])
  await new Promise<void>((resolve) => {
    transaction.oncomplete = () => {
      resolve()
    }
  })
  await expect(all(user.the_active_face(when(), {}))).rejects.toBeInstanceOf(ARecordOutOfItsForm)
})
