// The harness of the step's checks on the oracle with two nodes (plan.md
// step 12, "Checks"; F7, F8, EXT-2, EXT-4, EXT-6, EXT-7, EXT-12, EXT-15;
// part 12.4). Anna's, Bruno's and Carla's phones of the post's stories
// (`../post/harness.ts`: one relay, a face made in each safe, the requests
// of `post`, a transport where a story injects its faults, the story's
// clock), each with the office of the extensions beside its address book
// (`./activations/harness.ts`, its bonds the other phones' faces and
// mailboxes), and greetings, the test extension, hosted in process through
// the boundary's messages (`a_hosted_extension`, `in_process`) over its
// partition of the node's. Two cells per phone, the post's and the
// office's, side by side as their harnesses make them; one cell is the
// stack's (step 17).
//
// The asker's side is the kernel's of part 12.4: greetings' leaf on `self`
// invoked through the kernel's host; its delivery calling the kernel's port
// of requests, wired with the phone's post, its address book and its
// office. The server's side is the kernel's entry, played as step 13 will
// write it (13 writes auth, the four persona trees and the inbound path):
// the letters collected and opened (`post`); a request routed (`route`,
// over the office's reads: installed, active, offered to the bond of the
// `Caller`'s key), silent with its case in the kernel's trace, or through
// the gate and the leaf by the library's mounted port on `known`, below a
// stand-in of the kernel's node, its event the response, deposited once
// (PST-9); a response taken (PST-7), or annotated (`a_response_not_awaited`).
// The extension's executor waits on a real timer, and every wait of a story
// is bounded (the rule on loops, A, 20 Nov 2026).

import {
  a_hosted_extension,
  as_traced,
  compose_an_extension,
  route,
  the_kernels_offer,
  the_kernels_reads,
  the_manifest_to_accept,
  the_port_of_requests,
  type ABondToAskOn,
  type ANotice,
  type ARequestAsItCame,
  type Composed,
  type Hosted,
  type Loaded,
  type TheKernelsTraced,
  type Transport,
} from '@q-mino/adapters-common'
import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import { the_identity_of_a_request } from '@q-mino/domains/post/_dsl.ts'
import * as post_value from '@q-mino/domains/post/_value.ts'
import { greetings } from '@q-mino/greetings'
import manifest_json from '@q-mino/greetings/manifest.json' with { type: 'json' }
import { z } from 'zod'
import { in_process, partitions } from '../../src/index.ts'
import { all, a_story, entries_of, type PhoneUnderTest } from '../post/harness.ts'
import { fake_primitives } from '../seals/primitives.ts'
import { a_phone as an_office } from './activations/harness.ts'

/** Greetings' manifest as its build writes it (EXT-10): what the phones install. */
export const greetings_manifest: unknown = manifest_json

/** The effect of greetings whose deliveries are its requests (EXT-12). */
export const ask_for_a_greeting_back = 'business/greetings/effect/ask_for_a_greeting_back'

/** An extension composed from its manifest (EXT-4), or the test fails with the composition's message. */
export const composed_from = (manifest: unknown): Composed => {
  const composition = compose_an_extension(the_kernels_offer([]))(manifest)
  if (composition.composition === 'a_fault') throw new Error(composition.message)
  return composition.composed
}

/** Turns of the event loop, each a real timer, until a condition holds: at most about two seconds, else the story fails. */
export const until = async (
  holds: () => boolean | Promise<boolean>,
  what: string,
): Promise<void> => {
  for (let round = 0; round < 1000; round += 1) {
    if (await holds()) return
    await new Promise<void>((done) => {
      setTimeout(done, 2)
    })
  }
  throw new Error(`${what}: it did not come to pass`)
}

// A stand-in of the kernel's node at the top of `known` (EXT-5, EXT-6,
// PER-7), which step 13 writes with auth's lookups and the four persona
// trees, and which replaces this one: it takes the `Caller` the post gave
// (PER-5, 1), looks up the bond of the Caller's key over the address book
// (`not_found` when none, PER-14), and gives the bond, its identity and its
// name. Written with the library's builders, as a tree of the kernel is,
// so that greetings' leaves on `known` are served below it by
// `zz.mounted_leaf_ports` as step 13's tree will serve them (PER-6, "A
// mounted folder"). Not q-'s tree: the test's.
const { lookup, node } = zz.builders_at<zz.RootContext>()

