import type * as z from 'zod'
import type { position } from './format.ts'
import type {
  CalculationComponent,
  CalculationsOfQueries,
  Direction,
  FieldsOf,
  PredicatesOfQueries,
  Queries,
} from './query.ts'
import type { CursorAlgebra, PredicateFragments } from './algebra.ts'

// Read adapters (LIB-14): the operators of the commands (ADP-8), a fragment
// per selection predicate and per calculation, one source per query, one
// read. No concept of state here.

/**
 * Where the adapter finds a query's candidates (a table, a store) and how it
 * reads each field of an entry from a candidate.
 */
export interface QuerySource<fields extends z.ZodObject, source, field> {
  readonly from: source
  readonly fields: { readonly [name in keyof z.output<fields>]-?: field }
}

/**
 * A query ready to read: the selection composed, the fields and the order as
 * fragments, the order closed by the identity; the identity by its field's
 * name and its path, for a stream to know which entries a fact touches. A
 * calculation, bound to its parameters, is one more field (SC-21): the
 * adapter's read, its order and its stream meet fields alone. So are the
 * leaves of a read's actions (SC-33), when it has some (`leaves`).
 */
export interface PlannedQuery<selection, source, field, condition = never> {
  readonly from: source
  readonly fields: Readonly<Record<string, field>>
  readonly identity: { readonly field: string; readonly path: string }
  readonly selection: selection
  readonly order: readonly (readonly [field, Direction])[]
  readonly leaves?: PlannedLeaves<condition>
}

/**
 * The leaves of a read's actions, planned by the library (SC-33, D47.2,
 * D51.1): for an entry as stored, the conditions of the leaves of its
 * commands known at the read, as the adapter's command fragments (ADP-8),
 * which the adapter evaluates in the snapshot of the entry, every one (no
 * short circuit, D47), and writes, in order, as one more field of the entry
 * (`field`, the library's name, which no field of the query has). So the
 * read, its pages and its stream meet fields alone, as with a calculation:
 * Gianni books the drill while Marta reads her loans, and the row of L7,
 * which the fact does not touch, changed (SC-19). The adapter never meets a
 * value not known: the library leaves out the leaves whose parameters the
 * caller gives, and composes the three values itself (D51.4).
 */
export interface PlannedLeaves<condition> {
  readonly field: string
  readonly of: (entry: Readonly<Record<string, unknown>>) => readonly condition[]
}

/**
 * The adapter's read, in one consistent snapshot: the entries as stored (the
 * library parses them with the query's fields) and the position read at (D66).
 */
export type Read<selection, source, field, condition = never> = (
  plan: PlannedQuery<selection, source, field, condition>,
) => Promise<{ readonly entries: readonly unknown[]; readonly position: position }>

/**
 * A page of a planned query (SC-22): the selection of the page, the query's
 * after the cursor, composed by the library with the adapter's `after` (the
 * query's alone on the first page); how many entries at most (the library
 * asks one more than the page, to know whether another follows). The query's
 * selection still counts the total.
 */
export interface PlannedPage<selection, source, field, condition = never> extends PlannedQuery<
  selection,
  source,
  field,
  condition
> {
  readonly page: selection
  readonly limit: number
}

/**
 * The adapter's read of a page, in one consistent snapshot (D72.8): the
 * entries the page's selection keeps, in the order, at most `limit`, as
 * stored; how many the query's selection keeps there, the total; and the
 * position read at.
 */
export type ReadPage<selection, source, field, condition = never> = (
  plan: PlannedPage<selection, source, field, condition>,
) => Promise<{
  readonly entries: readonly unknown[]
  readonly total: number
  readonly position: position
}>

/**
 * What a read adapter gives for a set of queries, of one or more domains. Its
 * fragments are of three types: a condition over a candidate (`selection`),
 * where the candidates are (`source`), how a field reads from a candidate
 * (`field`). In SQL the three are one type, and one adapter serves the
 * queries of every subject; an adapter whose fragments are typed by the
 * candidate (the in-memory oracle) serves the queries of one subject at a
 * time (DOM-18). Every query reads whole or in pages (SC-22): the algebra
 * compares with a cursor (`after`, a step's), and the adapter reads a page
 * with its total (`page`). An adapter that evaluates the actions of its
 * reads (SC-33) takes the plan's leaves with its command fragments
 * (`condition`), which it gives to `read_use_case_ports` (`applicability`).
 */
export type ReadAdapter<queries extends Queries, selection, source, field, condition = never> = {
  readonly algebra: CursorAlgebra<PredicatesOfQueries<queries>, selection, field>
  readonly sources: {
    readonly [name in keyof queries]: QuerySource<FieldsOf<queries[name]>, source, field>
  }
  readonly read: Read<selection, source, field, condition>
  readonly page: ReadPage<selection, source, field, condition>
} & ([CalculationsOfQueries<queries>] extends [never]
  ? { readonly calculations?: never }
  : { readonly calculations: CalculationFragments<CalculationsOfQueries<queries>, field> })

/**
 * The adapter's fragment for each calculation, under its path, from its
 * parsed parameters: a field read from a candidate, of the type its sources
 * give (a SQL subquery, a function over the candidate and the state). One
 * translation per calculation, reused by every query (ADP-8); its meaning is
 * the adapter's, as a selection predicate's (SC-21). An adapter whose queries
 * calculate nothing gives none.
 */
export type CalculationFragments<
  calculations extends CalculationComponent,
  field,
> = PredicateFragments<calculations, field>
