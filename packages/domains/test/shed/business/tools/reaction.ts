import { reaction, fact, usecase } from './_scope_reaction.ts'

// The desk's own standing orders: a sheet of tools moves itself on, one step
// a line, until it is loaded (DOM-16, DOM-20, SC-44). They move no other
// office, so they live with the process (DOM-23): the reactions between
// offices live above them (GR-9).

/**
 * When the desk begins loading a sheet, it takes up the first line: the
 * library's rake, line 1, goes in first.
 */
export const the_first_line_of_the_sheet_is_taken_up = reaction({
  when: fact.the_loading_of_a_sheet_has_begun,
  invokes: usecase.continue_the_loading_of_a_sheet,
  translation: (fact) => ({ sheet_id: fact.new_sheet.id }),
})

/**
 * When the desk has gone one line further, it takes up the next: line 37 is
 * left, line 38 comes next; after line 200, the step closes the sheet, and
 * no one reacts to the closing.
 */
export const the_next_line_of_the_sheet_is_taken_up = reaction({
  when: fact.the_loading_of_the_sheet_has_advanced,
  invokes: usecase.continue_the_loading_of_a_sheet,
  translation: (fact) => ({ sheet_id: fact.sheet_id }),
})
