// The harness of the post's stories (TST-2, TST-3; README of `post`, §
// Stories to prove). The stories of the protocol (1–6) take a face known by
// its private key, its machine over the primitives port the suite gives
// (`a_face`). The stories of the requests (7–16) take phones of q-'s oracle:
// one cell each with the safe and the requests (MBX-7), a face made in the
// safe, the post's machine bound to it over the safe's reads (PST-3, PST-10),
// the effect executor of the requests, whose deposits go through the post's
// mailbox port over the relay's oracle (`../relay/harness.ts`), with loss,
// duplication and abort injected on the transport (TST-4). The port of
// requests (step 12.4) and the kernel's entry (step 13) are played as they
// will be wired: `send_a_request` under the request's identity, a response
// opened and taken under its own; the peer's leaf answers from what it
// recorded under the request's identity, as its duplicate branch would
// (DOM-11). A story observes what the ports give: the events of a command,
// the entries of a read, the facts of the log, the executor's letters, the
// envelopes at the relay; never the cell's state. The clock is the story's.

import * as zz from '@q-mino/domains/library'
import { majors as safe_majors } from '@q-mino/domains/seals/safe/_majors.ts'
import { registry as safe_registry } from '@q-mino/domains/seals/safe/_registry.ts'
import {
  keep_a_mailbox_key,
  keep_a_new_seed_and_its_face,
} from '@q-mino/domains/seals/safe/_usecase.ts'
import {
  base64url_of,
  bytes_of,
  opened_with,
  sealed_for,
  the_signature_holds,
  the_signature_of,
  type Bytes,
  type Primitives,
} from '@q-mino/domains/seals/safe/_dsl.ts'
import { majors as requests_majors } from '@q-mino/domains/post/requests/_majors.ts'
import { registry as requests_registry } from '@q-mino/domains/post/requests/_registry.ts'
import {
  close_a_request_with_no_response,
  send_a_request_again,
} from '@q-mino/domains/post/requests/_usecase.ts'
import { the_deposit_of_a_letter } from '@q-mino/domains/post/requests/_dsl.ts'
import {
  a_letter_in_an_envelope,
  the_identity_of_a_request,
  the_identity_of_the_response_to,
  the_letter_in_an_envelope,
  the_operation_of_a_deposit,
  type Deposited,
  type MailboxPort,
  type Machine,
} from '@q-mino/domains/post/_dsl.ts'
import type * as post_value from '@q-mino/domains/post/_value.ts'
import {
  cell,
  log,
  no_request,
  no_secret,
  post_ports,
  seals_ports,
  seen_by,
  type PostState,
  type SealsState,
} from '../../src/index.ts'
import { a_relay, nobody, showing, type RelayUnderTest } from '../relay/harness.ts'
import { the_safe_s_machine } from '../seals/harness.ts'

/** The zone of the phones' clock, in the stories. */
export const time_zone = zz.time_zone.parse('UTC')

/** The relay of the stories (BND-4): one, in stage 1. */
export const the_relay = 'https://relay.q-mino.test'

/** The scope of the port of requests' calls (EXT-2), under which it sends: step 12.4 wires it. */
export const the_scope_of_the_port_of_requests = 'the_port_of_requests'

/** The scope of the kernel's entry, under which it gives a response back (EXT-6): step 13 wires it. */
export const the_scope_of_the_kernel_s_entry = 'the_kernel_s_entry'

/** The effect of Anna's ping pong that asks for a pong (EXT-12, step 14), whose names these only illustrate. */
export const ask_for_a_pong = 'ping_pong/business/pings/effect/ask_for_a_pong'

/** What Anna's ping pong invokes on Bruno's node (EXT-5): the leaf `ping` of `known`. */
export const a_ping: post_value.invocation = {
  of: 'an_extension',
  extension: 'ping_pong',
  persona: 'known',
  use_case: 'ping',
  version: '1.0.0',
}

/** Every event of a port's stream, until it ends. */
export const all = async <event>(events: AsyncIterable<event>): Promise<readonly event[]> => {
  const every: event[] = []
  for await (const event of events) every.push(event)
  return every
}

/** A command's last event, the one that closes its stream. */
export const last_of = <event>(events: readonly event[]): event => {
  const last = events.at(-1)
  if (last === undefined) throw new Error('a command gave no event')
  return last
}

