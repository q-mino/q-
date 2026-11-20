import { z } from 'zod'
import {
  command,
  identity_of,
  AND,
  NOT,
  pick,
  address_book,
  dsl,
  effect,
  fact,
  id,
  predicate,
  value,
} from './_scope_command.ts'

// The user's choices about the extensions (EXT-7), commands of `self` only:
// activation and offers are hers, never a peer's. And the questions her
// node asks a bond about the extensions in common (EXT-8), with their
// return.

/** The extension is installed with the manifest shown, which the user has not accepted yet. */
export const the_manifest_shown_is_new = AND({
  the_extension_is_installed_with_it: predicate.the_extension_is_installed_with_this_manifest,
  it_is_not_activated_with_it: NOT(predicate.the_extension_is_activated_with_this_manifest),
})

/** The extension is installed with the manifest shown, and the user activated it with that manifest already. */
export const the_manifest_shown_is_accepted_already = AND({
  the_extension_is_installed_with_it: predicate.the_extension_is_installed_with_this_manifest,
  it_is_activated_with_it: predicate.the_extension_is_activated_with_this_manifest,
})

/**
 * Anna activates greetings (EXT-7), the conscious act: from the
 * extension's screen, accepting what its manifest shows (what it sees, what
 * it touches, its extension points, its leaves on known faces), at its
 * version. The office records the manifest she accepted, which is the one
 * installed: one shown before an update, or not the node's, is refused. An
 * update that asks more is accepted so, and one already accepted again
 * changes nothing.
 */
export const activate_an_extension = command({
  input: z.strictObject({
    manifest: value.manifest,
  }),
  outcomes: {
    the_manifest_shown_is_new_so_it_is_activated: [
      the_manifest_shown_is_new,
      fact.an_extension_has_been_activated,
    ],
    the_manifest_shown_is_accepted_already_so_nothing_changes: [
      the_manifest_shown_is_accepted_already,
      fact.an_extension_has_been_activated_again,
    ],
  },
  creator: (context) => (input) => {
    const checked = {
      the_extension_is_installed_with_it: { manifest: input.manifest },
      it_is_not_activated_with_it: { manifest: input.manifest },
    }
    return {
      the_manifest_shown_is_new_so_it_is_activated: [
        checked,
        {
          activated_extension: {
            name: input.manifest.name,
            status: 'activated',
            accepted: input.manifest,
            at: context.now,
          },
        },
      ],
      the_manifest_shown_is_accepted_already_so_nothing_changes: [
        {
          the_extension_is_installed_with_it: { manifest: input.manifest },
          it_is_activated_with_it: { manifest: input.manifest },
        },
        { name: input.manifest.name },
      ],
    }
  },
})

/** The user has not activated the extension, or has deactivated it. */
export const the_extension_is_not_activated = NOT(predicate.the_extension_is_activated)

/**
 * Anna deactivates greetings (EXT-7): it runs nothing, serves nothing, its
 * leaves silent to every bond (F8), until she activates it again. One she
 * has not activated, deactivated again, changes nothing. Her offers stay as
 * she left them, for when she activates it again.
 */
export const deactivate_an_extension = command({
  input: z.strictObject({
    name: id.extension_name,
  }),
  outcomes: {
    the_extension_is_activated_so_it_is_deactivated: [
      predicate.the_extension_is_activated,
      fact.an_extension_has_been_deactivated,
    ],
    the_extension_is_not_activated_so_nothing_changes: [
      the_extension_is_not_activated,
      fact.an_extension_has_been_deactivated_again,
    ],
  },
  creator: (context) => (input) => ({
    the_extension_is_activated_so_it_is_deactivated: [
      { name: input.name },
      { deactivated_extension: { name: input.name, status: 'deactivated', at: context.now } },
    ],
    the_extension_is_not_activated_so_nothing_changes: [{ name: input.name }, { name: input.name }],
  }),
})

