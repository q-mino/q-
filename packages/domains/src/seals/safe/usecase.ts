import { command_use_case, read_use_case, command, effect, query } from './_scope_usecase.ts'

// The use cases of the safe, its only entry (DOM-2). Its commands belong to
// no persona tree: reactions and the effect executor reach them, wired by
// the configurator (PER-21); its reads, `post` and who collects from the
// relay. No peer and no screen reaches a secret.

/** A face is asked for, its seed drawn for it: the first face of the node. */
export const make_a_face_from_a_new_seed = command_use_case({
  command: command.make_a_face_from_a_new_seed,
})

/** The safe keeps the seed drawn and the face made from it: the return of the draw. */
export const keep_a_new_seed_and_its_face = command_use_case({
  command: command.keep_a_new_seed_and_its_face,
  returns_from: effect.draw_a_seed_for_the_face,
})

/** A mailbox key is asked for, its collect secret drawn. */
export const draw_a_mailbox_key = command_use_case({ command: command.draw_a_mailbox_key })

/** The safe keeps the collect secret drawn and its deposit address: the return of the draw. */
export const keep_a_mailbox_key = command_use_case({
  command: command.keep_a_mailbox_key,
  returns_from: effect.draw_the_mailbox_key,
})

/** A content signed by a face of the node's user. */
export const a_content_signed_by_a_face = read_use_case({
  query: query.a_content_signed_by_a_face,
})

/** A sealed content opened by a face of the node's user. */
export const a_sealed_content_opened_by_a_face = read_use_case({
  query: query.a_sealed_content_opened_by_a_face,
})

/** The key of a mailbox of the node's, for the relay. */
export const the_key_of_a_mailbox = read_use_case({ query: query.the_key_of_a_mailbox })
