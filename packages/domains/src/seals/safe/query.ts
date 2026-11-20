import { z } from 'zod'
import {
  query,
  AND,
  face_selection,
  mailbox_key_selection,
  face_calculation,
  id,
  value,
} from './_scope_query.ts'

/** The face is the one named, and made. */
export const the_face_is_made_under_this_id = AND({
  the_face_has_the_id: face_selection.the_face_has_this_id,
  the_face_is_made: face_selection.the_face_is_made,
})

/** The mailbox key is the one named, and drawn. */
export const the_mailbox_key_is_drawn_under_this_id = AND({
  the_mailbox_key_has_the_id: mailbox_key_selection.the_mailbox_key_has_this_id,
  the_mailbox_key_is_drawn: mailbox_key_selection.the_mailbox_key_is_drawn,
})

/**
 * `post` brings the safe a content to sign with Anna's face (SEA-6): the face,
 * its public key and its signature over the content; nothing is recorded,
 * and the private key stays in the safe. No entry if the face is not made.
 */
export const a_content_signed_by_a_face = query({
  input: z.strictObject({
    face_id: id.face_id,
    content: value.content,
  }),
  fields: value.face_of_mine,
  calculations: { signature: face_calculation.the_signature_of_a_content },
  identity: 'id',
  selection: the_face_is_made_under_this_id,
  order: { id: 'ascending' },
  creator: () => (input) => ({
    selection: {
      the_face_has_the_id: { face_id: input.face_id },
      the_face_is_made: {},
    },
    calculations: {
      signature: { content: input.content },
    },
  }),
})

/**
 * `post` brings the safe a sealed content come for Anna's face (SEA-6): the
 * face, its public key and the content opened, or not opened.
 */
export const a_sealed_content_opened_by_a_face = query({
  input: z.strictObject({
    face_id: id.face_id,
    sealed_content: value.sealed_content,
  }),
  fields: value.face_of_mine,
  calculations: { opened: face_calculation.the_sealed_content_opened },
  identity: 'id',
  selection: the_face_is_made_under_this_id,
  order: { id: 'ascending' },
  creator: () => (input) => ({
    selection: {
      the_face_has_the_id: { face_id: input.face_id },
      the_face_is_made: {},
    },
    calculations: {
      opened: { sealed_content: input.sealed_content },
    },
  }),
})

/**
 * Who collects from the relay asks the safe for a mailbox's key (SEA-4, V5):
 * its collect secret R, to show, and its deposit address D, to name.
 */
export const the_key_of_a_mailbox = query({
  input: z.strictObject({
    mailbox_key_id: id.mailbox_key_id,
  }),
  fields: value.key_shown_to_the_relay,
  identity: 'id',
  selection: the_mailbox_key_is_drawn_under_this_id,
  order: { id: 'ascending' },
  creator: () => (input) => ({
    selection: {
      the_mailbox_key_has_the_id: { mailbox_key_id: input.mailbox_key_id },
      the_mailbox_key_is_drawn: {},
    },
  }),
})