/** The extension is installed, the bond is one of the user's, and the extension is offered to it: its offer not withdrawn. */
export const the_extension_is_offered_to_the_bond = AND({
  the_extension_is_installed: predicate.the_extension_is_installed,
  the_bond_exists: predicate.the_bond_exists,
  the_offer_is_not_withdrawn: NOT(predicate.the_offer_is_withdrawn_from_the_bond),
})

/** The extension is installed, the bond is one of the user's, and she withdrew the offer from it. */
export const the_offer_is_withdrawn_from_the_bond = AND({
  the_extension_is_installed: predicate.the_extension_is_installed,
  the_bond_exists: predicate.the_bond_exists,
  the_offer_is_withdrawn: predicate.the_offer_is_withdrawn_from_the_bond,
})

/**
 * Anna withdraws the offer of greetings from her bond with Carla (EXT-7):
 * her node neither serves it to Carla (F8) nor asks with it on their bond,
 * and draws none of its extension points on Carla's screen; to Bruno it is
 * still offered. From a bond that is not hers (never one, or removed), or
 * of an extension the node does not have, refused. Withdrawn already, it
 * changes nothing.
 */
export const withdraw_the_offer_from_a_bond = command({
  input: z.strictObject({
    name: id.extension_name,
    bond: address_book.id.bond_id,
  }),
  outcomes: {
    the_extension_is_offered_to_the_bond_so_the_offer_is_withdrawn: [
      the_extension_is_offered_to_the_bond,
      fact.the_offer_of_an_extension_has_been_withdrawn_from_a_bond,
    ],
    the_offer_is_withdrawn_already_so_nothing_changes: [
      the_offer_is_withdrawn_from_the_bond,
      fact.the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again,
    ],
  },
  creator: () => (input) => ({
    the_extension_is_offered_to_the_bond_so_the_offer_is_withdrawn: [
      {
        the_extension_is_installed: { name: input.name },
        the_bond_exists: { bond: input.bond },
        the_offer_is_not_withdrawn: { name: input.name, bond: input.bond },
      },
      { withdrawn_offer: { name: input.name, bond: input.bond } },
    ],
    the_offer_is_withdrawn_already_so_nothing_changes: [
      {
        the_extension_is_installed: { name: input.name },
        the_bond_exists: { bond: input.bond },
        the_offer_is_withdrawn: { name: input.name, bond: input.bond },
      },
      { name: input.name, bond: input.bond },
    ],
  }),
})

/**
 * Anna offers greetings to Carla again (EXT-7): the offer she withdrew
 * comes back, a change, so no `again`. Offered already (every bond is, by
 * default), it changes nothing. To a bond that is not hers, or of an
 * extension the node does not have, refused.
 */
export const offer_an_extension_to_a_bond = command({
  input: z.strictObject({
    name: id.extension_name,
    bond: address_book.id.bond_id,
  }),
  outcomes: {
    the_offer_is_withdrawn_from_the_bond_so_it_is_offered_again: [
      the_offer_is_withdrawn_from_the_bond,
      fact.an_extension_has_been_offered_to_a_bond,
    ],
    the_extension_is_offered_to_the_bond_already_so_nothing_changes: [
      the_extension_is_offered_to_the_bond,
      fact.an_extension_has_been_offered_to_a_bond_again,
    ],
  },
  creator: () => (input) => ({
    the_offer_is_withdrawn_from_the_bond_so_it_is_offered_again: [
      {
        the_extension_is_installed: { name: input.name },
        the_bond_exists: { bond: input.bond },
        the_offer_is_withdrawn: { name: input.name, bond: input.bond },
      },
      { name: input.name, bond: input.bond },
    ],
    the_extension_is_offered_to_the_bond_already_so_nothing_changes: [
      {
        the_extension_is_installed: { name: input.name },
        the_bond_exists: { bond: input.bond },
        the_offer_is_not_withdrawn: { name: input.name, bond: input.bond },
      },
      { name: input.name, bond: input.bond },
    ],
  }),
})

/** The question is new, the bond is one of the user's, and the node offers it what it tells. */
export const the_question_can_be_asked = AND({
  the_question_is_new: NOT(predicate.a_question_has_this_id),
  the_bond_exists: predicate.the_bond_exists,
  what_it_tells_is_offered: predicate.these_extensions_are_offered_to_the_bond,
})

