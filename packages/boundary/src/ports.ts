import * as z from 'zod'
import { bond } from './contexts.ts'
import { a_leaf, json, semver } from './values.ts'

// The kernel's ports an extension calls (EXT-2 "Calls", EXT-3 "What its code
// may call", EXT-14): in stage 1 the port of requests (F7) and its storage,
// a partition of the node's. Each call is answered by the kernel with a
// closed ADT, never thrown: a refusal is the extension's fault or the
// kernel's state, not a technical abort (DOM-14). The kernel gives the
// extension's configurator only the ports its manifest's `touches` names
// (`PortsOf`), so that a port not declared cannot be named; and still checks
// at runtime what it lets through (EXT-4), for an extension built otherwise.

/** A port of the kernel's for extensions, by name, as `touches` lists it (EXT-3, EXT-10). */
export const port = z.enum(['the_port_of_requests', 'its_storage'])
export type port = z.output<typeof port>

// The port of requests (F7, EXT-2, EXT-12).

/**
 * A request to a peer, as an extension's delivery calls the port of requests
 * (EXT-2, EXT-12): the bond; what it invokes on the peer, its own leaf on
 * `known` by its path in its surface and the version it speaks (EXT-5: the
 * kernel adds the extension's name, so that no call names another
 * extension's leaf); the leaf's input; the effect's path and the entry's id,
 * from which, with the extension's name, the kernel composes the request's
 * identity (F7); and the seconds it waits for the response (at most the
 * seven days a relay keeps a letter, MBX-2). Idempotent by the identity: a
 * delivery after a restart meets its request again, or the answer the port
 * keeps.
 */
export const a_request = z.strictObject({
  bond,
  invokes: z.strictObject({ persona: z.literal('known'), use_case: a_leaf, version: semver }),
  input: json,
  effect: z.string().min(1),
  id: z.string().min(1),
  waits: z.number().int().min(1).max(604_800),
})
export type a_request = z.output<typeof a_request>

/**
 * The port of requests' answer (EXT-2), a closed ADT: `responded`, with the
 * peer's event, a claim (F2) the delivery parses by its leaf's events and
 * the kernel's (`the_kernels_events_on_known`); `no_response`, the time
 * over; `the_bond_is_gone`; `refused`, which sent nothing: a call the
 * manifest does not declare (EXT-4), the extension not active (EXT-7), the
 * offer withdrawn from that bond (an offer goes both ways, EXT-7).
 */
export const an_answer_to_a_request = z.discriminatedUnion('answer', [
  z.strictObject({ answer: z.literal('responded'), event: json }),
  z.strictObject({ answer: z.literal('no_response') }),
  z.strictObject({ answer: z.literal('the_bond_is_gone') }),
  z.strictObject({
    answer: z.literal('refused'),
    why: z.enum(['not_declared', 'not_active', 'not_offered_to_the_bond']),
  }),
])
export type an_answer_to_a_request = z.output<typeof an_answer_to_a_request>

// Its storage (EXT-14): a partition of the node's, its own, which the kernel
// carries and never reads. Keys are strings, in the order of their code
// units (as IndexedDB orders them); values are JSON.

/** A key of the partition. */
export const a_key = z.string().min(1)

/** An entry of the partition: a key and its value. */
export const an_entry = z.strictObject({ key: a_key, value: json })
export type an_entry = z.output<typeof an_entry>

/**
 * A read of the partition (EXT-14), an ADT: some keys, whose entries come
 * in the order asked, those present; or a range of keys, in their order,
 * from a key (inclusive) and before another (exclusive), either left out
 * for no bound.
 */
export const a_read = z.discriminatedUnion('read', [
  z.strictObject({ read: z.literal('keys'), keys: z.array(a_key).readonly() }),
  z.strictObject({ read: z.literal('range'), from: a_key.optional(), before: a_key.optional() }),
])
export type a_read = z.output<typeof a_read>

/** A write of a commit (EXT-14), an ADT: a key set to a value, or deleted. */
export const a_write = z.discriminatedUnion('write', [
  z.strictObject({ write: z.literal('set'), key: a_key, value: json }),
  z.strictObject({ write: z.literal('delete'), key: a_key }),
])
export type a_write = z.output<typeof a_write>

/** A commit (EXT-14): a batch of writes, atomic, all or none, in order. */
export const a_commit = z.array(a_write).readonly()
export type a_commit = z.output<typeof a_commit>

/** Why the kernel refuses a call of the storage it does not serve: undeclared (EXT-4), or the extension not active (EXT-7). */
const not_served = ['not_declared', 'not_active'] as const

/** A read's answer, an ADT: the entries read, or refused. */
export const an_answer_to_a_read = z.discriminatedUnion('answer', [
  z.strictObject({ answer: z.literal('read'), entries: z.array(an_entry).readonly() }),
  z.strictObject({ answer: z.literal('refused'), why: z.enum(not_served) }),
])
export type an_answer_to_a_read = z.output<typeof an_answer_to_a_read>

/**
 * A commit's answer, an ADT: committed, all of it; or refused, none of it:
 * not served, or the partition full, a technical outcome (DOM-15), not a
 * fact.
 */
export const an_answer_to_a_commit = z.discriminatedUnion('answer', [
  z.strictObject({ answer: z.literal('committed') }),
  z.strictObject({
    answer: z.literal('refused'),
    why: z.enum([...not_served, 'the_partition_is_full']),
  }),
])
export type an_answer_to_a_commit = z.output<typeof an_answer_to_a_commit>

/** A call of the storage, as a message carries it (EXT-2), an ADT: a read, or a commit. */
export const a_call_of_the_storage = z.discriminatedUnion('call', [
  z.strictObject({ call: z.literal('read'), read: a_read }),
  z.strictObject({ call: z.literal('commit'), writes: a_commit }),
])
export type a_call_of_the_storage = z.output<typeof a_call_of_the_storage>

/** The kernel's ports for extensions, each as the extension's code calls it: a function whose promise gives the call's answer. */
export interface Ports {
  readonly the_port_of_requests: (request: a_request) => Promise<an_answer_to_a_request>
  readonly its_storage: {
    readonly read: (read: a_read) => Promise<an_answer_to_a_read>
    readonly commit: (writes: a_commit) => Promise<an_answer_to_a_commit>
  }
}

/**
 * The ports the kernel gives an extension's configurator: exactly those its
 * manifest's `touches` names (EXT-3), so that a port not declared cannot be
 * named (`Property 'its_storage' does not exist`), as a door gives only what
 * its map opens.
 */
export type PortsOf<declaration extends { readonly touches: readonly port[] }> = Pick<
  Ports,
  declaration['touches'][number]
>
