import * as z from 'zod'

// The kind a builder gives what it builds (DOM-25): the generator imports the
// authored files and finds the components among their exports by the mark
// their builder left (`kind_of`), the segment of their path after their
// folders. An exported zod schema with no mark is a value (DOM-21); anything
// else the library ignores. A condition composed with AND, OR, NOT is not a
// kind of its own: it takes the kind of the file it is named in, the one of
// the scope the file imports (`business/tools/command/the_tool_is_new`).

/** The kinds of construct, the segment of a path after its folders (DOM-24, DOM-25). */
export type ConstructKind =
  | 'id'
  | 'value'
  | 'fact'
  | 'predicate'
  | 'selection'
  | 'calculation'
  | 'effect'
  | 'command'
  | 'query'
  | 'usecase'
  | 'lookup'
  | 'node'
  | 'reaction'
  | 'version'

/**
 * What a builder tells of what it built: its kind; for a selection predicate
 * and a calculation, the subject it declares, which the generator writes
 * after the kind (DOM-18); for a condition composed with AND, OR, NOT, that it
 * is one, its kind the file's.
 */
export const built = z.union([
  z.strictObject({
    kind: z.enum([
      'id',
      'fact',
      'predicate',
      'effect',
      'command',
      'query',
      'usecase',
      'lookup',
      'node',
      'reaction',
      'version',
    ]),
  }),
  z.strictObject({ kind: z.enum(['selection', 'calculation']), subject: z.string().min(1) }),
  z.strictObject({ kind: z.literal('condition') }),
])

export type Built = z.output<typeof built>

export const $Built: unique symbol = Symbol('Built')

/** The mark a builder leaves on what it builds, beside its parts. */
export interface Mark {
  readonly [$Built]: Built
}

/** The mark of a kind, for a builder to leave. */
export const mark = (kind: Built): Mark => ({ [$Built]: kind })

/**
 * What built a value, if a builder of the library did: its kind, and its
 * subject for a selection predicate or a calculation; nothing for any other
 * value, a zod schema (a value of the domain, DOM-21) or a function of `dsl`.
 * A component of a past major tells the kind of the next major's it stands
 * for (`earlier`, `delegate`).
 */
export const kind_of = (value: unknown): Built | undefined =>
  (typeof value === 'object' || typeof value === 'function') && value !== null && $Built in value
    ? built.parse(value[$Built])
    : undefined
