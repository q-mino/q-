// The relay's HTTP client (WEB-6; ADP-4, ADP-5, MBX-9, PST-10, STK-3,
// STK-5): the two transports between a phone and the relay, the post's
// mailbox port and the collector's collect port, carried over the relay's
// HTTP interface, as the `memory` stack carries them in process. A
// transport: it carries the request and the answer's events, in their
// order, and tells the answer in the words of the port it serves; it keeps
// nothing and decides nothing (ADP-1, ADP-4). Reliability is end to end:
// the post sends a deposit again under the same operation (PST-6, PST-11),
// the collector collects again at its next pass (STK-3).
//
// The page's `fetch` is given (WEB-5), and the time that passes (WEB-4),
// by which the client waits for the relay at most `the_longest_wait_for_the_relay`
// at a time. The relay is the mailbox's, one in stage 1 (BND-4).

import type { ACollect, ADeposit } from '@q-mino/adapters-common'
import { depositor } from '@q-mino/domains/desk/depositor/_version.ts'
import { envelope } from '@q-mino/domains/desk/holder/_value.ts'
import { holder } from '@q-mino/domains/desk/holder/_version.ts'
import * as zz from '@q-mino/domains/library'
import { deposit_id } from '@q-mino/domains/mailbox/deposits/_id.ts'
import type { Deposited, MailboxPort } from '@q-mino/domains/post/_dsl.ts'
import * as z from 'zod'

/** The parts of an answer the client reads: its status and its body, a stream of bytes. */
export interface AnAnswer {
  readonly status: number
  readonly body: ReadableStream<Uint8Array> | null
}

/** The parts of a request the client makes: a `POST` of JSON, its headers, and the signal it is let go by. */
export interface ARequest {
  readonly method: 'POST'
  readonly headers: Readonly<Record<string, string>>
  readonly body: string
  readonly signal: AbortSignal
}

/** The page's `fetch`, by the parts the client uses (WEB-5): the runtime's is given as it is. */
export type AFetch = (address: string, request: ARequest) => Promise<AnAnswer>

/** What the client is given (WEB-5, WEB-4): the page's `fetch`, and the time that passes. */
export interface TheRelaysHttpWiring {
  readonly fetch: AFetch
  readonly elapsed: zz.Elapsed
}

/**
 * The longest the client waits for the relay at a time, for an answer to
 * begin or for its next bytes: 30 seconds; then the request is let go, with
 * no answer. A wait, not a time for the whole answer: a long snapshot on a
 * slow network goes on while its bytes come.
 */
export const the_longest_wait_for_the_relay = 30_000

/** The paths of the relay's HTTP interface (MBX-9). */
export const the_paths_of_the_relay = {
  deposit: '/depositor/deposit_an_envelope',
  collect: '/holder/collect_the_envelopes',
} as const

/** The address of a path at a relay: the relay's address, its path kept, then the interface's path. */
const at_the_relay = (relay: string, path: string): string => `${relay.replace(/\/+$/, '')}${path}`

/** What came of a wait for the relay: what it gave, or nothing in the longest wait. */
type Heard<value> = { readonly heard: 'it'; readonly value: value } | { readonly heard: 'nothing' }

/** A line of an answer's body, its end, or no bytes in the longest wait. */
type ALine =
  | { readonly is: 'a_line'; readonly line: string }
  | { readonly is: 'the_end' }
  | { readonly is: 'nothing_heard' }

/** An answer's body read line by line (NDJSON, MBX-9), each wait within the longest; let go when the reader stops. */
const the_lines_of = (
  body: ReadableStream<Uint8Array>,
  heard: <value>(waiting: Promise<value>) => Promise<Heard<value>>,
) => {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let ended = false
  return {
    /** The next line; at the end, a last line with no newline, then the end. */
    next: async (): Promise<ALine> => {
      for (;;) {
        const end = pending.indexOf('\n')
        if (end !== -1) {
          const line = pending.slice(0, end)
          pending = pending.slice(end + 1)
          return { is: 'a_line', line }
        }
        if (ended) {
          const rest = pending
          pending = ''
          return rest.trim() === '' ? { is: 'the_end' } : { is: 'a_line', line: rest }
        }
        const read = await heard(reader.read())
        if (read.heard === 'nothing') return { is: 'nothing_heard' }
        if (read.value.done) {
          ended = true
          pending += decoder.decode()
        } else pending += decoder.decode(read.value.value, { stream: true })
      }
    },
    /** The body let go: the relay's stream is let go with it (MBX-9). */
    let_go: async (): Promise<void> => {
      await reader.cancel().catch(() => undefined)
    },
  }
}

/** Whether a fault is an abort: the runtime, or the page, let the request go (ADP-4). */
const is_an_abort = (fault: unknown): boolean =>
  typeof fault === 'object' && fault !== null && 'name' in fault && fault.name === 'AbortError'

