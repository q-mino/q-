import type * as post_value from '@q-mino/domains/post/_value.ts'
import {
  a_node,
  a_story,
  bonded_by_a_link,
  bonded_in_person,
  the_relay,
  type NodeUnderTest,
  type Signed,
  type Story,
} from './harness.ts'

// Anna's phone and her acquaintances on the node of q-'s oracle, and the
// letters they write (part 13.3): the cast of the personas' stories
// (`../persona/personas.test.ts`) and of the kernel's entry's
// (`../entry/the_kernels_entry.test.ts`). A remote caller writes a real
// letter: its node's post sends it as a request from its face (PST-5),
// deposited at the mailbox the story names, collected there and handed to
// the kernel's entry, its response deposited on the bond of the `Caller`'s
// key (PST-9), collected and taken by the asker's entry, read as the answer
// its post keeps (PST-8); a request whose `Caller` has no bond gets no
// response, and the answer stays `waiting`. An unsigned letter, or one whose
// signature does not hold, the story writes itself (PER-2).
//
// Anna's phone, her face F_a "Anna"; her bond L_b with Bruno, the QR crossed
// (his key K_b, his mailbox D_b, hers for him D_mb); her bond L_c with
// Carla, Carla's link opened (K_c, D_c, D_mc); her ticket L_d, ready at
// D_md, sent to Dario in a link (K_d; his mailbox D_d, his ticket's for
// Anna). Bruno's phone, his bond L_a with Anna. Greetings preinstalled and
// activated on Anna's and Bruno's phones, offered to every bond, unless a
// story says otherwise. Friday 20 November 2026, 10:00.

/** What a request invokes of the kernel (EXT-5): a use case of a persona, at 1.0.0 or the version a story names. */
export const the_kernels = (
  persona: post_value.persona,
  use_case: string,
  version = '1.0.0',
): post_value.invocation => ({ of: 'the_kernel', persona, use_case, version })

/** What a request invokes of greetings (EXT-5): its leaf `greet` on `known` at 1.0.0, or the persona, leaf and version a story names. */
export const greetings_on = (
  persona: post_value.persona = 'known',
  use_case = 'usecase/greet',
  version = '1.0.0',
): post_value.invocation => ({
  of: 'an_extension',
  extension: 'greetings',
  persona,
  use_case,
  version,
})

/** Greetings' leaf on `known` (EXT-5): a greeting asked back. */
export const greetings_greet: post_value.invocation = greetings_on()

/** The kernel's read leaf of the extensions in common on `known` (EXT-8). */
export const the_extensions_in_common = the_kernels('known', 'usecase/the_extensions_in_common')

/** The leaf of `unknown` an introduction invokes (PER-11). */
export const introduce_myself = the_kernels('unknown', 'usecase/introduce_myself')

/** Greetings at major 1, as a side offers it in the persona's words (EXT-8). */
export const greetings_at_1 = { extension: 'greetings', majors: [1] }

/** A mailbox at the story's relay. */
export const at = (deposit_address: string) => ({ deposit_address, relays: [the_relay] })

/** Greetings on Anna's phone: not installed, installed and not activated, or activated (the default). */
export type AnnasGreetings = 'not_installed' | 'installed' | 'active'

/** Anna's phone and her acquaintances: the story, the four phones, their faces' keys and the mailboxes of their bonds. */
export interface AnnasPhone {
  readonly story: Story
  readonly anna: NodeUnderTest
  readonly bruno: NodeUnderTest
  readonly carla: NodeUnderTest
  readonly dario: NodeUnderTest
  readonly K_a: string
  readonly K_b: string
  readonly K_c: string
  readonly K_d: string
  readonly D_mb: string
  readonly D_mc: string
  readonly D_md: string
  readonly D_b: string
  readonly D_c: string
  readonly D_d: string
}

/**
 * Anna's phone and her acquaintances, at 10:00 on Friday 20 November 2026
 * (or when the story opens Bruno's ticket, `opened_at`): L_b the QR crossed
 * with Bruno, his introduction carried to her unless the story keeps it
 * back (`not_yet`: Anna opened his ticket presenting L_b's, his
 * introduction not come); L_c, Carla's link, opened by Anna presenting
 * L_c's ticket; L_d, Anna's ticket, ready; Dario's ticket for Anna ready
 * (his mailbox D_d). Greetings active on Bruno's phone, and on Anna's
 * unless the story installs it only or not at all (`greetings`), her
 * partition of the size the story gives (`characters`).
 */
