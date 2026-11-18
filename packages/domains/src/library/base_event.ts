import type { Semver } from './format.ts'
import type { Snapshot } from './stream.ts'

// The base events of a tree (PER-5, D106), terminal, which no leaf declares,
// and how its nodes may close a request (PER-14): `not_found`, `refused`,
// `invalid_request`, `version_not_supported`, `identity_already_used`; and the
// snapshot of a read.

/** A lookup that finds nothing, or a perimeter that fails: no reason (PER-14, D87.5). */
export interface NotFound {
  readonly event: 'not_found'
}

/** Failed limits: the name of each, the reasons the caller reads (PER-14, D80). */
export interface Refused<reason extends string> {
  readonly event: 'refused'
  readonly reasons: readonly reason[]
}

/**
 * The events of a node that closes a request (PER-14, D80), in the union of
 * every leaf below it, which no leaf declares; terminal. In the paper they
 * are of the node's declared union, not base events (D72).
 */
export type NodeEvent<reason extends string> = NotFound | Refused<reason>

/**
 * A base event (D106.3), in the union of every leaf: at the entry of the
 * tree, the path is not a leaf (an inner node, none at that version), the
 * input is not in its schema, or a read's cursor does not decode to its
 * query's order key (SC-22; one forged that decodes starts the page
 * elsewhere, and the selection holds, D57). A formal reason: the contract
 * is public, so it tells nothing more. Terminal.
 */
export interface InvalidRequest {
  readonly event: 'invalid_request'
  readonly reason: 'not_a_leaf' | 'input_not_in_schema' | 'cursor_not_in_schema'
}

/**
 * The gate (PER-17, A, 17 Nov 2026), a base event in the union of every
 * leaf: at the entry of the tree, before any node (no lookup runs), the
 * version the message carries is out of the tree's window, which is its
 * majors, the folders the generator lists (`_majors.ts`): a major the tree
 * has not (a `1.2.0` once `1/` is deleted; a `3.0.0` that meets an instance
 * still at 2.0.0 during a release), or the current major at a higher minor
 * (a client at `2.1.0`, which may send a field 2.0.0 does not know, on a
 * server at 2.0.0). The patch does not count. It tells the version the tree
 * speaks and its oldest major, so that the client knows whether to update,
 * to speak a lower minor or to wait: the contract is public. Terminal.
 */
export interface VersionNotSupported {
  readonly event: 'version_not_supported'
  readonly current: Semver
  readonly oldest: number
}

/**
 * A base event (DOM-11, D79.4), in the union of every command leaf: the
 * operation's identity, in its scope, was used with another fingerprint. It
 * comes from the duplicate branch of the command port and crosses the leaf
 * unprojected. Terminal.
 */
export interface IdentityAlreadyUsed {
  readonly event: 'identity_already_used'
}

/** The first event of a read: the entries and the position read at. */
export interface SnapshotEvent<entry> extends Snapshot<entry> {
  readonly event: 'snapshot'
}
