// The domain's pure functions over its values, added at need: usable by the
// adapters, the interface and the client. Not concepts of the library. DOM-5

import type { tool } from './_value.ts'

export const the_tool_is_in_the_catalogue = (the_tool: tool | undefined): the_tool is tool =>
  the_tool !== undefined

export const the_tool_is_in_service = (the_tool: tool | undefined): boolean =>
  the_tool?.status === 'inService'

export const the_tool_is_retired = (the_tool: tool | undefined): boolean =>
  the_tool?.status === 'retired'
