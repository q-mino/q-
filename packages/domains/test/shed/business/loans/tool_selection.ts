import { z } from 'zod'
import { selection } from './_scope_selection.ts'

// The selections over a tool of the shed as the desk sees it, the subject of
// this file (DOM-18): the view of `loans` over the tools (GR-3, V11), whose
// candidates the adapter reads from the catalogue of `tools`.

/** The tool is still in the shed: in service or in the workshop, not retired. */
export const the_tool_is_still_in_the_shed = selection({
  subject: 'tool',
  parameters: z.strictObject({}),
})
