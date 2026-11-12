import * as wlib from '../../wlib.ts'
import * as command from './command.ts'
import * as query from './query.ts'

// The use cases of `tools`, its only entry (DOM-2): every persona, reaction
// and effect executor reaches the catalogue through them. A command use case
// runs one command (DOM-4), a read use case reads one query; in the trivial
// case each declares only its command or its query.

/** The keeper adds a tool to the catalogue: a new drill on the shelf. */
export const add_a_tool = wlib.command_use_case({ command: command.add_a_tool })

/** The keeper retires a tool: broken, lost, worn out or given away. */
export const retire_a_tool = wlib.command_use_case({ command: command.retire_a_tool })

/** A visitor browses the catalogue: the garden tools, say, read once. */
export const the_catalogue = wlib.read_use_case({ query: query.the_catalogue })