/**
 * Everything already set going has run its course, up to its next wait: the
 * oracle and the harness wait on nothing but promises; a delivery of a
 * deposit goes through the safe's reads and the relay's tree, so it takes
 * more turns than a story of one domain.
 */
export const quiet = async (): Promise<void> => {
  for (let turn = 0; turn < 25; turn += 1) {
    await new Promise<void>((done) => {
      setTimeout(done, 0)
    })
  }
}

/** The hash of the post's machine (PST-3): BLAKE2b-256 of bytes in base64url, told in base64url. */
const the_hash_over = (primitives: Primitives) => (content: string) =>
  base64url_of(primitives.blake2b_256(bytes_of(content)))

/**
 * A face known by its private key, with no safe (stories 1–6): its key, and
 * its machine over the primitives port, as the safe would compute it (SEA-6).
 */
export const a_face = (primitives: Primitives, private_key: Bytes) => {
  const secret = base64url_of(private_key)
  const key = base64url_of(primitives.public_key_of(private_key))
  const machine: Machine = {
    sign: (content) => Promise.resolve(the_signature_of(primitives)(secret, content)),
    seal_for: sealed_for(primitives),
    open: (sealed_content) => Promise.resolve(opened_with(primitives)(secret, sealed_content)),
    signature_holds: the_signature_holds(primitives),
    hash: the_hash_over(primitives),
  }
  return { key, machine }
}

/** A face of a story, by its private key. */
export type Face = ReturnType<typeof a_face>

/**
 * The world's random bytes for a phone: each draw new, of the length asked,
 * from a number the story gives each phone, so that two phones never draw
 * the same seed (TST-3).
 */
const a_world_of = (primitives: Primitives, phone: number): Primitives => {
  let draws = 0
  return {
    ...primitives,
    random_bytes: (length): Bytes => {
      draws += 1
      return Uint8Array.from({ length }, (_, at) => (phone * 101 + draws * 37 + at * 11) & 255)
    },
  }
}

/**
 * A fault of the transport between a phone and the relay, injected on one
 * deposit (TST-4): lost on its way, so the relay never sees it; kept by the
 * relay and its answer lost; sent twice; aborted, the transport throwing;
 * refused by a relay whose limits are not MBX-1's (its software is its own,
 * F2), which answers as the oracle's relay answers what it does not take.
 */
export type Fault = 'lost' | 'answer_lost' | 'doubled' | 'aborted' | 'refused'

/** A deposit the transport carried, as the story reads it: under which operation, on which D, and what the relay answered. */
export interface Carried {
  readonly operation: string
  readonly deposit_address: string
  readonly fault: Fault | 'none'
  readonly answered: Deposited
}

/**
 * The post's mailbox port over the relay's oracle (GR-6, PST-10): a
 * transport that deposits as the relay's depositor, under the post's
 * operation, and tells the relay's answer in the post's words; the faults
 * the story injects, one per deposit, in order.
 */
export const a_transport = (relay: RelayUnderTest, now: () => string) => {
  const faults: Fault[] = []
  const carried: Carried[] = []
  /** The relay's answer, in the post's words (PST-10). */
  const told = (events: readonly { readonly event: string }[]): Deposited => {
    const answer = events.at(-1)?.event
    if (answer === 'the_envelope_is_kept') return { outcome: 'kept' }
    if (answer === 'identity_already_used') return { outcome: 'kept_already' }
    return { outcome: 'refused', why: answer ?? 'no_event' }
  }
  const port: MailboxPort = {
    deposit: async (deposit) => {
      const fault = faults.shift() ?? 'none'
      const kept = (answered: Deposited): Deposited => {
        carried.push({
          operation: deposit.operation,
          deposit_address: deposit.deposit_address,
          fault,
          answered,
        })
        return answered
      }
      if (fault === 'aborted') {
        kept({ outcome: 'unreachable' })
        throw new Error('the transport aborted')
      }
      if (fault === 'lost') return kept({ outcome: 'unreachable' })
      if (fault === 'refused') return kept({ outcome: 'refused', why: 'invalid_request' })
      const depositor = await relay.as(nobody, '1.0.0')
      const once = () =>
        all(
          relay.depositor.deposit_an_envelope(
            depositor.at(now(), { operation: deposit.operation }),
            { deposit_address: deposit.deposit_address, envelope: deposit.envelope },
          ),
        )
      const first = await once()
      const answered = fault === 'doubled' ? await once() : first
      return kept(fault === 'answer_lost' ? { outcome: 'unreachable' } : told(answered))
    },
  }
  return {
    port,
    /** The next deposits meet these faults, in order (TST-4). */
    will: (...next: readonly Fault[]) => {
      faults.push(...next)
    },
    /** Every deposit the transport carried, in order. */
    carried: (): readonly Carried[] => [...carried],
  }
}

