import * as z from 'zod'
import type { Semver, date_time, time_zone } from './format.ts'

// The context of a request (PER-6, DOM-11): what the library's mechanisms
// read (`RootContext`: one instant, the node's zone), and the library's own
// data of a request beside it, by kind: the operation and its fingerprint,
// the correlation, the version of the message.

/**
 * The context every root of a tree takes, given by the entry (PER-6): the
 * instant of the request, from a trusted frame (D99.4), one for the request,
 * so that the library's mechanisms and the domain's creators read the same.
 * The application extends it (declaration merging) with what every root has
 * and every invocation carries over; what only one tree's entry gives goes in
 * the context its root node takes. A node extends the context of its point,
 * never rewrites it, and one context serves everything below it (commands,
 * queries, use cases); a construct declares only the part it reads (`Now`),
 * so that it serves any context that has it. When a leaf invokes another
 * tree, the library gives its root this context, copied, and nothing else
 * (D105.1).
 *
 * The node's calendar is part of it (SC-12, C, 17 Nov 2026): its zone
 * (`time_zone`), declared by the configuration of the node, not by a domain,
 * since one domain serves sheds in many towns; `now` is an instant in UTC,
 * which tells no zone (A, 23 Nov 2026), its day `day_of(time_zone)(now)`.
 */
export interface RootContext {
  readonly now: date_time
  readonly time_zone: time_zone
}

/** The part of the context a construct that reads only the time declares. */
export type Now = Pick<RootContext, 'now'>

/**
 * The clock of a node (SC-12, C, 17 Nov 2026): the instant, as a clock writes
 * it (`new Date().toISOString()`, A, 23 Nov 2026), and the zone of the node's
 * calendar, which its configuration declares. An internal entry (the effect
 * executor, the reaction consumers) builds its context from it: `now` as the
 * clock gives it, and the zone.
 */
export interface Clock {
  readonly now: () => date_time
  readonly time_zone: time_zone
}

/** An operation's identity (DOM-11, DOM-12): created before the first attempt, kept on a retry. */
export const operation_id = z.string().min(1).brand<'operation_id'>()

export type operation_id = z.output<typeof operation_id>

/**
 * The operation of a command (DOM-11): its identity and the scope it is
 * unique in, which the entry composes (in the paper, `Caller` + hat) and the
 * library does not read. The duplicate branch is keyed on both.
 */
export interface Operation {
  readonly id: operation_id
  readonly scope: string
}

/**
 * What the library adds to the context of a command, at its point of the
 * tree, for its own mechanisms: its operation. A read has none.
 */
export interface OperationContext {
  readonly operation: Operation
}

/**
 * What the entry gives a leaf whose input names its operation (SC-34, D91.2,
 * C, 18 Nov 2026 (3)): the scope alone, which it composes as for any leaf
 * (the hat and the `Caller`'s id, `workshop/K-ROSSI`); the library reads the
 * id from the input, where the leaf says (`operation.identity`), after its
 * schema, and gives the leaf's creator the whole operation.
 */
export interface OperationScopeContext {
  readonly operation: Pick<Operation, 'scope'>
}

/**
 * The correlation of a chain of facts born of one intention (DOM-10, D56, §
 * "La busta e la pila"): created at the origin, by the client if it gives
 * one (D72.7), else by the entry; neither a secret nor a permission. Every
 * fact, outbox entry and event derived from a fact keeps it: a reaction
 * invokes with the correlation of the fact it reacts to, the executor
 * returns with the entry's, which is the fact's that queued it. Not part of
 * the operation's identity (DOM-11): a retry keeps both. A, 16 Nov 2026 (5)
 */
export const correlation = z.string().min(1).brand<'correlation'>()

export type correlation = z.output<typeof correlation>

/**
 * What the library adds to the context of a command's port, beside its
 * operation: its correlation, which it writes into the envelope. A creator
 * never sees it: no business decides on it.
 */
export interface CorrelationContext {
  readonly correlation: correlation
}

/**
 * What the entry gives a tree's leaf beside the context of its top: the
 * version of the persona the client was built at, whole (`1.4.0`), which the
 * message carries beside its path, never in the input nor in the path (D75,
 * D72.7). Its major picks the leaf, its minor serves the gate (PER-17). A
 * claim: a client may name any version, and chooses only the words it is
 * answered in, since every major ends in the current leaf, with its limits
 * and its creator; no guarantee rests on it. No creator and no projection
 * sees it: to them the version is the leaf (A, 17 Nov 2026).
 */
export interface VersionContext<version extends Semver = Semver> {
  readonly version: version
}

/**
 * The fingerprint of an operation (DOM-11, D100): computed by the library
 * where the request enters, over its path and its input as sent, and kept
 * with the fact the operation records, so that the duplicate branch tells a
 * retry from another request under the same identity. Opaque, compared for
 * equality only; it never leaves the node (PER-18).
 */
export const fingerprint = z.string().min(1).brand<'fingerprint'>()

export type fingerprint = z.output<typeof fingerprint>

/**
 * What the library adds to the context of a command's port, beside its
 * operation: the operation's fingerprint, which the port gives the adapter
 * with the plan (`PlannedCommand`). A creator never sees it. SC-11
 */
export interface FingerprintContext {
  readonly fingerprint: fingerprint
}

/** The context of a command at the root of its tree: what its port takes. */
export type CommandRootContext = RootContext &
  OperationContext &
  CorrelationContext &
  FingerprintContext
