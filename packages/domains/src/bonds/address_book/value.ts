import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { id } from './_scope_value.ts'

// The values of the address book (BND-1): the node's user's faces and her
// bonds, as an address book keeps one's own cards and one's contacts. No
// secret: the keys are the safe's, which the address book names by their
// opaque references (BND-2).

/** A field a state does not have: in the type, `?: undefined`; in the data, absent. */
const absent = z.undefined().optional()

/** An Ed25519 public key, 32 bytes in base64url with no padding: 43 characters, the last of the 16 whose two low bits are zero. */
export const face_key = z.string().regex(/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/)

/** The name a face is introduced as: "Anna". Its user's, shown to whoever she bonds with. */
export const face_name = z.string().min(1).max(80)

/**
 * Where a face sits in its user's tree of faces (BND-3): at the top, or
 * under another of her faces. Data of hers, never of the keys: moving a face
 * changes no key, and no key tells a position. In stage 1 the one face is at
 * the top; a face under another comes with stage 2 ("more faces").
 */
export const face_position = z.discriminatedUnion('place', [
  z.strictObject({ place: z.literal('at_the_top') }),
  z.strictObject({ place: z.literal('under_a_face'), face_id: id.face_id }),
])

/** Being made, the safe is drawing its seed; made, it has its public key (SEA-3). */
export const face_status = z.enum(['being_made', 'made'])

/** Every field of every state of a face. Not a state: each state subtracts from it. */
const every_face_field = z.strictObject({
  id: id.face_id,
  status: face_status,
  name: face_name,
  position: face_position,
  public_key: face_key,
})

/** A face named by its user, whose keys the safe is making: no public key yet. */
export const face_being_made = every_face_field.extend({
  status: z.literal(face_status.enum.being_made),
  public_key: absent,
})

/** A face with its public key, which the safe made: it can be shown, and bonded. */
export const made_face = every_face_field.extend({
  status: z.literal(face_status.enum.made),
})

/** A face of the node's user: its states share every field, so any field reads without narrowing. */
export const face = z.discriminatedUnion('status', [face_being_made, made_face])

/** What the user's screens read of a face of hers: its name, its place in her tree, its key. */
export const face_of_mine = made_face.pick({
  id: true,
  name: true,
  position: true,
  public_key: true,
})

/**
 * The address of a relay, where a mailbox is deposited on and collected
 * from: an `https` URL, as a ticket carries it (BND-4). The peer's is its
 * claim (F2).
 */
export const relay_address = z.url({ protocol: /^https$/ }).max(2048)

/**
 * The relays of a mailbox: a list, of one relay in stage 1 (§ Stage 1 of the
 * plan). Preferred relays of a face, overridden per bond, come later, and
 * widen the list.
 */
export const relays = z.array(relay_address).min(1).max(1)

/** A deposit address D, in the relay's form (MBX-1): base64url, at most 128 characters. */
export const deposit_address = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/)
  .max(128)

/** Their face, in a bond: its key, which signs their letters and which mine are sealed for, and the name it is introduced as. */
export const their_face = z.strictObject({
  key: face_key,
  introduced_as: face_name,
})

/** Their mailbox, in a bond: where my node deposits for them, as they declared it at the introduction (BND-4). */
export const their_mailbox = z.strictObject({
  deposit_address: deposit_address,
  relays: relays,
})

/**
 * My mailbox, in a bond: the one they deposit on for me, one for each bond
 * (BND-4), its key in the safe filed under the bond's id (BND-2, BND-7): its
 * D and its relays, which I declared to them in my ticket.
 */
export const my_mailbox = z.strictObject({
  deposit_address: deposit_address,
  relays: relays,
})

/** My mailbox while the safe draws its key (BND-8): its relays, its D still to come. */
export const my_mailbox_being_drawn = my_mailbox.pick({ relays: true })

/**
 * The secret of a ticket (BND-9): my face's signature over the ticket's
 * mailbox address (`dsl.the_content_a_ticket_s_secret_signs`), 64 bytes in
 * base64url, 86 characters. Only my face makes it, so no relay forges an
 * introduction; it is kept nowhere, the safe makes it again when the ticket
 * is shown.
 */
export const ticket_secret = z.string().regex(/^[A-Za-z0-9_-]{85}[AQgw]$/)

/**
 * A ticket as its holder shows it, in a QR or after `#` in a link (BND-8):
 * the face, by its key and the name it is introduced as; the mailbox of the
 * bond to be, its D and its relays; the secret; until when it holds. Theirs,
 * when I open it: their claims (F2), which my node keeps as they are.
 */
export const their_ticket = z.strictObject({
  key: face_key,
  introduced_as: face_name,
  mailbox: z.strictObject({
    deposit_address: deposit_address,
    relays: relays,
  }),
  secret: ticket_secret,
})

/** The name I give a bond: "Annina". Mine, on my node only; theirs stays as they introduced themselves. */
export const bond_name = z.string().min(1).max(80)

/** In person, the crossed QR; at a distance, a link (BND-5). */
export const handshake_way = z.enum(['in_person', 'at_a_distance'])

/**
 * How the bond was made, as my node saw it (BND-5): in person or at a
 * distance, and when, by my clock. Information, not a guarantee (F6).
 */
export const handshake = z.strictObject({
  way: handshake_way,
  at: date_time,
})

/**
 * Whether they have me (BND-5): the confirmation is awaited until a letter
 * of theirs comes on the bond, and received from then, with when it came by
 * my clock.
 */
