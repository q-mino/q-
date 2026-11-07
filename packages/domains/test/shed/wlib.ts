// The wished library: what the Shed domains want from the library, as types
// and signatures only. No bodies: nothing here runs, a call throws at runtime.
// It grows step by step with the domains and becomes the requirement of the
// real library (docs/plan.md). Rule ids refer to docs/architecture.md.

import type { z } from 'zod'

// ---------------------------------------------------------------- identities

/** The identity of an operation: created by the caller before the first attempt, kept on retry. DOM-12 */
export type OperationId = string & z.core.$brand<'OperationId'>

/** The identity of a recorded event. DOM-10 */
export type EventId = string & z.core.$brand<'EventId'>

// ---------------------------------------------------------------- state

/** An entity kind: its name and the strict schema of one instance. DOM-1 */
export interface Entity<K extends string, S extends z.ZodObject> {
  readonly kind: K
  readonly schema: S
}

export type AnyEntity = Entity<string, z.ZodObject>

/** One instance of an entity kind, as the core sees it. */
export type Instance<E extends AnyEntity> = z.output<E['schema']>

export declare function entity<const K extends string, S extends z.ZodObject>(
  kind: K,
  schema: S,
): Entity<K, S>

// ---------------------------------------------------------------- facts

/**
 * A fact: its name is its meaning, a business phrase that never changes; its
 * version is the shape of its payload. DOM-5, DOM-22
 */
export interface Fact<N extends string, V extends number, P extends z.ZodObject> {
  readonly name: N
  readonly version: V
  readonly payload: P
}

export type AnyFact = Fact<string, number, z.ZodObject>

export type Payload<F extends AnyFact> = z.output<F['payload']>

export declare function fact<
  const N extends string,
  const V extends number,
  P extends z.ZodObject,
>(definition: { readonly name: N; readonly version: V; readonly payload: P }): Fact<N, V, P>

// ---------------------------------------------------------------- domain

/** A domain: its name, the entity kinds of its state, the closed set of its facts. DOM-1 */
export interface Domain<N extends string, E extends AnyEntity, F extends AnyFact> {
  readonly name: N
  readonly entities: readonly E[]
  readonly facts: readonly F[]
}

export type AnyDomain = Domain<string, AnyEntity, AnyFact>

export type FactOf<D extends AnyDomain> = D['facts'][number]

export declare function domain<
  const N extends string,
  E extends AnyEntity,
  F extends AnyFact,
>(definition: {
  readonly name: N
  readonly entities: readonly E[]
  readonly facts: readonly F[]
}): Domain<N, E, F>

// ---------------------------------------------------------------- commands

/** A step of a mutation. Grows by need: only `create` so far. DOM-5 */
export interface Create<E extends AnyEntity> {
  readonly step: 'create'
  readonly entity: E['kind']
  readonly values: Instance<E>
}

export type MutationStep = Create<AnyEntity>

export declare function create<E extends AnyEntity>(entity: E, values: Instance<E>): Create<E>

/**
 * A branch: the fact it records, its resolved values, its mutation. Condition
 * and outbox follow-ups come with their steps. DOM-5, DOM-6
 */
export interface Branch<F extends AnyFact> {
  readonly fact: F
  readonly payload: Payload<F>
  readonly mutation: readonly MutationStep[]
}

export type AnyBranch = Branch<AnyFact>

export declare function branch<F extends AnyFact>(
  fact: F,
  body: { readonly payload: Payload<F>; readonly mutation: readonly MutationStep[] },
): Branch<F>

/** A command is data: an ordered list of branches, at most one applies. DOM-5 */
export interface Command<F extends AnyFact> {
  readonly branches: readonly Branch<F>[]
}

export declare function command<F extends AnyFact>(...branches: readonly Branch<F>[]): Command<F>

// ---------------------------------------------------------------- outcomes

/** What identifies a fact's resource: ordering and locking read it without the payload. DOM-10 */
export interface Resource {
  readonly entity: string
  readonly id: string
}

/**
 * The event envelope of a recorded fact. DOM-10 lists more fields (path,
 * fingerprint, correlation, attribution, frame stack): they come with the steps
 * that need them.
 */
export interface Envelope<F extends AnyFact> {
  readonly name: F['name']
  readonly version: F['version']
  readonly payload: Payload<F>
  readonly eventId: EventId
  readonly operationId: OperationId
  readonly resources: readonly Resource[]
}

export interface Recorded<F extends AnyFact> {
  readonly outcome: 'recorded'
  readonly fact: Envelope<F>
}

export interface Rejected {
  readonly outcome: 'rejected'
  /** The names of the failed predicates. DOM-6 */
  readonly failed: readonly string[]
}

/** The typed outcome of a command: one recorded fact per possible branch, or the rejection. DOM-7 */
export type Outcome<F extends AnyFact> = (F extends AnyFact ? Recorded<F> : never) | Rejected

// ---------------------------------------------------------------- ports

/**
 * The command port of a domain: same result as the reference interpreter, all
 * or nothing, isolated. DOM-2, DOM-9
 */
export interface CommandPort<D extends AnyDomain> {
  execute<F extends FactOf<D>>(operationId: OperationId, command: Command<F>): Promise<Outcome<F>>
}
