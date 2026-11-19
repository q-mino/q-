import type { CommandRootContext } from './context.ts'
import type { ComposedBranches, PartFields, StoredPart } from './envelope.ts'
import type { Bound } from './bound_condition.ts'
import type { PlannedWrite, StoredEntry } from './state_adapter.ts'

// What the ports of a command and of a step plan alike (DOM-10, DOM-13,
// DOM-20): a part with its write and its entries, and what a branch writes
// for the parts it chose. Internal, not exported from the index.

/**
 * A part as planned, with its write and its outbox entries, each with the
 * part's resources (DOM-13, SC-53): the correlation the request's, written
 * with the fact.
 */
export interface PartWrite<write> {
  readonly part: StoredPart
  readonly write: write
  readonly entries: readonly Omit<StoredEntry, 'correlation'>[]
}

/**
 * A part of a branch as planned, the branch's own or a composed
 * transition's (DOM-10, D111): the name of the branch, its condition bound
 * by the creator, its part as stored, with its resources and its domain's
 * version, its write, its outbox entries.
 */
export interface PlannedPart<write> extends PartWrite<write> {
  readonly name: string
  readonly bound: Bound
}

/** The parts a plan writes for a choice, in order, and the branch each part it composed applied. */
export interface Chosen<write> {
  readonly parts: readonly PartWrite<write>[]
  readonly composed: ComposedBranches
}

/**
 * What a plan writes for a choice (DOM-8, DOM-10): its parts' writes in
 * order, its fact in its envelope, under the request's operation, its
 * correlation and its fingerprint, the branch applied by name and the
 * branch each part it composed applied, and its entries, each with the
 * request's correlation (DOM-10).
 */
export const written =
  (context: CommandRootContext, name: string) =>
  <write>(chosen: Chosen<write>): PlannedWrite<write> => ({
    writes: chosen.parts.map((part) => part.write),
    fact: {
      parts: chosen.parts.map((part) => part.part),
      operation: context.operation,
      correlation: context.correlation,
      branch: name,
      composed: chosen.composed,
      fingerprint: context.fingerprint,
    },
    entries: chosen.parts.flatMap((part) =>
      part.entries.map((entry) => ({ ...entry, correlation: context.correlation })),
    ),
  })

/** A part as an outcome gives it: its version, which never leaves the node (PER-18), left out. */
export const read_fields = (part: StoredPart): PartFields => ({
  path: part.path,
  payload: part.payload,
  resources: part.resources,
})
