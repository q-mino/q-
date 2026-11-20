import * as z from 'zod'
import { semver } from './values.ts'

// The kernel's node above the folders an extension mounts (EXT-5 "The
// kernel's node above an extension's leaves"; PER-6, PER-14, D106): what a
// leaf of an extension inherits, part of the boundary's contract, fixed
// within its major. On `known`, the context (`the_bond`, and what the
// manifest's `sees` declares: `mounted_of`) and the closing `not_found`, no
// reason; on every leaf, the base events of the kernel's entry. A peer's
// response to an extension's leaf carries the leaf's own events or these,
// so that the extension's delivery parses it by its leaf's events and
// `the_kernels_events_on_known` (EXT-12). A release of the kernel that adds
// a closing or a limit to that node, or changes what it gives, is a new
// major of the boundary.

/** The kernel's node on `known` closing a request (PER-14, D87.5): a bond it does not find, no reason. */
export const not_found = z.strictObject({ event: z.literal('not_found') })

/**
 * A base event (D106.3): at the kernel's entry, before its node (EXT-6),
 * the path is no leaf of the surface at that major, or the input is not in
 * the leaf's schema. A formal reason: the contract is public.
 */
export const invalid_request = z.strictObject({
  event: z.literal('invalid_request'),
  reason: z.enum(['not_a_leaf', 'input_not_in_schema']),
})

/** The gate, a base event (PER-17): the version the request names is out of the surface's window; the version it speaks and its oldest major. */
export const version_not_supported = z.strictObject({
  event: z.literal('version_not_supported'),
  current: semver,
  oldest: z.number().int().min(0),
})

/** A base event of a command leaf (DOM-11, D79.4): the operation's identity was used with another fingerprint. */
export const identity_already_used = z.strictObject({ event: z.literal('identity_already_used') })

/** The base events of the kernel's entry, an ADT by `event`, terminal, which no leaf declares (D106). */
export const a_base_event = z.discriminatedUnion('event', [
  invalid_request,
  version_not_supported,
  identity_already_used,
])
export type a_base_event = z.output<typeof a_base_event>

/**
 * What a peer's response to an extension's leaf on `known` may carry beside
 * the leaf's own events (EXT-5, EXT-12): the closing of the kernel's node
 * and the base events, an ADT by `event`.
 */
export const the_kernels_events_on_known = z.discriminatedUnion('event', [
  not_found,
  invalid_request,
  version_not_supported,
  identity_already_used,
])
export type the_kernels_events_on_known = z.output<typeof the_kernels_events_on_known>
