import {
  the_kernels_port_of_requests,
  type ABondToAskOn,
  type AKernelsRequest,
} from '@q-mino/adapters-common'
import { the_identity_of_a_request } from '@q-mino/domains/post/_dsl.ts'
import { describe, expect, test } from 'vitest'
import { a_story, quiet } from '../post/harness.ts'
import { fake_primitives } from '../seals/primitives.ts'

// The kernel's own port of requests over the post's oracle (F7, EXT-8,
// PST-2, PST-5, PST-8; part 13.3), the path it shares with the extensions'
// port (`the_port_of_requests.test.ts`): Anna's phone of the post's stories,
// its port wired with its post's ports and log, its machine, and the bond
// with Bruno by the address book's id; Bruno's node played by the harness
// as a peer that serves. No refusal: the kernel's requests are always
// declared, and the kernel is never inactive nor its offers withdrawn (F8,
// EXT-7). The question's delivery on two nodes: `../persona/personas.test.ts`.

const ask_for_the_extensions_in_common =
  'extensions/activations/effect/ask_for_the_extensions_in_common'

/** A question of the office (EXT-8), on Anna's bond with Bruno. */
const a_question = (
  id: string,
  effect: string = ask_for_the_extensions_in_common,
): AKernelsRequest => ({
  effect,
  id,
  bond: 'L_b',
  invokes: { persona: 'known', use_case: 'usecase/the_extensions_in_common', version: '1.0.0' },
  input: { offered: [{ extension: 'greetings', majors: [1] }] },
  waits: 60,
})

/** Anna's phone with the kernel's port of requests, the bond as each test sets it. */
const annas_port = async () => {
  const story = await a_story(fake_primitives)
  const { anna, bruno } = story
  const state = { bond: 'kept' as 'kept' | 'gone' }
  const the_bond = (bond: string): Promise<ABondToAskOn> =>
    Promise.resolve(
      bond === 'L_b' && state.bond === 'kept'
        ? {
            bond: 'kept',
            from: { face_id: anna.face_id, key: anna.key },
            to: { key: bruno.key, mailbox: bruno.mailbox },
          }
        : { bond: 'gone' },
    )
  const port = the_kernels_port_of_requests({
    clock: story.clock,
    machine: anna.machine_of(anna.face_id),
    post: {
      send_a_request: anna.post.send_a_request,
      the_answer_to_a_request: anna.post.the_answer_to_a_request,
      log: anna.log,
    },
    the_bond,
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
  const machine = anna.machine_of(anna.face_id)
  return { story, anna, bruno, state, port, sent, machine }
}

describe('the kernel’s own port of requests (F7, EXT-8)', () => {
  test('the bond gone: the_bond_is_gone, nothing sent', async () => {
    const { anna, state, port, sent } = await annas_port()
    state.bond = 'gone'
    expect(await port(a_question('Q1'))).toEqual({ answer: 'the_bond_is_gone' })
    await anna.runs()
    expect(await sent()).toEqual([])
    expect(anna.carried()).toEqual([])
  })

  test('the identity the kernel’s, never an extension’s of the same effect and id; what it sends invokes the kernel; no response at its time', async () => {
    const { story, anna, bruno, port, sent, machine } = await annas_port()
    const answers = Promise.all([
      port(a_question('Q1')),
      port(a_question('Q1', 'extensions/activations/effect/ask_again')),
    ])
    await quiet()
    const the_kernels = (effect: string, id: string) =>
      the_identity_of_a_request(machine)({ of: 'the_kernel', effect, id })
    const identities = [
      the_kernels(ask_for_the_extensions_in_common, 'Q1'),
      the_kernels('extensions/activations/effect/ask_again', 'Q1'),
    ]
    const an_extension_s = the_identity_of_a_request(machine)({
      of: 'an_extension',
      extension: 'activations',
      effect: ask_for_the_extensions_in_common,
      id: 'Q1',
    })
    expect(new Set([...identities, an_extension_s]).size).toBe(3)
    expect(await sent()).toEqual(identities)
    await anna.runs()
    // Bruno's phone opens what came, in the relay's order: requests of the kernel, from Anna's face.
    const requests = (await bruno.opens_what_came()).flatMap(({ opened }) =>
      opened.outcome === 'opened' && opened.letter.is === 'a_request'
        ? [{ letter: opened.letter, caller: opened.caller }]
        : [],
    )
    expect(requests.map(({ letter }) => letter.identity).toSorted()).toEqual(identities.toSorted())
    for (const request of requests) {
      expect(request).toMatchObject({
        letter: {
          invokes: {
            of: 'the_kernel',
            persona: 'known',
            use_case: 'usecase/the_extensions_in_common',
            version: '1.0.0',
          },
          input: { offered: [{ extension: 'greetings', majors: [1] }] },
        },
        caller: { is: 'a_face', key: anna.key },
      })
    }
    story.at('10:01:00')
    await anna.runs()
    expect(await answers).toEqual([{ answer: 'no_response' }, { answer: 'no_response' }])
  })

  test('responded with the peer’s event; called again, the answer kept, never sent again, the bond removed meanwhile', async () => {
    const { story, anna, bruno, state, port, sent, machine } = await annas_port()
    const snapshot = {
      event: 'snapshot',
      entries: [{ extension: 'greetings', majors: [1] }],
      position: '0',
      total: 1,
    }
    const answer = port(a_question('Q1'))
    await quiet()
    await anna.runs()
    await bruno.serves(story.bonds_of.bruno, snapshot)
    await anna.receives()
    const responded = { answer: 'responded', event: snapshot }
    expect(await answer).toEqual(responded)
    const carried = anna.carried().length
    state.bond = 'gone'
    expect(await port(a_question('Q1'))).toEqual(responded)
    expect(await port(a_question('Q2'))).toEqual({ answer: 'the_bond_is_gone' })
    await anna.runs()
    expect(await sent()).toEqual([
      the_identity_of_a_request(machine)({
        of: 'the_kernel',
        effect: ask_for_the_extensions_in_common,
        id: 'Q1',
      }),
    ])
    expect(anna.carried()).toHaveLength(carried)
  })
})
