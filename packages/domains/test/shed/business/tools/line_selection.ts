import { z } from 'zod'
import { selection, id } from './_scope_selection.ts'

// The selections over a line of a sheet of tools, the subject of this file
// (DOM-18): what the desk's loading of a sheet walks (SC-44). A line is a
// part of its sheet (D94.1); the subject is a view, where it lives is the
// adapter's.

/** The line is on the sheet being loaded. */
export const the_line_is_on_the_sheet = selection({
  subject: 'line',
  parameters: z.strictObject({
    sheet_id: id.sheet_id,
  }),
})
