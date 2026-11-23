import { z } from 'zod'
import {
  command,
  identity_of,
  pick,
  NOT,
  dsl,
  effect,
  fact,
  id,
  predicate,
  value,
} from './_scope_command.ts'

/** No face has the id the asker gives this one. */
export const the_face_is_new = NOT(predicate.a_face_has_this_id)

/** No mailbox key has the id the asker gives this one. */
export const the_mailbox_key_is_new = NOT(predicate.a_mailbox_key_has_this_id)

/**
 * Anna's phone needs her first face (SEA-3): the safe files it under the id
 * `bonds` gives, and draws a new seed to make it from. Reached by a reaction
 * only (PER-21). A face after the first, from a seed in use, comes with
 * stage 2 (SEA-2).
 */
export const make_a_face_from_a_new_seed = command({
  input: z.strictObject({
    face_id: id.face_id,
  }),
  outcomes: {
    the_face_is_new_so_a_seed_is_drawn_for_it: [
      the_face_is_new,
      fact.a_face_has_been_asked_for,
      pick(effect, 'draw_a_seed_for_the_face'),
    ],
  },
  creator: () => (input) => ({
    the_face_is_new_so_a_seed_is_drawn_for_it: [
      { face_id: input.face_id },
      {
        face_being_made: {
          id: input.face_id,
          status: 'being_made',
        },
      },
      {
        draw_a_seed_for_the_face: {
          id: input.face_id,
          payload: { face_id: input.face_id },
        },
      },
    ],
  }),
})

/**
 * The safe keeps the seed its machine drew and the face made from it at its
 * first index (SEA-2, SEA-3): the return of the draw. The seed's id is the
 * operation's (D75.8): a redelivery is the duplicate branch, one seed.
 */
export const keep_a_new_seed_and_its_face = command({
  input: z.strictObject({
    face_id: id.face_id,
    seed_secret: value.seed_secret,
    first_face: value.face_keys,
  }),
  outcomes: {
    the_face_is_being_made_so_it_is_made_from_the_seed: [
      predicate.the_face_is_being_made,
      fact.a_face_has_been_made_from_a_new_seed,
    ],
  },
  creator: (context) => (input) => {
    const seed_id = identity_of(id.seed_id)(context.operation)
    return {
      the_face_is_being_made_so_it_is_made_from_the_seed: [
        { face_id: input.face_id },
        {
          new_seed: {
            id: seed_id,
            scheme: 'slip10-flat',
            secret: input.seed_secret,
            next_index: dsl.the_index_after(dsl.the_index_of_a_first_face),
          },
          made_face: {
            id: input.face_id,
            status: 'made',
            seed_id: seed_id,
            index: dsl.the_index_of_a_first_face,
            public_key: input.first_face.public_key,
            private_key: input.first_face.private_key,
            chain_code: input.first_face.chain_code,
          },
        },
      ],
    }
  },
})

/**
 * Anna's phone needs a mailbox of its own for a bond (SEA-4): the safe files
 * its key under the id `bonds` gives, and draws its collect secret. Reached
 * by a reaction only (PER-21).
 */
export const draw_a_mailbox_key = command({
  input: z.strictObject({
    mailbox_key_id: id.mailbox_key_id,
  }),
  outcomes: {
    the_mailbox_key_is_new_so_it_is_drawn: [
      the_mailbox_key_is_new,
      fact.a_mailbox_key_has_been_asked_for,
      pick(effect, 'draw_the_mailbox_key'),
    ],
  },
  creator: () => (input) => ({
    the_mailbox_key_is_new_so_it_is_drawn: [
      { mailbox_key_id: input.mailbox_key_id },
      {
        mailbox_key_being_drawn: {
          id: input.mailbox_key_id,
          status: 'being_drawn',
        },
      },
      {
        draw_the_mailbox_key: {
          id: input.mailbox_key_id,
          payload: { mailbox_key_id: input.mailbox_key_id },
        },
      },
    ],
  }),
})

/**
 * The safe keeps the collect secret its machine drew and the deposit address
 * that hashes it (SEA-4): the return of the draw.
 */
export const keep_a_mailbox_key = command({
  input: z.strictObject({
    mailbox_key_id: id.mailbox_key_id,
    collect_secret: value.collect_secret,
    deposit_address: value.deposit_address,
  }),
  outcomes: {
    the_mailbox_key_is_being_drawn_so_it_is_kept: [
      predicate.the_mailbox_key_is_being_drawn,
      fact.a_mailbox_key_has_been_drawn,
    ],
  },
  creator: () => (input) => ({
    the_mailbox_key_is_being_drawn_so_it_is_kept: [
      { mailbox_key_id: input.mailbox_key_id },
      {
        drawn_mailbox_key: {
          id: input.mailbox_key_id,
          status: 'drawn',
          collect_secret: input.collect_secret,
          deposit_address: input.deposit_address,
        },
      },
    ],
  }),
})
