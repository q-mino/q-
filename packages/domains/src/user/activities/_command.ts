// generated

// The commands of `user/activities` from `command.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `command.ts`.

import { z } from 'zod'
import * as command from './command.ts'

/**
 * No activity with this id has been asked.
 *
 * @see {@link command.the_activity_is_new}
 */
export const the_activity_is_new = command.the_activity_is_new
export type the_activity_is_new = z.output<typeof the_activity_is_new>

/**
 * Anna taps "Ping" on her bond with Bruno, or renames it, or activates ping
 * pong: the screen asks for an activity, with the id it drew (DOM-12). The
 * office keeps it in progress and queues its carrying out. The same id
 * again (a tap repeated, a screen reloaded) changes nothing.
 *
 * @see {@link command.ask_for_an_activity}
 */
export const ask_for_an_activity = command.ask_for_an_activity

/**
 * The input of `ask_for_an_activity`, declared inline.
 *
 * @see {@link command.ask_for_an_activity}
 */
export const ask_for_an_activity_input = command.ask_for_an_activity.input
export type ask_for_an_activity_input = z.output<typeof ask_for_an_activity_input>

/**
 * Bruno's pong came back, or the bond is renamed, or ping pong is off: the
 * activity ends, how in her words (USR-3), the return of its carrying out.
 * One that is not in progress is refused: a held letter, shown (DOM-15).
 *
 * @see {@link command.end_an_activity}
 */
export const end_an_activity = command.end_an_activity

/**
 * The input of `end_an_activity`, declared inline.
 *
 * @see {@link command.end_an_activity}
 */
export const end_an_activity_input = command.end_an_activity.input
export type end_an_activity_input = z.output<typeof end_an_activity_input>
