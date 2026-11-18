import * as z from 'zod'
import type { date_time } from './format.ts'
import type { OperationContext } from './context.ts'
import type { Component, Path, PathOf, Strays } from './component.ts'
import type { Condition, ConditionInput, Leaves } from './condition.ts'

// Commands (DOM-5, DOM-6, DOM-19): a command is data, an ordered record of
// branches, each a condition, the fact it records, the effects it queues and
// the transitions it composes; its creator resolves them under the same
// names. Here too what the adapters and the use cases derive from a set of
// commands: their predicates, facts, effects and transitions.

/**
 * The outbox entries of a branch, by name (DOM-5, DOM-13): each an effect,
 * queued with the branch's fact, in the same atomic step (D12).
 */
export type Entries = Readonly<Record<string, Component>>

export const $Composition: unique symbol = Symbol('Composition')

export const $Each: unique symbol = Symbol('Each')

/**
 * A transition a branch composes on each element of a list (SC-54, D113):
 * the instances named by the input, as many as the list, each applying its
 * own branch and recording its own part.
 */
export interface Each<transition extends Commands[string]> {
  readonly [$Each]: transition
}

/** The command a composition applies: the transition, or the one composed on each element of a list. */
type TransitionOf<composed> = composed extends Each<infer transition> ? transition : composed

/**
 * The transitions a branch composes, by name, each a command of its own
 * domain (D111, DOM-19): the transitions of other instances the branch
 * applies with no choice, outside a step (SC-10, C, 17 Nov 2026), on one
 * instance or on each element of a list (`each`, SC-54). A composed
 * transition composes nothing in turn, until a case asks (LIB-3).
 */
export type Transitions = Readonly<Record<string, Commands[string] | Each<Commands[string]>>>

/** A branch's composition: its transitions, by name. */
export interface Composition<transitions extends Transitions> {
  readonly [$Composition]: transitions
}

/**
 * A branch, declared: the condition, the fact it records, if it asks the
 * world for something its outbox entries, and, if it applies the transitions
 * of other instances of its domain, their composition (`composes`, after the
 * entries, `{}` when it queues none). DOM-5, D111
 */
export type Outcome =
  | readonly [condition: Condition, fact: Component]
  | readonly [condition: Condition, fact: Component, entries: Entries]
  | readonly [
      condition: Condition,
      fact: Component,
      entries: Entries,
      composes: Composition<Transitions>,
    ]

/**
 * The closed set of a command's branches, each under a business name: at
 * most one applies, tried in the order they are written. DOM-5, DOM-3
 */
export type Outcomes = Readonly<Record<string, Outcome>>

/**
 * The branches resolved by the creator, under the same names as the outcomes:
 * for each, the parameters bound to its condition and the payload of its fact.
 * Inputs, not outputs: the library parses them and puts the brands on.
 */
export type ResolvedOutcomes<outcomes extends Outcomes> = {
  readonly [k in keyof outcomes]: outcomes[k] extends readonly [
    Condition,
    Component,
    infer entries extends Entries,
    Composition<infer transitions>,
  ]
    ? readonly [
        condition: ConditionInput<outcomes[k][0]>,
        fact: z.input<outcomes[k][1]>,
        entries: ResolvedEntries<entries>,
        composes: ResolvedTransitions<transitions>,
      ]
    : outcomes[k] extends readonly [Condition, Component, infer entries extends Entries]
      ? readonly [
          condition: ConditionInput<outcomes[k][0]>,
          fact: z.input<outcomes[k][1]>,
          entries: ResolvedEntries<entries>,
        ]
      : readonly [condition: ConditionInput<outcomes[k][0]>, fact: z.input<outcomes[k][1]>]
}

/**
 * The inputs of the transitions a branch composes, under their names: the
 * instance each applies to, from the input (SC-10); for a transition on a
 * list, one input per element, in the order of the list (SC-54).
 */
export type ResolvedTransitions<transitions extends Transitions> = {
  readonly [name in keyof transitions]: transitions[name] extends Each<infer transition>
    ? readonly z.input<InputOf<transition>>[]
    : z.input<InputOf<transitions[name]>>
}

/** The identity of an outbox entry (DOM-13, D48): written by the domain, the key sent outside with its effect. */
export const entry_id = z.string().min(1).brand<'entry_id'>()

export type entry_id = z.output<typeof entry_id>

/**
 * A branch's outbox entries as the creator resolves them, under the same
 * names (DOM-13, D108.1): the entry's id, from the domain's values, so that
 * the pair (effect, id) is the key sent outside and the identity of the
 * return's operation (DOM-14); its payload; and, if it waits, the instant it
 * may go at the earliest, `not_before`, which the creator computes with the
 * clock as a parameter (D48): after a downtime the entry goes late, never
 * skipped. The paper leaves the form of the delay open (A, 13 Nov 2026 (3)).
 */
