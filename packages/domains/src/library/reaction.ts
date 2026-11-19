import type * as z from 'zod'
import { mark } from './kind.ts'
import type { Component, Path, PathOf, Strays } from './component.ts'
import type { Commands } from './command.ts'
import type { CommandUseCase } from './use_case.ts'
import type { InputOfUseCase } from './use_case_over.ts'

// Reactions (DOM-16, PER-12): "when fact E, command C", a standing order
// between two offices. Its module sits above the domains, which never import
// it (GR-9, D88.6): it speaks the language of the fact it reads and of the
// use case it invokes, and the configurator wires it. In Shed the folders
// under `reaction/` are procedures, the business occurrences that move more
// than one office (`retirement/`), the author's choice (A, 15 Nov 2026).

export const $Reaction: unique symbol = Symbol('Reaction')

/**
 * What a reaction's translation gives when its fact asks for no command
 * (D88.2): a value of the library, so that "no command" is never an input
 * of the invoked one. Not a builder: it builds no component.
 */
export const nothing: unique symbol = Symbol('nothing')

/**
 * A reaction: the fact it reacts to and the command use case it invokes.
 * Its path is its identity, stable across releases (D89.5): the scope of its
 * operations ("system · reaction R", D91.3) and its delivery unit, with its
 * own position, order and dead letters (D89.6). At runtime it holds its
 * declaration whole, its translation with it, for its consumer to run
 * (`declared`).
 */
export interface Reaction<
  fact extends Component,
  use_case extends CommandUseCase<Commands[string]>,
> {
  readonly [$Reaction]: {
    readonly when: fact
    readonly invokes: use_case
    readonly declared: object
  }
}

/**
 * A reaction, declared in one argument whose parts have names: the fact it
 * reacts to (`when`), the command use case it invokes (`invokes`), through a
 * domain's door, and the pure translation from the fact's payload to the
 * invoked one's input (`translation`, D89.3), or to `nothing` (D88.2): Paolo
 * returns the ladder whole, Marta the drill damaged, and only the drill goes
 * to repair; for a fact translated to nothing the consumer invokes no
 * command and goes on to the next part (A, 16 Nov 2026 (4)). It reads no
 * state and has no context: the command's `now` is the clock of the entry,
 * as for the effect executor.
 */
export type ReactionBuilder = <
  const fact extends Component,
  const use_case extends CommandUseCase<Commands[string]>,
>(
  reaction: {
    readonly when: fact
    readonly invokes: use_case
    readonly translation: (fact: z.output<fact>) => InputOfUseCase<use_case> | typeof nothing
  } & ([Strays<fact, Path<'fact'>>] extends [never]
    ? unknown
    : { readonly 'a reaction reacts to a fact (DOM-16)': PathOf<Strays<fact, Path<'fact'>>> }),
) => Reaction<fact, use_case>

/** The paths of the reactions of a registry. */
export type ReactionPaths<registry> = {
  [path in keyof registry & string]: registry[path] extends { [$Reaction]: unknown } ? path : never
}[keyof registry & string]

// The builder's body (part 3.2): a reaction is its fact and the use case it
// invokes, with its declaration whole.

export const reaction_builder: ReactionBuilder = (reaction) => ({
  [$Reaction]: { when: reaction.when, invokes: reaction.invokes, declared: reaction },
  ...mark({ kind: 'reaction' }),
})
