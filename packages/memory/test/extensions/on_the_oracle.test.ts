import * as zz from '@q-mino/domains/library'
import manifest_json from '@q-mino/greetings/manifest.json' with { type: 'json' }
import { describe, expect, test } from 'vitest'
import { all, quiet } from '../post/harness.ts'
import { two_nodes, until, type NodeUnderTest } from './harness.ts'

// The checks of step 12 (plan.md, "Checks"), on q-'s oracle with two nodes
// (F7, F8, EXT-2, EXT-4, EXT-6, EXT-7, EXT-12, EXT-15; part 12.4), each a
// test named by what it proves, with greetings, the test extension, in
// place of ping pong (step 14): Anna greets Bruno, Bruno's node greets her
// back. The harness (`harness.ts`) plays the kernel's entry as step 13 will
// write it, with a stand-in of the kernel's node at the top of `known`. The
// README of this folder lists each check with its test, those proven by
// the earlier blocks, and those deferred to their step.

/** Anna's words, and Bruno's greeting back (greetings' `dsl`, its texts). */
const greeted_back = { event: 'greeted_back', payload: { words: 'ciao anche a te' } }

/** Anna's node greets a bond, and its post deposits the request: the greeting. */
const greets = async (asker: NodeUnderTest, bond: string, requests = 1): Promise<string> => {
  const greeting = await asker.greets(bond)
  await until(async () => (await asker.sent()).length >= requests, 'the request sent')
  await asker.post.runs()
  return greeting
}

/** How a greeting stands, as greetings keeps it. */
const closed_with = (outcome: unknown) => ({ progress: { stage: 'closed', outcome } })

describe('1. a request and its response (F7)', () => {
  test('Anna greets Bruno: his node greets her back through the kernel’s entry, the response taken, the return given once; the scope on known holds no key', async () => {
    const { anna, bruno } = await two_nodes()
    const greeting = await greets(anna, 'B-BRUNO')
    await bruno.the_entry()
    await anna.the_entry()
    await until(() => anna.is_closed(greeting), 'the greeting closed')
    expect(anna.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_came_back', words: 'ciao anche a te' }),
    )
    expect(anna.facts_of_greetings()).toEqual([
      'a_bond_has_been_greeted',
      'a_greeting_has_been_closed',
    ])
    expect(bruno.greetings_back()).toMatchObject([
      { bond: 'B-ANNA', their_words: 'ciao', words: 'ciao anche a te' },
    ])
    expect(await anna.post.the_answer_to(anna.the_request_of(greeting))).toEqual([
      { id: anna.the_request_of(greeting), answer: { status: 'answered', event: greeted_back } },
    ])
    expect(bruno.post.carried()).toHaveLength(1)
    const invoked = bruno.to_the_extension.find(
      (message) => message.message === 'invoke' && message.persona === 'known',
    )
    expect(invoked).toMatchObject({
      context: { bond: 'B-ANNA' },
      operation: { id: anna.the_request_of(greeting), scope: 'known/B-ANNA' },
    })
    expect(JSON.stringify(invoked)).not.toContain(anna.post.key)
    expect(anna.traced).toEqual([])
    expect(bruno.traced).toEqual([])
  })

  test('the response lost on its way: the request sent again, Bruno’s duplicate branch, the same response, one greeting back', async () => {
    const { anna, bruno, runs_at } = await two_nodes()
    const greeting = await greets(anna, 'B-BRUNO')
    bruno.post.will('lost')
    await bruno.the_entry()
    await anna.the_entry()
    expect(anna.is_closed(greeting)).toBe(false)
    await runs_at(anna, '10:00:15')
    await bruno.the_entry()
    await anna.the_entry()
    await until(() => anna.is_closed(greeting), 'the greeting closed')
    expect(anna.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_came_back', words: 'ciao anche a te' }),
    )
    expect(bruno.greetings_back()).toHaveLength(1)
    expect(bruno.post.carried().map((deposit) => deposit.fault)).toEqual(['lost', 'none'])
    expect(
      anna.facts_of_greetings().filter((fact) => fact === 'a_greeting_has_been_closed'),
    ).toHaveLength(1)
  })

  test('no response in the asker’s time: no_response; Bruno’s greeting back after it, annotated in Anna’s kernel trace', async () => {
    const { anna, bruno, runs_at } = await two_nodes()
    const greeting = await greets(anna, 'B-BRUNO')
    for (const quarter of ['10:00:15', '10:00:30', '10:00:45', '10:01:00'])
      await runs_at(anna, quarter)
    await until(() => anna.is_closed(greeting), 'the greeting closed')
    expect(anna.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_had_no_response' }),
    )
    // Bruno's phone on at 10:01:30: four copies of the request, one greeting back, one response at the relay.
    await runs_at(bruno, '10:01:30')
    await bruno.the_entry()
    expect(bruno.greetings_back()).toHaveLength(1)
    await anna.the_entry()
    expect(anna.traced).toMatchObject([
      {
        why: 'a_response_not_awaited',
        response: {
          answers: anna.the_request_of(greeting),
          caller: { is: 'a_face', key: bruno.post.key },
        },
        answered: { outcome: 'rejected' },
      },
    ])
    expect(anna.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_had_no_response' }),
    )
  })

  test('a response to no request of Anna’s, or from another face than the one asked: annotated, never taken', async () => {
    const { anna, carla } = await two_nodes()
    const greeting = await greets(anna, 'B-BRUNO')
    const to_anna = { key: anna.post.key, mailbox: anna.post.mailbox }
    await carla.post.deposits_a_response({
      answers: anna.the_request_of(greeting),
      to: to_anna,
      event: greeted_back,
    })
    await carla.post.deposits_a_response({
      answers: anna.the_request_of('a greeting never sent'),
      to: to_anna,
      event: greeted_back,
    })
    await anna.the_entry()
    expect(anna.whys()).toEqual(['a_response_not_awaited', 'a_response_not_awaited'])
    const annotated = (answers: string): string =>
      JSON.stringify(
        anna.traced.find(
          (entry) => entry.why === 'a_response_not_awaited' && entry.response.answers === answers,
        ),
      )
    expect(annotated(anna.the_request_of(greeting))).toContain('the_request_went_to_this_face')
    expect(annotated(anna.the_request_of('a greeting never sent'))).toContain(
      'the_request_is_waiting',
    )
    expect(annotated(anna.the_request_of(greeting))).toContain(carla.post.key)
    expect(anna.is_closed(greeting)).toBe(false)
  })
})

