import { the_content_a_ticket_s_secret_signs } from '@q-mino/domains/bonds/address_book/_dsl.ts'
import { send_my_introduction } from '@q-mino/domains/bonds/address_book/_effect.ts'
import * as zz from '@q-mino/domains/library'
import { unknown } from '@q-mino/domains/persona/unknown/_version.ts'
import { describe, expect, test } from 'vitest'
import {
  the_delivery_of_my_introduction,
  the_ticket_shown,
  type AKernelsRequest,
  type AnAnswerToTheKernelsRequest,
} from '../../src/index.ts'

// The adapters of the handshake (BND-8, BND-9, BND-10, F7; step 17): the
// delivery of Bruno's introduction to Anna's ticket through the kernel's
// own port of requests, the port and the address book's reads played,
// each answer the port can give mapped; and his ticket as he shows it, the
// safe's signature played. Over the oracle, with two phones:
// `memory/test/bonds/the_introduction_through_post.test.ts`.

const clock = {
  now: () => zz.date_time.parse('2026-11-20T10:00:00.000Z'),
  time_zone: zz.time_zone.parse('UTC'),
}

/** A read's one snapshot, as a read port gives it. */
async function* a_snapshot<entry>(entries: readonly entry[]) {
  yield await Promise.resolve({ event: 'snapshot' as const, entries })
}

/** Bruno's mailbox of the bond, his ticket's: at the story's relay. */
const his_mailbox = { deposit_address: 'D_b', relays: ['https://relay.q-mino.test'] }

/** Anna's ticket as she showed it in her link: her key, her name, her mailbox D_md, its secret. */
const her_ticket = {
  key: `${'K'.repeat(42)}A`,
  introduced_as: 'Anna',
  mailbox: { deposit_address: 'D_md', relays: ['https://relay.q-mino.test'] },
  secret: `${'s'.repeat(85)}A`,
}

/** Bruno's introduction on his bond L_a, to her ticket. */
const l_a = {
  id: zz.entry_id.parse('L_a'),
  payload: send_my_introduction.parse({ bond_id: 'L_a', their_ticket: her_ticket }),
}

/** Bruno's address book played: his bond L_a kept with his face F_b "Bruno", unless the story says it is not there. */
const his_address_book = (missing: 'nothing' | 'the_bond' | 'the_face' = 'nothing') => ({
  a_bond: () =>
    a_snapshot(missing === 'the_bond' ? [] : [{ my_face_id: 'F_b', my_mailbox: his_mailbox }]),
  my_faces: () => a_snapshot(missing === 'the_face' ? [] : [{ id: 'F_b', name: 'Bruno' }]),
})

/** The kernel's port played: it answers so, and keeps the requests it was called with. */
const a_port = (answer: AnAnswerToTheKernelsRequest) => {
  const called: AKernelsRequest[] = []
  const port = (request: AKernelsRequest): Promise<AnAnswerToTheKernelsRequest> => {
    called.push(request)
    return Promise.resolve(answer)
  }
  return { port, called }
}

/** What Bruno's delivery came to, the port answering so. */
const delivered_when = (answer: AnAnswerToTheKernelsRequest) =>
  the_delivery_of_my_introduction({
    clock,
    address_book: his_address_book(),
    the_kernels_port: a_port(answer).port,
  })(l_a)

describe('the delivery of my introduction (BND-10, F7)', () => {
  test('the request: unknown’s introduce_myself at the version of unknown, her ticket’s secret, his name and mailbox, the effect and the entry’s id, the bond, 48 hours', async () => {
    const { port, called } = a_port({ answer: 'no_response' })
    await the_delivery_of_my_introduction({
      clock,
      address_book: his_address_book(),
      the_kernels_port: port,
    })(l_a)
    expect(called).toEqual([
      {
        effect: 'bonds/address_book/effect/send_my_introduction',
        id: 'L_a',
        bond: 'L_a',
        invokes: {
          persona: 'unknown',
          use_case: 'usecase/introduce_myself',
          version: unknown[zz.$Version],
        },
        input: { secret: her_ticket.secret, introduced_as: 'Bruno', mailbox: his_mailbox },
        waits: 172_800,
      },
    ])
  })

  test('the bond made or confirmed on her phone: delivered; any other answer exhausted with its reason', async () => {
    for (const event of [
      'you_are_bonded',
      'you_met_in_person',
      'the_bond_is_confirmed',
      'you_introduced_yourself_already',
    ]) {
      expect(await delivered_when({ answer: 'responded', event: { event, payload: {} } })).toEqual({
        outcome: 'delivered',
      })
    }
    expect(
      await delivered_when({
        answer: 'responded',
        event: { event: 'the_ticket_cannot_be_used', payload: {} },
      }),
    ).toEqual({ outcome: 'exhausted', reason: 'they answered the_ticket_cannot_be_used' })
    expect(await delivered_when({ answer: 'responded', event: { event: 'not_found' } })).toEqual({
      outcome: 'exhausted',
      reason: 'they answered not_found',
    })
    expect(await delivered_when({ answer: 'responded', event: 42 })).toEqual({
      outcome: 'exhausted',
      reason: 'they answered no event',
    })
    expect(await delivered_when({ answer: 'no_response' })).toEqual({
      outcome: 'exhausted',
      reason: 'no response in 48 hours',
    })
    expect(await delivered_when({ answer: 'too_large_for_a_letter' })).toEqual({
      outcome: 'exhausted',
      reason: 'too large for a letter',
    })
    expect(await delivered_when({ answer: 'the_bond_is_gone' })).toEqual({
      outcome: 'exhausted',
      reason: 'the bond is gone',
    })
  })

  test('his side not found, no bond kept or no face made: exhausted, nothing sent', async () => {
    for (const missing of ['the_bond', 'the_face'] as const) {
      const { port, called } = a_port({ answer: 'no_response' })
      expect(
        await the_delivery_of_my_introduction({
          clock,
          address_book: his_address_book(missing),
          the_kernels_port: port,
        })(l_a),
      ).toMatchObject({ outcome: 'exhausted' })
      expect(called).toEqual([])
    }
  })
})

describe('the ticket shown (BND-8, BND-9)', () => {
  /** His ticket L_a ready at D_b, his face F_b; his face's signature played: the content it signed, marked. */
  const shown = the_ticket_shown({
    clock,
    address_book: {
      my_ticket: (_, input) =>
        a_snapshot(
          input.bond_id === 'L_a'
            ? [
                {
                  my_face_id: 'F_b',
                  key: her_ticket.key,
                  introduced_as: 'Bruno',
                  my_mailbox: his_mailbox,
                },
              ]
            : [],
        ),
    },
    machine_of: (face_id) => ({
      sign: (content) => Promise.resolve(`signed by ${face_id}: ${content}`),
    }),
  })

  test('his ticket ready: his key and name, his mailbox, its secret his face’s signature over its D; none for a ticket not ready', async () => {
    expect(await shown('L_a')).toEqual({
      key: her_ticket.key,
      introduced_as: 'Bruno',
      mailbox: his_mailbox,
      secret: `signed by F_b: ${the_content_a_ticket_s_secret_signs('D_b')}`,
    })
    expect(await shown('L_x')).toBeUndefined()
  })
})
