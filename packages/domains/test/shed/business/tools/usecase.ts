import { command_use_case, read_use_case, command, query } from './_scope_usecase.ts'

// The use cases of `tools`, its only entry (DOM-2): every persona, reaction
// and effect executor reaches the catalogue through them. A command use case
// runs one command (DOM-4), a read use case reads one query; in the trivial
// case each declares only its command or its query.

/** The keeper adds a tool to the catalogue: a new drill on the shelf. */
export const add_a_tool = command_use_case({ command: command.add_a_tool })

/** The keeper retires a tool: broken, lost, worn out or given away. */
export const retire_a_tool = command_use_case({ command: command.retire_a_tool })

/**
 * The tool goes to the workshop: Luca found the drill broken on the shelf,
 * or a standing order brings the news of a damaged return.
 */
export const send_a_tool_to_repair = command_use_case({ command: command.send_a_tool_to_repair })

/** The keeper puts a repaired tool back on the shelf. */
export const put_a_repaired_tool_back_in_service = command_use_case({
  command: command.put_a_repaired_tool_back_in_service,
})

/** A visitor browses the catalogue: the garden tools, say, read once. */
export const the_catalogue = read_use_case({ query: query.the_catalogue })
