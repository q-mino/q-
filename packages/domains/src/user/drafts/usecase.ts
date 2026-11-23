import { command_use_case, read_use_case, command, query } from './_scope_usecase.ts'

// The use cases of the drafts (USR-5).

/** A draft is kept. */
export const keep_a_draft = command_use_case({ command: command.keep_a_draft })

/** A draft is dropped. */
export const drop_a_draft = command_use_case({ command: command.drop_a_draft })

/** The draft for this. */
export const a_draft = read_use_case({ query: query.a_draft })
