import * as z from 'zod'
import { a_name } from './values.ts'

// The words of an extension (EXT-16, WEB-22; part 22.2): its texts the
// kernel draws for it, in one language, as data, so that no code of the
// extension runs to draw them: the label of each of its actions, and the
// words of its own events on `self`, which tell how an action it carries
// out ended (USR-3, `the_extension_told_how_it_ended`). The extension writes them in
// its `texts/`, one file per language (`texts/it.json`); the kernel parses
// them with this schema and draws them in the extension's mark, never as its
// own words. A frame's texts are in its document, the extension's too.

/** The words of an extension in one language: its actions' labels and its own events' words, each by its name. */
export const the_words_of_an_extension = z.strictObject({
  actions: z.record(a_name, z.string().min(1).max(64)),
  events: z.record(a_name, z.string().min(1).max(256)),
})
export type the_words_of_an_extension = z.output<typeof the_words_of_an_extension>
