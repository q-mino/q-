import {
  the_port_of_requests,
  type ABondToAskOn,
  type TheKernelsTraced,
} from '@q-mino/adapters-common'
import * as boundary from '@q-mino/boundary'
import { the_identity_of_a_request } from '@q-mino/domains/post/_dsl.ts'
import { describe, expect, test } from 'vitest'
import { a_story, quiet } from '../post/harness.ts'
import { fake_primitives } from '../seals/primitives.ts'

// The kernel's port of requests over the post's oracle (F7, EXT-2, PST-5,
// PST-8; part 12.4): Anna's phone of the post's stories, its port wired
// with its post's ports and log, its machine, the bond with Bruno, and
// `extensions` played (block 4 writes it); Bruno's node played by the
// harness as a peer that serves (step 13 wires the kernel's entry). The
// story of two nodes through the kernel's entry and greetings is
// `on_the_oracle.test.ts`.

const ask_for_a_greeting_back = 'business/greetings/effect/ask_for_a_greeting_back'

/** A request of greetings' delivery (EXT-12), on Anna's bond with Bruno. */
const a_greeting = (id: string, effect: string = ask_for_a_greeting_back): boundary.a_request => ({
  bond: boundary.bond.parse('B-BRUNO'),
  invokes: { persona: 'known', use_case: 'usecase/greet', version: '1.0.0' },
  input: { words: 'ciao' },
  effect,
  id,
  waits: 60,
})

/** Anna's phone with the kernel's port of requests, what `extensions` tells and the bond as each test sets them. */
const annas_port = async () => {
  const story = await a_story(fake_primitives)
  const { anna, bruno } = story
  const traced: TheKernelsTraced[] = []
  const state = { active: true, offered: true, bond: 'kept' as 'kept' | 'gone' }
  const the_bond = (bond: boundary.bond): Promise<ABondToAskOn> =>
    Promise.resolve(
      bond === 'B-BRUNO' && state.bond === 'kept'
        ? {
            bond: 'kept',
            from: { face_id: anna.face_id, key: anna.key },
            to: { key: bruno.key, mailbox: bruno.mailbox },
          }
        : { bond: 'gone' },
    )
  const port = the_port_of_requests({
    clock: story.clock,
    machine: anna.machine_of(anna.face_id),
    post: {
      send_a_request: anna.post.send_a_request,
      the_answer_to_a_request: anna.post.the_answer_to_a_request,
      log: anna.log,
    },
    the_bond,
    extensions: {
      is_active: () => Promise.resolve(state.active),
      is_offered: () => Promise.resolve(state.offered),
    },
    trace: (entry) => {
      traced.push(entry)
    },
  })
  /** The requests Anna's post recorded as sent, by their identity. */
  const sent = async (): Promise<readonly unknown[]> =>
    (await anna.recorded()).flatMap((fact) =>
      fact.parts
        .filter((part) => part.path === 'post/requests/fact/a_request_has_been_sent')
        .map((part): unknown => {
          const sent_request: unknown = Reflect.get(Object(part.payload), 'sent_request')
          return Reflect.get(Object(sent_request), 'id')
        }),
    )
  /** Greetings' identity of a request, as the kernel composes it (F7). */
  const identity_of = (extension: string, effect: string, id: string): string =>
    the_identity_of_a_request(anna.machine_of(anna.face_id))({
      of: 'an_extension',
      extension,
      effect,
      id,
    })
  return { story, anna, bruno, traced, state, port, sent, identity_of }
}