/** The story's clock: every phone reads it; moved, it ends every wait asked for, so that the executors look again. */
export const a_clock = (start: string) => {
  let instant = zz.date_time.parse(start)
  const waits: (() => void)[] = []
  return {
    now: () => instant,
    clock: { now: () => instant, time_zone },
    elapsed: () =>
      new Promise<void>((over) => {
        waits.push(over)
      }),
    at: (to: string) => {
      instant = zz.date_time.parse(to)
      for (const over of waits.splice(0)) over()
    },
  }
}

/** A story's clock. */
export type Clock = ReturnType<typeof a_clock>

/** A phone's cell: the safe and the requests, side by side (MBX-7). */
type PhoneState = SealsState & PostState

/** How a phone starts: its number for the world's draws, its face, the collect secret of its mailbox. */
export interface Start {
  readonly phone: number
  readonly face_id: string
  readonly collect_secret: string
  readonly redelivered?: boolean
}

/** A command's operation, if the story names it. */
export interface Sent {
  readonly operation?: string
}

/** A letter a phone opened at its mailbox, with the deposit it came in. */
export interface Opened {
  readonly deposit_id: string
  readonly opened: post_value.opened_envelope
}

/** A phone of a story, over a primitives port, its relay and its clock, as the oracle starts it. */
export const a_phone = async (
  primitives: Primitives,
  relay: RelayUnderTest,
  time: Clock,
  start: Start,
) => {
  const made = cell<PhoneState>({
    initial: { ...no_secret, ...no_request },
    ...(start.redelivered === undefined ? {} : { redelivered: start.redelivered }),
  })
  const world = a_world_of(primitives, start.phone)
  const versions = await zz.versions([safe_majors, requests_majors])({
    stored: made.stored_versions,
  })
  const safe = seals_ports(seen_by<SealsState, PhoneState>(made), world)(versions)
  const post = post_ports(seen_by<PostState, PhoneState>(made))(versions)
  const when = () => ({ now: zz.in_zone(time_zone)(time.now()), time_zone })
  let operations = 0
  /** The context of a command sent under an operation and a scope (DOM-11), its fingerprint over its use case's path and its input. */
  const sent_as =
    (path: string, input: unknown, scope: string) =>
    (sent: Sent = {}): zz.CommandRootContext => {
      operations += 1
      const id = sent.operation ?? `op-${String(start.phone)}-${String(operations)}`
      return {
        now: zz.in_zone(time_zone)(time.now()),
        time_zone,
        operation: { id: zz.operation_id.parse(id), scope },
        correlation: zz.correlation.parse(`correlation-${id}`),
        fingerprint: zz.fingerprint_of({ path, input }),
      }
    }
  /**
   * The post's machine of a face of the phone (PST-3, PST-10): to sign and to
   * open, the safe's reads; to seal and to check, the safe's pure functions;
   * the hash, BLAKE2b-256. A face the safe has not made signs nothing: a
   * fault of the wiring.
   */
  const machine_of = (face_id: string): Machine => ({
    sign: async (content) => {
      const [face] = entries_of(
        await all(safe.a_content_signed_by_a_face(when(), { face_id, content })),
      )
      if (face === undefined) throw new Error(`no face ${face_id} to sign`)
      return face.signature
    },
    seal_for: sealed_for(world),
    open: async (sealed_content) => {
      const [face] = entries_of(
        await all(safe.a_sealed_content_opened_by_a_face(when(), { face_id, sealed_content })),
      )
      if (face === undefined) throw new Error(`no face ${face_id} to open`)
      return face.opened
    },
    signature_holds: the_signature_holds(world),
    hash: the_hash_over(world),
  })
  const transport = a_transport(relay, time.now)
  const facts = log(made)
  const the_safe_s_executor = zz.effect_executor({
    registry: safe_registry,
    versions,
    returns: { keep_a_new_seed_and_its_face, keep_a_mailbox_key },
  })(the_safe_s_machine(world))
  const the_post_s_executor = zz.effect_executor({
    registry: requests_registry,
    versions,
    returns: { send_a_request_again, close_a_request_with_no_response },
  })({
    'post/requests/effect/deposit_a_letter': the_deposit_of_a_letter(machine_of, transport.port),
    'post/requests/effect/wait_to_send_again': zz.returns_the_payload,
    'post/requests/effect/wait_for_the_response': zz.returns_the_payload,
  })
  const ports = {
    outbox: made.outbox,
    state: made.executor,
    clock: time.clock,
    elapsed: time.elapsed,
  }
  /**
   * The phone runs until it is quiet (DOM-14): both executors started, what
   * is due delivered, then stopped, as a phone closed. A wait not due yet
   * stays in the outbox; an entry tried again after a pause comes when the
   * phone runs again. A fall of the post's executor is thrown (`stop`).
   */
  const runs = async (): Promise<void> => {
    const running = [
      the_safe_s_executor({ ...ports, returns: safe }),
      the_post_s_executor({ ...ports, returns: post }),
    ]
    await quiet()
    for (const each of running) await each.stop()
  }
  // The face of the phone, made in the safe as the first start makes it
  // (SEA-3, part 11.2): asked for, its seed drawn by the safe's executor.
  const face_input = { face_id: start.face_id }
  await all(
    safe.make_a_face_from_a_new_seed(
      sent_as(
        'seals/safe/usecase/make_a_face_from_a_new_seed',
        face_input,
        'reaction/first_face',
      )(),
      face_input,
    ),
  )
  await runs()
  const [made_face] = entries_of(
    await all(safe.a_content_signed_by_a_face(when(), { face_id: start.face_id, content: 'AA' })),
  )
  if (made_face === undefined) throw new Error(`the face ${start.face_id} was not made`)
  const key: string = made_face.public_key
  const deposit_address = `hash-of-${start.collect_secret}`
  /** A phone's mailbox as the bond with it gives it: its D, at the relay. */
  const mailbox = { deposit_address, relays: [the_relay] }
  const seen = new Set<string>()
  /** What a peer's leaf answered under a request's identity (DOM-11), as its duplicate branch keeps it: the harness plays it (step 13). */
  const served = new Map<string, unknown>()

  /** The phone's identity of one of its requests (F7, PST-2): of its ping pong's effect, by the entry's id. */
  const the_request = (entry: string, effect: string = ask_for_a_pong): string =>
    the_identity_of_a_request(machine_of(start.face_id))({
      of: 'an_extension',
      extension: 'ping_pong',
      effect,
      id: entry,
    })

  /** What the phone collects at its mailbox, in the relay's order: the deposits the relay keeps there. */
  const collects = async (): Promise<readonly { deposit_id: string; envelope: string }[]> => {
    const holder = await relay.as(showing(start.collect_secret), '1.0.0')
    const stream = relay.holder
      .collect_the_envelopes(holder.when(time.now()), { deposit_address })
      [Symbol.asyncIterator]()
    const first = await stream.next()
    await stream.return?.()
    if (first.done === true || first.value.event !== 'snapshot')
      throw new Error('a collect began with no snapshot')
    return first.value.entries.map((entry) => ({
      deposit_id: entry.deposit_id,
      envelope: entry.envelope,
    }))
  }

  /** The envelopes at the phone's mailbox it has not opened yet, each opened by its face (PST-4). */
  const opens_what_came = async (): Promise<readonly Opened[]> => {
    const opened: Opened[] = []
    for (const deposit of await collects()) {
      if (seen.has(deposit.deposit_id)) continue
      seen.add(deposit.deposit_id)
      opened.push({
        deposit_id: deposit.deposit_id,
        opened: await the_letter_in_an_envelope(machine_of(start.face_id))(
          deposit_address,
          deposit.envelope,
        ),
      })
    }
    return opened
  }

  /**
   * The kernel's entry gives a response back (PST-9; played, step 13 wires
   * it): the response to a request, its identity PST-2's, from the phone's
   * face to the mailbox the bond gives, its declared time the clock's, the
   * event of the leaf that served it; put in an envelope for their key
   * (PST-3) and deposited once through the phone's transport under its
   * operation (PST-11). What the deposit came to, or `not_sealed`.
   */
  const deposits_a_response = async (response_to: {
    readonly answers: string
    readonly to: {
      readonly key: string
      readonly mailbox: { readonly deposit_address: string; readonly relays: readonly string[] }
    }
    readonly event: unknown
  }): Promise<Deposited | 'not_sealed'> => {
    const machine = machine_of(start.face_id)
    const response: post_value.letter = {
      is: 'a_response',
      schema: 1,
      identity: the_identity_of_the_response_to(machine)(response_to.answers),
      from: key,
      to: response_to.to.mailbox.deposit_address,
      declared_at: zz.date_time.parse(time.now()),
      answers: response_to.answers,
      event: response_to.event,
    }
    const sealed = await a_letter_in_an_envelope(machine)(response, response_to.to.key)
    if (sealed.outcome === 'not_sealed') return 'not_sealed'
    return transport.port.deposit({
      operation: the_operation_of_a_deposit(machine)(
        response.identity,
        response_to.to.mailbox.deposit_address,
      ),
      deposit_address: response_to.to.mailbox.deposit_address,
      relays: [...response_to.to.mailbox.relays],
      envelope: sealed.envelope,
    })
  }

  const the_phone = {
    face_id: start.face_id,
    /** The phone's face's key (A, B, C). */
    key,
    /** The phone's mailbox of its bond, D at the relay (BND-4). */
    mailbox,
    /** The phone's collect secret R. */
    collect_secret: start.collect_secret,
    machine_of,
    the_request,
    /** The ports of `post/requests` over the phone's cell, and the log of its facts: what the kernel's port of requests is wired with (12.4). */
    post,
    log: facts,
    /** The identity of the response to a request (PST-2). */
    the_response_to: (request_id: string): string =>
      the_identity_of_the_response_to(machine_of(start.face_id))(request_id),
    runs,
    /** The port of requests sends a request (PST-5, step 12.4): under its identity, in the port's scope. */
    send_a_request: (
      input: {
        readonly request_id: string
        readonly to: { readonly key: string; readonly mailbox: typeof mailbox }
        readonly invokes?: post_value.invocation
        readonly input?: unknown
        readonly waits?: number
      },
      sent: Sent = {},
    ) => {
      const given = {
        request_id: input.request_id,
        from: { face_id: start.face_id, key },
        to: {
          key: input.to.key,
          mailbox: {
            deposit_address: input.to.mailbox.deposit_address,
            relays: [...input.to.mailbox.relays],
          },
        },
        invokes: input.invokes ?? a_ping,
        input: input.input ?? {},
        waits: input.waits ?? 60,
      }
      return all(
        post.send_a_request(
          sent_as(
            'post/requests/usecase/send_a_request',
            given,
            the_scope_of_the_port_of_requests,
          )({ operation: input.request_id, ...sent }),
          given,
        ),
      )
    },
    /** The kernel's entry gives a response back (PST-7, step 13): under the response's identity, in the entry's scope. */
    take_a_response: (
      input: { readonly request_id: string; readonly from: string; readonly event: unknown },
      sent: Sent = {},
    ) => {
      const given = { request_id: input.request_id, from: input.from, event: input.event }
      return all(
        post.take_a_response(
          sent_as(
            'post/requests/usecase/take_a_response',
            given,
            the_scope_of_the_kernel_s_entry,
          )({
            operation: the_identity_of_the_response_to(machine_of(start.face_id))(input.request_id),
            ...sent,
          }),
          given,
        ),
      )
    },
    /** The answer the port keeps under a request's identity (PST-8). */
    the_answer_to: async (request_id: string) =>
      entries_of(await all(post.the_answer_to_a_request(when(), { request_id }))),
    collects,
    opens_what_came,
    /**
     * The phone serves the requests that came to its mailbox (played, as the
     * kernel's entry and the leaf will, steps 12.4, 13): each request opened
     * from a face is answered by the leaf's event, or by the event its leaf
     * recorded under that identity before (DOM-11), and its response is
     * written (PST-9), put in an envelope for the face that asked, and
     * deposited once, on the mailbox the bond with that face gives
     * (`bonded`); a response asks for none.
     */
    serves: async (
      bonded: ReadonlyMap<string, typeof mailbox>,
      event: unknown = { pong: true },
    ): Promise<readonly Opened[]> => {
      const opened = await opens_what_came()
      for (const each of opened) {
        if (each.opened.outcome !== 'opened') continue
        const letter = each.opened.letter
        const caller = each.opened.caller
        if (letter.is !== 'a_request' || caller.is !== 'a_face') continue
        const their_mailbox = bonded.get(caller.key)
        if (their_mailbox === undefined) continue
        const answered = served.get(letter.identity) ?? event
        served.set(letter.identity, answered)
        await deposits_a_response({
          answers: letter.identity,
          to: { key: caller.key, mailbox: their_mailbox },
          event: answered,
        })
      }
      return opened
    },
    deposits_a_response,
    /**
     * The kernel's entry takes the responses that came to the phone's mailbox
     * (played, step 13): each opened response from a face, under its
     * identity; what it gives, in order.
     */
    receives: async () => {
      const taken: (readonly unknown[])[] = []
      for (const each of await opens_what_came()) {
        if (each.opened.outcome !== 'opened') continue
        const letter = each.opened.letter
        const caller = each.opened.caller
        if (letter.is !== 'a_response' || caller.is !== 'a_face') continue
        const given = { request_id: letter.answers, from: caller.key, event: letter.event }
        taken.push(
          await all(
            post.take_a_response(
              sent_as(
                'post/requests/usecase/take_a_response',
                given,
                the_scope_of_the_kernel_s_entry,
              )({ operation: letter.identity }),
              given,
            ),
          ),
        )
      }
      return taken
    },
    /** The next deposits of the phone's transport meet these faults (TST-4). */
    will: transport.will,
    /** Every deposit the phone's transport carried, in order. */
    carried: transport.carried,
    /** Every fact the cell recorded, in order, as its log gives them (DOM-17), each once by its position. */
    recorded: async (): Promise<readonly zz.StoredEnvelope[]> => {
      const kept = new Map<zz.position, zz.StoredEnvelope>()
      for await (const each of facts(undefined)) {
        if (each.event !== 'fact') break
        kept.set(each.position, each.fact)
      }
      return [...kept.values()]
    },
    /** The entries queued with the facts, in order (DOM-14). */
    queued: made.entries,
    /** The entries the executors hold: their dead letters (DOM-15). */
    held: made.held,
  }
  return the_phone
}