/** Whether a fault is the network's: `fetch` and a body's reads fail with a `TypeError` (the Fetch standard). */
const is_the_network_s = (fault: unknown): boolean => fault instanceof TypeError

/** An event of the relay's, as the client reads it: its name, the rest carried (MBX-9: the events are the contract's). */
const an_event = z.object({ event: z.string() })

/**
 * The first event of a collect: the mailbox's snapshot (MBX-3), of each
 * entry what the collector takes, the deposit's id and its envelope, in the
 * holder's words (the rest carried, unread).
 */
const a_snapshot = z.object({
  event: z.literal('snapshot'),
  entries: z.array(z.object({ deposit_id, envelope })),
})

/** A line of JSON, or nothing when it is not JSON. */
const the_json_of = (line: string): unknown => {
  try {
    const parsed: unknown = JSON.parse(line)
    return parsed
  } catch {
    return undefined
  }
}

/** The statuses by which an HTTP server says it gave no answer: try again (RFC 9110: 408, 429, 5xx). */
const is_no_answer = (status: number): boolean => status === 408 || status === 429 || status >= 500

/** The status by which the relay refuses a deposit for the room on its disk (REL-3): 507, Insufficient Storage, a 5xx. */
const the_relay_is_full = 507

/**
 * What came of a request to the relay (MBX-9): an answer, its status and
 * its lines to read; no answer (the request lost, the relay unheard in the
 * longest wait); or an abort (the runtime let it go), which the client
 * signals (ADP-4).
 */
type AnExchange =
  | {
      readonly came: 'an_answer'
      readonly status: number
      readonly lines: ReturnType<typeof the_lines_of>
    }
  | { readonly came: 'no_answer'; readonly because: string }
  | { readonly came: 'an_abort'; readonly fault: unknown }

/**
 * The relay as the client last met it (UI-5's strip): not met yet; it
 * answered; it did not (`unreachable`: the request lost, the relay unheard
 * in the longest wait, a status by which it gave no answer; no network and a
 * relay silent are not told apart); or it answered that it is full, a
 * deposit refused for the room on its disk (507, REL-3), until a deposit is
 * answered otherwise (a collect, which writes nothing, says nothing of the room).
 */
export type TheRelayMet = 'not_met_yet' | 'answered' | 'did_not_answer' | 'is_full'

/** What asks the relay: a deposit, which tells of its room, or a collect, which does not (REL-3). */
type AskedBy = 'a_deposit' | 'a_collect'

/** What the client tells of its meetings with the relay: the last, and whoever listens, told at each change. */
export interface TheRelayAsMet {
  readonly last: () => TheRelayMet
  readonly when_it_changes: (tell: () => void) => () => void
}

/**
 * The relay's HTTP client (WEB-6): the post's mailbox port and the
 * collector's collect port over the relay's HTTP interface (MBX-9), and the
 * relay as it last met it (UI-5).
 */
