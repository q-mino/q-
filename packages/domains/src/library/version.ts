import type * as z from 'zod'
import type { Semver } from './format.ts'
import type { Component } from './component.ts'

// Versions (DOM-22, PER-17, D75.6, D101, A, 16 Nov 2026 (7)): a domain has one
// version, semver, declared in its `version.ts`; a major that has passed keeps
// a folder of its own in the domain (`business/loans/1/`), outside the path,
// with every stored or published shape of that major: a component that
// changed, at the last minor of the major (`earlier`), and every other
// delegated to the next major (`delegate`). The current version knows no
// past: when a major leaves the window, its folder is deleted and nothing
// else changes. A minor keeps no folder: every shape it leaves still parses
// with the next minor's schema, which CI checks.

export const $Version: unique symbol = Symbol('Version')

/** The version of a domain, as its `version.ts` declares it: the one its parts are written at (DOM-10). */
export interface Version<version extends Semver> {
  readonly [$Version]: version
}

/** The version of a domain (`loans = version('2.0.0')`), one per domain, in its `version.ts`. */
export type VersionBuilder = <const version extends Semver>(version: version) => Version<version>

export const $Earlier: unique symbol = Symbol('Earlier')

/**
 * A component of a past major that changed in the next one: its shape at the
 * last minor of its major, written whole (a value of the domain may change
 * under it, and CI compares every version's schema with the one released),
 * and the step to the next major's shape. Pure, over the payload alone; it
 * adds nothing (a field that cannot be derived is "not known", D101.4) and
 * never changes once published (DOM-22). The library chains the steps from
 * the version a part was written at to the current one; a reader sees only
 * the current shape.
 */
export type Earlier<next extends Component, payload extends z.ZodObject> = payload & {
  readonly [$Earlier]: {
    readonly next: next
    readonly to_next: (payload: z.output<payload>) => z.input<next>
  }
}

export const $Delegated: unique symbol = Symbol('Delegated')

/** A component of a past major with the same shape as in the next one: no step. */
export interface Delegated<next> {
  readonly [$Delegated]: next
}

/**
 * A component of a past major left unchanged by the next one
 * (`delegate(next.fact.a_tool_has_been_returned)`): the folder of a major
 * lists every component of that major, so that one forgotten stops the
 * generator, not a reader. A delegated leaf of a persona has its input
 * delegated too, written by the generator where the next major has one
 * (`return_a_tool_input = delegate(next.return_a_tool_input)` in
 * `persona/member/1/_usecase.ts`, C, 18 Nov 2026 (7)): the registry of a
 * major is its whole map, every path its clients were released with, which
 * the JSON Schema export and CI's comparison by path and version read,
 * resolving a delegation to the next major as the port resolves a leaf.
 */
export type DelegateBuilder = <const next>(next: next) => Delegated<next>