/** The bond of a face's key (stand-in of auth's lookup, step 13): its identity and the name the user gives it. */
const the_bond_of_a_key = lookup({
  key: post_value.face_key,
  value: z.strictObject({ id: z.string().min(1), name: z.string().min(1) }),
})

/** The stand-in of the kernel's node at the top of `known` (step 13 replaces it). */
const the_kernels_node_on_known = node({
  takes: z.strictObject({ caller: post_value.caller }),
  looks_up: {
    the_bond_of_the_caller: {
      lookup: the_bond_of_a_key,
      of: (context) =>
        context.caller.is === 'a_face'
          ? { answer: 'known', value: context.caller.key }
          : { answer: 'not_known' },
      /** A key of no bond: "not found", no reason (PER-14). */
      when_not_known: 'not_found',
    },
  },
  gives: () => (found) => ({ bond: found.the_bond_of_the_caller }),
})

/** The registry of the stand-in (DOM-24): the lookup in auth's folder, the node at the top of `known`. */
const the_kernels_registry = {
  'auth/bonds/lookup/the_bond_of_a_key': the_bond_of_a_key,
  'persona/known/node/known': the_kernels_node_on_known,
} satisfies zz.Registry

/** The context the stand-in gives the leaves below it, as the hosting reads it. */
const the_context_on_known = z.object({
  caller: z.object({ is: z.literal('a_face'), key: z.string() }),
  bond: z.object({ id: z.string(), name: z.string() }),
})

/** The port the stand-in's tree gives greetings' leaves on `known`, as step 13's entry invokes it. */
type TheLeavesOnKnown = zz.PortByPath<zz.EntryOf<typeof the_kernels_node_on_known>>

/** A fact as greetings' partition keeps it, as far as a story reads it: its parts' paths. */
const a_fact_kept = z.object({ parts: z.array(z.object({ path: z.string() })) })

/** Whether greetings is installed on a phone, and whether its user activated it. */
export type Greetings = 'not_installed' | 'installed' | 'active'

/** A bond a node starts with: its identity, its name, and the phone of the face it is with. */
export interface BondWith {
  readonly id: string
  readonly name: string
  readonly with: PhoneUnderTest
}

/** The story's clock, as every phone reads it. */
type Story = Awaited<ReturnType<typeof a_story>>

/**
 * A node of the story: the post's phone, its office and address book, its
 * kernel's reads, port of requests, trace and entry, greetings hosted over
 * its partition (when installed), and what a story reads of it.
 */