export const the_relay_s_http_transports = (
  wiring: TheRelaysHttpWiring,
): {
  readonly mailbox: MailboxPort
  readonly collect: ACollect
  readonly the_relay: TheRelayAsMet
} => {
  let last: TheRelayMet = 'not_met_yet'
  const listening = new Set<() => void>()
  /** A meeting with the relay: kept, and told when it changes what she is shown; a collect answered leaves a relay full as it was. */
  const met = (now: Exclude<TheRelayMet, 'not_met_yet'>, by: AskedBy): void => {
    if (now === last) return
    if (now === 'answered' && by === 'a_collect' && last === 'is_full') return
    last = now
    for (const tell of listening) tell()
  }
  const the_relay: TheRelayAsMet = {
    last: () => last,
    when_it_changes: (tell) => {
      listening.add(tell)
      return () => {
        listening.delete(tell)
      }
    },
  }

  /** A request posted to a relay, and its answer as it begins, each wait within the longest. */
  const posted = async (
    by: AskedBy,
    relay: string,
    path: string,
    body: unknown,
    shown: Readonly<Record<string, string>>,
  ): Promise<AnExchange> => {
    const letting_go = new AbortController()
    const heard = async <value>(waiting: Promise<value>): Promise<Heard<value>> => {
      const heard_it = await Promise.race([
        waiting.then((value): Heard<value> => ({ heard: 'it', value })),
        wiring
          .elapsed(the_longest_wait_for_the_relay)
          .then((): Heard<value> => ({ heard: 'nothing' })),
      ])
      if (heard_it.heard === 'nothing') letting_go.abort()
      return heard_it
    }
    try {
      const answer = await heard(
        wiring.fetch(at_the_relay(relay, path), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...shown },
          body: JSON.stringify(body),
          signal: letting_go.signal,
        }),
      )
      if (answer.heard === 'nothing') {
        met('did_not_answer', by)
        return { came: 'no_answer', because: 'the relay unheard' }
      }
      const the_body = answer.value.body
      met(
        answer.value.status === the_relay_is_full
          ? 'is_full'
          : is_no_answer(answer.value.status) || the_body === null
            ? 'did_not_answer'
            : 'answered',
        by,
      )
      if (the_body === null) return { came: 'no_answer', because: 'an answer with no body' }
      return {
        came: 'an_answer',
        status: answer.value.status,
        lines: the_lines_of(the_body, heard),
      }
    } catch (fault) {
      if (is_the_network_s(fault)) {
        met('did_not_answer', by)
        return { came: 'no_answer', because: 'the request lost' }
      }
      if (is_an_abort(fault) && letting_go.signal.aborted) {
        met('did_not_answer', by)
        return { came: 'no_answer', because: 'the relay unheard' }
      }
      return { came: 'an_abort', fault }
    }
  }

  /** The relay's answer to a deposit, its events read to the end, told in the post's words (PST-10). */
  const told = async (lines: ReturnType<typeof the_lines_of>): Promise<Deposited> => {
    let last: string | undefined = undefined
    for (;;) {
      const next = await lines.next()
      if (next.is === 'nothing_heard') return { outcome: 'unreachable' }
      if (next.is === 'the_end') break
      const event = an_event.safeParse(the_json_of(next.line))
      if (!event.success) {
        await lines.let_go()
        return { outcome: 'refused', why: 'an answer out of form' }
      }
      last = event.data.event
    }
    if (last === 'the_envelope_is_kept') return { outcome: 'kept' }
    if (last === 'identity_already_used') return { outcome: 'kept_already' }
    return { outcome: 'refused', why: last ?? 'no_event' }
  }

  /** The relay a mailbox is deposited on and collected at: its first, one in stage 1 (BND-4). */
  const the_relay_of = (relays: readonly string[], deposit_address: string): string => {
    const [relay] = relays
    if (relay === undefined) throw new Error(`the mailbox at ${deposit_address} has no relay`)
    return relay
  }

  const mailbox: MailboxPort = {
    deposit: async (deposit) => {
      const exchange = await posted(
        'a_deposit',
        the_relay_of(deposit.relays, deposit.deposit_address),
        the_paths_of_the_relay.deposit,
        {
          version: depositor[zz.$Version],
          operation: deposit.operation,
          input: { deposit_address: deposit.deposit_address, envelope: deposit.envelope },
        },
        {},
      )
      if (exchange.came === 'an_abort')
        throw new Error(`the deposit at ${deposit.deposit_address} was aborted`, {
          cause: exchange.fault,
        })
      if (exchange.came === 'no_answer') return { outcome: 'unreachable' }
      if (exchange.status !== 200) {
        await exchange.lines.let_go()
        return is_no_answer(exchange.status)
          ? { outcome: 'unreachable' }
          : { outcome: 'refused', why: `status ${String(exchange.status)}` }
      }
      try {
        return await told(exchange.lines)
      } catch (fault) {
        // The answer lost on its way, its stream broken: the relay may have kept the envelope,
        // and the post's sending tried again is the same operation (PST-11).
        if (is_the_network_s(fault)) return { outcome: 'unreachable' }
        throw new Error(`the deposit at ${deposit.deposit_address} was aborted`, { cause: fault })
      } finally {
        await exchange.lines.let_go()
      }
    },
  }

  const collect: ACollect = async (mailbox_to_collect) => {
    const at = mailbox_to_collect.deposit_address
    const exchange = await posted(
      'a_collect',
      the_relay_of(mailbox_to_collect.relays, at),
      the_paths_of_the_relay.collect,
      { version: holder[zz.$Version], input: { deposit_address: at } },
      { Authorization: `Bearer ${mailbox_to_collect.collect_secret}` },
    )
    if (exchange.came === 'an_abort')
      throw new Error(`the collect at ${at} was aborted`, { cause: exchange.fault })
    if (exchange.came === 'no_answer') throw new Error(`the collect at ${at}: ${exchange.because}`)
    try {
      if (exchange.status !== 200)
        throw new Error(`the collect at ${at}: status ${String(exchange.status)}`)
      const first = await exchange.lines.next()
      if (first.is === 'nothing_heard') throw new Error(`the collect at ${at}: the relay unheard`)
      if (first.is === 'the_end') throw new Error(`the collect at ${at} ended`)
      const snapshot = a_snapshot.safeParse(the_json_of(first.line))
      if (!snapshot.success) {
        const event = an_event.safeParse(the_json_of(first.line))
        const began_with = !event.success
          ? 'an answer out of form'
          : event.data.event === 'snapshot'
            ? 'a snapshot out of form'
            : event.data.event
        throw new Error(`the collect at ${at} began with ${began_with}`)
      }
      return snapshot.data.entries.map((entry): ADeposit => ({
        deposit_id: entry.deposit_id,
        envelope: entry.envelope,
      }))
    } finally {
      await exchange.lines.let_go()
    }
  }

  return { mailbox, collect, the_relay }
}
