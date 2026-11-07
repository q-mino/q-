// The pure core of tools: entities, the domain, command builders. No I/O.

import { branch, command, create, domain, entity } from '../wlib.ts'
import { type AddToolInput, Tool, toolAdded } from './language.ts'

export const tool = entity('tool', Tool)

export const tools = domain({
  name: 'tools',
  entities: [tool],
  facts: [toolAdded],
})

/** "Add tool": one branch, no condition. */
export function addTool(input: AddToolInput) {
  const values = { ...input, status: 'inService' as const }
  return command(
    branch(toolAdded, {
      payload: values,
      mutation: [create(tool, values)],
    }),
  )
}
