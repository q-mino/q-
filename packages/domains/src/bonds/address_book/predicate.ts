import { z } from 'zod'
import { date_time } from '../../library/index.ts'
import { predicate, id, value } from './_scope_predicate.ts'

// The vocabulary of the conditions. A predicate declares its parameters;
// its value is the adapters', helped by dsl.ts.

/** A face with this id is in the address book, being made or made. */
export const a_face_has_this_id = predicate({
  parameters: z.strictObject({
    face_id: id.face_id,
  }),
})

/** This face is made: it has its public key, and can be bonded (BND-1). */
export const the_face_is_made = predicate({
  parameters: z.strictObject({
    face_id: id.face_id,
  }),
})

/** A bond with this id is in the address book, kept or removed. */
export const a_bond_has_this_id = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** This bond is in the user's list. */
export const the_bond_is_kept = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** The user removed this bond. */
export const the_bond_is_removed = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** The user has a face, being made or made: in stage 1, her one face (BND-8). */
export const the_user_has_a_face = predicate({
  parameters: z.strictObject({}),
})

/** This face is being made: the safe is drawing its seed. */
export const the_face_is_being_made = predicate({
  parameters: z.strictObject({
    face_id: id.face_id,
  }),
})

/** The ticket of this bond is being prepared: the safe is drawing its mailbox's key. */
export const the_ticket_is_being_prepared = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** The ticket of this bond is ready: shown, and used by no one yet. */
export const the_ticket_is_ready = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** The ticket of this bond expired, used by no one. */
export const the_ticket_has_expired = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/**
 * The secret given is the ticket's (BND-9): my face's signature over the
 * ticket's mailbox address holds. The adapter verifies it with the safe's
 * pure function over the face's public key (`seals`' `dsl.the_signature_holds`).
 */
export const the_secret_is_the_ticket_s = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
    secret: value.ticket_secret,
  }),
})

/** The bond is with this face of theirs: their key is the one given. */
export const the_bond_is_with_this_face = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
    key: value.face_key,
  }),
})

/** My node has sent my introduction on this bond (BND-10). */
export const my_introduction_is_sent = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/** A letter of theirs came on this bond: the confirmation is received (BND-5). */
export const the_confirmation_is_received = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
  }),
})

/**
 * I opened their ticket on this bond within the window of a crossing of the
 * time their introduction declares (BND-10): the two tickets crossed, in
 * person. The time is theirs, a claim (PER-13).
 */
export const i_opened_their_ticket_within_the_window_of_a_crossing_of = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
    declared_at: date_time,
  }),
})

/**
 * Their introduction on this bond, come first, declares a time within the
 * window of a crossing of this instant, my opening their ticket (BND-10):
 * the two tickets crossed, in person.
 */
export const their_introduction_is_declared_within_the_window_of_a_crossing_of = predicate({
  parameters: z.strictObject({
    bond_id: id.bond_id,
    now: date_time,
  }),
})