export type ResolvedEntries<entries extends Entries> = {
  readonly [name in keyof entries]: {
    readonly id: z.input<typeof entry_id>
    readonly payload: z.input<entries[name]>
    readonly not_before?: z.input<typeof date_time>
  }
}

/**
 * A command's creator: from the part of the context it declares, which the
 * tree must give at the command's point (the generator checks it), and the
 * input, the resolved branches.
 */
export type CommandCreator<
  inputSchema extends z.ZodType,
  outcomes extends Outcomes,
  context = never,
> = (context: context) => (input: z.output<inputSchema>) => ResolvedOutcomes<outcomes>

/**
 * A command's input: a schema, or a function of the part of the context its
 * validation needs (a static rule over `now`). The library builds it before
 * parsing. DOM-21
 */
export type CommandInput<inputSchema extends z.ZodType, context = never> =
  inputSchema | ((context: context) => inputSchema)

/**
 * The schema of an input declared as a schema or as a function of a context
 * (DOM-21): the schema, or what the function returns.
 */
export type SchemaOf<input> = input extends z.ZodType
  ? input
  : input extends (context: never) => infer schema
    ? schema extends z.ZodType
      ? schema
      : never
    : never

export const $Command: unique symbol = Symbol('Command')

/**
 * A command: its creator, its input as declared (`input`), from which the
 * generator writes `<command>_input` (DOM-25), and its parts for the library.
 */
export type Command<
  input extends CommandInput<z.ZodType>,
  outcomes extends Outcomes,
  context,
> = CommandCreator<SchemaOf<input>, outcomes, context> & {
  readonly input: input
  [$Command]: {
    input: SchemaOf<input>
    outcomes: outcomes
  }
}

/**
 * Branches whose conditions are made of predicates, whose facts are facts
 * and whose entries are effects are themselves; others ask for a field no
 * command has, whose name says why and whose type lists the paths of the
 * strays. DOM-24
 */
export type PredicatesAndFacts<outcomes extends Outcomes> = [
  | Strays<PredicatesOf<outcomes>, Path<'predicate'>>
  | Strays<FactsOf<outcomes>, Path<'fact'>>
  | Strays<EffectsOf<outcomes>, Path<'effect'>>,
] extends [never]
  ? unknown
  : {
      readonly 'a condition is made of predicates, a branch records a fact and queues effects (DOM-24)': PathOf<
        | Strays<PredicatesOf<outcomes>, Path<'predicate'>>
        | Strays<FactsOf<outcomes>, Path<'fact'>>
        | Strays<EffectsOf<outcomes>, Path<'effect'>>
      >
    }

/**
 * A command, declared in one argument whose parts have names: the input,
 * declared inline, the branches, and last the creator that binds them. DOM-25.
 * Its conditions are made of predicates and its facts are facts, checked by
 * type. Its creator and its input read the context of its point of the tree
 * with its operation (`command`, `Builders`).
 */
export type CommandBuilder<context> = <
  const input extends CommandInput<z.ZodType, context & OperationContext>,
  const outcomes extends Outcomes,
>(command: {
  readonly input: input
  readonly outcomes: outcomes & PredicatesAndFacts<outcomes>
  readonly creator: CommandCreator<SchemaOf<input>, outcomes, context & OperationContext>
}) => Command<input, outcomes, context & OperationContext>

/** The input schema of a command. */
export type InputOf<command> = command extends {
  [$Command]: { input: infer input extends z.ZodType }
}
  ? input
  : never

/** Every predicate a command's branches use. */
export type PredicatesOf<outcomes extends Outcomes> = Leaves<outcomes[keyof outcomes][0]>

/** Every fact a command can record. */
export type FactsOf<outcomes extends Outcomes> = outcomes[keyof outcomes][1]

/** The effects of a branch's entries, none if it has no entries. */
type EffectsOfOutcome<outcome> = outcome extends readonly [
  Condition,
  Component,
  infer entries extends Entries,
  ...unknown[],
]
  ? entries[keyof entries]
  : never

/** The transitions a branch composes, none if it composes none (SC-10), a list's by its transition (SC-54). */
export type TransitionsOfOutcome<outcome> = outcome extends readonly [
  Condition,
  Component,
  Entries,
  Composition<infer transitions>,
]
  ? TransitionOf<transitions[keyof transitions]>
  : never

/** Every transition a command's branches compose (SC-10). */
export type TransitionsOf<outcomes extends Outcomes> = TransitionsOfOutcome<
  outcomes[keyof outcomes]
>

/** Every effect a command can queue. */
export type EffectsOf<outcomes extends Outcomes> = EffectsOfOutcome<outcomes[keyof outcomes]>

/** The commands of a domain, by name. */
export type Commands = Readonly<
  Record<string, { readonly [$Command]: { input: z.ZodType; outcomes: Outcomes } }>
>

/** The outcomes of a command. */
export type OutcomesOf<command> = command extends { [$Command]: { outcomes: infer outcomes } }
  ? outcomes extends Outcomes
    ? outcomes
    : never
  : never
