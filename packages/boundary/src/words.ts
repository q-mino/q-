import * as z from 'zod'
import type { Declaration } from './manifest.ts'
import { a_name } from './values.ts'

// The words of an extension (EXT-16, WEB-22; part 22.2): its texts the
// kernel draws for it, in one language, as data, so that no code of the
// extension runs to draw them: its name, the label of each of its actions,
// slots and pages, and the words of its own events on `self`, which tell
// how an action it carries out ended (USR-3, `the_extension_told_how_it_ended`).
// The extension writes them in its `texts/`, one file per language
// (`texts/it.json`), the one form the kernel reads: the kernel parses them
// with this schema and draws them in the extension's mark, never as its own
// words; a word it lacks is drawn as a fault. Its author may write the JSON
// by hand, checked by this schema and a test, or write a typed module
// (`texts/it.ts`, `satisfies Words<typeof manifest, typeof registry>`) whose
// build writes the JSON, as the manifest's (A, 22 Nov 2026). A part's
// texts are in its document, the extension's too.

/** A label of an extension's point (an action, a slot, a page), or its name: short, drawn on a gesture or a title. */
const a_label = z.string().min(1).max(64)

/** The words of an extension in one language: its name, its points' labels and its own events' words, each by its name in the manifest. */
export const the_words_of_an_extension = z.strictObject({
  name: a_label,
  actions: z.record(a_name, a_label),
  slots: z.record(a_name, a_label),
  pages: z.record(a_name, a_label),
  events: z.record(a_name, z.string().min(1).max(256)),
})
export type the_words_of_an_extension = z.output<typeof the_words_of_an_extension>

/** The names of a declaration's points of one kind, none where it declares none. */
type PointsOf<declaration, kind extends 'actions' | 'slots' | 'pages'> =
  declaration extends Readonly<Record<kind, infer points>> ? keyof points & string : never

/** The leaves of `self` a declaration's actions invoke, by their paths from the persona's segment. */
type LeavesInvoked<declaration> =
  declaration extends Readonly<Record<'actions', infer actions>>
    ? {
        [action in keyof actions]: actions[action] extends { readonly invokes: infer leaf }
          ? leaf & string
          : never
      }[keyof actions]
    : never

/**
 * The names of a leaf's own events, from its entry in the registry: the
 * record of events its declaration holds, read by its shape under whatever
 * key the library keeps it (the boundary imports no library, GR-10). The
 * events the kernel tells in its own words (the base events, the wait over,
 * the closings, USR-3) are not among them.
 */
type OwnEventsOf<entry> = {
  [key in keyof entry]: entry[key] extends { readonly events: infer events }
    ? keyof events & string
    : never
}[keyof entry]

/** The own events of the leaves a declaration's actions invoke, by the registry of `self`. */
type EventsOfTheActions<declaration, registry> = {
  [path in keyof registry]: path extends `persona/self/${LeavesInvoked<declaration>}`
    ? OwnEventsOf<registry[path]>
    : never
}[keyof registry]

/** A word for each of these names, and none for another (an empty set takes no word). */
type WordsFor<names extends string> = [names] extends [never]
  ? Readonly<Record<string, never>>
  : Readonly<Record<names, string>>

/**
 * The words an extension's typed module gives (EXT-16, WEB-22): its name, a
 * label for every action, slot and page of its declaration, and words for
 * every own event of the leaves its actions invoke on `self`, by the
 * registry the generator writes, so that a word missing does not compile.
 * `export const words = { … } satisfies boundary.Words<typeof manifest,
 * typeof registry>`; its build writes it as `texts/<language>.json`.
 */
export interface Words<declaration extends Declaration, registry> {
  readonly name: string
  readonly actions: WordsFor<PointsOf<declaration, 'actions'>>
  readonly slots: WordsFor<PointsOf<declaration, 'slots'>>
  readonly pages: WordsFor<PointsOf<declaration, 'pages'>>
  readonly events: WordsFor<EventsOfTheActions<declaration, registry>>
}
