import * as boundary from '@q-mino/boundary'
import type * as zz from '@q-mino/domains/library'
import { a_composition_fault, type Composed, type Composition } from './composition.ts'
import { as_traced, type TheKernelsTrace } from './the_kernels_trace.ts'

// The kernel hosting an extension (EXT-2, EXT-13, EXT-15; part 12.4): its
// side of the boundary's messages, speaking with the extension's side
// (`boundary.the_extensions_side`) through a transport given at wiring (in
// process on the oracle and the phone, each message copied as JSON; an
// isolated realm's frame, a future mode, EXT-13). It loads the extension only while active and checks its `ready`
// against the composed manifest; starts and stops its consumers; serves its
// calls (the port of requests, its partition); invokes its leaves for the
// library's mounted ports (`zz.mounted_leaf_ports`, the `invokes` port),
// with the scope and the context the kernel composes; traces what the
// extension does wrong; loads it again after a fall, once.

/**
 * A transport to an extension's realm (EXT-13): given how the realm speaks
 * to the kernel, it loads the extension there, and gives how the kernel
 * speaks to it and how the realm is unloaded. In process on the oracle and
 * the phone, each message a JSON value copied (`memory`, `in_process`); an
 * isolated realm's frame in a future mode (EXT-13). A fault of the realm (an exception) comes as `fallen`.
 */
export type Transport = (to_the_kernel: (message: unknown) => void) => {
  readonly to_the_extension: (message: boundary.a_message_to_an_extension) => void
  readonly unload: () => void
}

/**
 * What the kernel's node on `known` gives of the bond a request came on, in
 * the boundary's words (EXT-3, EXT-11): its identity, the peer's face key,
 * the name the user gives the bond. The extension sees the bond, and the
 * other two only if its manifest's `sees` declares them.
 */
export interface TheBondAsTheNodeGivesIt {
  readonly bond: string
  readonly peer_key: string
  readonly bond_name: string
}

/**
 * How long a peer's request waits, at most, for an extension active but not
 * running yet (EXT-15, MSG-9): from the hosting's creation, at the node's
 * start, or from its load's beginning. Past it, as for an extension that
 * does not run, silence (F8).
 */
export const the_hold_of_a_request = 30_000

/**
 * A peer's request to an extension active but not running yet (EXT-15,
 * MSG-9; [Q, C, high impact: A to discuss], 26 Nov 2026): loading, or not
 * loaded yet at the node's start. A technical outcome (DOM-15), thrown, which
 * the kernel's entry throws on, so that the collector leaves the letter
 * unseen and hands it again at its next pass, in place of a silence that
 * would wait for the asker's next sending (a quarter of its time: almost two
 * days for a message). Rejected: the silence kept (a message collected at
 * the start, while messaging loads, answered days later); the collector
 * started after the extensions' first look (a load begun while the node
 * runs, an activation, would still meet it).
 */
export class TheExtensionIsNotRunningYet extends Error {
  readonly extension: string
  constructor(extension: string) {
    super(`${extension} is not running yet: the request waits for it (EXT-15)`)
    this.name = 'TheExtensionIsNotRunningYet'
    this.extension = extension
  }
}

/** A notice of an extension's (EXT-2 "Its notices"), with its name: shown in its mark by `user` and `ui` (EXT-16), a claim of the extension's (F2). */
export interface ANotice {
  readonly extension: string
  readonly notice: Extract<
    boundary.a_message_from_an_extension,
    { readonly message: 'dead_letter' | 'released' | 'traced' }
  >
}

/**
 * The wiring of an extension hosted (EXT-15): it composed; the transport to
 * its realm; whether it is active (`extensions`, EXT-7: block 4); the
 * kernel's port of requests for it (`the_port_of_requests`); its partition
 * (EXT-14); how the kernel's node on `known` gives the bond, in the
 * boundary's words, and the time the request declares; the kernel's trace (EXT-6); the port of its notices;
 * the clock; the while the kernel waits for its invocations in flight when
 * it is unloaded; who is told it runs (MSG-16).
 */
