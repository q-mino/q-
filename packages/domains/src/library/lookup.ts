import type * as z from 'zod'
import { mark } from './kind.ts'

// Lookups (PER-9): a read of one key, which gives its value or "not known",
// with no list and no stream. A node runs its lookups, then its conditions
// and bindings, pure (PER-6). Whose lookups a node may run is the
// architecture's (auth's, D43, D77.3), not the library's (LIB-1). A lookup
// is implemented by an adapter: a token, a table, an identity provider (D43).

export const $Lookup: unique symbol = Symbol('Lookup')

/** A lookup: the schema of its key and of its value. */
export interface Lookup<key extends z.ZodType, value extends z.ZodType> {
  readonly [$Lookup]: { readonly key: key; readonly value: value }
}

/** A lookup, declared in one argument whose parts have names (DOM-25). */
export type LookupBuilder = <const key extends z.ZodType, const value extends z.ZodType>(lookup: {
  readonly key: key
  readonly value: value
}) => Lookup<key, value>

/** The answer of a lookup: its value, or "not known"; absence is a value, never `null` (D30). */
export type Answer<value> =
  { readonly answer: 'known'; readonly value: value } | { readonly answer: 'not_known' }

/** The lookups of a domain, by name. */
export type Lookups = Readonly<Record<string, Lookup<z.ZodType, z.ZodType>>>

/** The key and the value schemas of a lookup. */
export type LookupParts<lookup> = lookup extends {
  [$Lookup]: { key: infer key extends z.ZodType; value: infer value extends z.ZodType }
}
  ? { readonly key: key; readonly value: value }
  : never

/**
 * What an adapter gives for a set of lookups: for each, under its name, a
 * function from the parsed key to the answer, whose value the library
 * parses. Exhaustive: a forgotten lookup does not compile.
 */
export type LookupAdapter<lookups extends Lookups> = {
  readonly [name in keyof lookups]: (
    key: z.output<LookupParts<lookups[name]>['key']>,
  ) => Promise<Answer<z.input<LookupParts<lookups[name]>['value']>>>
}

/** A lookup port: the key in, the answer out, its value parsed. */
export type LookupPort<lookup> = (
  key: z.input<LookupParts<lookup>['key']>,
) => Promise<Answer<z.output<LookupParts<lookup>['value']>>>

// The builder's body (part 3.2): a lookup is its key and its value.

export const lookup_builder: LookupBuilder = (lookup) => ({
  [$Lookup]: { key: lookup.key, value: lookup.value },
  ...mark({ kind: 'lookup' }),
})
