// The secondary ports of tools. The adapters implement them.

import type { CommandPort } from '../wlib.ts'
import type { tools } from './core.ts'

export type ToolsCommandPort = CommandPort<typeof tools>
