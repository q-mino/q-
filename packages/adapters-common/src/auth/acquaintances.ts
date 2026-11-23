import * as zz from '@q-mino/domains/library'
import type * as lookup from '@q-mino/domains/auth/acquaintances/_lookup.ts'

// Auth's adapters, the acquaintances (PER-9, PER-22, GR-4; part 13.2): the
// three lookups of `auth/acquaintances`, each one key, a face at my mailbox,
// and one value or not known (D30), over the read use cases of the address
// book (`bonds`) and of the office of the extensions (`extensions`), which
// the configurator gives as functions, so that the oracle and the phone wire
// them alike. Data only, never a decision: the comparisons are the nodes'
// and the kernel's; here only the keys that link auth's identities to the
// address book's and the office's (the same keys). Each read at the instant
// it is asked, so that a bond removed or an offer withdrawn holds from the
// next letter.

/** A read's events as the acquaintances read them: its snapshot's entries, or a refusal of its input. */
type ARead<entry> = AsyncIterable<
  | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
  | { readonly event: 'invalid_request' }
>

/**
 * The address book's reads the acquaintances need (BND-4, BND-10), as its
 * read ports give them: the bond kept at a mailbox of mine, with the face
 * of mine it belongs to and their face's key; a ready ticket of mine at a
 * mailbox, with the face of mine it is for; a bond kept, by its id, with
 * the name the user gives it.
 */
export interface TheAddressBooksReads {
  readonly the_bond_at_my_mailbox: (
    context: zz.RootContext,
    input: { readonly deposit_address: string },
  ) => ARead<{
    readonly id: string
    readonly my_face_id: string
    readonly their_face: { readonly key: string }
  }>
  readonly the_ticket_at_my_mailbox: (
    context: zz.RootContext,
    input: { readonly deposit_address: string },
  ) => ARead<{ readonly id: string; readonly my_face_id: string }>
  readonly a_bond: (
    context: zz.RootContext,
    input: { readonly bond_id: string },
  ) => ARead<{ readonly id: string; readonly name: string }>
}

/**
 * The office's read the acquaintances need (EXT-6, EXT-7), as its read port
 * gives it: the extensions offered to a bond, the active ones whose offer
 * is not withdrawn from it, each by its name with the majors of its
 * surface on `known`.
 */
export interface TheOfficesOffers {
  readonly the_extensions_offered_to_a_bond: (
    context: zz.RootContext,
    input: { readonly bond: string },
  ) => ARead<{ readonly name: string; readonly majors: readonly number[] }>
}

/** The acquaintances' wiring (GR-6): the clock, the address book's reads, the office's. */
export interface TheAcquaintancesWiring {
  readonly clock: zz.Clock
  readonly address_book: TheAddressBooksReads
  readonly office: TheOfficesOffers
}

/** The three lookups of the acquaintances, as `zz.lookup_ports` takes their implementations. */
export type TheAcquaintances = zz.LookupAdapter<{
  readonly the_bond_of_a_face_at_my_mailbox: typeof lookup.the_bond_of_a_face_at_my_mailbox
  readonly the_ticket_a_face_presents_at_my_mailbox: typeof lookup.the_ticket_a_face_presents_at_my_mailbox
  readonly the_extensions_offered_to_the_bond_of_a_key: typeof lookup.the_extensions_offered_to_the_bond_of_a_key
}>

/** A face at my mailbox, the key of every lookup (PER-22): the signer's key and the mailbox of mine the letter came to. */
interface AFaceAtMyMailbox {
  readonly face: string
  readonly mailbox: string
}

/** The entries of a read's snapshot, its first event; none for a refused input (a key out of the read's form). */
const the_entries_of = async <entry>(events: ARead<entry>): Promise<readonly entry[]> => {
  for await (const event of events) return event.event === 'snapshot' ? event.entries : []
  return []
}

/** A value known (D30). */
const known = <value>(value: value): zz.Answer<value> => ({ answer: 'known', value })

/** Nothing known: a lookup's answer when the key leads to no value (D30). */
const not_known: zz.Answer<never> = { answer: 'not_known' }

/**
 * The acquaintances over the address book and the office (PER-22):
 * - `the_bond_of_a_face_at_my_mailbox`: the bond kept at the mailbox whose
 *   face's key is the one asked with, with the face of mine it belongs to
 *   and the name the user gives it; not known when no bond is kept there,
 *   or the one kept there is another face's (a known key outside its bond);
 * - `the_ticket_a_face_presents_at_my_mailbox`: a ready ticket of mine at
 *   the mailbox, or the bond kept there with that face (the crossed QR,
 *   BND-11), with the face of mine and the key asked with; not known
 *   otherwise;
 * - `the_extensions_offered_to_the_bond_of_a_key` (EXT-6): not known
 *   without the bond of the first lookup; else the extensions the office
 *   offers that bond, each with its majors on `known`, an empty list when
 *   none.
 */
export const the_acquaintances = (wiring: TheAcquaintancesWiring): TheAcquaintances => {
  const now = (): zz.RootContext => ({
    now: wiring.clock.now(),
    time_zone: wiring.clock.time_zone,
  })
  /** The bond kept at the mailbox, if its face is the one asked with. */
  const the_bond_kept_with = async (asked: AFaceAtMyMailbox) => {
    const [kept] = await the_entries_of(
      wiring.address_book.the_bond_at_my_mailbox(now(), { deposit_address: asked.mailbox }),
    )
    return kept?.their_face.key === asked.face ? kept : undefined
  }
  const the_bond_of_a_face_at_my_mailbox: TheAcquaintances['the_bond_of_a_face_at_my_mailbox'] =
    async (asked) => {
      const kept = await the_bond_kept_with(asked)
      if (kept === undefined) return not_known
      const [card] = await the_entries_of(wiring.address_book.a_bond(now(), { bond_id: kept.id }))
      return card === undefined
        ? not_known
        : known({
            bond_id: kept.id,
            my_face_id: kept.my_face_id,
            their_key: asked.face,
            name: card.name,
          })
    }
  return {
    the_bond_of_a_face_at_my_mailbox,
    the_ticket_a_face_presents_at_my_mailbox: async (asked) => {
      const [ticket] = await the_entries_of(
        wiring.address_book.the_ticket_at_my_mailbox(now(), { deposit_address: asked.mailbox }),
      )
      const presented = ticket ?? (await the_bond_kept_with(asked))
      return presented === undefined
        ? not_known
        : known({ bond_id: presented.id, my_face_id: presented.my_face_id, their_key: asked.face })
    },
    the_extensions_offered_to_the_bond_of_a_key: async (asked) => {
      const bond = await the_bond_of_a_face_at_my_mailbox(asked)
      if (bond.answer === 'not_known') return not_known
      const offered = await the_entries_of(
        wiring.office.the_extensions_offered_to_a_bond(now(), { bond: bond.value.bond_id }),
      )
      return known(offered.map((each) => ({ extension: each.name, majors: [...each.majors] })))
    },
  }
}
