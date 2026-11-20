import { command_use_case, command, effect } from './_scope_usecase.ts'

// The use cases of `pings`, its only entry (DOM-2): the leaves of its
// personas reach those of its door; the effect executor brings back what
// came of a ping (DOM-14).

/** A ping is sent to a bond, and the bond asked for a pong. */
export const send_a_ping = command_use_case({ command: command.send_a_ping })

/** A ping is closed with what came back: the return of the request. */
export const close_a_ping = command_use_case({
  command: command.close_a_ping,
  returns_from: effect.ask_for_a_pong,
})

/** A bond's ping is answered with a pong. */
export const answer_a_ping = command_use_case({ command: command.answer_a_ping })
