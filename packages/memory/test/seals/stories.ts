import { describe, expect, test } from 'vitest'
import * as dsl from '@q-mino/domains/seals/safe/_dsl.ts'
import * as value from '@q-mino/domains/seals/safe/_value.ts'
import * as id from '@q-mino/domains/seals/safe/_id.ts'
import * as zz from '@q-mino/domains/library'
import { a_safe, quiet, type SafeUnderTest } from './harness.ts'
import { bytes_all, recording } from './primitives.ts'
import type { Primitives } from '@q-mino/domains/seals/safe/_dsl.ts'

// The safe's stories (`packages/domains/src/seals/README.md`, § Stories to
// prove; SEA-1..SEA-9, GR-5, GR-8, DOM-8, DOM-21, PER-21, the invariants of
// § 4), one test each, named as the README names it. A suite parametrized by
// the primitives port (TST-1): the fake's and libsodium's (`safe.test.ts`),
// the same stories over the real machine. The stories of the core (1–4, 13)
// run on the safe's `dsl` through its generated `_dsl.ts` (MBX-5), the port
// recorded; those of the safe (5–12) on q-'s oracle
// (MBX-7), through the ports a reaction and the executor send to (PER-21),
// the world's random bytes the story's.
//
// Anna's phone; F1 and F2 her faces, as `bonds` names them; S1 and S2 the
// seeds the world draws for them; M1 a mailbox key, R1 its collect secret;
// C1 a content.

/** Bytes as the safe tells them. */
const told = dsl.base64url_of

/** The bytes of a text, one per character (ASCII). */
const ascii = (text: string): Uint8Array =>
  Uint8Array.from({ length: text.length }, (_, at) => text.charCodeAt(at) & 255)

const S1 = bytes_all(1)
const S2 = bytes_all(2)
const R1 = bytes_all(3)
const C1 = told(ascii('Anna to Bruno: the first letter'))
const C2 = told(ascii('Anna to Bruno: another letter'))

/** The bytes of "ed25519 seed", the key of SLIP-0010's master. */
const the_curve_s_seed_key = ascii('ed25519 seed')

/** A content sealed for a public key that is one (story 4): its sealed content. */
const sealed_for =
  (primitives: Primitives) =>
  (public_key: string, content: string): string => {
    const sealing = dsl.sealed_for(primitives)(public_key, content)
    if (sealing.outcome !== 'sealed') throw new Error("a face's public key sealed nothing")
    return sealing.sealed_content
  }

/** A command's last event, the one that closes its stream. */
const last_of = <event>(events: readonly event[]): event => {
  const last = events.at(-1)
  if (last === undefined) throw new Error('a command gave no event')
  return last
}

/** The entries of a read's snapshot, its first event. */
const entries_of = <entry>(
  events: readonly (
    | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
    | {
        readonly event: 'invalid_request'
      }
  )[],
): readonly entry[] => {
  const first = events[0]
  if (first?.event !== 'snapshot') throw new Error('a read began with no snapshot')
  return first.entries
}

/** The paths of the parts of the facts recorded, fact by fact. */
const paths_of = (facts: Awaited<ReturnType<SafeUnderTest['recorded']>>) =>
  facts.map((fact) => fact.parts.map((part) => part.path))

/** Anna's phone with F1 made from S1: the reaction asks, the machine draws. */
const with_F1 = async (primitives: Primitives) => {
  const safe = await a_safe(primitives)
  safe.will_draw(S1)
  await safe.makes_a_face('F1', { operation: 'a-face-for-the-bond-with-bruno' })
  const machine = safe.the_machine_runs()
  await quiet()
  await machine.stop()
  return safe
}