export interface HostingWiring {
  readonly composed: Composed
  readonly transport: Transport
  readonly is_active: () => Promise<boolean>
  readonly the_port_of_requests: (
    request: boundary.a_request,
  ) => Promise<boundary.an_answer_to_a_request>
  readonly its_storage: boundary.Ports['its_storage']
  readonly the_bond_on_known: (
    context: Readonly<Record<string, unknown>>,
  ) => TheBondAsTheNodeGivesIt
  /** The time the request declares (PER-23), as the kernel's node on `known` gives it: what `sees` may let the extension see (EXT-3, MSG-8). */
  readonly the_declared_time_on_known: (context: Readonly<Record<string, unknown>>) => string
  readonly trace: TheKernelsTrace
  readonly notices: (notice: ANotice) => void
  readonly clock: zz.Clock
  /** The time that passes: the most the user's ask on `self` waits for it to run (MSG-17). */
  readonly elapsed: zz.Elapsed
  readonly a_while: () => Promise<void>
  /**
   * Told each time a load makes it run (its activation, the node's start),
   * not at its load again after a fall: the node's collector forgets what
   * it saw, so that a request silenced while it did not run reaches it at
   * the next pass (MSG-16), and the letter it fell on is not handed again.
   */
  readonly when_it_runs: () => void
}

/** The life of an extension hosted (EXT-15), as the kernel shows it: not loaded; loading, `ready` awaited; running; stopped, after a second fall or a `ready` that differs from its manifest. */
export type Life =
  | { readonly life: 'unloaded' }
  | { readonly life: 'loading' }
  | { readonly life: 'running' }
  | { readonly life: 'stopped'; readonly why: 'it_fell_twice' | 'its_ready_differs' }

/** What loading an extension came to (EXT-15), an ADT: running; not loaded, not active; a composition fault, its `ready` not its manifest's (it does not run); stopped, fallen twice; unloaded before it was ready. */
export type Loaded =
  | { readonly loaded: 'running' }
  | { readonly loaded: 'not_active' }
  | {
      readonly loaded: 'a_composition_fault'
      readonly fault: Extract<Composition, { readonly composition: 'a_fault' }>
    }
  | { readonly loaded: 'stopped' }
  | { readonly loaded: 'unloaded' }

/** What the user's request on a dead letter came to: sent to the extension, or not, the extension not running. */
export type Handed = 'handed' | 'not_running'

/** An extension hosted (EXT-15): its life, and what the kernel does with it. */
export interface Hosted {
  /** Loads it, only while active, and starts its consumers once its `ready` is its manifest's (its activation, or the node's start). */
  readonly load: () => Promise<Loaded>
  /** Stops its consumers, waits a while for its invocations in flight, and unloads it (its deactivation). */
  readonly unload: () => Promise<void>
  /** The port that invokes its leaves on a persona, for `zz.mounted_leaf_ports` (`invokes`). */
  readonly invokes: (
    persona: 'self' | 'known',
  ) => (invocation: zz.MountedInvocation) => AsyncIterable<unknown>
  /** The port of the events its surface does not type, for `zz.mounted_leaf_ports` (`outside_the_surface`): the kernel's trace. */
  readonly outside_the_surface: (persona: 'self' | 'known') => (event: zz.OutsideTheSurface) => void
  /** The user's request on one of its dead letters (EXT-2, DOM-14): redelivered, or discarded with who and why. */
  readonly redeliver: (letter: string) => Handed
  readonly discard: (
    letter: string,
    trace: { readonly by: string; readonly reason: string },
  ) => Handed
  readonly life: () => Life
}

/** A promise and the function that settles it. */
const a_promise = <value>() => {
  let settle: (value: value) => void = () => undefined
  const promise = new Promise<value>((resolve) => {
    settle = resolve
  })
  return {
    promise,
    settle: (value: value) => {
      settle(value)
    },
  }
}

/** The events of an invocation in flight, in order (DOM-3): given as they come, ended by `done`, or failed (a fall, an unload). */
const a_flow = () => {
  const waiting: unknown[] = []
  let end:
    | { readonly end: 'open' }
    | { readonly end: 'done' }
    | { readonly end: 'failed'; readonly error: Error } = {
    end: 'open',
  }
  let wake: () => void = () => undefined
  const ended = a_promise<undefined>()
  const close = (closing: typeof end): void => {
    if (end.end !== 'open') return
    end = closing
    ended.settle(undefined)
    wake()
  }
  async function* events(): AsyncIterable<unknown> {
    for (;;) {
      if (waiting.length > 0) {
        yield waiting.shift()
        continue
      }
      if (end.end === 'done') return
      if (end.end === 'failed') throw end.error
      await new Promise<void>((resolve) => {
        wake = resolve
      })
    }
  }
  return {
    give: (event: unknown) => {
      waiting.push(event)
      wake()
    },
    done: () => {
      close({ end: 'done' })
    },
    fail: (error: Error) => {
      close({ end: 'failed', error })
    },
    ended: ended.promise,
    events,
  }
}