/** The quarters of a greeting's 60 seconds at which Anna's post sends again, and its end (PST-6). */
const the_quarters = ['10:00:15', '10:00:30', '10:00:45', '10:01:00'] as const

/** Anna's post, at each quarter, sends again; Bruno's node, if on, reads its mailbox each time; Anna reads hers at the end. */
const to_the_end_of_its_time = async (
  story: Awaited<ReturnType<typeof two_nodes>>,
  server: NodeUnderTest | 'off',
): Promise<void> => {
  for (const quarter of the_quarters) {
    await story.runs_at(story.anna, quarter)
    if (server !== 'off') await server.the_entry()
  }
  await story.anna.the_entry()
}

/** What Anna invokes on a peer through greetings (EXT-5), at a version and a leaf a story names: a peer whose code is its own. */
const greetings_on_known = (version: string, use_case = 'usecase/greet') => ({
  of: 'an_extension' as const,
  extension: 'greetings',
  persona: 'known' as const,
  use_case,
  version,
})

/** A request sent by a node's post itself, outside greetings (the code is free, F2): its identity. */
const a_request_of_its_own = async (
  asker: NodeUnderTest,
  to: NodeUnderTest,
  id: string,
  invokes: ReturnType<typeof greetings_on_known>,
  input: unknown,
): Promise<string> => {
  const request_id = asker.the_request_of(id, 'a peer’s code of its own')
  await asker.post.send_a_request({
    request_id,
    to: { key: to.post.key, mailbox: to.post.mailbox },
    invokes,
    input,
  })
  await asker.post.runs()
  return request_id
}

