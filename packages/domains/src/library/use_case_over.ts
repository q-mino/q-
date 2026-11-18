import type * as z from 'zod'
import type { Component } from './component.ts'
import type { Condition } from './condition.ts'
import type { Composition, Each, Entries, Outcomes, OutcomesOf } from './command.ts'
import type { Failure, PathFailures } from './state_adapter.ts'
import type { $UseCase, InputOfCommand } from './use_case.ts'

// A use case over another (DOM-2, D105): it runs no command of its own, it
// invokes another domain's command use case, with parts of its own: its
// input, its events, the creator and the projection that translate them. The
// library knows no kind of domain (LIB-1, DOM-25): who uses it, and with
// which rules, is the architecture's. In Shed a persona's leaves are always
// in this form (PER-6), so that the persona keeps its contract when the
// business changes (PER-17, D75.6, GR-3).

/**
 * The events of a use case with parts of its own, by name: each a phrase of
 * its domain's language, its payload a schema (D72.1). A closed set (DOM-3).
 */
export type Events = Readonly<Record<string, z.ZodType>>

/**
 * One of the events of a use case, as a projection writes it: its name and
 * its payload, an input that the library parses with the event's schema.
 */
export type EventOf<events extends Events> = {
  [name in keyof events & string]: {
    readonly event: name
    readonly payload: z.input<events[name]>
  }
}[keyof events & string]

/** The command a command use case runs. */
export type CommandOfUseCase<use_case> = use_case extends { [$UseCase]: { command: infer command } }
  ? command
  : never

/**
 * The input of a command use case, as its invoker gives it: the target the
 * nodes of its path bind and its command's own, flat (D105, SC-31).
 */
export type InputOfUseCase<use_case> = use_case extends {
  [$UseCase]: { accumulated: { binds: infer binds } }
}
  ? InputOfCommand<CommandOfUseCase<use_case>> & binds
  : never

/** The predicates the nodes of a command use case's path require, which its rejection may name. */
export type LeavesOfUseCase<use_case> = use_case extends {
  [$UseCase]: { accumulated: { leaves: infer leaves extends Component } }
}
  ? leaves
  : never

/**
 * A part a branch composed, as a leaf reads it (SC-54): the branch of the
 * transition applied, by name, and its fact's payload, an ADT by branch, as
 * a command's outcome.
 */
export type ComposedPart<transition> = {
  [branch in keyof OutcomesOf<transition> & string]: {
    readonly branch: branch
    readonly fact: z.output<OutcomesOf<transition>[branch][1]>
  }
}[keyof OutcomesOf<transition> & string]

/**
 * The parts a branch composed, under the names of its composition (SC-10,
 * SC-54): a transition's part, or, for a transition on a list, one part per
 * element, in the order of the list; nothing for a branch that composes
 * none. Luca's screen reads which lines of his short sheet went in and
 * which were left.
 */
export type ComposedParts<outcome> = outcome extends readonly [
  Condition,
  Component,
  Entries,
  Composition<infer transitions>,
]
  ? {
      readonly [name in keyof transitions]: transitions[name] extends Each<infer transition>
        ? readonly ComposedPart<transition>[]
        : ComposedPart<transitions[name]>
    }
  : Readonly<Record<string, never>>

/**
 * The projection of the invoked use case's outcome into the events of the
 * use case over it (D45): one function per branch, from its fact's payload
 * and the parts its branch composed, by name (SC-54; A, 18 Nov 2026 (6):
 * a second parameter, which a projection that does not need it leaves out),
 * and one for the rejection, from its failures. Exhaustive, as a match over
 * an ADT: a new branch below does not compile above. What never leaves the
 * node (the fact's resources, attribution, versions, PER-18) is never given
 * to it. The branches exclude `rejected` from their keys: while the
 * outcomes are still generic, a mapped type may hold any key, and `rejected`
 * would get two signatures and lose its parameter's type (A, 13 Nov 2026).
 */
export type Projection<
  outcomes extends Outcomes,
  events extends Events,
  leaves extends Component = never,
> = {
  readonly [branch in Exclude<keyof outcomes, 'rejected'>]: (
    fact: z.output<outcomes[branch][1]>,
    composed: ComposedParts<outcomes[branch]>,
  ) => EventOf<events>
} & {
  readonly rejected: (
    failures: readonly (Failure<outcomes> | PathFailures<leaves>)[],
  ) => EventOf<events>
}

/** One of the events of a use case, as its port gives it: its name and its payload, parsed. */
export type EventOutOf<events extends Events> = {
  [name in keyof events & string]: {
    readonly event: name
    readonly payload: z.output<events[name]>
  }
}[keyof events & string]
