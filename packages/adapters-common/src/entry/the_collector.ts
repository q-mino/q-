import * as zz from '@q-mino/domains/library'
import type { AnEnvelopeCollected } from './the_kernels_entry.ts'

// The collector (DOM-17, BND-11, SEA-4, PER-25; step 17): one pass over the
// mailboxes the node collects, each read at its relays with its collect
// secret R from the safe, through a collect port the configurator gives
// (the relay's oracle in `memory`, HTTP from step 20); each deposit not seen
// yet handed to the kernel's entry. A deposit the entry throws on stays
// unseen, and the mailbox's next deposits wait behind it for the next pass
// (DOM-17: the position does not advance past a fault); the other mailboxes
// go on. Its wiring is functions, so that the oracle and the phone wire it
// alike.

/** A read's events as the collector reads them: its snapshot's entries, or a refusal of its input. */
type ARead<entry> = AsyncIterable<
  | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
  | { readonly event: 'invalid_request' }
>

/** The entries of a read's snapshot, its first event; none for a refused input. */
const the_entries_of = async <entry>(events: ARead<entry>): Promise<readonly entry[]> => {
  for await (const event of events) return event.event === 'snapshot' ? event.entries : []
  return []
}

/** A mailbox of mine as the collector reads it at its relays (MBX-6): its D, the R that shows it is mine, the relays. */
export interface AMailboxToCollect {
  readonly deposit_address: string
  readonly collect_secret: string
  readonly relays: readonly string[]
}

/** A deposit at a mailbox, as the relay keeps it: its id at the relay, the envelope's text. */
export interface ADeposit {
  readonly deposit_id: string
  readonly envelope: string
}

/**
 * The collect port (MBX-6): the deposits a relay keeps at a mailbox, in its
 * order, read with its R (the relay's snapshot). A transport that fails
 * throws.
 */
export type ACollect = (mailbox: AMailboxToCollect) => Promise<readonly ADeposit[]>

/**
 * The collector's wiring: the clock, for the reads; the address book's read
 * of the mailboxes I collect (BND-11), each by the id of its key; the safe's
 * read of a mailbox's key, its R (SEA-4); the collect port; the kernel's
 * entry; and, if given, who is told each envelope the entry took (F6).
 */
export interface TheCollectorsWiring {
  readonly clock: zz.Clock
  readonly address_book: {
    readonly the_mailboxes_i_collect: (
      context: zz.RootContext,
      input: Readonly<Record<string, never>>,
    ) => ARead<{
      readonly id: string
      readonly my_mailbox: { readonly deposit_address: string; readonly relays: readonly string[] }
    }>
  }
  readonly safe: {
    readonly the_key_of_a_mailbox: (
      context: zz.RootContext,
      input: { readonly mailbox_key_id: string },
    ) => ARead<{ readonly collect_secret: string }>
  }
  readonly collect: ACollect
  readonly entry: (collected: AnEnvelopeCollected) => Promise<void>
  readonly handed?: (collected: AnEnvelopeCollected) => void
}

/** The mailboxes the node collects now (BND-11), each with its R from the safe (SEA-4); one with no key is a fault of the wiring. */
const the_mailboxes_of = async (
  wiring: TheCollectorsWiring,
  faults: unknown[],
): Promise<readonly AMailboxToCollect[]> => {
  const now = (): zz.RootContext => ({
    now: wiring.clock.now(),
    time_zone: wiring.clock.time_zone,
  })
  const mailboxes = await the_entries_of(wiring.address_book.the_mailboxes_i_collect(now(), {}))
  const each = await Promise.all(
    mailboxes.map(async (mailbox): Promise<AMailboxToCollect | undefined> => {
      const [key] = await the_entries_of(
        wiring.safe.the_key_of_a_mailbox(now(), { mailbox_key_id: mailbox.id }),
      )
      if (key === undefined) {
        faults.push(new Error(`no key of the mailbox of ${mailbox.id} in the safe (SEA-4)`))
        return undefined
      }
      return {
        deposit_address: mailbox.my_mailbox.deposit_address,
        collect_secret: key.collect_secret,
        relays: mailbox.my_mailbox.relays,
      }
    }),
  )
  return each.filter((mailbox) => mailbox !== undefined)
}

/**
 * The collector (DOM-17): `collects()`, one pass. For each mailbox the node
 * collects, its deposits at the relay, in the relay's order; each not seen
 * yet (by its D and its deposit id, kept while the node runs) handed to the
 * entry as `{ came_to, envelope }`, then seen. One the entry throws on stays
 * unseen, and the rest of that mailbox waits behind it for the next pass. A
 * collect that throws (the transport down) leaves that mailbox for the next
 * pass. Either way the other mailboxes go on, and the first fault is thrown
 * once the pass is over, so that a pass that met one says so: a collect's
 * fault as an entry's, not one that stops the pass (a relay down would keep
 * the node from the mailboxes at the others). A mailbox the safe has no key
 * of is a fault of the wiring, thrown likewise.
 */
export const the_collector = (wiring: TheCollectorsWiring) => {
  const seen = new Set<string>()
  return async (): Promise<void> => {
    const faults: unknown[] = []
    for (const mailbox of await the_mailboxes_of(wiring, faults)) {
      let deposits: readonly ADeposit[]
      try {
        deposits = await wiring.collect(mailbox)
      } catch (fault) {
        faults.push(fault)
        continue
      }
      for (const deposit of deposits) {
        const at = `${mailbox.deposit_address}/${deposit.deposit_id}`
        if (seen.has(at)) continue
        const collected = { came_to: mailbox.deposit_address, envelope: deposit.envelope }
        try {
          await wiring.entry(collected)
        } catch (fault) {
          faults.push(fault)
          break
        }
        seen.add(at)
        wiring.handed?.(collected)
      }
    }
    if (faults.length > 0) throw faults[0]
  }
}