describe('2. the silence and the gate (F8, EXT-6)', () => {
  test('greetings not installed, not active, or not offered to Anna’s bond on Bruno’s node: no letter back, the three alike for Anna (no_response), each in Bruno’s kernel trace with its case', async () => {
    const as_seen = async (bruno_s: 'not_installed' | 'installed' | 'withdrawn') => {
      const story = await two_nodes({ bruno: bruno_s === 'withdrawn' ? 'active' : bruno_s })
      const { anna, bruno } = story
      if (bruno_s === 'withdrawn') await bruno.withdraws_the_offer_from('B-ANNA')
      const greeting = await greets(anna, 'B-BRUNO')
      await bruno.the_entry()
      await to_the_end_of_its_time(story, bruno)
      await until(() => anna.is_closed(greeting), 'the greeting closed')
      return {
        anna: {
          greeting: anna.the_greeting(greeting),
          answer: await anna.post.the_answer_to(anna.the_request_of(greeting)),
          collected: (await anna.post.collects()).length,
          traced: anna.traced,
        },
        bruno: { deposits: bruno.post.carried().length, whys: bruno.whys() },
      }
    }
    const not_installed = await as_seen('not_installed')
    const not_active = await as_seen('installed')
    const not_offered = await as_seen('withdrawn')
    expect(not_installed.anna).toMatchObject({
      greeting: closed_with({ outcome: 'the_greeting_had_no_response' }),
      collected: 0,
      traced: [],
    })
    expect(not_active.anna).toEqual(not_installed.anna)
    expect(not_offered.anna).toEqual(not_installed.anna)
    // Four copies of the request (0, 15, 30, 45 seconds), each silent, each traced with its case.
    expect(not_installed.bruno).toEqual({
      deposits: 0,
      whys: Array(4).fill('the_extension_is_not_installed'),
    })
    expect(not_active.bruno).toEqual({
      deposits: 0,
      whys: Array(4).fill('the_extension_is_not_active'),
    })
    expect(not_offered.bruno).toEqual({
      deposits: 0,
      whys: Array(4).fill('the_extension_is_not_offered_to_the_bond'),
    })
  })

  test('version_not_supported only for an extension offered: to a version Bruno does not speak, offered, the gate answers; withdrawn, silence', async () => {
    const { anna, bruno } = await two_nodes()
    const V2 = await a_request_of_its_own(anna, bruno, 'V2', greetings_on_known('2.0.0'), {
      words: 'ciao',
    })
    await bruno.the_entry()
    await anna.the_entry()
    expect(await anna.post.the_answer_to(V2)).toEqual([
      {
        id: V2,
        answer: {
          status: 'answered',
          event: { event: 'version_not_supported', current: '1.0.0', oldest: 1 },
        },
      },
    ])
    await bruno.withdraws_the_offer_from('B-ANNA')
    const V2_again = await a_request_of_its_own(
      anna,
      bruno,
      'V2 again',
      greetings_on_known('2.0.0'),
      {
        words: 'ciao',
      },
    )
    await bruno.the_entry()
    await anna.the_entry()
    expect(await anna.post.the_answer_to(V2_again)).toEqual([
      { id: V2_again, answer: { status: 'waiting' } },
    ])
    expect(bruno.whys()).toEqual(['the_extension_is_not_offered_to_the_bond'])
    expect(bruno.post.carried()).toHaveLength(1)
  })

  test('an undeclared leaf of an extension offered: invalid_request, not_a_leaf, nothing invoked', async () => {
    const { anna, bruno } = await two_nodes()
    const dance = await a_request_of_its_own(
      anna,
      bruno,
      'dance',
      greetings_on_known('1.0.0', 'usecase/dance'),
      {},
    )
    await bruno.the_entry()
    await anna.the_entry()
    expect(await anna.post.the_answer_to(dance)).toMatchObject([
      { answer: { status: 'answered', event: { event: 'invalid_request', reason: 'not_a_leaf' } } },
    ])
    expect(bruno.to_the_extension.filter((message) => message.message === 'invoke')).toEqual([])
  })

  test('a peer’s malformed input: invalid_request before the kernel’s node; a peer with no bond reads not_found only after it, and at the entry meets silence', async () => {
    const { anna, bruno, carla, story } = await two_nodes()
    const malformed = await a_request_of_its_own(
      anna,
      bruno,
      'malformed',
      greetings_on_known('1.0.0'),
      {
        words: '',
      },
    )
    await bruno.the_entry()
    await anna.the_entry()
    expect(await anna.post.the_answer_to(malformed)).toMatchObject([
      {
        answer: {
          status: 'answered',
          event: { event: 'invalid_request', reason: 'input_not_in_schema' },
        },
      },
    ])
    expect(bruno.to_the_extension.filter((message) => message.message === 'invoke')).toEqual([])
    // Carla, no bond of Bruno's, at the leaves below the kernel's node, as its entry would invoke them.
    const as_carla = (operation: string) => ({
      now: zz.in_zone(story.clock.time_zone)(story.clock.now()),
      time_zone: story.clock.time_zone,
      caller: { is: 'a_face' as const, key: carla.post.key },
      version: zz.semver.parse('1.0.0'),
      operation: { id: zz.operation_id.parse(operation), scope: `known/${carla.post.key}` },
    })
    expect(
      await all(bruno.on_known()(as_carla('C1'), { leaf: 'usecase/greet', input: { words: '' } })),
    ).toEqual([{ event: 'invalid_request', reason: 'input_not_in_schema' }])
    expect(
      await all(
        bruno.on_known()(as_carla('C2'), { leaf: 'usecase/greet', input: { words: 'ciao' } }),
      ),
    ).toEqual([{ event: 'not_found' }])
    expect(bruno.tree_traced.slice(-2)).toMatchObject([
      { why: { closed_by: 'the_input' } },
      {
        why: {
          closed_by: 'a_lookup',
          lookups: [{ lookup: 'the_bond_of_the_caller', not_known: 'value' }],
        },
      },
    ])
    // At the entry, Carla's request meets silence: no bond, nothing offered to it, no response (F7, PST-9).
    await a_request_of_its_own(carla, bruno, 'C3', greetings_on_known('1.0.0'), { words: 'ciao' })
    await bruno.the_entry()
    expect(bruno.whys()).toEqual(['the_extension_is_not_offered_to_the_bond'])
    expect(bruno.post.carried()).toHaveLength(1)
    expect(bruno.to_the_extension.filter((message) => message.message === 'invoke')).toEqual([])
  })
})