/** What came first from a realm being loaded: its `ready`, or its fall. */
type Came =
  | {
      readonly came: 'ready'
      readonly ready: Extract<boundary.a_message_from_an_extension, { readonly message: 'ready' }>
    }
  | { readonly came: 'fallen'; readonly why: string }

/** A realm the extension is loaded in: how the kernel speaks to it, how it is unloaded, what came first. */
interface Realm {
  readonly to_the_extension: (message: boundary.a_message_to_an_extension) => void
  readonly unload: () => void
  readonly came: Promise<Came>
  readonly first: (came: Came) => void
}

/** An invocation in flight: its realm, its persona, its leaf and version, whether its answer came (on `known`, one event), its events. */
interface InFlight {
  readonly realm: Realm
  readonly persona: 'self' | 'known'
  readonly leaf: string
  readonly version: string
  answered: boolean
  readonly flow: ReturnType<typeof a_flow>
}

/** A version's major. */
const major_of = (version: string): number => Number(version.split('.')[0])

/**
 * An extension hosted by the kernel (EXT-2, EXT-13, EXT-15), from its
 * wiring. Its realm is opened at `load`, only while it is active: its calls
 * are served while it loads (its storage read before it is `ready`), then
 * its `ready` is compared with the manifest composed (a difference is a
 * composition fault: unloaded, it does not run), and its consumers are
 * started. Its leaves are invoked by the library's mounted ports through
 * `invokes`: the kernel composes the scope of a command (on `known`, from
 * the hat and the bond's identity, `known/<bond>`, never the `Caller`; on
 * `self`, the entry's, `Caller` + hat) and the context as its manifest lets
 * it see (EXT-3: the bond, and the peer's key or the bond's name if `sees`
 * declares them). On `known` the first event its surface types is the
 * answer, and the rest are traced (EXT-15); on `self` its events go to the
 * library's port, which sets aside what its surface does not type
 * (`outside_the_surface`, traced). An invocation whose consumer stops
 * before its `done` (a follow no longer shown, a peer's request answered by
 * its first event) is ended: `end` sent to the extension, and what of it
 * still crosses dropped, its `done` included (K-4). Its calls: the port of requests, which
 * checks what it serves; its partition, served only if `touches` names it
 * (else refused, `not_declared`, traced) and only while active. A fall (its
 * `fallen`, an exception in its realm) is traced; its invocations in flight
 * fail, a technical outcome (DOM-15) the kernel's entry turns into silence
 * for a peer (F8); it is loaded again once, and a second fall leaves it
 * stopped. Its notices go to their port; the user's requests on its dead
 * letters to it.
 */