export const annas_phone = async (
  options: {
    readonly brunos_introduction?: 'carried' | 'not_yet'
    readonly opened_at?: string
    readonly greetings?: AnnasGreetings
    readonly characters?: number
  } = {},
): Promise<AnnasPhone> => {
  const story = await a_story()
  const annas_greetings = options.greetings ?? 'active'
  const anna = await a_node(story, {
    phone: 1,
    face_id: 'F_a',
    name: 'Anna',
    greetings: annas_greetings === 'not_installed' ? 'not_installed' : 'installed',
    ...(options.characters === undefined ? {} : { characters: options.characters }),
  })
  const bruno = await a_node(story, { phone: 2, face_id: 'F_b', name: 'Bruno' })
  const elsewhere = { greetings: 'not_installed' } as const
  const carla = await a_node(story, { phone: 3, face_id: 'F_c', name: 'Carla', ...elsewhere })
  const dario = await a_node(story, { phone: 4, face_id: 'F_d', name: 'Dario', ...elsewhere })
  if (options.opened_at !== undefined) story.at(options.opened_at)
  await bonded_in_person(
    { node: anna, bond_id: 'L_b', name: 'Bruno' },
    { node: bruno, bond_id: 'L_a', name: 'Anna' },
    options.brunos_introduction === 'not_yet' ? 'not_the_second_s' : 'both',
  )
  await bonded_by_a_link(
    { node: carla, bond_id: 'L_a', name: 'Anna' },
    { node: anna, bond_id: 'L_c', name: 'Carla' },
  )
  await anna.prepares_a_ticket('L_d')
  await dario.prepares_a_ticket('L_a')
  if (annas_greetings === 'active') await anna.activates()
  await bruno.activates()
  const mailbox_of = async (node: NodeUnderTest, bond_id: string) =>
    (await node.my_mailbox_of(bond_id)).deposit_address
  return {
    story,
    anna,
    bruno,
    carla,
    dario,
    K_a: anna.key,
    K_b: bruno.key,
    K_c: carla.key,
    K_d: dario.key,
    D_mb: await mailbox_of(anna, 'L_b'),
    D_mc: await mailbox_of(anna, 'L_c'),
    D_md: await mailbox_of(anna, 'L_d'),
    D_b: await mailbox_of(bruno, 'L_a'),
    D_c: await mailbox_of(carla, 'L_a'),
    D_d: await mailbox_of(dario, 'L_a'),
  }
}

/** A letter a face writes: its id, the story's; the mailbox it is deposited at; what it invokes; its input. */
export interface ALetter {
  readonly id: string
  readonly at: string
  readonly invokes: post_value.invocation
  readonly input: unknown
}

/** The identity of a story's letter (F7, PST-2): a request of the kernel's, keyed by the story's id. */
export const the_identity_of = (node: NodeUnderTest, id: string): string =>
  node.the_kernels_request_of(id, 'story/a_letter')

/**
 * A face's letter, a real one: its node's post sends it as a request from
 * its face to the server's key at the mailbox the story names; the asker's
 * node runs (deposited), the server's serves (collected, handed to the
 * entry, its response deposited on the bond), the asker's collects (the
 * response taken by its entry). What the asker's post keeps under the
 * request's identity: `answered` with the event, or `waiting` when nothing
 * came back.
 */
export const asks = async (asker: NodeUnderTest, server: NodeUnderTest, letter: ALetter) => {
  const request_id = the_identity_of(asker, letter.id)
  await asker.sends_a_request({
    request_id,
    to: { key: server.key, mailbox: at(letter.at) },
    invokes: letter.invokes,
    input: letter.input,
  })
  await asker.runs()
  await server.serves()
  await asker.collects()
  const [kept] = await asker.the_answer_to(request_id)
  if (kept === undefined) throw new Error(`${asker.name}'s post keeps no request ${letter.id}`)
  return kept.answer
}

/** The answer of a response that came: its event. */
export const answered = (event: unknown) => ({ status: 'answered', event })

/** No response came: the request waits. */
export const waiting = { status: 'waiting' }

/**
 * A letter a face writes itself (the code is free, F2; PER-2): signed by its
 * face, unsigned, or with a signature given, one that need not hold; sealed
 * for the server's key and deposited at the mailbox it is for, or at another
 * (re-addressed, PST-4); the server's node collects. The envelope, as the
 * relay keeps it.
 */
export const writes = async (
  writer: NodeUnderTest,
  server: NodeUnderTest,
  letter: ALetter,
  signed: (written: post_value.letter) => Promise<Signed>,
  deposited_at: string = letter.at,
): Promise<string> => {
  const written = writer.a_request({
    identity: the_identity_of(writer, letter.id),
    to: letter.at,
    invokes: letter.invokes,
    input: letter.input,
  })
  const envelope = await writer.an_envelope_of(written, server.key, await signed(written))
  await writer.deposits(deposited_at, envelope)
  await server.collects()
  return envelope
}

/** The entries of the trees' trace a node kept since a count (F6, PER-14). */
export const traced_since = (node: NodeUnderTest, count: number) => node.tree_traced.slice(count)

/** The facts a node recorded, by the paths and payloads of their parts, in order, those of a domain. */
export const facts_of = async (node: NodeUnderTest, domain: string) =>
  (await node.recorded()).flatMap((fact) =>
    fact.parts
      .filter((part) => part.path.startsWith(domain))
      .map((part) => ({ path: part.path, payload: part.payload })),
  )

/** The envelopes the relay keeps at a node's mailboxes: what was deposited for it. */
export const deposited_for = async (node: NodeUnderTest): Promise<number> =>
  (await node.at_my_mailboxes()).length
