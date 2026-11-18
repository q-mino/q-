import type * as z from 'zod'
import type { Component, Path, PathOf, Strays } from './component.ts'
import type { $Command, Commands } from './command.ts'
import type { Queries } from './query.ts'
import type { Accumulated, NothingAccumulated } from './node.ts'

// Use cases (DOM-2, DOM-3, DOM-4): a domain's only entry. Personas, reactions
// and the effect executor reach a business domain through its use cases,
// never through its ports: its command is sent only by the domain, in its own
// store (DOM-8). A business use case does not know who asks (D85); what
// depends on the caller is the persona's.

export const $UseCase: unique symbol = Symbol('UseCase')

/**
 * A command use case: the primary port of one command (DOM-4). In the
 * trivial case it declares only its command, so that it is a declared
 * boundary, not boilerplate: its input is the command's; its events are the
 * command's outcome, the first event and a terminal one (D72.3). Parts of its
 * own (an input and a creator, events after the outcome, their terminals)
 * come with the case that composes something.
 */
export interface CommandUseCase<
  command extends Commands[string],
  returns_from = unknown,
  accumulated extends Accumulated<unknown, Component> = Accumulated<unknown, Component>,
> {
  readonly [$UseCase]: {
    readonly command: command
    readonly returns_from: returns_from
    readonly accumulated: accumulated
  }
}

/**
 * A command use case, declared in one argument whose parts have names
 * (DOM-25). A return use case (DOM-13, D108.1) names the effect it comes
 * back from (`returns_from`): the effect executor invokes it with what the
 * world said, which the effect's delivery maps onto its input. The paper
 * puts the return in the entry; here the use case names the effect, since a
 * command that queues an effect and a use case over a command would import
 * each other (A, 13 Nov 2026 (3)). An effect has one return at most, which
 * the generator checks.
 *
 * Below a node of a business tree (D105, SC-31) the use case is invoked at
 * the leaf's path, with the target the nodes above it bind beside its
 * command's input, flat: `extend_the_loan`, under `an_ongoing_loan`, takes
 * `loan_id` with its command's own; the library gives the target to the
 * nodes and the rest to the command. A command below binds none of it again
 * (D105.2).
 */
export type CommandUseCaseBuilder<
  accumulated extends Accumulated<unknown, Component> = NothingAccumulated,
> = <
  const command extends Commands[string],
  const returns_from extends Component | undefined = undefined,
>(
  use_case: {
    readonly command: command
    readonly returns_from?: returns_from
  } & NotDeclaredAgain<accumulated, command>,
) => CommandUseCase<command, returns_from, accumulated>

/** The keys of a command's input bound by a node above it (D105.2): none, or a field no command has. */
type NotDeclaredAgain<accumulated extends Accumulated<unknown, Component>, command> = [
  Extract<keyof InputOfCommand<command>, keyof accumulated['binds']>,
] extends [never]
  ? unknown
  : {
      readonly 'a command declares no key a node above it binds (D105.2)': Extract<
        keyof InputOfCommand<command>,
        keyof accumulated['binds']
      >
    }

/** The input of a command, as its invoker gives it. */
export type InputOfCommand<command> = command extends {
  [$Command]: { input: infer input extends z.ZodType }
}
  ? z.input<input>
  : never

/** The command use cases of a domain, by name. */
export type CommandUseCases = Readonly<Record<string, CommandUseCase<Commands[string]>>>

/** The commands the use cases run, under the use cases' names. */
export type CommandsOf<use_cases extends CommandUseCases> = {
  readonly [name in keyof use_cases]: use_cases[name][typeof $UseCase]['command']
}

/**
 * A read use case: the primary port of one query (DOM-2). One use case per
 * query, always a stream: with no position, its first event is the snapshot
 * (the entries and the position P they were read at, D66), then the events
 * of the stream from P (DOM-17); from a position, the stream alone (a resume).
 * The consumer takes what it needs and stops: the snapshot alone is a read,
 * up to `caught_up` a review, on and on a live view (D72, D72.2). The library
 * composes the read and the stream, so that a live view has no gap and no
 * double. A query the adapter does not stream gives the snapshot alone.
 *
 * It names the facts that a use case over it may name in its stream
 * (`facts`, the facts themselves, as a command names its own: D64.2,
 * D101.4): the notices the domain sends with its register, its choice (A,
 * 14 Nov 2026). A fact is named when it touches an entry and leaves it in
 * the selection (one that takes it out comes as `left`, its identity only),
 * tells a reader something the entry does not, an occurrence rather than a
 * state ("has just fallen overdue", not "is overdue"), and a reader uses it
 * (LIB-3). A fact it does not name reaches the use cases over it as the
 * entry it leaves. A use case over it names a fact by the name in its path.
 */
export interface ReadUseCase<
  query extends Queries[string],
  facts extends Readonly<Record<string, Component>> = Readonly<Record<string, Component>>,
> {
  readonly [$UseCase]: { readonly query: query; readonly facts: facts }
}

/** The name of a fact, the last part of its path. */
type FactName<path> = path extends `${string}/fact/${infer name}` ? name : never

/** Facts by the name in their path. */
export type FactsByName<facts extends Component> = {
  readonly [fact in facts as FactName<PathOf<fact>>]: fact
}

/**
 * A read use case, declared in one argument whose parts have names (DOM-25):
 * its query and the facts it names, which must be facts.
 */
export type ReadUseCaseBuilder = <
  const query extends Queries[string],
  const facts extends Component = never,
>(
  use_case: {
    readonly query: query
    readonly facts?: readonly facts[]
  } & ([Strays<facts, Path<'fact'>>] extends [never]
    ? unknown
    : { readonly 'a read use case names facts (DOM-17)': PathOf<Strays<facts, Path<'fact'>>> }),
) => ReadUseCase<query, FactsByName<facts>>

/** The read use cases of a domain, by name. */
export type ReadUseCases = Readonly<Record<string, ReadUseCase<Queries[string]>>>

/** The queries the use cases read, under the use cases' names. */
export type QueriesOf<use_cases extends ReadUseCases> = {
  readonly [name in keyof use_cases]: use_cases[name][typeof $UseCase]['query']
}
