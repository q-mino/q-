import * as wlib from '../../wlib.ts'
import * as command from './command.ts'

// The use cases of `tools`, its only entry (DOM-2): every persona, reaction
// and effect executor reaches the catalogue through them. Each runs one
// command (DOM-4); in the trivial case it declares only the command.

/** The keeper adds a tool to the catalogue: a new drill on the shelf. */
export const add_a_tool = wlib.command_use_case({ command: command.add_a_tool })

/** The keeper retires a tool: broken, lost, worn out or given away. */
export const retire_a_tool = wlib.command_use_case({ command: command.retire_a_tool })
