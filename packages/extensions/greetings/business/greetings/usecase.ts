import { command_use_case, command, effect } from './_scope_usecase.ts'

// The use cases of `greetings`, its only entry (DOM-2): the leaves of its
// personas reach those of its door; the effect executor brings back what
// came of a greeting (DOM-14).

/** A bond is greeted, and asked for a greeting back. */
export const greet_a_bond = command_use_case({ command: command.greet_a_bond })

/** A greeting is closed with what came back: the return of the request. */
export const close_a_greeting = command_use_case({
  command: command.close_a_greeting,
  returns_from: effect.ask_for_a_greeting_back,
})

/** A bond that greeted the node is greeted back. */
export const greet_a_bond_back = command_use_case({ command: command.greet_a_bond_back })
