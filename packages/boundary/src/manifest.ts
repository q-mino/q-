import * as z from 'zod'
import { seen_on_known } from './contexts.ts'
import { place } from './places.ts'
import { port } from './ports.ts'
import { a_file, a_leaf, a_name, a_set_of, json, semver } from './values.ts'
import { version } from './version.ts'

// The manifest (EXT-3, EXT-10): what an extension is to the kernel. Its
// declaration is authored, `manifest.ts` in the extension's package, with
// `manifest(...)`: the name, what it sees, what it touches, its extension
// points, what the user accepts; its leaves typed by the paths of `self`'s
// registry (`Manifest<typeof registry>`). Its surface is its tree's, which
// the extension's build derives; the build writes the manifest as data
// (`manifest.json`, `the_manifest`), the one form the kernel reads, with
// the package's version and the boundary's, never written by hand.

/** An action (EXT-16): data the kernel draws in a place, which invokes a leaf of the extension on `self` with the place's data. */
const an_action = z.strictObject({ on: place, invokes: a_leaf })

/** A slot (EXT-16): a frame the kernel places in a screen of its own, with a document of the extension's bundle. */
const a_slot = z.strictObject({ on: place, shows: a_file })

/** A page (EXT-16): a frame the kernel places as a screen, from the extension's own screen. */
const a_page = z.strictObject({ on: z.literal('the_extension'), shows: a_file })

/**
 * The declaration, as its author writes it (EXT-10): `sees` per persona,
 * only `known` in stage 1, left out when nothing (every leaf on `known` sees
 * the bond); `touches`, the kernel's ports it calls; its extension points
 * by name, each in a place. `invokes` is a leaf's path on `self` (`leaf`:
 * any path here, those of `self`'s registry in `Manifest`).
 */
export interface Declaration<leaf extends string = string> {
  readonly name: string
  readonly sees?: { readonly known?: readonly seen_on_known[] }
  readonly touches: readonly port[]
  readonly actions?: Readonly<Record<string, { readonly on: place; readonly invokes: leaf }>>
  readonly slots?: Readonly<Record<string, { readonly on: place; readonly shows: string }>>
  readonly pages?: Readonly<
    Record<string, { readonly on: 'the_extension'; readonly shows: string }>
  >
}

/** The declaration's schema (EXT-10): a name in snake_case, names from the boundary's closed sets each listed once, a leaf's path, a file's. */
export const the_declaration = z.strictObject({
  name: a_name,
  sees: z.strictObject({ known: a_set_of(seen_on_known).optional() }).optional(),
  touches: a_set_of(port),
  actions: z.record(a_name, an_action).optional(),
  slots: z.record(a_name, a_slot).optional(),
  pages: z.record(a_name, a_page).optional(),
})

/**
 * The declaration of an extension (EXT-10), as data: its literal types
 * kept, so that its configurator's ports (`PortsOf`) and its tree's
 * mounted points (`mounted_of`) are typed from it. Checked by its schema
 * when its module loads (the generator's configuration loads it at `pnpm
 * generate`); `invokes` is checked by type when the declaration `satisfies`
 * `Manifest<typeof registry>`, `self`'s registry imported as a type.
 */
export const manifest = <const declaration extends Declaration>(
  declaration: declaration,
): declaration => {
  the_declaration.parse(declaration)
  return declaration
}

/** A path of `self`'s registry that is a leaf, from the persona's segment: a `usecase/` segment, a component with an input, no schema. */
type LeafOnSelf<path, entry> = path extends `persona/self/${infer leaf}`
  ? leaf extends `usecase/${string}` | `${string}/usecase/${string}`
    ? entry extends z.ZodType
      ? never
      : entry extends { readonly input: unknown }
        ? leaf
        : never
    : never
  : never

/** The leaves of an extension's `self`, by their paths from the persona's segment (`usecase/greet_a_bond`), from its generated registry (DOM-24). */
export type LeavesOnSelf<registry> = {
  [path in keyof registry]: LeafOnSelf<path, registry[path]>
}[keyof registry]

/**
 * A declaration whose actions invoke leaves of `self` only (EXT-10): the
 * paths of the registry the generator writes for `persona/self`, so that a
 * path that is no leaf there does not compile, as a field named by key
 * (SC-34). `export const manifest = boundary.manifest({ … }) satisfies
 * boundary.Manifest<typeof registry>`.
 */
export type Manifest<registry> = Declaration<LeavesOnSelf<registry>>

/** A major, as a key of a surface's majors (`"1"`). */
const a_major = z.string().regex(/^(?:0|[1-9][0-9]*)$/)

/**
 * A leaf of a surface at a major (EXT-10, EXT-6): whether it takes an
 * operation (a command) or none (a read), its input's JSON Schema, its
 * events by name, each the JSON Schema of the whole event, and whether it
 * answers in one event (F7: every leaf on `known` does, EXT-4).
 */
const a_leaf_of_a_surface = z.strictObject({
  kind: z.enum(['command', 'read']),
  input: json,
  events: z.record(a_name, json),
  answers_in_one_event: z.boolean(),
})

/**
 * The surface an extension adds to a persona (EXT-5, EXT-10, PER-17): the
 * version it speaks and its leaves at each major of its window, by their
 * paths; the majors hold the version's.
 */
export const a_surface = z
  .strictObject({
    version: semver,
    majors: z.record(a_major, z.record(a_leaf, a_leaf_of_a_surface)),
  })
  .refine((surface) => Object.hasOwn(surface.majors, surface.version.split('.')[0] ?? ''), {
    message: 'the majors do not hold the version’s',
  })
export type a_surface = z.output<typeof a_surface>

/**
 * The manifest as data (EXT-10), `manifest.json`, the one form the kernel
 * reads: the declaration, every list and record present (maybe empty), the
 * extension's version and the boundary's, and its surfaces per persona (none
 * where it adds no leaf).
 */
export const the_manifest = z.strictObject({
  name: a_name,
  version: semver,
  boundary_version: semver,
  sees: z.strictObject({ known: a_set_of(seen_on_known) }),
  touches: a_set_of(port),
  actions: z.record(a_name, an_action),
  slots: z.record(a_name, a_slot),
  pages: z.record(a_name, a_page),
  surfaces: z.strictObject({ self: a_surface.optional(), known: a_surface.optional() }),
})
export type the_manifest = z.output<typeof the_manifest>

/**
 * The manifest as data, from the declaration, the package's version and the
 * surfaces its build derives (EXT-10): the one place it is made. The
 * boundary version is the boundary's the extension is built with
 * (`version`), never given.
 */
export const the_manifest_as_data = (made: {
  readonly declaration: Declaration
  readonly version: string
  readonly surfaces: z.input<typeof the_manifest>['surfaces']
}): the_manifest =>
  the_manifest.parse({
    name: made.declaration.name,
    version: made.version,
    boundary_version: version,
    sees: { known: made.declaration.sees?.known ?? [] },
    touches: made.declaration.touches,
    actions: made.declaration.actions ?? {},
    slots: made.declaration.slots ?? {},
    pages: made.declaration.pages ?? {},
    surfaces: made.surfaces,
  })
