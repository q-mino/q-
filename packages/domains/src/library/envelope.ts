import type * as z from 'zod'
import type { Semver } from './format.ts'
import type { Operation, correlation, fingerprint } from './context.ts'
import type { Component, PathOf } from './component.ts'

// The event envelope (DOM-10): a fact is a list of parts, one per branch
// applied, each with its path, payload and resources; the envelope carries
// the operation, the correlation and the parts, and, as stored, the version
// of each part, the branch applied and the fingerprint, which never leave the
// node (PER-18).

/**
 * A part of a fact (DOM-10): its path apart from its payload, as in the paper
 * (D56, D101.2), and its resources. Whoever consumes facts matches on the
 * path of each part, exhaustively as on an ADT (a `switch` on `path` with a
 * `never` check, or a record by path as `FactWrites`), and never reads the
 * payload to know the fact (D107).
 */
export type Part<facts extends Component> = facts extends unknown
  ? {
      readonly path: PathOf<facts>
      readonly payload: z.output<facts>
      readonly resources: readonly Resource[]
    }
  : never

/**
 * A fact in its event envelope (DOM-10): its parts, one per branch applied
 * (D111), in order; a command records one, a step two (the step's, then the
 * composed transition's), and every consumer reads them alike (A, 16 Nov
 * 2026 (2)). A part is named by its position in the fact. The operation that
 * recorded the fact is its identity: one operation in its scope records one
 * fact (DOM-11), and it travels with the fact through any adapter, where a
 * position may be renumbered; a reaction derives its own operation from it
 * and the part (LIB-10, A, 16 Nov 2026). Its correlation is the chain's
 * (`correlation`), kept by every fact derived from it, so that Marta's
 * return follows the repair it opens (A, 16 Nov 2026 (5)). The other fields
 * of the envelope come with their cases.
 */
export interface Envelope<parts extends readonly PartFields[]> {
  readonly parts: parts
  readonly operation: Operation
  readonly correlation: correlation
}

/**
 * A resource of a fact (DOM-10): an identity in its payload, by its path and
 * value (`business/loans/id/loan_id`, `L7`). The library derives a fact's resources
 * from its schema, finding the identities in the registry; nobody writes
 * them. In the paper they come from the mutation primitives (D107); in q-
 * the fact carries the change (V9), so they come from the fact: every
 * identity of its payload, or those of the fields it declares (`resources`,
 * D94.6, SC-55). They are written with the part: a fact recorded before a
 * declaration keeps those it was written with.
 */
export interface Resource {
  readonly path: string
  readonly value: unknown
}

/**
 * A part of a fact as an adapter stores it: the library parses the payload by
 * the path, at the version of its domain when it was written (DOM-10, D111.3),
 * through the domain's folder of that major if it has passed, then takes it
 * to the current shape (`earlier`, `Versions`). The version never leaves the node
 * (PER-18) and is not in the parsed `Part`: a reader sees the current shape
 * only (D101).
 */
export interface StoredPart extends PartFields {
  readonly version: Semver
}

/** What every part of a fact has, parsed or stored: its path, its payload, its resources. */
export interface PartFields {
  readonly path: string
  readonly payload: unknown
  readonly resources: readonly Resource[]
}

/**
 * A fact's envelope as an adapter stores it: its parts as stored, and what
 * the duplicate branch reads of the operation that recorded it (DOM-11): the
 * name of the branch applied (two branches may record one fact, as
 * `retire_a_tool`'s) and the fingerprint. The library writes both and reads
 * them back; the adapter keeps them opaque, as a part's version, and they
 * never leave the node (PER-18). SC-11
 */
export interface StoredEnvelope extends Envelope<readonly StoredPart[]> {
  readonly branch: string
  readonly fingerprint: fingerprint
}
