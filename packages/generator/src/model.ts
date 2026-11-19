import type { Built, ConstructKind, Json, Sight } from '@q-mino/domains/library'

// A tree as the shell reads it (DOM-25), the core's input: its folders, the
// authored files in them, what their source says (the scope each imports, the
// names it exports in order, the JSDoc) and, once the shell has imported a
// file, what the runtime says of each export (the mark its builder left).
// The core turns it into the files to write and the failures; it reads no
// file and imports nothing of the tree.

/** The kind of an authored file: the kind of the scope it imports, a kind of construct or `dsl`. */
export type FileKind = ConstructKind | 'dsl'

/** A tree, as configured and read. */
export interface Tree {
  /** The map: what the folders under a first segment see of the others (`sight.ts`). */
  readonly sight: Sight
  /** The module the generated files import the library from, relative to the root (Shed's `../../src/library/index.ts`). */
  readonly library: string
  /** Every folder of the tree holding an authored file, outer folders first. */
  readonly folders: readonly Folder[]
}

/** A folder of the tree: its segments from the root (`['business', 'loans', '1']`) and its authored files. */
export interface Folder {
  readonly segments: readonly string[]
  readonly files: readonly AuthoredFile[]
}

/** An authored file (`fact.ts`), by its name without the extension. */
export interface AuthoredFile {
  readonly stem: string
  /** The kind of the file: of the scope it imports, or, importing none, of what it exports. */
  readonly kind: FileKind
  /** Its exports, in the order of its source. */
  readonly exports: readonly Export[]
}

/** An export of an authored file. */
export interface Export {
  readonly name: string
  /** The line of its declaration in the source, from 1, for the failures (`file:line`). */
  readonly line: number
  /** The lines of its JSDoc, as written; none if it has none. */
  readonly doc: readonly string[]
  /** The lines of the JSDoc of the input declared inline in its builder, if any. */
  readonly input_doc: readonly string[]
  /** What the runtime says of it; absent until the shell has imported its file. */
  readonly value?: Value
}

/** What an export is at runtime. */
export type Value =
  /** A component: its builder's mark, its input, and what it is in a past major. */
  | {
      readonly is: 'component'
      readonly built: Built
      readonly input: Input
      readonly past: Past
      /** For a node, what its declaration adds to the point's types; none for any other component. */
      readonly node?: NodeParts
      /** For a version, the major it declares (`version('2.0.0')`: 2); none for any other component. */
      readonly major?: number
      /** For a version, the version it declares (`'2.0.0'`); none for any other component. */
      readonly version?: string
      /** Its shapes as JSON Schema, by part (TST-7), a past major's delegated component the next one's. */
      readonly shapes: Shapes
      /** The object it is, by identity (one object, one path, DOM-24). */
      readonly identity: Identity
      /** The input it declares inline, by identity, if it declares one. */
      readonly input_identity?: Identity
      /** The components its parts reach, not through another component: each one has a path only if a file exports it (DOM-25). */
      readonly holds: readonly Held[]
    }
  /** A zod schema with no mark: a value of the domain (DOM-21). */
  | {
      readonly is: 'value'
      readonly identity: Identity
      /** Its shape as JSON Schema (TST-7). */
      readonly shape: Json
    }
  /** Anything else: a function of `dsl`, a helper; the library ignores it. */
  | { readonly is: 'other' }

/**
 * An object of the runtime, as a number: the same object, the same number,
 * wherever the tree names it. The shell numbers them; the core compares.
 */
export type Identity = number

/**
 * The shapes of a component as JSON Schema (DOM-21, TST-7), by part:
 * `schema` for a component that is a schema (an identity, a fact, a
 * predicate…), `input` for the input it declares, `event/<name>` for an
 * event of a leaf's, `entry` for a read leaf's entry, `stream/<name>` for an
 * event of its stream. A component with no shape of its own has none.
 */
export type Shapes = Readonly<Record<string, Json>>

/** A component another one holds: the object it is, and its builder's mark. */
export interface Held {
  readonly identity: Identity
  readonly built: Built
}

/**
 * What a node declares that changes the types of the points below it (PER-6,
 * SC-31): whether it may close a request (it looks up, or has a perimeter or a
 * limit), and whether it accumulates (it binds or requires).
 */
export interface NodeParts {
  readonly closes: boolean
  readonly accumulates: boolean
}

/** The input a command, a query or a leaf declares inline: a schema, a function of the context, or none. */
export type Input = 'none' | 'schema' | 'function'

/**
 * A component of a past major (DOM-22, PER-17): written whole (`earlier`), or
 * delegated to the next major's (`delegate`), with whether the next has an input.
 */
export type Past =
  | { readonly is: 'current' }
  | { readonly is: 'earlier' }
  | { readonly is: 'delegated'; readonly next_input: Input }

/** A file the generator writes, by its path from the root of the tree. */
export interface GeneratedFile {
  readonly path: string
  readonly text: string
}

/**
 * A failure, one line as tsc and ESLint write theirs (`file:line  rule
 * sentence`), the sentence in the tree's words (DOM-25, provisional: A to confirm).
 */
export interface Failure {
  readonly path: string
  readonly line: number
  readonly rule: string
  readonly sentence: string
}