/** A phone under the stories. */
export type PhoneUnderTest = Awaited<ReturnType<typeof a_phone>>

/** The entries of a read's snapshot, its first event. */
export const entries_of = <entry>(
  events: readonly (
    | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
    | { readonly event: 'invalid_request' }
  )[],
): readonly entry[] => {
  const first = events[0]
  if (first?.event !== 'snapshot') throw new Error('a read began with no snapshot')
  return first.entries
}

/**
 * The story of the requests: one relay, Anna's phone, Bruno's and Carla's,
 * each with its face and its mailbox (A at DA, B at DB, C at DC), the clock
 * at 10:00:00 on Friday 20 November 2026. Anna and Bruno are bonded: each
 * phone's responses go to the mailbox the bond gives (`bonds` of a phone).
 */
export const a_story = async (
  primitives: Primitives,
  options: { readonly redelivered?: boolean } = {},
) => {
  const relay = await a_relay()
  const time = a_clock('2026-11-20T10:00:00Z')
  const anna = await a_phone(primitives, relay, time, {
    phone: 1,
    face_id: 'F_a',
    collect_secret: 'anna-R',
    ...(options.redelivered === undefined ? {} : { redelivered: options.redelivered }),
  })
  const bruno = await a_phone(primitives, relay, time, {
    phone: 2,
    face_id: 'F_b',
    collect_secret: 'bruno-R',
  })
  const carla = await a_phone(primitives, relay, time, {
    phone: 3,
    face_id: 'F_c',
    collect_secret: 'carla-R',
  })
  /** The bonds each phone keeps (BND-4): the face's key, and the mailbox the bond gives for it. */
  const bonds_of = {
    anna: new Map([[bruno.key, bruno.mailbox]]),
    bruno: new Map([[anna.key, anna.mailbox]]),
    carla: new Map([[anna.key, anna.mailbox]]),
  }
  return {
    relay,
    anna,
    bruno,
    carla,
    bonds_of,
    /** The phones' clock (DOM-14). */
    clock: time.clock,
    /** The phones' clock reads this instant (10:00:15 is `at('10:00:15')`). */
    at: (time_of_day: string) => {
      time.at(`2026-11-20T${time_of_day}Z`)
    },
  }
}