describe('3. an offer withdrawn, both ways (EXT-7, F8)', () => {
  test('Bruno withdraws greetings’ offer from Anna: her greeting meets silence; his greeting of her is refused by his port of requests, nothing sent, closed as called off', async () => {
    const story = await two_nodes()
    const { anna, bruno } = story
    await bruno.withdraws_the_offer_from('B-ANNA')
    const greeting = await greets(anna, 'B-BRUNO')
    await to_the_end_of_its_time(story, bruno)
    await until(() => anna.is_closed(greeting), 'the greeting closed')
    expect(anna.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_had_no_response' }),
    )
    expect(new Set(bruno.whys())).toEqual(new Set(['the_extension_is_not_offered_to_the_bond']))
    // His own gesture, a meaning (EXT-12; A, 21 Nov 2026): his greeting closed as called off, no dead letter.
    const his = await bruno.greets('B-ANNA')
    await until(() => bruno.is_closed(his), 'his greeting closed')
    expect(bruno.the_greeting(his)).toMatchObject(
      closed_with({ outcome: 'the_greeting_was_called_off' }),
    )
    expect(bruno.dead_letters()).toEqual([])
    expect(await bruno.sent()).toEqual([])
    expect(bruno.post.carried()).toEqual([])
  })

  test('a retry after a withdrawal, or after a deactivation, meets silence: Anna records no_response, Bruno keeps his greeting back', async () => {
    for (const change of ['withdraws', 'deactivates'] as const) {
      const story = await two_nodes()
      const { anna, bruno } = story
      const greeting = await greets(anna, 'B-BRUNO')
      bruno.post.will('lost')
      await bruno.the_entry()
      expect(bruno.greetings_back()).toHaveLength(1)
      if (change === 'withdraws') await bruno.withdraws_the_offer_from('B-ANNA')
      else await bruno.deactivates()
      await to_the_end_of_its_time(story, bruno)
      await until(() => anna.is_closed(greeting), 'the greeting closed')
      expect(anna.the_greeting(greeting)).toMatchObject(
        closed_with({ outcome: 'the_greeting_had_no_response' }),
      )
      expect(bruno.greetings_back()).toMatchObject([{ bond: 'B-ANNA', words: 'ciao anche a te' }])
      expect(new Set(bruno.whys())).toEqual(
        new Set([
          change === 'withdraws'
            ? 'the_extension_is_not_offered_to_the_bond'
            : 'the_extension_is_not_active',
        ]),
      )
      expect(bruno.post.carried().map((deposit) => deposit.fault)).toEqual(['lost'])
    }
  })
})