/**
 * Anna's phone asks Bruno's which extensions they have in common (EXT-8):
 * on their bond, telling what it offers him (greetings, at major 1), and
 * nothing it does not (F8: each side tells only what it offers the other).
 * The question, named by the operation that asks it, waits 60 seconds for
 * what comes back. When to ask (at the introduction, on a bond's screen)
 * is `user`'s, which gives what the node offers the bond as
 * `the_extensions_offered_to_a_bond` reads it. Asked again under the same
 * operation, it is the recorded fact (DOM-11).
 */
export const ask_a_bond_for_the_extensions_in_common = command({
  input: z.strictObject({
    bond: address_book.id.bond_id,
    offered: value.offered_extensions,
  }),
  outcomes: {
    the_question_can_be_asked_so_it_is_asked: [
      the_question_can_be_asked,
      fact.a_bond_has_been_asked_for_the_extensions_in_common,
      pick(effect, 'ask_for_the_extensions_in_common'),
    ],
  },
  creator: (context) => (input) => {
    const question_id = identity_of(id.question_id)(context.operation)
    return {
      the_question_can_be_asked_so_it_is_asked: [
        {
          the_question_is_new: { question_id },
          the_bond_exists: { bond: input.bond },
          what_it_tells_is_offered: { bond: input.bond, offered: input.offered },
        },
        {
          question: {
            id: question_id,
            bond: input.bond,
            offered: input.offered,
            progress: { stage: 'waiting' },
          },
        },
        {
          ask_for_the_extensions_in_common: {
            id: question_id,
            payload: {
              question_id,
              bond: input.bond,
              offered: input.offered,
              waits: dsl.a_question_waits,
            },
          },
        },
      ],
    }
  },
})

/** The question waits, and the extensions in common came back. */
export const the_question_waits_and_they_came_back = AND({
  the_question_waits: predicate.the_question_waits,
  they_came_back: predicate.the_extensions_in_common_came_back,
})

/** The question waits, and no answer came back. */
export const the_question_waits_and_no_answer_came_back = AND({
  the_question_waits: predicate.the_question_waits,
  no_answer_came_back: NOT(predicate.the_extensions_in_common_came_back),
})

/**
 * What came back of Anna's question closes it (EXT-8, DOM-13): the
 * extensions Bruno's phone offers back, with the majors it serves, learned;
 * or no answer, with why: no response in its 60 seconds, or a phone that
 * cannot answer it. The return of `ask_for_the_extensions_in_common`, its
 * input the office's closed set. A question that waits no more (closed, or
 * never asked) is refused: a dead letter of the executor, shown.
 */
export const learn_the_extensions_in_common = command({
  input: z.strictObject({
    question_id: id.question_id,
    what_came_back: value.what_came_back,
  }),
  outcomes: {
    they_came_back_so_they_are_learned: [
      the_question_waits_and_they_came_back,
      fact.the_extensions_in_common_with_a_bond_have_been_learned,
    ],
    no_answer_came_back_so_it_had_no_answer: [
      the_question_waits_and_no_answer_came_back,
      fact.a_question_about_the_extensions_in_common_had_no_answer,
    ],
  },
  creator: () => (input) => {
    const came_back = input.what_came_back
    const checked = {
      the_question_waits: { question_id: input.question_id },
    }
    return {
      they_came_back_so_they_are_learned: [
        { ...checked, they_came_back: { what_came_back: came_back } },
        {
          question_id: input.question_id,
          in_common:
            came_back.outcome === 'the_extensions_in_common_came_back' ? came_back.in_common : [],
        },
      ],
      no_answer_came_back_so_it_had_no_answer: [
        { ...checked, no_answer_came_back: { what_came_back: came_back } },
        {
          question_id: input.question_id,
          why: came_back.outcome === 'no_answer_came_back' ? came_back.why : 'no_response',
        },
      ],
    }
  },
})
