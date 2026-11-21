// The address book's pure functions over its values (DOM-5), added at need:
// usable by the adapters, the interface and the client.

import { date_time } from '../../library/index.ts'
import type { value } from './_scope_dsl.ts'

/** A face with this id is in the address book, being made or made. */
export const a_face_is_there = (the_face: value.face | undefined): the_face is value.face =>
  the_face !== undefined

/** The face is made: it has its public key. */
export const the_face_is_made = (the_face: value.face | undefined): boolean =>
  the_face?.status === 'made'

/** The face is being made: the safe is drawing its seed. */
export const the_face_is_being_made = (the_face: value.face | undefined): boolean =>
  the_face?.status === 'being_made'

/** A bond with this id is in the address book, kept or removed. */
export const a_bond_is_there = (the_bond: value.bond | undefined): the_bond is value.bond =>
  the_bond !== undefined

/** The bond is in the user's list. */
export const the_bond_is_kept = (the_bond: value.bond | undefined): boolean =>
  the_bond?.status === 'kept'

/** The user removed the bond. */
export const the_bond_is_removed = (the_bond: value.bond | undefined): boolean =>
  the_bond?.status === 'removed'

/** How long a ticket holds (BND-8): 48 hours, from when it was asked for. */
export const a_ticket_s_hours = 48

/** When a ticket asked for at this instant expires (BND-8). */
export const the_expiry_of_a_ticket_asked_at = (now: date_time): date_time =>
  date_time.parse(new Date(Date.parse(now) + a_ticket_s_hours * 3_600_000).toISOString())

/**
 * The window of a crossing (BND-10): their introduction declares a time
 * within two minutes of my opening their ticket, before or after it, and
 * the handshake is in person.
 */
export const a_crossing_s_minutes = 2

/** Two instants within the window of a crossing of each other, in either order (BND-10). */
const within_the_window_of_a_crossing = (one: date_time, other: date_time): boolean =>
  Math.abs(Date.parse(one) - Date.parse(other)) <= a_crossing_s_minutes * 60_000

/**
 * I opened their ticket within the window of a crossing of the time their
 * introduction declares (BND-10): my opening, when my introduction was
 * sent, by my clock; their time, their claim (PER-13).
 */
export const i_opened_their_ticket_within_the_window_of_a_crossing_of =
  (declared_at: date_time) =>
  (the_bond: value.bond | undefined): boolean =>
    the_bond?.my_introduction?.state === 'sent' &&
    within_the_window_of_a_crossing(the_bond.my_introduction.at, declared_at)

/**
 * Their introduction, come first, declares a time within the window of a
 * crossing of this instant, my opening their ticket (BND-10).
 */
export const their_introduction_is_declared_within_the_window_of_a_crossing_of =
  (now: date_time) =>
  (the_bond: value.bond | undefined): boolean =>
    the_bond?.their_introduction?.state === 'received' &&
    within_the_window_of_a_crossing(the_bond.their_introduction.declared_at, now)

/**
 * What my face signs to make a ticket's secret (BND-9): the text `q-ticket/`
 * then the ticket's mailbox address, as bytes in base64url. `q-ticket/` is 9
 * bytes, a multiple of 3, so its base64url (`cS10aWNrZXQv`) and the D's
 * join into the base64url of both: a content no letter of `post` is, since
 * none begins so (step 10 keeps it).
 */
export const the_content_a_ticket_s_secret_signs = (
  deposit_address: value.deposit_address,
): string => `cS10aWNrZXQv${deposit_address}`

/** The ticket of the bond is being prepared. */
export const the_ticket_is_being_prepared = (the_bond: value.bond | undefined): boolean =>
  the_bond?.status === 'ticket_being_prepared'

/** The ticket of the bond is ready. */
export const the_ticket_is_ready = (the_bond: value.bond | undefined): boolean =>
  the_bond?.status === 'ticket_ready'

/** The ticket of the bond expired. */
export const the_ticket_has_expired = (the_bond: value.bond | undefined): boolean =>
  the_bond?.status === 'ticket_expired'

/** My introduction on the bond is sent. */
export const my_introduction_is_sent = (the_bond: value.bond | undefined): boolean =>
  the_bond?.my_introduction?.state === 'sent'

/** A letter of theirs came on the bond. */
export const the_confirmation_is_received = (the_bond: value.bond | undefined): boolean =>
  the_bond?.confirmation?.state === 'received'