export const confirmation = z.discriminatedUnion('state', [
  z.strictObject({ state: z.literal('awaited') }),
  z.strictObject({ state: z.literal('received'), at: date_time }),
])

/**
 * Whether I introduced myself to them (BND-10): not yet, when the bond came
 * of their introduction to my ticket; sent, with when, once my node queued
 * my introduction to their ticket.
 */
export const my_introduction = z.discriminatedUnion('state', [
  z.strictObject({ state: z.literal('not_sent') }),
  z.strictObject({ state: z.literal('sent'), at: date_time }),
])

/**
 * Whether their introduction came (BND-10): not yet, when the bond came of
 * my opening their ticket; received, with the time their letter declares
 * (their claim, PER-13), the one the window of a crossing is measured from.
 */
export const their_introduction = z.discriminatedUnion('state', [
  z.strictObject({ state: z.literal('not_received') }),
  z.strictObject({ state: z.literal('received'), declared_at: date_time }),
])

/**
 * The life of a bond (BND-7): its ticket first, being prepared while the
 * safe draws my mailbox's key, then ready to be shown, until it is used,
 * and the bond kept, or it expires; kept, in the user's list; removed, by
 * her, for good (BND-6).
 */
export const bond_status = z.enum([
  'ticket_being_prepared',
  'ticket_ready',
  'ticket_expired',
  'kept',
  'removed',
])

/** Every field of every state of a bond. Not a state: each state subtracts from it. */
const every_bond_field = z.strictObject({
  id: id.bond_id,
  status: bond_status,
  name: bond_name,
  my_face_id: id.face_id,
  their_face: their_face,
  their_mailbox: their_mailbox,
  my_mailbox: my_mailbox,
  expires_at: date_time,
  handshake: handshake,
  confirmation: confirmation,
  my_introduction: my_introduction,
  their_introduction: their_introduction,
  removed_at: date_time,
})

/** Nothing of them yet: the fields a ticket has not. */
const nothing_of_them = {
  name: absent,
  their_face: absent,
  their_mailbox: absent,
  handshake: absent,
  confirmation: absent,
  my_introduction: absent,
  their_introduction: absent,
  removed_at: absent,
}

/**
 * A ticket Anna asked for (BND-8), for her face, expiring 48 hours after:
 * the safe is drawing the key of her mailbox for the bond to be.
 */
export const ticket_being_prepared = every_bond_field.extend({
  status: z.literal(bond_status.enum.ticket_being_prepared),
  my_mailbox: my_mailbox_being_drawn,
  ...nothing_of_them,
})

/** A ticket with its mailbox: it can be shown, and used once until it expires (BND-8). */
export const ticket_ready = every_bond_field.extend({
  status: z.literal(bond_status.enum.ticket_ready),
  ...nothing_of_them,
})

/** A ticket no one used in its 48 hours (BND-8): no bond came of it, its mailbox is collected no more. */
export const ticket_expired = every_bond_field.extend({
  status: z.literal(bond_status.enum.ticket_expired),
  my_mailbox: z.union([my_mailbox, my_mailbox_being_drawn]),
  ...nothing_of_them,
})

/**
 * A bond in the user's list: one of her faces, exactly one, with their face
 * (BND-1), their mailbox and hers, the name she gives them and what her node
 * noted of the handshake.
 */
export const kept_bond = every_bond_field.extend({
  status: z.literal(bond_status.enum.kept),
  removed_at: absent,
})

/** A bond the user removed: out of her list, its letters no longer collected (BND-6). */
export const removed_bond = every_bond_field.extend({
  status: z.literal(bond_status.enum.removed),
})

/** A bond of the node's user, from its ticket on: its states share every field, so any field reads without narrowing. */
export const bond = z.discriminatedUnion('status', [
  ticket_being_prepared,
  ticket_ready,
  ticket_expired,
  kept_bond,
  removed_bond,
])

/** A bond in the user's list: whom, by the name she gives them and theirs, with which face of hers, and whether they have her. */
export const bond_in_the_list = kept_bond.pick({
  id: true,
  name: true,
  my_face_id: true,
  their_face: true,
  confirmation: true,
})

/** A bond as a whole, for its card and for whoever writes on it (`post`, step 10): every value but its status. */
export const bond_card = kept_bond.pick({
  id: true,
  name: true,
  my_face_id: true,
  their_face: true,
  their_mailbox: true,
  my_mailbox: true,
  handshake: true,
  confirmation: true,
})

/**
 * The bond a letter came for, by the mailbox of mine it was deposited on
 * (BND-4): which face of mine opens it, and the key it should be signed by.
 */
export const bond_at_my_mailbox = kept_bond.pick({
  id: true,
  my_face_id: true,
  their_face: true,
})

/**
 * My ticket, to be shown (BND-8): my face, by its key and the name it is
 * introduced as, the mailbox of the bond to be, and until when it holds. Its
 * secret is the safe's to make (BND-9), joined where the ticket is drawn.
 */
export const ticket_to_show = z.strictObject({
  id: id.bond_id,
  my_face_id: id.face_id,
  key: face_key,
  introduced_as: face_name,
  my_mailbox: my_mailbox,
  expires_at: date_time,
})

/** The ticket an introduction came for, by the mailbox it was deposited on (BND-10): the bond to be and my face. */
export const ticket_at_my_mailbox = ticket_ready.pick({
  id: true,
  my_face_id: true,
})

/** A mailbox the phone collects from (BND-11): a ready ticket's, for an introduction, or a kept bond's. */
export const mailbox_to_collect = ticket_ready.pick({
  id: true,
  my_mailbox: true,
})