describe('4. Claude’s fixes at the gate (F7, DOM-14, EXT-2, EXT-12)', () => {
  test('Anna greets Bruno (P1, his phone off) and Carla (P2, her greeting back taken), her phone closed and started again: P1 no_response at its time, P2 delivered again reads the answer the port keeps, one closing each, no dead letter', async () => {
    const { anna, carla, at } = await two_nodes()
    const p1 = await anna.greets('B-BRUNO')
    const p2 = await anna.greets('B-CARLA')
    await until(async () => (await anna.sent()).length === 2, 'both requests sent')
    await anna.post.runs()
    await carla.the_entry()
    await anna.the_entry()
    await until(() => anna.is_closed(p2), 'P2 closed')
    expect(anna.is_closed(p1)).toBe(false)
    await anna.closes()
    at('10:01:00')
    expect(await anna.starts()).toEqual({ loaded: 'running' })
    await anna.post.runs()
    await until(() => anna.is_closed(p1), 'P1 closed')
    expect(anna.the_greeting(p1)).toMatchObject(
      closed_with({ outcome: 'the_greeting_had_no_response' }),
    )
    expect(anna.the_greeting(p2)).toMatchObject(
      closed_with({ outcome: 'the_greeting_came_back', words: 'ciao anche a te' }),
    )
    expect(
      anna.facts_of_greetings().filter((fact) => fact === 'a_greeting_has_been_closed'),
    ).toHaveLength(2)
    expect(anna.dead_letters()).toEqual([])
    // P2 answered twice by the port, once before the close and once after the start, never sent again.
    const answers_of_the_port = anna.to_the_extension.filter(
      (message) => message.message === 'answer' && message.port === 'the_port_of_requests',
    )
    expect(answers_of_the_port).toHaveLength(3)
    expect(await anna.sent()).toHaveLength(2)
  })

  test('the port answers a bond gone: a dead letter, nothing sent', async () => {
    const { anna } = await two_nodes()
    await anna.removes_a_bond('B-BRUNO')
    const greeting = await anna.greets('B-BRUNO')
    await until(() => anna.dead_letters().length === 1, 'the dead letter')
    expect(anna.dead_letters()).toEqual([
      `business/greetings/effect/ask_for_a_greeting_back/${greeting}`,
    ])
    expect(JSON.stringify(anna.notices[0])).toContain('the bond is gone')
    expect(await anna.sent()).toEqual([])
  })

  test('a response that does not parse (Bruno’s code changed): a dead letter with his event, and the effect goes on toward Carla', async () => {
    const { anna, bruno, carla } = await two_nodes()
    bruno.tampers_with_its_responses(() => ({ event: 'pong' }))
    const to_bruno = await anna.greets('B-BRUNO')
    const to_carla = await anna.greets('B-CARLA')
    await until(async () => (await anna.sent()).length === 2, 'both requests sent')
    await anna.post.runs()
    await bruno.the_entry()
    await carla.the_entry()
    await anna.the_entry()
    await until(
      () => anna.is_closed(to_carla) && anna.dead_letters().length === 1,
      'Carla’s greeting closed, Bruno’s a dead letter',
    )
    expect(anna.dead_letters()).toEqual([
      `business/greetings/effect/ask_for_a_greeting_back/${to_bruno}`,
    ])
    expect(JSON.stringify(anna.notices[0])).toContain('pong')
    expect(anna.is_closed(to_bruno)).toBe(false)
    expect(anna.the_greeting(to_carla)).toMatchObject(
      closed_with({ outcome: 'the_greeting_came_back', words: 'ciao anche a te' }),
    )
  })
})

/** Greetings' manifest with an extension point added: an update that asks more (EXT-7). */
const asks_more = {
  ...manifest_json,
  actions: {
    ...manifest_json.actions,
    greet_from_its_page: { on: 'the_extension', invokes: 'usecase/greet_a_bond' },
  },
}

