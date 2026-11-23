import { first, oracle, type Shed } from './oracle.ts'

// What the scenarios of the commands share: the shed's tools, added by Luca
// before a scenario begins.

/** A tool of the catalogue, as Luca adds it. */
export interface Tool {
  readonly id: string
  readonly name: string
  readonly category: 'garden' | 'power' | 'hand' | 'ladder'
}

export const drill: Tool = { id: 'drill', name: 'Cordless drill', category: 'power' }
export const sander: Tool = { id: 'sander', name: 'Orbital sander', category: 'power' }
export const ladder: Tool = { id: 'ladder', name: 'Ladder', category: 'ladder' }

/** The oracle with the tools added on Monday 16 November, in the morning. */
export const a_shed_with = async (...tools: readonly Tool[]): Promise<Shed> => {
  const shed = await oracle()
  for (const tool of tools) {
    await first(shed.tools.add_a_tool(shed.at('2026-11-16T14:00:00.000Z'), tool))
  }
  return shed
}
