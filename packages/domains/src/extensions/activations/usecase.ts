import { command_use_case, read_use_case, command, effect, query } from './_scope_usecase.ts'

// The use cases of the activations, their only entry (DOM-2): the user's on
// `self` (her choices and her questions, steps 13 and 15); the kernel's
// reads (its routing, its port of requests, its hosting, auth's lookup,
// EXT-6, PER-9); the kernel's leaf on `known` that answers a question
// (step 13); the effect executor brings back what came of a question
// (DOM-14).

/** An extension is activated, its manifest accepted. */
export const activate_an_extension = command_use_case({ command: command.activate_an_extension })

/** An extension is deactivated. */
export const deactivate_an_extension = command_use_case({
  command: command.deactivate_an_extension,
})

/** The offer of an extension is withdrawn from a bond. */
export const withdraw_the_offer_from_a_bond = command_use_case({
  command: command.withdraw_the_offer_from_a_bond,
})

/** An extension is offered to a bond again. */
export const offer_an_extension_to_a_bond = command_use_case({
  command: command.offer_an_extension_to_a_bond,
})

/** A bond is asked for the extensions in common. */
export const ask_a_bond_for_the_extensions_in_common = command_use_case({
  command: command.ask_a_bond_for_the_extensions_in_common,
})

/** What came back of a question about the extensions in common is learned: the return of the request. */
export const learn_the_extensions_in_common = command_use_case({
  command: command.learn_the_extensions_in_common,
  returns_from: effect.ask_for_the_extensions_in_common,
})

/** An installed extension, with whether it is active. */
export const an_extension = read_use_case({ query: query.an_extension })

/** The extensions offered to a bond. */
export const the_extensions_offered_to_a_bond = read_use_case({
  query: query.the_extensions_offered_to_a_bond,
})

/** The extensions in common with a bond, for what its face offers. */
export const the_extensions_in_common = read_use_case({ query: query.the_extensions_in_common })
