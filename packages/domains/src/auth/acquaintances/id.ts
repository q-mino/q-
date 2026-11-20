import { z } from 'zod'
import { id } from './_scope_id.ts'

// The identities of the acquaintances, auth's (GR-4, PER-9): in auth's own
// language, never the address book's. The adapters link them to the bonds'
// and the faces' of `bonds` (the same keys); no business domain knows them,
// and a persona gives the business the values it asks (D33).

/**
 * A bond, as auth names it: the same key the address book gives Anna's bond
 * with Bruno, L_b, linked by the adapter. The bond a letter from Bruno's
 * face comes on, at the mailbox of Anna's it was deposited on.
 */
export const bond_id = id({ format: z.string().min(1) })

/**
 * A face of the node's user, the one a bond belongs to: Anna's face F_a,
 * which opens Bruno's letters on L_b and in whose name her node answers.
 */
export const face_id = id({ format: z.string().min(1) })