export const a_hosted_extension = (wiring: HostingWiring): Hosted => {
  const manifest = wiring.composed.manifest
  const name = manifest.name
  let life:
    | { readonly life: 'unloaded' }
    | { readonly life: 'loading'; readonly realm: Realm }
    | { readonly life: 'running'; readonly realm: Realm }
    | { readonly life: 'stopped'; readonly why: 'it_fell_twice' | 'its_ready_differs' } = {
    life: 'unloaded',
  }
  let falls = 0
  let invocations = 0
  const in_flight = new Map<string, InFlight>()
  /** The invocations the kernel ended before their `done` (K-4): their events and their `done` still crossing, dropped. */
  const ended = new Set<string>()
  const now = (): string => wiring.clock.now()
  /** Since when it is to run: the hosting's creation, at the node's start, or its last load's beginning (MSG-9). */
  let to_run_since = Date.parse(now())
  /** Who waits for it to run (MSG-17): the user's asks on `self` while it is to run, woken at each change of its life. */
  const waiting_to_run = new Set<(woken: undefined) => void>()
  /** Its life changed: running, stopped, unloaded; who waits for it to run looks again. */
  const lives = (next: typeof life): void => {
    life = next
    for (const wake of [...waiting_to_run]) wake(undefined)
    waiting_to_run.clear()
  }
  /**
   * The user's ask on `self` while it is to run (MSG-17): active and not
   * running yet (not loaded yet at the node's start, or loading), within
   * the hold of MSG-9; waited for until it runs, it stops, or the hold is over.
   */
  const until_it_runs = async (): Promise<void> => {
    for (;;) {
      if (life.life !== 'loading' && life.life !== 'unloaded') return
      const left = to_run_since + the_hold_of_a_request - Date.parse(now())
      if (left <= 0 || !(await wiring.is_active())) return
      const woken = a_promise<undefined>()
      waiting_to_run.add(woken.settle)
      await Promise.race([woken.promise, wiring.elapsed(left)])
      waiting_to_run.delete(woken.settle)
    }
  }
  /** The realm loaded now, if any. */
  const the_realm = (): Realm | undefined =>
    life.life === 'loading' || life.life === 'running' ? life.realm : undefined

  /** Its invocations in flight in a realm fail: a technical outcome (DOM-15). */
  const fail_in = (realm: Realm, why: string): void => {
    for (const [id, invocation] of in_flight) {
      if (invocation.realm !== realm) continue
      invocation.flow.fail(new Error(`${name}: ${why} (EXT-15)`))
      in_flight.delete(id)
    }
  }

  /** Its partition, served only if declared and while active (EXT-4, EXT-14). */
  const its_storage = async (
    request: boundary.a_call_of_the_storage,
  ): Promise<boundary.an_answer_to_a_read | boundary.an_answer_to_a_commit> => {
    if (!manifest.touches.includes('its_storage')) {
      wiring.trace({
        why: 'a_call_not_declared',
        extension: name,
        now: now(),
        call: { port: 'its_storage', request: as_traced(request) },
      })
      return { answer: 'refused', why: 'not_declared' }
    }
    if (!(await wiring.is_active())) return { answer: 'refused', why: 'not_active' }
    return request.call === 'read'
      ? wiring.its_storage.read(request.read)
      : wiring.its_storage.commit(request.writes)
  }

  /** A call of the extension's, answered under its id if its realm is still loaded; a call the kernel cannot serve is traced, unanswered. */
  const serve = async (
    realm: Realm,
    call: Extract<boundary.a_message_from_an_extension, { readonly message: 'call' }>,
  ): Promise<void> => {
    try {
      const answer: boundary.a_message_to_an_extension =
        call.port === 'the_port_of_requests'
          ? {
              message: 'answer',
              id: call.id,
              port: call.port,
              answer: await wiring.the_port_of_requests(call.request),
            }
          : {
              message: 'answer',
              id: call.id,
              port: call.port,
              answer: await its_storage(call.request),
            }
      if (the_realm() === realm) realm.to_the_extension(answer)
    } catch (error) {
      wiring.trace({
        why: 'a_call_not_answered',
        extension: name,
        now: now(),
        call: { port: call.port, request: as_traced(call.request) },
        fault: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /** An event of an invocation in flight: on `self` given on; on `known` the first its surface types is the answer, the rest traced (EXT-15). */
  const an_event = (
    realm: Realm,
    event: Extract<boundary.a_message_from_an_extension, { readonly message: 'event' }>,
  ): void => {
    const invocation = in_flight.get(event.id)
    if (invocation?.realm !== realm) {
      if (!ended.has(event.id)) not_in_the_boundary(event, 'pairs_no_exchange')
      return
    }
    if (invocation.persona === 'self') {
      invocation.flow.give(event.event)
      return
    }
    const leaf =
      wiring.composed.surfaces.known?.majors[major_of(invocation.version)]?.[invocation.leaf]
    const schema = leaf?.events[event.event.event]
    if (!invocation.answered && schema?.safeParse(event.event).success === true) {
      invocation.answered = true
      invocation.flow.give(event.event)
      return
    }
    wiring.trace({
      why: 'an_event_not_in_the_surface',
      extension: name,
      now: now(),
      persona: 'known',
      leaf: invocation.leaf,
      version: invocation.version,
      event: event.event,
      the_event_is: invocation.answered ? 'after_the_answer' : 'not_typed',
    })
  }

  /** A message of the extension's the boundary does not carry, or that pairs no exchange: traced (EXT-2). */
  const not_in_the_boundary = (
    message: unknown,
    the_message: 'does_not_parse' | 'pairs_no_exchange',
  ): void => {
    wiring.trace({
      why: 'a_message_not_in_the_boundary',
      extension: name,
      now: now(),
      message: as_traced(message),
      the_message,
    })
  }

  /** A message from a realm: dropped once the realm is unloaded; parsed by the boundary; handed to what it pairs. */
  const received = (realm: Realm) => (message: unknown) => {
    if (the_realm() !== realm) return
    const parsed = boundary.a_message_from_an_extension.safeParse(message)
    if (!parsed.success) {
      not_in_the_boundary(message, 'does_not_parse')
      return
    }
    const from = parsed.data
    switch (from.message) {
      case 'ready':
        if (life.life === 'loading') realm.first({ came: 'ready', ready: from })
        else not_in_the_boundary(from, 'pairs_no_exchange')
        return
      case 'fallen':
        if (life.life === 'loading') realm.first({ came: 'fallen', why: from.why })
        else void fell(realm, from.why)
        return
      case 'event':
        an_event(realm, from)
        return
      case 'done': {
        const invocation = in_flight.get(from.id)
        if (invocation?.realm !== realm) {
          if (!ended.delete(from.id)) not_in_the_boundary(from, 'pairs_no_exchange')
          return
        }
        invocation.flow.done()
        in_flight.delete(from.id)
        return
      }
      case 'call':
        void serve(realm, from)
        return
      case 'dead_letter':
      case 'released':
      case 'traced':
        wiring.notices({ extension: name, notice: from })
        return
    }
  }

  /** A realm opened by the transport, `ready` or its fall awaited. */
  const a_realm = (): Realm => {
    const came = a_promise<Came>()
    let opened: ReturnType<Transport> | undefined = undefined
    const realm: Realm = {
      to_the_extension: (message) => opened?.to_the_extension(message),
      unload: () => opened?.unload(),
      came: came.promise,
      first: came.settle,
    }
    life = { life: 'loading', realm }
    to_run_since = Date.parse(now())
    opened = wiring.transport(received(realm))
    return realm
  }

  /** A fall (EXT-15): traced, its invocations in flight failed, its realm unloaded; loaded again once, else stopped. */
  const fell = async (realm: Realm, because: string): Promise<Loaded> => {
    if (the_realm() !== realm) return loaded_now()
    falls += 1
    wiring.trace({
      why: 'the_extension_has_fallen',
      extension: name,
      now: now(),
      fall: falls === 1 ? 'the_first' : 'the_second',
      because,
    })
    lives({ life: 'unloaded' })
    fail_in(realm, `it has fallen, ${because}`)
    ended.clear()
    realm.unload()
    if (falls > 1) {
      lives({ life: 'stopped', why: 'it_fell_twice' })
      return { loaded: 'stopped' }
    }
    return loaded()
  }

  /** What loading came to, from its life now (a load overtaken by an unload or a fall). */
  const loaded_now = (): Loaded =>
    life.life === 'running'
      ? { loaded: 'running' }
      : life.life === 'stopped'
        ? { loaded: 'stopped' }
        : { loaded: 'unloaded' }

  /** A realm loaded, its `ready` compared with the manifest, its consumers started. */
  const loaded = async (): Promise<Loaded> => {
    const realm = a_realm()
    const came = await realm.came
    if (the_realm() !== realm) return loaded_now()
    if (came.came === 'fallen') return fell(realm, came.why)
    const ready = came.ready
    if (
      ready.name !== manifest.name ||
      ready.version !== manifest.version ||
      ready.boundary_version !== manifest.boundary_version
    ) {
      lives({ life: 'stopped', why: 'its_ready_differs' })
      realm.unload()
      return {
        loaded: 'a_composition_fault',
        fault: a_composition_fault(name, [
          {
            fault: 'a_ready_that_differs',
            ready: {
              name: ready.name,
              version: ready.version,
              boundary_version: ready.boundary_version,
            },
          },
        ]),
      }
    }
    lives({ life: 'running', realm })
    realm.to_the_extension({ message: 'start' })
    return { loaded: 'running' }
  }

  /** An invocation of a leaf on a persona, through the boundary (EXT-2). */
  async function* invoked(
    persona: 'self' | 'known',
    invocation: zz.MountedInvocation,
  ): AsyncIterable<unknown> {
    if (persona === 'self' && life.life !== 'running') await until_it_runs()
    if (life.life !== 'running') {
      const to_run =
        persona === 'known' &&
        (life.life === 'loading' || life.life === 'unloaded') &&
        Date.parse(now()) - to_run_since < the_hold_of_a_request &&
        (await wiring.is_active())
      if (to_run) throw new TheExtensionIsNotRunningYet(name)
      throw new Error(`${name} is not running, ${life.life}: it invokes nothing (EXT-15)`)
    }
    const realm = life.realm
    const seen = persona === 'known' ? wiring.the_bond_on_known(invocation.context) : undefined
    const sees = manifest.sees.known
    const context: boundary.JsonObject =
      seen === undefined
        ? {}
        : {
            bond: seen.bond,
            ...(sees.includes('the_peer_key') ? { peer_key: seen.peer_key } : {}),
            ...(sees.includes('the_name_of_the_bond') ? { bond_name: seen.bond_name } : {}),
            ...(sees.includes('the_declared_time')
              ? { declared_at: wiring.the_declared_time_on_known(invocation.context) }
              : {}),
          }
    const operation =
      invocation.operation === undefined
        ? undefined
        : seen === undefined
          ? { id: invocation.operation.id, scope: invocation.operation.scope }
          : { id: invocation.operation.id, scope: `known/${seen.bond}` }
    const input = boundary.json.parse(invocation.input)
    invocations += 1
    const id = `invocation-${String(invocations)}`
    const flow = a_flow()
    in_flight.set(id, {
      realm,
      persona,
      leaf: invocation.leaf,
      version: invocation.version,
      answered: false,
      flow,
    })
    realm.to_the_extension({
      message: 'invoke',
      id,
      persona,
      use_case: invocation.leaf,
      version: invocation.version,
      context,
      ...(operation === undefined ? {} : { operation }),
      ...(invocation.correlation === undefined ? {} : { correlation: invocation.correlation }),
      input,
    })
    try {
      yield* flow.events()
    } finally {
      // Its consumer stopped before `done` (K-4): the extension told to end its flow.
      if (in_flight.get(id)?.flow === flow) {
        in_flight.delete(id)
        ended.add(id)
        if (the_realm() === realm) realm.to_the_extension({ message: 'end', id })
      }
    }
  }

  /** The user's request on a dead letter, handed to the extension while it runs. */
  const handed = (message: boundary.a_message_to_an_extension): Handed => {
    if (life.life !== 'running') return 'not_running'
    life.realm.to_the_extension(message)
    return 'handed'
  }

  return {
    load: async () => {
      if (life.life === 'running') return { loaded: 'running' }
      if (!(await wiring.is_active())) return { loaded: 'not_active' }
      if (life.life === 'loading') {
        await life.realm.came
        return loaded_now()
      }
      falls = 0
      const came = await loaded()
      // It runs now (MSG-16), not after a fall's load again, which would hand again the letter it fell on.
      if (came.loaded === 'running') wiring.when_it_runs()
      return came
    },
    unload: async () => {
      const realm = the_realm()
      if (realm === undefined) return
      if (life.life === 'running') {
        realm.to_the_extension({ message: 'stop' })
        const flows = [...in_flight.values()]
          .filter((invocation) => invocation.realm === realm)
          .map((invocation) => invocation.flow.ended)
        await Promise.race([Promise.all(flows), wiring.a_while()])
      }
      lives({ life: 'unloaded' })
      fail_in(realm, 'it has been unloaded')
      ended.clear()
      realm.unload()
      // A load still waiting for its `ready` ends: its realm is no longer the one loaded.
      realm.first({ came: 'fallen', why: 'it has been unloaded' })
    },
    invokes: (persona) => (invocation) => invoked(persona, invocation),
    outside_the_surface: (persona) => (event) => {
      wiring.trace({
        why: 'an_event_not_in_the_surface',
        extension: name,
        now: now(),
        persona,
        leaf: event.leaf,
        version: event.version,
        event: as_traced(event.event),
        the_event_is: 'not_typed',
      })
    },
    redeliver: (letter) => handed({ message: 'redeliver', letter }),
    discard: (letter, trace) =>
      handed({ message: 'discard', letter, by: trace.by, reason: trace.reason }),
    life: () => (life.life === 'loading' || life.life === 'running' ? { life: life.life } : life),
  }
}
