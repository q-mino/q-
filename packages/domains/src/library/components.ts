// The components of a compiled domain, as the generated indexes hold them (LIB-16, LIB-17, LIB-19).
import type { ZodType } from 'zod'

/** What a predicate reads (LIB-6): an instance, or a set with one aggregation. Keys and filters come with the interpreter. */
export type Aggregation = 'exists' | 'count' | 'sum' | 'min' | 'max'
export type Reads =
  | { readonly read: 'instance'; readonly of: string }
  | { readonly read: 'set'; readonly of: string; readonly aggregation: Aggregation }

/** Reads one instance of a type of the language, named by its path. */
export const instance = (of: string): Reads => ({ read: 'instance', of })

/** Reads a set of instances of a type of the language, with one aggregation. */
export const set = (of: string, aggregation: Aggregation): Reads => ({
  read: 'set',
  of,
  aggregation,
})

export interface CommandComponent {
  readonly kind: 'command'
  readonly run: (input: never) => unknown
  readonly input: ZodType
}

export interface PredicateComponent {
  readonly kind: 'predicate'
  readonly value: (params: never, read: never) => unknown
  readonly input: ZodType
  readonly reads: Reads
}

/** A schema with no function of the same name: a type of the domain's language. */
export interface SchemaComponent {
  readonly kind: 'schema'
  readonly schema: ZodType
}

export type Component = CommandComponent | PredicateComponent | SchemaComponent

/** The shape of the root index and of every node under it. */
export interface ComponentTree {
  readonly [name: string]: Component | ComponentTree
}
