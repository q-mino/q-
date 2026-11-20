import { reaction, address_book, safe } from './_scope_reaction.ts'

// The procedure of the first face: what the offices of the node do when the
// user starts her phone for the first time (GR-9, DOM-16, BND-8). A standing
// order speaks the language of both offices; neither knows it.

/**
 * When the address book asks for Anna's first face, the safe makes it from
 * a new seed, under the same id (SEA-3, BND-2).
 */
export const the_safe_makes_the_first_face = reaction({
  when: address_book.fact.a_first_face_has_been_asked_for,
  invokes: safe.usecase.make_a_face_from_a_new_seed,
  translation: (fact) => ({ face_id: fact.face_being_made.id }),
})

/**
 * When the safe has made a face from a new seed, the address book keeps its
 * public key: of the safe's fact, the face's id and its public key only,
 * never its secrets (SEA-7).
 */
export const the_address_book_keeps_the_key_of_the_face = reaction({
  when: safe.fact.a_face_has_been_made_from_a_new_seed,
  invokes: address_book.usecase.keep_the_key_of_a_face,
  translation: (fact) => ({
    face_id: fact.made_face.id,
    public_key: fact.made_face.public_key,
  }),
})
