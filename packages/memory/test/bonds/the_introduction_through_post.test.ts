import { describe, expect, test } from 'vitest'
import { a_node, a_story, shown, until, type NodeUnderTest } from '../node/harness.ts'

// The introduction as the phone sends it (BND-10, F7, PER-11; step 17): a
// request of the kernel's, `send_my_introduction` delivered through the
// kernel's port of requests and `post` to the peer's ticket's mailbox, at
// the relay; collected by the peer's phone, opened at its ticket, routed to
// its `unknown`, which takes it (`accept_their_introduction`); the answer
// on the bond just made, collected and taken by the asker's entry, which
// closes the request and the delivery. Anna's ticket L_b, sent to Bruno in
// a link; his ticket L_a, presented. Two phones of the `memory` stack, the
// introductions sent through `post` as the phone sends them. Friday 20
// November 2026, 10:00 UTC.

/** The effect of the address book whose deliveries are the introductions (BND-10). */
const send_my_introduction = 'bonds/address_book/effect/send_my_introduction'

/** Anna's phone and Bruno's, the introductions sent through `post`; Anna's ticket ready, Bruno's too, his opening hers in a link. */
const bruno_opens_annas_link = async () => {
  const story = await a_story()
  const through_post = { installed: 'not_installed', introductions: 'sent_through_post' } as const
  const anna = await a_node(story, { phone: 1, face_id: 'F_a', name: 'Anna', ...through_post })
  const bruno = await a_node(story, { phone: 2, face_id: 'F_b', name: 'Bruno', ...through_post })
  await anna.prepares_a_ticket('L_b')
  await bruno.prepares_a_ticket('L_a')
  await bruno.opens_their_ticket({
    bond_id: 'L_a',
    their_ticket: await shown(anna, 'L_b'),
    name: 'Anna',
  })
  return { story, anna, bruno }
}

/** The asker's node runs until its request is deposited at the other's mailboxes: its delivery and the post's in flight together. */
const deposited = (asker: NodeUnderTest, at: NodeUnderTest): Promise<void> =>
  until(async () => {
    await asker.runs()
    return (await at.at_my_mailboxes()).length > 0
  }, 'the introduction deposited')

/** The requests a node's post recorded as sent, as it keeps them. */
const sent_requests = async (node: NodeUnderTest) =>
  (await node.recorded()).flatMap((fact) =>
    fact.parts
      .filter((part) => part.path === 'post/requests/fact/a_request_has_been_sent')
      .map((part) => part.payload),
  )

describe('the introduction through post (BND-10, F7)', () => {
  test('his introduction goes through post; her unknown makes the bond; her answer closes his request', async () => {
    const { anna, bruno } = await bruno_opens_annas_link()
    await deposited(bruno, anna)
    const request = bruno.the_kernels_request_of('L_a', send_my_introduction)
    const her_ticket = await anna.my_mailbox_of('L_b')
    const his_mailbox = await bruno.my_mailbox_of('L_a')
    // The kernel's request to her unknown: her ticket's secret, his face's name, his mailbox; 48 hours.
    expect(await sent_requests(bruno)).toMatchObject([
      {
        sent_request: {
          id: request,
          status: 'waiting',
          until: '2026-11-22T10:00:00.000Z',
          deposit: {
            their_key: anna.key,
            letter: {
              to: her_ticket.deposit_address,
              invokes: {
                of: 'the_kernel',
                persona: 'unknown',
                use_case: 'usecase/introduce_myself',
                version: '1.0.0',
              },
              input: {
                secret: (await shown(anna, 'L_b')).secret,
                introduced_as: 'Bruno',
                mailbox: his_mailbox,
              },
            },
          },
        },
      },
    ])
    // Her phone collects it: her unknown takes it, the bond made at a distance, named as he is introduced.
    await anna.collects()
    expect(await anna.a_bond('L_b')).toMatchObject({
      name: 'Bruno',
      their_face: { key: bruno.key, introduced_as: 'Bruno' },
      their_mailbox: his_mailbox,
      handshake: { way: 'at_a_distance' },
      confirmation: { state: 'received' },
    })
    // Her answer, on the bond just made, comes back: his entry takes it, his delivery is over.
    await bruno.collects()
    expect(await bruno.the_answer_to(request)).toMatchObject([
      { answer: { status: 'answered', event: { event: 'you_are_bonded', payload: {} } } },
    ])
    await bruno.runs()
    expect(bruno.held_letters()).toEqual([])
    expect(anna.letters()).toEqual([])
  })

  test('her phone off for the ticket’s 48 hours: no response, his introduction a dead letter he is shown', async () => {
    const { story, anna, bruno } = await bruno_opens_annas_link()
    await deposited(bruno, anna)
    story.at_the_instant('2026-11-22T10:00:01.000Z')
    await until(async () => {
      await bruno.runs()
      return bruno.held_letters().length > 0
    }, 'the introduction held')
    expect(bruno.held_letters()).toMatchObject([
      {
        whose: { of: 'the_kernel', office: 'bonds/address_book' },
        letter: `${send_my_introduction}/L_a`,
        what: 'send_my_introduction',
      },
    ])
    expect(JSON.stringify(bruno.held())).toContain('no response in 48 hours')
    expect(
      await bruno.the_answer_to(bruno.the_kernels_request_of('L_a', send_my_introduction)),
    ).toMatchObject([{ answer: { status: 'no_response' } }])
  })
})