export const a_node = async (
  story: Story,
  post: PhoneUnderTest,
  start: {
    readonly bonds: readonly BondWith[]
    readonly greetings: Greetings
    readonly characters?: number
  },
) => {
  const clock = story.clock
  const traced: TheKernelsTraced[] = []
  const trace = (entry: TheKernelsTraced): void => {
    traced.push(entry)
  }
  const tree_traced: unknown[] = []
  const notices: ANotice[] = []
  const to_the_extension: boundary.a_message_to_an_extension[] = []
  const storage = partitions({ characters: start.characters ?? 1_000_000 })
  let composed: Composed | undefined =
    start.greetings === 'not_installed' ? undefined : composed_from(greetings_manifest)
  const the_office = await an_office({
    face: post.face_id,
    face_key: post.key,
    bonds: start.bonds.map((bond) => ({
      id: bond.id,
      name: bond.name,
      their_face: { key: bond.with.key, mailbox: bond.with.mailbox },
    })),
    installed: composed === undefined ? [] : [the_manifest_to_accept(composed.manifest)],
    at: clock.now(),
    clock,
  })
  let office: Omit<typeof the_office, 'updated_to'> = the_office
  const reads = the_kernels_reads({
    clock,
    office: {
      an_extension: (context, input) => office.office.an_extension(context, input),
      the_extensions_offered_to_a_bond: (context, input) =>
        office.office.the_extensions_offered_to_a_bond(context, input),
    },
  })

  /** The bond a call names, as the port of requests reads it (PST-5): its card, my face's key, or gone. */
  const the_bond = async (bond: boundary.bond): Promise<ABondToAskOn> => {
    const [card] = entries_of(await office.a_bond(bond))
    if (card === undefined) return { bond: 'gone' }
    const face = entries_of(await office.my_faces()).find((mine) => mine.id === card.my_face_id)
    if (face === undefined) throw new Error(`no face ${card.my_face_id} of the bond ${bond}`)
    return {
      bond: 'kept',
      from: { face_id: card.my_face_id, key: face.public_key },
      to: { key: card.their_face.key, mailbox: card.their_mailbox },
    }
  }
  const port_of_requests = the_port_of_requests({
    clock,
    machine: post.machine_of(post.face_id),
    post: {
      send_a_request: post.post.send_a_request,
      the_answer_to_a_request: post.post.the_answer_to_a_request,
      log: post.log,
    },
    the_bond,
    extensions: { is_active: reads.is_active, is_offered: reads.is_offered },
    trace,
  })

  /** The bond of a face's key in the address book (the stand-in's lookup, step 13): kept, by its key. */
  const the_bond_of = async (
    key: string,
  ): Promise<{ readonly id: string; readonly name: string } | undefined> => {
    const found = entries_of(await office.my_bonds()).find((bond) => bond.their_face.key === key)
    return found === undefined ? undefined : { id: found.id, name: found.name }
  }
  const lookups = zz.lookup_ports({
    registry: the_kernels_registry,
    lookups: { the_bond_of_a_key },
  })({
    the_bond_of_a_key: async (key) => {
      const bond = await the_bond_of(key)
      return bond === undefined ? { answer: 'not_known' } : { answer: 'known', value: bond }
    },
  })

  /** The transport to greetings' realm, in process (EXT-13), each message to it kept for the story. */
  const transport: Transport = (to_the_kernel) => {
    const realm = in_process((send) =>
      greetings({
        clock,
        elapsed: () =>
          new Promise<void>((done) => {
            setTimeout(done, 2)
          }),
        send,
      }),
    )(to_the_kernel)
    return {
      to_the_extension: (message) => {
        to_the_extension.push(message)
        realm.to_the_extension(message)
      },
      unload: realm.unload,
    }
  }

  /** Greetings hosted, and its leaves on `known` below the stand-in, wired from what is composed. */
  const wired = (extension: Composed) => {
    const hosted = a_hosted_extension({
      composed: extension,
      transport,
      is_active: () => reads.is_active(extension.manifest.name),
      the_port_of_requests: port_of_requests({
        name: extension.manifest.name,
        touches: extension.manifest.touches,
      }),
      its_storage: storage.of(extension.manifest.name),
      the_bond_on_known: (context) => {
        const given = the_context_on_known.parse(context)
        return { bond: given.bond.id, peer_key: given.caller.key, bond_name: given.bond.name }
      },
      trace,
      notices: (notice) => {
        notices.push(notice)
      },
      clock,
      a_while: () =>
        new Promise<void>((done) => {
          setTimeout(done, 5)
        }),
    })
    const surface = extension.surfaces.known
    if (surface === undefined) throw new Error(`${extension.manifest.name} has no leaf on known`)
    const on_known: TheLeavesOnKnown = zz.mounted_leaf_ports({
      registry: the_kernels_registry,
      top: the_kernels_node_on_known,
      at: 'persona/known',
      name: extension.manifest.name,
    })({
      invoked: { 'auth/bonds': lookups },
      trace: (entry) => {
        tree_traced.push(entry)
      },
      surface,
      invokes: hosted.invokes('known'),
      outside_the_surface: hosted.outside_the_surface('known'),
    })
    return { hosted, on_known }
  }
  let kernel = composed === undefined ? undefined : wired(composed)
  // A node whose code is changed (the code is free, F2): what its entry
  // deposits in place of the leaf's event.
  let tampered: ((event: zz.EventByPath) => unknown) | undefined = undefined

  /** Greetings hosted, which the story installed. */
  const the_hosted = (): Hosted => {
    if (kernel === undefined) throw new Error('greetings is not installed')
    return kernel.hosted
  }
  /** Greetings' manifest in the office's words, as the user is shown it. */
  const shown = () => {
    if (composed === undefined) throw new Error('greetings is not installed')
    return the_manifest_to_accept(composed.manifest)
  }
  /** The names of the extensions installed (EXT-7): the composition's. */
  const installed = (): readonly string[] =>
    composed === undefined ? [] : [composed.manifest.name]

  /** What a mounted leaf answered: its first event, or nothing (the extension fell, or is not running). */
  const the_answer_of = async (
    events: AsyncIterable<zz.EventByPath>,
  ): Promise<zz.EventByPath | undefined> => {
    try {
      return (await all(events))[0]
    } catch {
      // A fall, or an extension not running: no response (F8, EXT-15); the hosting traced it.
      return undefined
    }
  }

  /**
   * A request opened from the mailbox (EXT-6, F8; step 13's): routed by
   * what it invokes, over the office's reads and the bond of the `Caller`'s
   * key; silent, traced with its case; or through the mounted port below
   * the stand-in, its first event the response, written to the bond's
   * mailbox and deposited once (PST-9). A request whose `Caller` has no bond
   * gets none (F7); the kernel's own leaves are step 13's.
   */
  const a_request_came = async (
    letter: Extract<post_value.letter, { readonly is: 'a_request' }>,
    caller: post_value.caller,
  ): Promise<void> => {
    const as_it_came: ARequestAsItCame = {
      invokes: letter.invokes,
      letter: letter.identity,
      caller,
      now: clock.now(),
      version: letter.invokes.version,
    }
    const bond = caller.is === 'a_face' ? await the_bond_of(caller.key) : undefined
    const names = installed()
    const routed = route({
      invokes: letter.invokes,
      installed: names,
      active: await reads.the_active_among(names),
      offered_to_the_bond_of_the_caller:
        bond === undefined
          ? []
          : await reads.the_extensions_offered_to(boundary.bond.parse(bond.id)),
    })
    if (routed.routed === 'to_silence') {
      trace({ why: routed.why, request: as_it_came })
      return
    }
    if (routed.routed === 'to_the_kernel' || kernel === undefined) return
    const answered = await the_answer_of(
      kernel.on_known(
        {
          now: zz.in_zone(clock.time_zone)(clock.now()),
          time_zone: clock.time_zone,
          caller,
          version: zz.semver.parse(letter.invokes.version),
          // The entry's scope (`Caller` + hat), which the hosting replaces by the bond's (EXT-2).
          operation: {
            id: zz.operation_id.parse(letter.identity),
            scope: `known/${caller.is === 'a_face' ? caller.key : caller.id}`,
          },
          correlation: zz.correlation.parse(letter.identity),
        },
        { leaf: letter.invokes.use_case, input: letter.input },
      ),
    )
    if (answered === undefined || bond === undefined || caller.is !== 'a_face') return
    const [card] = entries_of(await office.a_bond(bond.id))
    if (card === undefined) return
    await post.deposits_a_response({
      answers: letter.identity,
      to: { key: caller.key, mailbox: card.their_mailbox },
      event: tampered === undefined ? answered : tampered(answered),
    })
  }

  /**
   * A response opened from the mailbox (F7, PST-7; step 13's): taken under
   * its identity, the request's answer if it waits and went to that face
   * (a copy of one taken is its recorded fact); else annotated in the
   * kernel's trace with what `post` answered. An anonymous one is never
   * taken (PST-7).
   */
  const a_response_came = async (
    letter: Extract<post_value.letter, { readonly is: 'a_response' }>,
    caller: post_value.caller,
  ): Promise<void> => {
    const response = { letter: letter.identity, answers: letter.answers, caller, now: clock.now() }
    if (caller.is !== 'a_face') {
      trace({ why: 'a_response_not_awaited', response, answered: 'anonymous, never taken' })
      return
    }
    const taken = (
      await post.take_a_response(
        { request_id: letter.answers, from: caller.key, event: letter.event },
        { operation: letter.identity },
      )
    ).at(-1)
    if (taken?.outcome === 'applied') return
    trace({ why: 'a_response_not_awaited', response, answered: as_traced(taken) })
  }

  let operations = 0
  return {
    post,
    get office() {
      return office
    },
    reads,
    traced,
    tree_traced,
    notices,
    storage,
    to_the_extension,
    the_hosted,
    /** The port of requests of an extension of this node, by its name and its manifest's touches (EXT-2). */
    port_of_requests,
    /** Greetings' leaves on `known` below the stand-in, as step 13's entry invokes them. */
    on_known: (): TheLeavesOnKnown => {
      if (kernel === undefined) throw new Error('greetings is not installed')
      return kernel.on_known
    },
    /** The node's code changed (the code is free, F2): its responses carry this in place of the leaf's event. */
    tampers_with_its_responses: (change: (event: zz.EventByPath) => unknown): void => {
      tampered = change
    },
    /** The node starts greetings, if active (EXT-15): the phone started. */
    starts: (): Promise<Loaded> => the_hosted().load(),
    /** The phone closes: greetings stopped and unloaded (EXT-15), what it keeps in its partition. */
    closes: (): Promise<void> => the_hosted().unload(),
    /** The user activates greetings, accepting its manifest as shown, and the kernel loads it (EXT-7, EXT-15). */
    activates: async (): Promise<Loaded> => {
      await office.activate_an_extension(shown())
      return the_hosted().load()
    },
    /** The user deactivates greetings, and the kernel unloads it (EXT-7, EXT-15). */
    deactivates: async (): Promise<void> => {
      await office.deactivate_an_extension('greetings')
      await the_hosted().unload()
    },
    /** The user withdraws greetings' offer from a bond (EXT-7). */
    withdraws_the_offer_from: (bond: string) =>
      office.withdraw_the_offer_from_a_bond({ name: 'greetings', bond }),
    /** The user removes a bond from her address book (BND-6). */
    removes_a_bond: (bond: string) => office.remove_a_bond(bond),
    /**
     * An update of the app with this manifest of greetings (EXT-7, EXT-10):
     * greetings unloaded, composed again, the office with the manifest
     * installed now (the same cells, the same partition), then loaded, as a
     * node starts: what its load came to.
     */
    updated_to: async (manifest: unknown): Promise<Loaded> => {
      await kernel?.hosted.unload()
      const updated = composed_from(manifest)
      composed = updated
      office = the_office.updated_to([the_manifest_to_accept(updated.manifest)])
      kernel = wired(updated)
      return kernel.hosted.load()
    },
    /** Anna taps "Saluta" on a bond: greetings' leaf on `self`, invoked through the kernel's host (EXT-2); the greeting its event names. */
    greets: async (bond: string): Promise<string> => {
      operations += 1
      const events = await all(
        the_hosted().invokes('self')({
          leaf: 'usecase/greet_a_bond',
          version: '1.0.0',
          context: {},
          operation: {
            id: zz.operation_id.parse(`${post.face_id}-greets-${String(operations)}`),
            scope: 'self/the_user',
          },
          input: { bond },
        }),
      )
      const greeting_id: unknown = Reflect.get(
        Object(Reflect.get(Object(events[0]), 'payload')),
        'greeting_id',
      )
      if (typeof greeting_id !== 'string') throw new Error(`no greeting: ${JSON.stringify(events)}`)
      return greeting_id
    },
    /** The kernel's entry, played (step 13): every letter that came to the mailbox, opened; a request routed and served or silent; a response taken or annotated. */
    the_entry: async (): Promise<void> => {
      for (const each of await post.opens_what_came()) {
        if (each.opened.outcome !== 'opened') continue
        const letter = each.opened.letter
        if (letter.is === 'a_request') await a_request_came(letter, each.opened.caller)
        else await a_response_came(letter, each.opened.caller)
      }
    },
    /** The identity of a request of greetings' (F7, PST-2), as this node's kernel composes it. */
    the_request_of: (id: string, effect: string = ask_for_a_greeting_back): string =>
      the_identity_of_a_request(post.machine_of(post.face_id))({
        of: 'an_extension',
        extension: 'greetings',
        effect,
        id,
      }),
    /** The requests the node's post recorded as sent, by their identity. */
    sent: async (): Promise<readonly string[]> =>
      (await post.recorded()).flatMap((fact) =>
        fact.parts
          .filter((part) => part.path === 'post/requests/fact/a_request_has_been_sent')
          .map((part) =>
            String(Reflect.get(Object(Reflect.get(Object(part.payload), 'sent_request')), 'id')),
          ),
      ),
    /** A greeting as greetings keeps it in its partition (`state/greeting/<id>`): its bond, its words, where it stands. */
    the_greeting: (greeting_id: string): unknown =>
      storage.kept('greetings').get(`state/greeting/${greeting_id}`),
    /** Whether a greeting is closed, as its partition keeps it. */
    is_closed: (greeting_id: string): boolean =>
      JSON.stringify(
        storage.kept('greetings').get(`state/greeting/${greeting_id}`) ?? null,
      ).includes('"stage":"closed"'),
    /** The greetings back greetings sent, as its partition keeps them. */
    greetings_back: (): readonly unknown[] =>
      [...storage.kept('greetings')]
        .filter(([key]) => key.startsWith('state/greeting_back/'))
        .map(([, value]) => value),
    /** The facts greetings recorded in its partition, in order, by the last segment of each part's path. */
    facts_of_greetings: (): readonly string[] =>
      [...storage.kept('greetings')]
        .filter(([key]) => key.startsWith('fact/'))
        .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .flatMap(([, value]) =>
          a_fact_kept.parse(value).parts.map((part) => part.path.split('/').at(-1) ?? ''),
        ),
    /** The dead letters greetings told the kernel (EXT-2), by their names. */
    dead_letters: (): readonly string[] =>
      notices.flatMap((notice) =>
        notice.notice.message === 'dead_letter' ? [notice.notice.letter] : [],
      ),
    /** The kernel's trace, by why. */
    whys: (): readonly string[] => traced.map((entry) => entry.why),
  }
}

