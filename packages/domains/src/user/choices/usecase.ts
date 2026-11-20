import { command_use_case, read_use_case, command, query } from './_scope_usecase.ts'

// The use cases of the choices (USR-6).

/** She changes face. */
export const change_face = command_use_case({ command: command.change_face })

/** The active face. */
export const the_active_face = read_use_case({ query: query.the_active_face })