export const stories_of_the_safe = (name: string, primitives: Primitives) => {
  describe(`the core of seals, ${name}`, () => {
    test('the face at an index is the hardened child of the seed', () => {
      const port = recording(primitives)
      const F = dsl.the_face_at(port.primitives)(told(S1), 5)
      const [master, child, public_key, ...more] = port.calls()
      expect(more).toEqual([])
      expect(master?.name).toBe('hmac_sha512')
      expect(master?.arguments).toEqual([the_curve_s_seed_key, S1])
      if (!(master?.gave instanceof Uint8Array)) throw new Error('the master is no bytes')
      expect(child?.name).toBe('hmac_sha512')
      expect(child?.arguments).toEqual([
        master.gave.slice(32, 64),
        Uint8Array.from([0, ...master.gave.slice(0, 32), 0x80, 0, 0, 5]),
      ])
      if (!(child?.gave instanceof Uint8Array)) throw new Error('the child is no bytes')
      expect(public_key?.name).toBe('public_key_of')
      expect(public_key?.arguments).toEqual([child.gave.slice(0, 32)])
      if (!(public_key?.gave instanceof Uint8Array)) throw new Error('the public key is no bytes')
      expect(F).toEqual({
        private_key: told(child.gave.slice(0, 32)),
        chain_code: told(child.gave.slice(32, 64)),
        public_key: told(public_key.gave),
      })
    })

    test('the same seed and index give the same face, another index another', () => {
      const face_at = dsl.the_face_at(primitives)
      const at_3 = face_at(told(S1), 3)
      expect(face_at(told(S1), 3)).toEqual(at_3)
      const at_4 = face_at(told(S1), 4)
      const of_S2 = face_at(told(S2), 3)
      for (const other of [at_4, of_S2]) {
        expect(other.private_key).not.toBe(at_3.private_key)
        expect(other.chain_code).not.toBe(at_3.chain_code)
        expect(other.public_key).not.toBe(at_3.public_key)
      }
    })

    test('the values go round base64url', () => {
      for (let length = 0; length <= 64; length += 1) {
        const bytes = Uint8Array.from({ length }, (_, at) => (at * 37 + length * 11) & 255)
        expect(dsl.bytes_of(dsl.base64url_of(bytes))).toEqual(bytes)
      }
      const thirty_two = Uint8Array.from({ length: 32 }, (_, at) => 255 - at)
      expect(told(thirty_two)).toHaveLength(43)
      expect(value.public_key.safeParse(told(thirty_two)).success).toBe(true)
      const sixty_four = Uint8Array.from({ length: 64 }, (_, at) => 255 - at)
      expect(told(sixty_four)).toHaveLength(86)
      expect(value.signature.safeParse(told(sixty_four)).success).toBe(true)
      expect(value.public_key.safeParse(told(sixty_four)).success).toBe(false)
      expect(value.signature.safeParse(told(thirty_two)).success).toBe(false)
    })

    test('a content is sealed for a public key and a signature checked by it', () => {
      const F = dsl.the_face_at(primitives)(told(S1), 0)
      const port = recording(primitives)
      const sealed = sealed_for(port.primitives)(F.public_key, C1)
      const signature = dsl.the_signature_of(primitives)(F.private_key, C1)
      expect(dsl.the_signature_holds(port.primitives)(F.public_key, C1, signature)).toBe(true)
      expect(dsl.the_signature_holds(port.primitives)(F.public_key, C2, signature)).toBe(false)
      expect(port.calls().map((call) => [call.name, call.arguments])).toEqual([
        ['seal_for', [dsl.bytes_of(F.public_key), dsl.bytes_of(C1)]],
        [
          'signature_holds',
          [dsl.bytes_of(F.public_key), dsl.bytes_of(C1), dsl.bytes_of(signature)],
        ],
        [
          'signature_holds',
          [dsl.bytes_of(F.public_key), dsl.bytes_of(C2), dsl.bytes_of(signature)],
        ],
      ])
      const [seal] = port.calls()
      expect(seal?.gave).toEqual({ outcome: 'sealed', sealed_content: dsl.bytes_of(sealed) })
    })

    test('no content is sealed for what is no public key', () => {
      // 32 zero bytes: a point of small order of Ed25519's group, which
      // libsodium refuses to seal for (SEA-5), as the fake does.
      const port = recording(primitives)
      const no_key = told(bytes_all(0))
      expect(value.public_key.safeParse(no_key).success).toBe(true)
      expect(dsl.sealed_for(port.primitives)(no_key, C1)).toEqual({ outcome: 'not_sealed' })
      expect(port.calls().map((call) => [call.name, call.arguments, call.gave])).toEqual([
        ['seal_for', [bytes_all(0), dsl.bytes_of(C1)], { outcome: 'not_sealed' }],
      ])
    })
  })

  describe(`the safe, ${name}`, () => {
    test('the first face is made from a new seed', async () => {
      const safe = await a_safe(primitives)
      const asked = last_of(
        await safe.makes_a_face('F1', { operation: 'a-face-for-the-bond-with-bruno' }),
      )
      expect(asked).toMatchObject({
        outcome: 'applied',
        branch: 'the_face_is_new_so_a_seed_is_drawn_for_it',
        fact: {
          parts: [
            {
              path: 'seals/safe/fact/a_face_has_been_asked_for',
              payload: { face_being_made: { id: 'F1', status: 'being_made' } },
            },
          ],
        },
      })
      expect(safe.queued()).toMatchObject([
        {
          effect: 'seals/safe/effect/draw_a_seed_for_the_face',
          id: 'F1',
          payload: { face_id: 'F1' },
        },
      ])
      safe.will_draw(S1)
      const machine = safe.the_machine_runs()
      await quiet()
      await machine.stop()
      const facts = await safe.recorded()
      expect(paths_of(facts)).toEqual([
        ['seals/safe/fact/a_face_has_been_asked_for'],
        ['seals/safe/fact/a_face_has_been_made_from_a_new_seed'],
      ])
      const made = facts[1]
      expect(made?.operation).toEqual({
        id: 'F1',
        scope: 'seals/safe/effect/draw_a_seed_for_the_face',
      })
      const F1 = dsl.the_face_at(primitives)(told(S1), 0)
      // The seed's id is the operation's (D75.8): it tells nothing of its bytes.
      const seed_id = zz.identity_of(id.seed_id)({
        id: zz.operation_id.parse('F1'),
        scope: 'seals/safe/effect/draw_a_seed_for_the_face',
      })
      expect(made?.parts[0]?.payload).toEqual({
        new_seed: { id: seed_id, scheme: 'slip10-flat', secret: told(S1), next_index: 1 },
        made_face: { id: 'F1', status: 'made', seed_id, index: 0, ...F1 },
      })
      expect(safe.held()).toEqual([])
    })

    test('a face asked for again is one face', async () => {
      const safe = await a_safe(primitives)
      const first = await safe.makes_a_face('F1', { operation: 'a-face-for-the-bond-with-bruno' })
      const again = await safe.makes_a_face('F1', { operation: 'a-face-for-the-bond-with-bruno' })
      expect(again).toEqual(first)
      expect(safe.queued()).toHaveLength(1)
      const another = last_of(await safe.makes_a_face('F1', { operation: 'another-reaction' }))
      expect(another).toEqual({
        outcome: 'rejected',
        failures: [
          {
            branch: 'the_face_is_new_so_a_seed_is_drawn_for_it',
            components: [],
            predicate: 'seals/safe/predicate/a_face_has_this_id',
          },
        ],
      })
      expect(await safe.recorded()).toHaveLength(1)
    })

    test('a draw delivered again keeps one seed', async () => {
      // The world answers a delivery again as it answered it (its key, the
      // entry's id, sent with the effect): the return's second delivery is
      // the duplicate branch, one seed, one face.
      const twice = await a_safe(primitives, { redelivered: true })
      twice.will_draw(S1)
      await twice.makes_a_face('F1', { operation: 'a-face-for-the-bond-with-bruno' })
      const F1 = dsl.the_face_at(primitives)(told(S1), 0)
      const kept = { face_id: 'F1', seed_secret: told(S1), first_face: F1 }
      const first = last_of(await twice.keeps_a_seed(kept, { operation: 'F1' }))
      const again = last_of(await twice.keeps_a_seed(kept, { operation: 'F1' }))
      expect(first).toMatchObject({ outcome: 'applied' })
      expect(again).toEqual(first)
      // A machine that draws again for the same entry (TST-4: every entry
      // delivered twice) says another seed: the operation recorded one
      // already, so the second return is no retry of it but another request
      // under its identity (DOM-11), a dead letter; the first seed and its
      // face stand (SEA-3).
      const redrawn = await a_safe(primitives, { redelivered: true })
      redrawn.will_draw(S1, S2)
      await redrawn.makes_a_face('F1', { operation: 'a-face-for-the-bond-with-bruno' })
      const machine = redrawn.the_machine_runs()
      await quiet()
      await machine.stop()
      const facts = await redrawn.recorded()
      expect(paths_of(facts)).toEqual([
        ['seals/safe/fact/a_face_has_been_asked_for'],
        ['seals/safe/fact/a_face_has_been_made_from_a_new_seed'],
      ])
      expect(facts[1]?.parts[0]?.payload).toMatchObject({ new_seed: { secret: told(S1) } })
      expect(redrawn.held()).toMatchObject([
        {
          held: 'dead_letter',
          entry: { effect: 'seals/safe/effect/draw_a_seed_for_the_face', id: 'F1' },
          cause: {
            cause: 'identity_already_used',
            returns: { face_id: 'F1', seed_secret: told(S2) },
          },
        },
      ])
      // A return for a face not being made (F2 never asked for): rejected.
      const F2 = dsl.the_face_at(primitives)(told(S2), 0)
      const stray = last_of(
        await redrawn.keeps_a_seed(
          { face_id: 'F2', seed_secret: told(S2), first_face: F2 },
          { operation: 'F2' },
        ),
      )
      expect(stray).toEqual({
        outcome: 'rejected',
        failures: [
          {
            branch: 'the_face_is_being_made_so_it_is_made_from_the_seed',
            components: [],
            predicate: 'seals/safe/predicate/the_face_is_being_made',
          },
        ],
      })
    })

    test('a mailbox key is drawn with its deposit address', async () => {
      const safe = await a_safe(primitives)
      const asked = last_of(
        await safe.draws_a_mailbox_key('M1', { operation: 'a-mailbox-for-the-bond-with-bruno' }),
      )
      expect(asked).toMatchObject({
        outcome: 'applied',
        fact: {
          parts: [
            {
              path: 'seals/safe/fact/a_mailbox_key_has_been_asked_for',
              payload: { mailbox_key_being_drawn: { id: 'M1', status: 'being_drawn' } },
            },
          ],
        },
      })
      expect(entries_of(await safe.the_key_of('M1'))).toEqual([])
      safe.will_draw(R1)
      const machine = safe.the_machine_runs()
      await quiet()
      await machine.stop()
      const D1 = told(primitives.blake2b_256(R1))
      expect(paths_of(await safe.recorded())).toEqual([
        ['seals/safe/fact/a_mailbox_key_has_been_asked_for'],
        ['seals/safe/fact/a_mailbox_key_has_been_drawn'],
      ])
      expect(entries_of(await safe.the_key_of('M1'))).toEqual([
        { id: 'M1', collect_secret: told(R1), deposit_address: D1 },
      ])
      expect(dsl.the_deposit_address_of(primitives)(told(R1))).toBe(D1)
      expect(D1).toMatch(/^[A-Za-z0-9_-]{43}$/)
    })

    test('a content signed by a face holds for its public key', async () => {
      const safe = await with_F1(primitives)
      const recorded = await safe.recorded()
      const F1 = dsl.the_face_at(primitives)(told(S1), 0)
      const [signed, ...more] = entries_of(await safe.signs('F1', C1))
      expect(more).toEqual([])
      expect(signed).toEqual({
        id: 'F1',
        public_key: F1.public_key,
        signature: told(primitives.sign(dsl.bytes_of(F1.private_key), dsl.bytes_of(C1))),
      })
      if (signed === undefined) throw new Error('F1 signed nothing')
      expect(dsl.the_signature_holds(primitives)(signed.public_key, C1, signed.signature)).toBe(
        true,
      )
      expect(dsl.the_signature_holds(primitives)(signed.public_key, C2, signed.signature)).toBe(
        false,
      )
      expect(await safe.recorded()).toEqual(recorded)
    })

    test('a content sealed for a face is opened by it alone', async () => {
      const safe = await with_F1(primitives)
      safe.will_draw(S2)
      await safe.makes_a_face('F2', { operation: 'a-face-for-the-bond-with-carla' })
      const machine = safe.the_machine_runs()
      await quiet()
      await machine.stop()
      const F1 = dsl.the_face_at(primitives)(told(S1), 0)
      const sealed = sealed_for(primitives)(F1.public_key, C1)
      expect(entries_of(await safe.opens('F1', sealed))).toEqual([
        { id: 'F1', public_key: F1.public_key, opened: { outcome: 'opened', content: C1 } },
      ])
      expect(entries_of(await safe.opens('F2', sealed))).toMatchObject([
        { id: 'F2', opened: { outcome: 'not_opened' } },
      ])
      const bytes = dsl.bytes_of(sealed)
      const broken = told(
        bytes.map((byte, at) => (at === Math.floor(bytes.length / 2) ? byte ^ 1 : byte)),
      )
      expect(entries_of(await safe.opens('F1', broken))).toMatchObject([
        { id: 'F1', opened: { outcome: 'not_opened' } },
      ])
    })

    test('a face not made signs and opens nothing', async () => {
      const safe = await a_safe(primitives)
      await safe.makes_a_face('F1', { operation: 'a-face-for-the-bond-with-bruno' })
      const F = dsl.the_face_at(primitives)(told(S1), 0)
      const sealed = sealed_for(primitives)(F.public_key, C1)
      expect(entries_of(await safe.signs('F1', C1))).toEqual([])
      expect(entries_of(await safe.opens('F1', sealed))).toEqual([])
      expect(entries_of(await safe.signs('F2', C1))).toEqual([])
      expect(entries_of(await safe.opens('F2', sealed))).toEqual([])
    })

    test('no read of the safe gives a secret', async () => {
      const safe = await with_F1(primitives)
      const F1 = dsl.the_face_at(primitives)(told(S1), 0)
      // By the fields their queries declare: a face's id and public key, and
      // the calculation; a mailbox key's id, R and D (V5).
      // (`value.face_of_mine` for the two reads of a face, `value.key_shown_to_the_relay`).
      expect(Object.keys(value.face_of_mine.shape).toSorted()).toEqual(['id', 'public_key'])
      expect(Object.keys(value.key_shown_to_the_relay.shape).toSorted()).toEqual([
        'collect_secret',
        'deposit_address',
        'id',
      ])
      // By what the reads give.
      const secrets = [F1.private_key, F1.chain_code, told(S1)]
      const given = [
        ...entries_of(await safe.signs('F1', C1)),
        ...entries_of(await safe.opens('F1', sealed_for(primitives)(F1.public_key, C1))),
      ]
      for (const entry of given) {
        expect(Object.keys(entry).filter((key) => key !== 'signature' && key !== 'opened')).toEqual(
          ['id', 'public_key'],
        )
        for (const secret of secrets) expect(JSON.stringify(entry)).not.toContain(secret)
        expect(JSON.stringify(entry)).not.toMatch(/index|seed|private|chain/)
      }
      // What is invalid is not taken.
      expect(await safe.signs('F1', 'not base64url!')).toEqual([
        { event: 'invalid_request', reason: 'input_not_in_schema' },
      ])
      const thirty_one = told(Uint8Array.from({ length: 31 }, () => 7))
      expect(
        await safe.keeps_a_seed(
          { face_id: 'F1', seed_secret: told(S1), first_face: { ...F1, public_key: thirty_one } },
          { operation: 'a-forged-return' },
        ),
      ).toEqual([{ outcome: 'invalid_request' }])
    })
  })
}
