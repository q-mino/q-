import { describe, expect, test } from 'vitest'
import * as zz from '@q-mino/domains/library'
import {
  a_letter_in_an_envelope,
  content_of,
  json_of,
  the_content_a_letter_signs,
  the_id_of_an_anonymous_letter,
  the_identity_of_a_request,
  the_identity_of_the_response_to,
  the_letter_in_an_envelope,
} from '@q-mino/domains/post/_dsl.ts'
import * as post_value from '@q-mino/domains/post/_value.ts'
import { bytes_of, sealed_for, type Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'
import { bytes_all } from '../seals/primitives.ts'
import {
  a_face,
  a_ping,
  a_story,
  ask_for_a_pong,
  last_of,
  the_relay,
  type Face,
  type PhoneUnderTest,
} from './harness.ts'

// The post's stories (`packages/domains/src/post/README.md`, § Stories to
// prove; PST-1..PST-13, F2..F5, F7, PER-2, PER-4, DOM-11, DOM-13..DOM-15,
// TST-4), one test each, named as the README names it: a suite
// parametrized by the primitives port (TST-1), the fake's and libsodium's
// (`post.test.ts`). Stories 1–6 run on the post's `dsl`, a face known by
// its private key; stories 7–16 on q-'s oracle, Anna's phone, Bruno's and
// Carla's over one relay, the port of requests and the kernel's entry played
// by the harness as steps 12.4 and 13 will wire them.
//
// A, B, C: the faces of Anna, Bruno and Carla; DA, DB, DC their mailboxes'
// deposit addresses on the relay; P1, P2 requests of Anna's ping pong
// (`ask_for_a_pong`, entries P1 and P2), 60 seconds each.

const DA = 'hash-of-anna-R'
const DB = 'hash-of-bruno-R'
const DC = 'hash-of-carla-R'

/** A key that takes no seal (SEA-5): 32 zero bytes, a point of small order. */
const no_key = 'A'.repeat(43)

/** Friday 20 November 2026, by the phones' clock, as a command's context tells it. */
const told = (time_of_day: string) => `2026-11-20T${time_of_day}+00:00`

/** The same instant, as the requests' times are computed (`dsl.the_end_of_a_time`). */
const computed = (time_of_day: string) => `2026-11-20T${time_of_day}.000Z`

/** The faces of the protocol's stories, by their private keys. */
const the_faces = (primitives: Primitives) => ({
  A: a_face(primitives, bytes_all(1)),
  B: a_face(primitives, bytes_all(2)),
  C: a_face(primitives, bytes_all(3)),
})

/** Whose Anna's request P1 is (F7): her ping pong's `ask_for_a_pong`, entry P1. */
const whose_P1: post_value.whose_request = {
  of: 'an_extension',
  extension: 'ping_pong',
  effect: ask_for_a_pong,
  id: 'P1',
}

/** Anna's request P1 to Bruno's mailbox, at 10:00:00, its ping (PST-1). */
const a_request_of = (from: Face, identity: string, to = DB): post_value.request => ({
  is: 'a_request',
  schema: 1,
  identity,
  from: from.key,
  to,
  declared_at: zz.date_time.parse(told('10:00:00')),
  invokes: a_ping,
  input: { ping: 1 },
})

/** An envelope of the protocol: a signed letter (or what claims to be one) sealed for a key, told as the relay keeps it. */
const an_envelope_of = (primitives: Primitives, key: string, signed: unknown): string => {
  const sealing = sealed_for(primitives)(key, content_of(signed))
  if (sealing.outcome !== 'sealed') throw new Error('the story seals for a key that takes no seal')
  return content_of({ format: 1, sealed: sealing.sealed_content })
}

/** The signed letter in an envelope, as the face it is sealed for takes it out. */
const the_signed_letter_in = async (face: Face, envelope: string): Promise<unknown> => {
  const parsed = post_value.envelope.parse(json_of(envelope)?.json)
  const opening = await face.machine.open(parsed.sealed)
  if (opening.outcome !== 'opened') throw new Error('the face does not open the envelope')
  return json_of(opening.content)?.json
}

/** A letter in an envelope, sealed: its text. */
const sealed_text = async (
  face: Face,
  letter: post_value.letter,
  their_key: string,
): Promise<string> => {
  const sealed = await a_letter_in_an_envelope(face.machine)(letter, their_key)
  if (sealed.outcome !== 'sealed') throw new Error('the letter was not sealed')
  return sealed.envelope
}

/** The facts' names, in order (the last segment of each part's path). */
const names_of = (facts: readonly zz.StoredEnvelope[]) =>
  facts.flatMap((fact) => fact.parts.map((part) => part.path.split('/').at(-1) ?? ''))

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

/** Anna's phone sends a request of her ping pong to a phone's face and mailbox: the port's call (12.4). */
const asks = (
  anna: PhoneUnderTest,
  to: PhoneUnderTest,
  entry: string,
  more: { readonly input?: unknown; readonly key?: string; readonly effect?: string } = {},
) =>
  anna.send_a_request({
    request_id: anna.the_request(entry, more.effect),
    to: { key: more.key ?? to.key, mailbox: to.mailbox },
    ...(more.input === undefined ? {} : { input: more.input }),
  })

/** A phone runs at an instant of Friday's: the clock moved, its executors run until it is quiet. */
const runs_at = async (
  story: Awaited<ReturnType<typeof a_story>>,
  phone: PhoneUnderTest,
  time_of_day: string,
) => {
  story.at(time_of_day)
  await phone.runs()
}

/** The post's entries queued by a phone, as the executor reads them: effect, key, not before. */
const queued_of = (phone: PhoneUnderTest) =>
  phone
    .queued()
    .filter((entry) => entry.effect.startsWith('post/'))
    .map((entry) => ({
      effect: entry.effect.split('/').at(-1),
      id: entry.id,
      not_before: entry.not_before,
    }))

export const stories_of_the_post = (name: string, primitives: Primitives): void => {
  describe(`the post, ${name}`, () => {
    describe('1. a letter goes in an envelope and comes out the same', () => {
      test('a letter sealed for a face is opened by it with its sender as Caller', async () => {
        const { A, B } = the_faces(primitives)
        const P1 = the_identity_of_a_request(A.machine)(whose_P1)
        const letter = a_request_of(A, P1)
        const envelope = await sealed_text(A, letter, B.key)
        const told_to_the_relay = post_value.envelope.parse(json_of(envelope)?.json)
        expect(told_to_the_relay.format).toBe(1)
        expect(told_to_the_relay.sealed).toMatch(/^[A-Za-z0-9_-]+$/)
        expect(await the_letter_in_an_envelope(B.machine)(DB, envelope)).toEqual({
          outcome: 'opened',
          letter,
          caller: { is: 'a_face', key: A.key },
        })
        // The signature is A's over `q-letter/` then the letter's canonical JSON, D within it.
        const signed = post_value.signed_letter.parse(await the_signed_letter_in(B, envelope))
        const content = the_content_a_letter_signs(letter)
        expect(new TextDecoder().decode(bytes_of(content))).toBe(
          `q-letter/${zz.canonical_json(letter)}`,
        )
        expect(signed.signature).toBe(await A.machine.sign(content))
      })
    })

    describe('2. a letter re-addressed fails', () => {
      test('a letter re-addressed to another mailbox goes no further', async () => {
        const { A, B, C } = the_faces(primitives)
        const letter = a_request_of(A, the_identity_of_a_request(A.machine)(whose_P1))
        const envelope = await sealed_text(A, letter, B.key)
        // Bruno takes Anna's signed letter out and seals it again for Carla, at her D.
        const for_carla = an_envelope_of(primitives, C.key, await the_signed_letter_in(B, envelope))
        expect(await the_letter_in_an_envelope(C.machine)(DC, for_carla)).toEqual({
          outcome: 're_addressed',
          letter,
          signed_by: A.key,
        })
        expect(await the_letter_in_an_envelope(B.machine)(DB, envelope)).toMatchObject({
          outcome: 'opened',
          caller: { is: 'a_face', key: A.key },
        })
      })
    })

    describe('3. a signature removed or broken is anonymous', () => {
      test('a letter with no signature or a broken one is anonymous', async () => {
        const { A, B, C } = the_faces(primitives)
        const letter = a_request_of(A, the_identity_of_a_request(A.machine)(whose_P1))
        const signature = await A.machine.sign(the_content_a_letter_signs(letter))
        const opened = async (signed: unknown) => {
          const envelope = an_envelope_of(primitives, B.key, signed)
          return {
            envelope,
            opened: await the_letter_in_an_envelope(B.machine)(DB, envelope),
          }
        }
        // Removed: anonymous, with no signature; its id the hash of its envelope (PER-4).
        const removed = await opened({ letter })
        expect(removed.opened).toEqual({
          outcome: 'opened',
          letter,
          caller: {
            is: 'anonymous',
            id: the_id_of_an_anonymous_letter(B.machine)(removed.envelope),
            annotation: { signature: 'none' },
          },
        })
        // Another face's signature, or the letter changed after signing: it does not hold (PER-2).
        const another_face = {
          letter,
          signature: await C.machine.sign(the_content_a_letter_signs(letter)),
        }
        const another_input = { letter: { ...letter, input: { ping: 2 } }, signature }
        const another_mailbox = { letter: { ...letter, to: DC }, signature }
        for (const signed of [another_face, another_input, another_mailbox]) {
          const broken = await opened(signed)
          expect(broken.opened).toEqual({
            outcome: 'opened',
            letter: signed.letter,
            caller: {
              is: 'anonymous',
              id: the_id_of_an_anonymous_letter(B.machine)(broken.envelope),
              annotation: { signature: 'does_not_hold', claimed_face: A.key },
            },
          })
        }
      })
    })

    describe('4. the envelope hash is stable', () => {
      test('the same envelope has the same id, another envelope another', async () => {
        const { A, B, C } = the_faces(primitives)
        const letter = a_request_of(A, the_identity_of_a_request(A.machine)(whose_P1))
        const id = the_id_of_an_anonymous_letter(B.machine)
        const envelope = await sealed_text(A, letter, B.key)
        expect(id(envelope)).toBe(id(envelope))
        expect(id(envelope)).toHaveLength(43)
        // The same letter in another envelope, a new operation (PER-4): sealed
        // for another face; sealed again for Bruno, another id exactly when the
        // sealed box is other bytes (libsodium's draws a new key, the fake's does not).
        expect(id(await sealed_text(A, letter, C.key))).not.toBe(id(envelope))
        const again = await sealed_text(A, letter, B.key)
        expect(id(again) === id(envelope)).toBe(again === envelope)
      })
    })

    describe('5. nothing comes out of what is no letter', () => {
      test('what is no envelope, not sealed for the face or no letter is told why', async () => {
        const { A, B } = the_faces(primitives)
        const letter = a_request_of(A, the_identity_of_a_request(A.machine)(whose_P1))
        const signature = await A.machine.sign(the_content_a_letter_signs(letter))
        const opens = the_letter_in_an_envelope(B.machine)
        const envelope = await sealed_text(A, letter, B.key)
        const sealed = post_value.envelope.parse(json_of(envelope)?.json).sealed
        for (const text of [
          'not base64url!',
          'AAAA',
          content_of({ format: 2, sealed }),
          content_of({ format: 1 }),
        ]) {
          expect(await opens(DB, text)).toEqual({ outcome: 'not_an_envelope' })
        }
        // Sealed for Anna, opened by Bruno; its sealed box broken in the middle.
        expect(await opens(DB, await sealed_text(B, letter, A.key))).toEqual({
          outcome: 'not_opened',
        })
        const middle = Math.floor(sealed.length / 2)
        const broken = `${sealed.slice(0, middle)}${sealed[middle] === 'A' ? 'B' : 'A'}${sealed.slice(middle + 1)}`
        expect(await opens(DB, content_of({ format: 1, sealed: broken }))).toEqual({
          outcome: 'not_opened',
        })
        // Sealed contents that are no signed letter of schema 1.
        const with_no_invocation = Object.fromEntries(
          Object.entries(letter).filter(([field]) => field !== 'invokes'),
        )
        for (const signed of [
          { letter: { ...letter, schema: 2 }, signature },
          { letter: { ...letter, more: 1 }, signature },
          { letter: with_no_invocation, signature },
          { letter, signature, more: 1 },
          'a letter',
        ]) {
          expect(await opens(DB, an_envelope_of(primitives, B.key, signed))).toEqual({
            outcome: 'not_a_letter',
          })
        }
        // A key that takes no seal (SEA-5).
        expect(await a_letter_in_an_envelope(A.machine)(letter, no_key)).toEqual({
          outcome: 'not_sealed',
        })
      })
    })

    describe('6. two effects keyed by one value are two requests', () => {
      test('the identity of a request is whose it is', () => {
        const { A } = the_faces(primitives)
        const identity = the_identity_of_a_request(A.machine)
        const x = { of: 'an_extension', extension: 'ping_pong', effect: 'E1', id: 'x' } as const
        const identities = [
          identity(x),
          identity({ ...x, effect: 'E2' }),
          identity({ ...x, extension: 'another' }),
          identity({ of: 'the_kernel', effect: 'E1', id: 'x' }),
        ]
        expect(new Set(identities).size).toBe(4)
        for (const each of identities) expect(post_value.identity.parse(each)).toHaveLength(43)
        expect(identity({ ...x })).toBe(identities[0])
        const response = the_identity_of_the_response_to(A.machine)(identities[0] ?? '')
        expect(identities).not.toContain(response)
        expect(response).not.toBe(the_identity_of_the_response_to(A.machine)(identities[1] ?? ''))
      })
    })

    describe('7. a request is sent', () => {
      test('a request is sent and waits within its time', async () => {
        const story = await a_story(primitives)
        const { anna, bruno } = story
        const P1 = anna.the_request('P1')
        expect(last_of(await asks(anna, bruno, 'P1'))).toMatchObject({
          outcome: 'applied',
          fact: {
            parts: [
              {
                path: 'post/requests/fact/a_request_has_been_sent',
                payload: {
                  sent_request: {
                    id: P1,
                    status: 'waiting',
                    until: computed('10:01:00'),
                    deposit: {
                      letter: {
                        is: 'a_request',
                        schema: 1,
                        identity: P1,
                        from: anna.key,
                        to: DB,
                        declared_at: told('10:00:00'),
                        invokes: a_ping,
                        input: {},
                      },
                      face_id: 'F_a',
                      their_key: bruno.key,
                      relays: [the_relay],
                    },
                  },
                },
              },
            ],
          },
        })
        expect(queued_of(anna)).toEqual([
          { effect: 'deposit_a_letter', id: `${P1}/0`, not_before: undefined },
          { effect: 'wait_to_send_again', id: `${P1}/1`, not_before: computed('10:00:15') },
          { effect: 'wait_for_the_response', id: P1, not_before: computed('10:01:00') },
        ])
        await anna.runs()
        const came = await bruno.opens_what_came()
        expect(came).toHaveLength(1)
        expect(came[0]?.opened).toMatchObject({
          outcome: 'opened',
          letter: { identity: P1, to: DB },
          caller: { is: 'a_face', key: anna.key },
        })
        expect(await anna.the_answer_to(P1)).toEqual([{ id: P1, answer: { status: 'waiting' } }])
        // A letter carries at most 32 KiB of JSON (PST-12): more is no request;
        // as much is deposited, its envelope within what the relay keeps.
        expect(await asks(anna, bruno, 'P9', { input: 'x'.repeat(32_767) })).toEqual([
          { outcome: 'invalid_request' },
        ])
        await asks(anna, bruno, 'P8', { input: 'x'.repeat(32_766) })
        await anna.runs()
        expect(anna.carried().map((each) => each.answered)).toEqual([
          { outcome: 'kept' },
          { outcome: 'kept' },
        ])
        expect(anna.held()).toEqual([])
      })
    })

    describe('8. a request is sent again while it waits', () => {
      test('a request that waits is sent again at each quarter, the same letter', async () => {
        const story = await a_story(primitives)
        const { anna, bruno } = story
        const P1 = anna.the_request('P1')
        await asks(anna, bruno, 'P1')
        await anna.runs()
        for (const quarter of ['10:00:15', '10:00:30', '10:00:45', '10:01:00'])
          await runs_at(story, anna, quarter)
        const facts = await anna.recorded()
        const of_P1 = facts.filter((fact) =>
          fact.parts.some((part) => part.path.startsWith('post/')),
        )
        expect(names_of(of_P1).slice(0, 4)).toEqual([
          'a_request_has_been_sent',
          'a_request_has_been_sent_again',
          'a_request_has_been_sent_again',
          'a_request_has_been_sent_again',
        ])
        expect(names_of(of_P1).slice(4).toSorted()).toEqual([
          'a_request_had_no_response',
          'the_time_to_send_again_came_too_late',
        ])
        expect(of_P1.slice(1, 4).map((fact) => fact.parts[0]?.payload)).toEqual(
          [1, 2, 3].map((attempt) => ({ request_id: P1, attempt })),
        )
        // Four copies of one letter at Bruno's mailbox, each deposited under its own operation.
        const came = await bruno.opens_what_came()
        expect(came).toHaveLength(4)
        const letters = came.map((each) =>
          each.opened.outcome === 'opened' ? each.opened.letter : undefined,
        )
        for (const letter of letters) expect(letter).toEqual(letters[0])
        expect(letters[0]?.identity).toBe(P1)
        expect(new Set(anna.carried().map((each) => each.operation)).size).toBe(4)
        expect(await anna.the_answer_to(P1)).toEqual([
          { id: P1, answer: { status: 'no_response' } },
        ])

        // Answered at 10:00:20: the sending of 10:00:30 is too late, nothing deposited.
        const answered = await a_story(primitives)
        await asks(answered.anna, answered.bruno, 'P1')
        await answered.anna.runs()
        await runs_at(answered, answered.anna, '10:00:15')
        answered.at('10:00:20')
        await answered.bruno.serves(answered.bonds_of.bruno)
        await answered.anna.receives()
        await runs_at(answered, answered.anna, '10:00:30')
        expect(names_of(await answered.anna.recorded()).slice(-3)).toEqual([
          'a_request_has_been_sent_again',
          'a_request_has_been_answered',
          'the_time_to_send_again_came_too_late',
        ])
        expect(answered.anna.carried()).toHaveLength(2)
      })
    })

    describe('9. a response answers its request', () => {
      test('a response from the face the request went to answers it once', async () => {
        const story = await a_story(primitives)
        const { anna, bruno } = story
        const P1 = anna.the_request('P1')
        await asks(anna, bruno, 'P1')
        await anna.runs()
        story.at('10:00:05')
        const pong = { request_id: P1, from: bruno.key, event: { pong: true } }
        const taken = last_of(await anna.take_a_response(pong))
        expect(taken).toMatchObject({
          outcome: 'applied',
          fact: {
            parts: [
              {
                path: 'post/requests/fact/a_request_has_been_answered',
                payload: { request_id: P1, event: { pong: true } },
              },
            ],
          },
        })
        expect(await anna.the_answer_to(P1)).toEqual([
          { id: P1, answer: { status: 'answered', event: { pong: true } } },
        ])
        // The same response again, for a copy of the request: the recorded fact (DOM-11).
        const facts = (await anna.recorded()).length
        expect(last_of(await anna.take_a_response(pong))).toEqual(taken)
        expect(await anna.recorded()).toHaveLength(facts)
        // Another event under the same response's identity.
        expect(await anna.take_a_response({ ...pong, event: { pong: false } })).toEqual([
          { outcome: 'identity_already_used' },
        ])
        await runs_at(story, anna, '10:01:00')
        expect(names_of(await anna.recorded())).toContain('the_response_came_before_the_time')
        expect(names_of(await anna.recorded())).not.toContain('a_request_had_no_response')
        expect(await anna.the_answer_to(P1)).toEqual([
          { id: P1, answer: { status: 'answered', event: { pong: true } } },
        ])
      })
    })

    describe('10. a response from another face, or to no request, is refused', () => {
      test('a response not awaited is refused', async () => {
        const story = await a_story(primitives)
        const { anna, bruno, carla } = story
        const P1 = anna.the_request('P1')
        await asks(anna, bruno, 'P1')
        await anna.runs()
        const facts = (await anna.recorded()).length
        const pong = { from: bruno.key, event: { pong: true } }
        expect(
          failed(last_of(await anna.take_a_response({ ...pong, request_id: P1, from: carla.key }))),
        ).toEqual(['the_request_went_to_this_face'])
        expect(
          failed(
            last_of(
              await anna.take_a_response({ ...pong, request_id: anna.the_request('never sent') }),
            ),
          ),
        ).toContain('the_request_is_waiting')
        await runs_at(story, anna, '10:01:00')
        expect(failed(last_of(await anna.take_a_response({ ...pong, request_id: P1 })))).toEqual([
          'the_request_is_waiting',
        ])
        expect(names_of(await anna.recorded())).not.toContain('a_request_has_been_answered')
        expect((await anna.recorded()).length).toBeGreaterThan(facts)
      })
    })

    describe('11. no response in its time', () => {
      test('a request with no response in its time closes with no response', async () => {
        const story = await a_story(primitives)
        const { anna, bruno } = story
        const P1 = anna.the_request('P1')
        await asks(anna, bruno, 'P1')
        await anna.runs()
        // Bruno's phone is off: nobody collects at DB.
        for (const quarter of ['10:00:15', '10:00:30', '10:00:45', '10:01:00'])
          await runs_at(story, anna, quarter)
        expect(names_of(await anna.recorded())).toContain('a_request_had_no_response')
        expect(await anna.the_answer_to(P1)).toEqual([
          { id: P1, answer: { status: 'no_response' } },
        ])
        // His pong, coming at 10:01:30, is refused: the request waits no more.
        story.at('10:01:30')
        await bruno.serves(story.bonds_of.bruno)
        const taken = await anna.receives()
        expect(taken).toHaveLength(1)
        expect(failed(last_of(taken[0] ?? []) as Outcome)).toEqual(['the_request_is_waiting'])
        expect(await anna.the_answer_to(P1)).toEqual([
          { id: P1, answer: { status: 'no_response' } },
        ])
      })
    })

    describe('12. the answer is kept', () => {
      test('a request called again reads the answer kept', async () => {
        const story = await a_story(primitives)
        const { anna, bruno } = story
        const P1 = anna.the_request('P1')
        const first = last_of(await asks(anna, bruno, 'P1'))
        await anna.runs()
        // After a fall, the port's call again while it waits: the recorded fact, its time the first's.
        story.at('10:00:10')
        const queued = anna.queued().length
        expect(last_of(await asks(anna, bruno, 'P1'))).toEqual(first)
        expect(anna.queued()).toHaveLength(queued)
        await anna.runs()
        expect(anna.carried()).toHaveLength(1)
        // Answered, then called again.
        story.at('10:00:12')
        await anna.take_a_response({ request_id: P1, from: bruno.key, event: { pong: true } })
        expect(last_of(await asks(anna, bruno, 'P1'))).toEqual(first)
        expect(await anna.the_answer_to(P1)).toEqual([
          { id: P1, answer: { status: 'answered', event: { pong: true } } },
        ])
        // Two calls are two requests: P2, and an entry P1 of another effect (F7).
        const P2 = anna.the_request('P2')
        const of_another_effect = anna.the_request(
          'P1',
          'ping_pong/business/pings/effect/ask_again',
        )
        expect(new Set([P1, P2, of_another_effect]).size).toBe(3)
        const second = last_of(await asks(anna, bruno, 'P2'))
        expect(second).toMatchObject({ outcome: 'applied' })
        expect(
          last_of(
            await asks(anna, bruno, 'P1', {
              effect: 'ping_pong/business/pings/effect/ask_again',
            }),
          ),
        ).toMatchObject({ outcome: 'applied' })
        // With no response, called again: the recorded fact; the answer as it stands.
        for (const quarter of ['10:00:30', '10:01:12']) await runs_at(story, anna, quarter)
        expect(await anna.the_answer_to(P2)).toEqual([
          { id: P2, answer: { status: 'no_response' } },
        ])
        expect(last_of(await asks(anna, bruno, 'P2'))).toEqual(second)
        expect(
          names_of(await anna.recorded()).filter((each) => each === 'a_request_has_been_sent'),
        ).toHaveLength(3)
      })
    })

    describe('13. a deposit lost, doubled or aborted', () => {
      test('the deposits of a request survive loss, duplication and abort', async () => {
        const story = await a_story(primitives)
        const { anna, bruno } = story
        const P1 = anna.the_request('P1')
        // P1/0 lost on its way, then kept with its answer lost, then kept already.
        anna.will('lost', 'answer_lost')
        await asks(anna, bruno, 'P1')
        await anna.runs()
        expect(await bruno.collects()).toHaveLength(0)
        await anna.runs()
        expect(await bruno.collects()).toHaveLength(1)
        await anna.runs()
        const first = anna.carried()
        expect(first.map((each) => each.fault)).toEqual(['lost', 'answer_lost', 'none'])
        expect(new Set(first.map((each) => each.operation)).size).toBe(1)
        expect(['kept', 'kept_already']).toContain(first[2]?.answered.outcome)
        expect(await bruno.collects()).toHaveLength(1)
        // P1/1 sent twice by the transport: one deposit at the relay (MBX-1).
        anna.will('doubled')
        await runs_at(story, anna, '10:00:15')
        expect(await bruno.collects()).toHaveLength(2)
        // An abort while depositing P1/2 stops the effect; started again, it deposits it.
        anna.will('aborted')
        story.at('10:00:30')
        await expect(anna.runs()).rejects.toThrow(
          'the delivery of post/requests/effect/deposit_a_letter fell',
        )
        expect(await bruno.collects()).toHaveLength(2)
        await anna.runs()
        expect(await bruno.collects()).toHaveLength(3)
        // Bruno opens three copies of one letter: his duplicate branch meets one
        // operation, and answers each with the response it recorded. Answered once.
        story.at('10:00:31')
        const came = await bruno.serves(story.bonds_of.bruno)
        const letters = came.map((each) =>
          each.opened.outcome === 'opened' ? each.opened.letter : undefined,
        )
        expect(letters).toHaveLength(3)
        for (const letter of letters) expect(letter).toEqual(letters[0])
        expect(anna.held()).toEqual([])
        await anna.receives()
        const names = names_of(await anna.recorded())
        expect(names.filter((each) => each === 'a_request_has_been_sent')).toHaveLength(1)
        expect(names.filter((each) => each === 'a_request_has_been_answered')).toHaveLength(1)
        expect(await anna.the_answer_to(P1)).toEqual([
          { id: P1, answer: { status: 'answered', event: { pong: true } } },
        ])

        // Every fact and entry given twice (TST-4): each sending one envelope at the relay.
        const twice = await a_story(primitives, { redelivered: true })
        await asks(twice.anna, twice.bruno, 'P1')
        await twice.anna.runs()
        await runs_at(twice, twice.anna, '10:00:15')
        expect(await twice.bruno.collects()).toHaveLength(2)
        expect(
          names_of(await twice.anna.recorded()).filter((each) => each.startsWith('a_request')),
        ).toEqual(['a_request_has_been_sent', 'a_request_has_been_sent_again'])
        // The safe's draw of Anna's seed, given twice, is its own dead letter (SEA-3); the post holds none.
        expect(twice.anna.held().filter((each) => each.entry.effect.startsWith('post/'))).toEqual(
          [],
        )
      })
    })

    describe('14. a response lost is asked again', () => {
      test('a response lost comes back with a sending again', async () => {
        const story = await a_story(primitives)
        const { anna, bruno } = story
        const P1 = anna.the_request('P1')
        await asks(anna, bruno, 'P1')
        await anna.runs()
        // Bruno answers at 10:00:01; the deposit of his response is lost.
        story.at('10:00:01')
        bruno.will('lost')
        await bruno.serves(story.bonds_of.bruno)
        expect(await anna.receives()).toEqual([])
        // At 10:00:15 Anna sends P1 again; Bruno answers from what he recorded.
        await runs_at(story, anna, '10:00:15')
        await bruno.serves(story.bonds_of.bruno)
        const taken = await anna.receives()
        expect(taken).toHaveLength(1)
        expect(last_of(taken[0] ?? [])).toMatchObject({ outcome: 'applied' })
        expect(bruno.carried().map((each) => each.fault)).toEqual(['lost', 'none'])
        // His response goes to Anna's mailbox of their bond (PST-9).
        expect(bruno.carried().map((each) => each.deposit_address)).toEqual([DA, DA])
        expect(new Set(bruno.carried().map((each) => each.operation)).size).toBe(1)
        expect(await anna.the_answer_to(P1)).toEqual([
          { id: P1, answer: { status: 'answered', event: { pong: true } } },
        ])
        expect(
          names_of(await anna.recorded()).filter((each) => each === 'a_request_has_been_answered'),
        ).toHaveLength(1)
      })
    })

    describe('15. a deposit that cannot be sealed is a dead letter, shown', () => {
      test('a letter for a key that takes no seal is a dead letter', async () => {
        const story = await a_story(primitives)
        const { anna, bruno } = story
        const P1 = anna.the_request('P1')
        await asks(anna, bruno, 'P1', { key: no_key })
        await anna.runs()
        for (const quarter of ['10:00:15', '10:00:30', '10:00:45', '10:01:00'])
          await runs_at(story, anna, quarter)
        const letters = anna.held()
        expect(letters.map((each) => [each.entry.id, each.held])).toEqual(
          [0, 1, 2, 3].map((attempt) => [`${P1}/${String(attempt)}`, 'dead_letter']),
        )
        for (const letter of letters)
          expect(letter.held === 'dead_letter' && letter.cause).toEqual({
            cause: 'exhausted',
            reason: 'their_key_takes_no_seal',
          })
        expect(await bruno.collects()).toEqual([])
        expect(
          names_of(await anna.recorded()).filter((each) => each.startsWith('a_request')),
        ).toEqual([
          'a_request_has_been_sent',
          'a_request_has_been_sent_again',
          'a_request_has_been_sent_again',
          'a_request_has_been_sent_again',
          'a_request_had_no_response',
        ])
        // A relay that refuses the envelope: a dead letter with what it said.
        const refusing = await a_story(primitives)
        refusing.anna.will('refused')
        await asks(refusing.anna, refusing.bruno, 'P1')
        await refusing.anna.runs()
        expect(
          refusing.anna.held().map((each) => each.held === 'dead_letter' && each.cause),
        ).toEqual([
          { cause: 'exhausted', reason: 'the_relay_refused_the_envelope: invalid_request' },
        ])
      })
    })

    describe('16. a phone closed while a request waits', () => {
      test('a phone started again closes its requests from the record', async () => {
        const story = await a_story(primitives)
        const { anna, bruno, carla } = story
        const P1 = anna.the_request('P1')
        const P2 = anna.the_request('P2')
        await asks(anna, bruno, 'P1')
        const to_carla = last_of(await asks(anna, carla, 'P2'))
        await anna.runs()
        // Carla answers P2; Bruno's phone is off.
        story.at('10:00:05')
        await carla.serves(story.bonds_of.carla)
        await anna.receives()
        // Anna's phone closed before P1's time, started again at 10:02:00.
        await runs_at(story, anna, '10:02:00')
        expect(await anna.the_answer_to(P1)).toEqual([
          { id: P1, answer: { status: 'no_response' } },
        ])
        expect(await anna.the_answer_to(P2)).toEqual([
          { id: P2, answer: { status: 'answered', event: { pong: true } } },
        ])
        // The port's call for P2 met again: the recorded fact, nothing sent.
        expect(last_of(await asks(anna, carla, 'P2'))).toEqual(to_carla)
        await anna.runs()
        expect(anna.carried()).toHaveLength(2)
        expect(anna.held()).toEqual([])
        expect(
          names_of(await anna.recorded()).filter((each) => each === 'a_request_has_been_answered'),
        ).toHaveLength(1)
      })
    })

    describe('17. a request called off is sent again no more', () => {
      test('a request called off keeps its refusal and is sent again no more', async () => {
        const story = await a_story(primitives)
        const { anna, bruno, carla } = story
        const P1 = anna.the_request('P1')
        const P2 = anna.the_request('P2')
        await asks(anna, bruno, 'P1')
        await asks(anna, carla, 'P2')
        await anna.runs()
        // What the kernel reads to call off: the requests that wait, with what they invoke and where they went.
        expect(await anna.the_requests_waiting()).toEqual(
          [
            { id: P1, invokes: a_ping, face_id: anna.face_id, their_key: bruno.key },
            { id: P2, invokes: a_ping, face_id: anna.face_id, their_key: carla.key },
          ].toSorted((one, other) => (one.id < other.id ? -1 : 1)),
        )
        // At 10:00:10 Anna withdraws her ping pong from her bond with Carla: the kernel calls P2 off.
        story.at('10:00:10')
        const called_off = last_of(
          await anna.call_off_a_request({ request_id: P2, why: 'not_offered_to_the_bond' }),
        )
        expect(called_off).toMatchObject({
          outcome: 'applied',
          fact: {
            parts: [
              {
                path: 'post/requests/fact/a_request_has_been_called_off',
                payload: { request_id: P2, why: 'not_offered_to_the_bond' },
              },
            ],
          },
        })
        expect(await anna.the_answer_to(P2)).toEqual([
          { id: P2, answer: { status: 'called_off', why: 'not_offered_to_the_bond' } },
        ])
        expect((await anna.the_requests_waiting()).map((each) => each.id)).toEqual([P1])
        // Called off again under its operation: the recorded fact (DOM-11); a request that waits no more: refused.
        expect(
          last_of(
            await anna.call_off_a_request({ request_id: P2, why: 'not_offered_to_the_bond' }),
          ),
        ).toEqual(called_off)
        expect(
          failed(
            last_of(
              await anna.call_off_a_request(
                { request_id: P2, why: 'not_active' },
                { operation: 'again' },
              ),
            ),
          ),
        ).toEqual(['the_request_is_waiting'])
        // Its sendings again send nothing; P1's go on; at 10:01:00 its time comes after the call-off.
        for (const quarter of ['10:00:15', '10:00:30', '10:00:45', '10:01:00'])
          await runs_at(story, anna, quarter)
        const to_carla = (await carla.opens_what_came()).length
        expect(to_carla).toBe(1)
        expect(await bruno.opens_what_came()).toHaveLength(4)
        const recorded = names_of(await anna.recorded())
        expect(recorded).toContain('the_call_off_came_before_the_time')
        expect(recorded.filter((each) => each === 'a_request_had_no_response')).toHaveLength(1)
        expect(await anna.the_answer_to(P2)).toEqual([
          { id: P2, answer: { status: 'called_off', why: 'not_offered_to_the_bond' } },
        ])
        // Carla's pong, coming after: a late one, refused (story 10).
        expect(
          failed(
            last_of(
              await anna.take_a_response({
                request_id: P2,
                from: carla.key,
                event: { pong: true },
              }),
            ),
          ),
        ).toEqual(['the_request_is_waiting'])
        expect(anna.held()).toEqual([])
      })
    })
  })
}