/** That manifest with a leaf on self added: an update that asks no more (EXT-10). */
const asks_no_more = {
  ...asks_more,
  surfaces: {
    ...asks_more.surfaces,
    self: {
      ...asks_more.surfaces.self,
      majors: {
        1: {
          ...asks_more.surfaces.self.majors['1'],
          'usecase/greet_a_bond_again': asks_more.surfaces.self.majors['1']['usecase/greet_a_bond'],
        },
      },
    },
  },
}

describe('5. the life of an extension (EXT-7, EXT-15)', () => {
  test('an update whose manifest asks more: greetings not loaded, its leaf silent, until Bruno accepts it; one that asks no more keeps it active', async () => {
    const story = await two_nodes()
    const { anna, bruno } = story
    expect(await bruno.updated_to(asks_more)).toEqual({ loaded: 'not_active' })
    expect(bruno.the_hosted().life()).toEqual({ life: 'unloaded' })
    const greeting = await greets(anna, 'B-BRUNO')
    await bruno.the_entry()
    expect(bruno.whys()).toEqual(['the_extension_is_not_active'])
    expect(bruno.post.carried()).toEqual([])
    expect(await bruno.activates()).toEqual({ loaded: 'running' })
    await story.runs_at(anna, '10:00:15')
    await bruno.the_entry()
    await anna.the_entry()
    await until(() => anna.is_closed(greeting), 'the greeting closed')
    expect(anna.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_came_back', words: 'ciao anche a te' }),
    )
    expect(await bruno.updated_to(asks_no_more)).toEqual({ loaded: 'running' })
    const again = await greets(anna, 'B-BRUNO', 2)
    await bruno.the_entry()
    await anna.the_entry()
    await until(() => anna.is_closed(again), 'the second greeting closed')
    expect(anna.the_greeting(again)).toMatchObject(
      closed_with({ outcome: 'the_greeting_came_back', words: 'ciao anche a te' }),
    )
  })

  test('deactivated while a greeting waits: not loaded, its consumers stopped; activated again, the delivery meets its request by its identity and reads the answer the port keeps', async () => {
    const { anna, bruno } = await two_nodes()
    const greeting = await greets(anna, 'B-BRUNO')
    await anna.deactivates()
    expect(anna.the_hosted().life()).toEqual({ life: 'unloaded' })
    expect(anna.to_the_extension.filter((message) => message.message === 'stop')).toHaveLength(1)
    expect(await anna.starts()).toEqual({ loaded: 'not_active' })
    await bruno.the_entry()
    await anna.the_entry()
    await quiet()
    expect(await anna.post.the_answer_to(anna.the_request_of(greeting))).toMatchObject([
      { answer: { status: 'answered', event: greeted_back } },
    ])
    expect(anna.is_closed(greeting)).toBe(false)
    expect(await anna.activates()).toEqual({ loaded: 'running' })
    await until(() => anna.is_closed(greeting), 'the greeting closed')
    expect(anna.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_came_back', words: 'ciao anche a te' }),
    )
    expect(await anna.sent()).toHaveLength(1)
  })

  test('greetings falls on Bruno’s node (its partition full): Anna’s request meets silence, his own greeting a technical outcome; the second fall leaves it stopped, and Anna reads no_response', async () => {
    const story = await two_nodes({ brunos_characters: 200 })
    const { anna, bruno } = story
    const greeting = await greets(anna, 'B-BRUNO')
    await bruno.the_entry()
    expect(bruno.whys()).toEqual(['the_extension_has_fallen'])
    await until(() => bruno.the_hosted().life().life === 'running', 'loaded again')
    await expect(bruno.greets('B-ANNA')).rejects.toThrow('greetings: it has fallen')
    expect(bruno.the_hosted().life()).toEqual({ life: 'stopped', why: 'it_fell_twice' })
    await to_the_end_of_its_time(story, bruno)
    await until(() => anna.is_closed(greeting), 'the greeting closed')
    expect(anna.the_greeting(greeting)).toMatchObject(
      closed_with({ outcome: 'the_greeting_had_no_response' }),
    )
    expect(bruno.traced).toMatchObject([
      { why: 'the_extension_has_fallen', fall: 'the_first' },
      { why: 'the_extension_has_fallen', fall: 'the_second' },
    ])
    expect(bruno.post.carried()).toEqual([])
  })
})