describe('the kernel’s port of requests (F7, EXT-2)', () => {
  test('a call refused sends nothing and keeps nothing: undeclared, not active, not offered to the bond', async () => {
    const { anna, traced, state, port, sent } = await annas_port()
    expect(await port({ name: 'greetings', touches: ['its_storage'] })(a_greeting('G1'))).toEqual({
      answer: 'refused',
      why: 'not_declared',
    })
    expect(traced).toMatchObject([
      {
        why: 'a_call_not_declared',
        extension: 'greetings',
        call: { port: 'the_port_of_requests', request: { id: 'G1' } },
      },
    ])
    const greetings = port({ name: 'greetings', touches: ['the_port_of_requests'] })
    state.active = false
    expect(await greetings(a_greeting('G1'))).toEqual({ answer: 'refused', why: 'not_active' })
    state.active = true
    state.offered = false
    expect(await greetings(a_greeting('G1'))).toEqual({
      answer: 'refused',
      why: 'not_offered_to_the_bond',
    })
    await anna.runs()
    expect(await sent()).toEqual([])
    expect(anna.carried()).toEqual([])
  })

  test('the bond gone: the_bond_is_gone, nothing sent', async () => {
    const { anna, state, port, sent } = await annas_port()
    state.bond = 'gone'
    expect(
      await port({ name: 'greetings', touches: ['the_port_of_requests'] })(a_greeting('G1')),
    ).toEqual({ answer: 'the_bond_is_gone' })
    await anna.runs()
    expect(await sent()).toEqual([])
  })

  test('the identity composed by the kernel and hashed: two effects keyed by one entry, or two extensions, never meet; no response at its time', async () => {
    const { story, anna, port, sent, identity_of } = await annas_port()
    const touches: readonly boundary.port[] = ['the_port_of_requests']
    const answers = Promise.all([
      port({ name: 'greetings', touches })(a_greeting('G1')),
      port({ name: 'greetings', touches })(a_greeting('G1', 'business/greetings/effect/ask_again')),
      port({ name: 'ping_pong', touches })(a_greeting('G1')),
    ])
    await quiet()
    const identities = [
      identity_of('greetings', ask_for_a_greeting_back, 'G1'),
      identity_of('greetings', 'business/greetings/effect/ask_again', 'G1'),
      identity_of('ping_pong', ask_for_a_greeting_back, 'G1'),
    ]
    expect(new Set(identities).size).toBe(3)
    expect(await sent()).toEqual(identities)
    await anna.runs()
    expect(anna.carried()).toHaveLength(3)
    story.at('10:01:00')
    await anna.runs()
    expect(await answers).toEqual([
      { answer: 'no_response' },
      { answer: 'no_response' },
      { answer: 'no_response' },
    ])
  })

  test('responded with the peer’s event; called again, the answer kept, never sent again, the bond removed, the offer withdrawn and the extension deactivated meanwhile; a new request refused', async () => {
    const { story, anna, bruno, state, port, sent, identity_of } = await annas_port()
    const greetings = port({ name: 'greetings', touches: ['the_port_of_requests'] })
    const answer = greetings(a_greeting('G1'))
    await quiet()
    await anna.runs()
    await bruno.serves(story.bonds_of.bruno, {
      event: 'greeted_back',
      payload: { words: 'ciao anche a te' },
    })
    await anna.receives()
    const responded = {
      answer: 'responded',
      event: { event: 'greeted_back', payload: { words: 'ciao anche a te' } },
    }
    expect(await answer).toEqual(responded)
    const carried = anna.carried().length
    state.bond = 'gone'
    expect(await greetings(a_greeting('G1'))).toEqual(responded)
    state.offered = false
    expect(await greetings(a_greeting('G1'))).toEqual(responded)
    expect(await greetings(a_greeting('G2'))).toEqual({
      answer: 'refused',
      why: 'not_offered_to_the_bond',
    })
    state.active = false
    expect(await greetings(a_greeting('G1'))).toEqual(responded)
    expect(await greetings(a_greeting('G2'))).toEqual({ answer: 'refused', why: 'not_active' })
    await anna.runs()
    expect(await sent()).toEqual([identity_of('greetings', ask_for_a_greeting_back, 'G1')])
    expect(anna.carried()).toHaveLength(carried)
  })
})