/** A node of the story. */
export type NodeUnderTest = Awaited<ReturnType<typeof a_node>>

/**
 * The story of two nodes (three phones): one relay; Anna's phone, bonded to
 * Bruno (`B-BRUNO`) and Carla (`B-CARLA`); Bruno's, bonded to Anna
 * (`B-ANNA`); Carla's, bonded to Anna (`B-ANNA`), with no bond to Bruno.
 * Greetings is installed and activated on each, unless the story says
 * otherwise, and started where active. Friday 20 November 2026, 10:00 UTC.
 */
export const two_nodes = async (
  options: {
    readonly anna?: Greetings
    readonly bruno?: Greetings
    readonly carla?: Greetings
    readonly brunos_characters?: number
  } = {},
) => {
  const story = await a_story(fake_primitives)
  const anna = await a_node(story, story.anna, {
    bonds: [
      { id: 'B-BRUNO', name: 'Bruno', with: story.bruno },
      { id: 'B-CARLA', name: 'Carla', with: story.carla },
    ],
    greetings: options.anna ?? 'active',
  })
  const bruno = await a_node(story, story.bruno, {
    bonds: [{ id: 'B-ANNA', name: 'Anna', with: story.anna }],
    greetings: options.bruno ?? 'active',
    ...(options.brunos_characters === undefined ? {} : { characters: options.brunos_characters }),
  })
  const carla = await a_node(story, story.carla, {
    bonds: [{ id: 'B-ANNA', name: 'Anna', with: story.anna }],
    greetings: options.carla ?? 'active',
  })
  const nodes = [
    [anna, options.anna],
    [bruno, options.bruno],
    [carla, options.carla],
  ] as const
  for (const [each, greetings_on_it] of nodes) {
    if ((greetings_on_it ?? 'active') === 'active') await each.activates()
  }
  return {
    story,
    anna,
    bruno,
    carla,
    /** The phones' clock reads this time of the day. */
    at: story.at,
    /** The phones' clock reads this time, and the asker's post runs (its sendings again, its waits): `runs_at`. */
    runs_at: async (asker: NodeUnderTest, time_of_day: string): Promise<void> => {
      story.at(time_of_day)
      await asker.post.runs()
    },
  }
}
