import type * as z from 'zod'
import type { RootContext } from './context.ts'
import type { Answer, Lookup, LookupParts } from './lookup.ts'
import type { Component, Path, PathOf, Strays } from './component.ts'
import type { Condition, ConditionInput, Leaves } from './condition.ts'
import type { NotFound, Refused } from './base_event.ts'

// Nodes (PER-6, PER-14): at most one in a folder, met by the library as it
// walks a path down, whatever the tree. A node is a function of the context,
// not of the request: it sees no input, since it sits above every leaf of
// its folder. It runs its lookups, its only I/O, then its perimeters, its
// limits and its bindings, pure, in the order of PER-5 (perimeter, then
// limit); it extends the context, never rewrites it (D105.2); once per
// request, for everything below it. It reads as sentences, its name the
// subject: `member` looks up …, is found only if …, is refused unless …,
// gives … (A, 13 Nov 2026).

export const $Node: unique symbol = Symbol('Node')

/**
 * What the nodes above a point of a tree add to the commands below it (D105,
 * SC-31): the input of the target they bind (`binds`), which the input of a
 * use case below carries beside its command's own, and the predicates of
 * their conditions (`requires`), which a rejection may name. Nothing at a
 * point with no such node, as everywhere in a persona's tree.
 */
export interface Accumulated<binds, leaves extends Component> {
  readonly binds: binds
  readonly leaves: leaves
}

/** What a point accumulates with no node above it that binds or requires. */
export type NothingAccumulated = Accumulated<unknown, never>

/**
 * A node: the context it takes, the context it gives, how it and the nodes
 * above it may close a request (`closes`, a union of `NodeEvent`s), and what
 * they add to the commands below (`accumulated`), for the leaves below it to
 * carry.
 */
export interface Node<
  taken,
  gives extends RootContext,
  closes,
  accumulated extends Accumulated<unknown, Component> = NothingAccumulated,
> {
  readonly [$Node]: {
    readonly takes: taken
    readonly gives: gives
    readonly closes: closes
    readonly accumulated: accumulated
  }
}

/** What a node and the nodes above it add to the commands below, for the `_scope.ts` of its folder. */
export type AccumulatedOf<node> = node extends {
  [$Node]: { accumulated: infer accumulated extends Accumulated<unknown, Component> }
}
  ? accumulated
  : never

/** The context a node gives, for the `_scope.ts` of its folder. */
export type ContextOf<node> = node extends { [$Node]: { gives: infer context extends RootContext } }
  ? context
  : never

/** How a node and the nodes above it may close a request, for the `_scope.ts` of its folder. */
export type ClosesOf<node> = node extends { [$Node]: { closes: infer closes } } ? closes : never

/** What the entry gives the node at the top of a tree: the root's context and what the node takes. */
export type EntryOf<node> = node extends { [$Node]: { takes: infer taken } } ? taken : never

/**
 * A lookup a node runs: the lookup, the key it runs `of`, from the context
 * the node takes, and what "not known" does. The key is an answer (D30): a
 * key not known (a caller with no account) runs no lookup, and the value is
 * not known. The key is typed as parsed, branded, so that another identity
 * (a session for an account) does not compile. `not_found` closes the
 * request as a perimeter (PER-14, D87.5), so that the value goes on known;
 * "not known" as a value comes with its case.
 */
export interface NodeLookup<context, key extends z.ZodType, value extends z.ZodType> {
  readonly lookup: Lookup<key, value>
  readonly of: (context: context) => Answer<z.output<key>>
  readonly when_not_known: 'not_found'
}

/** The lookups of a node, by name: each a phrase, the value it looks up. */
export type NodeLookups = Readonly<
  Record<string, { readonly lookup: Lookup<z.ZodType, z.ZodType> }>
>

/** The lookups of a node, each checked against the lookup it runs: its key, its value. */
type NodeLookupsOf<context, lookups> = {
  readonly [name in keyof lookups]: lookups[name] extends { readonly lookup: infer lookup }
    ? NodeLookup<context, LookupParts<lookup>['key'], LookupParts<lookup>['value']>
    : never
}

/** The values the lookups of a node found, by name, known. */
export type Found<lookups> = {
  readonly [name in keyof lookups]: z.output<
    LookupParts<lookups[name] extends { lookup: infer lookup } ? lookup : never>['value']
  >
}

/** The context a node takes: the point's, and at the top of a tree what its entry gives (`takes`). */
type Taken<context, takes> = takes extends z.ZodObject ? context & z.output<takes> : context

/** The conditions of a node, by name: each pure, over the context and what its lookups found. */
type NodeConditions<name extends string, context, lookups> = Readonly<
  Record<name, (context: context) => (found: Found<lookups>) => boolean>
>

/**
 * A node, declared in one argument whose parts have names, in the order of
 * its run, so that it reads as sentences with its name as the subject (A,
 * 13 Nov 2026): what the entry gives at the top of a tree (`takes`, only
 * there); what it `looks_up`; the perimeters, as what it `is_found_only_if`;
 * the limits, as what it `is_refused_unless`; what it `gives`, last. Every
 * part may be left out. A condition is named by what must hold: a perimeter
 * that fails closes with `not_found`, with no reason; a limit that fails
 * with `refused`, its name the reason the caller reads (PER-14); every limit
 * is evaluated, every failure named. The node adds to how the nodes above
 * close (`closes`) what it may close with: `not_found` if it looks up or
 * holds perimeters, `refused` with the names of its limits if it has some.
 *
 * A node of a business tree (D105, SC-31, C, 18 Nov 2026; A for the shape)
 * adds to every command below it what the domain holds true there for
 * whoever asks (D105.1): it `binds` the target, part of the input of the use
 * case invoked below it, which it gives down in the context, so that no leaf
 * declares it again nor binds it to another value (D105.2); it `requires` a
 * condition in the vocabulary of the domain's predicates, whose parameters
 * its `creator` binds from the target and the context. The library composes
 * the condition into every branch of the command below, after the duplicate
 * branch (D105.3), evaluated with the write, and a rejection names its failed
 * predicates, never the node (D105.4). The same builder as a persona's node,
 * whose parts a business node does not use (LIB-1: the library knows no kind
 * of domain); a node binds no key bound above it.
 */
export type NodeBuilder<
  context,
  closes,
  accumulated extends Accumulated<unknown, Component> = NothingAccumulated,
> = <
  const takes extends z.ZodObject | undefined = undefined,
  const lookups extends NodeLookups = NoLookups,
  const perimeters extends string = never,
  const limits extends string = never,
  const gives extends Readonly<Record<string, unknown>> | undefined = undefined,
  const binds extends z.ZodObject | undefined = undefined,
  const requires extends Condition | undefined = undefined,
>(
  node: {
    readonly takes?: takes
    readonly looks_up?: lookups & NodeLookupsOf<Taken<context, takes>, lookups>
    readonly is_found_only_if?: NodeConditions<perimeters, Taken<context, takes>, lookups>
    readonly is_refused_unless?: NodeConditions<limits, Taken<context, takes>, lookups>
    readonly gives?: (context: Taken<context, takes>) => (found: Found<lookups>) => gives
    readonly binds?: binds
    readonly requires?: requires & NodePredicates<requires>
  } & Requirement<Taken<context, takes>, binds, requires> &
    NotRebound<Taken<context, takes>, binds>,
) => Node<
  Taken<context, takes>,
  Taken<context, takes> & Given<gives> & Bound<binds> & RootContext,
  closes | ClosesBy<lookups, perimeters, limits>,
  Accumulated<
    accumulated['binds'] & (binds extends z.ZodObject ? z.input<binds> : unknown),
    accumulated['leaves'] | (requires extends Condition ? Leaves<requires> : never)
  >
>

/** The target a node binds, as the context below it holds it: nothing more when it binds none. */
type Bound<binds> = binds extends z.ZodObject ? z.output<binds> : unknown

/**
 * The creator of a node's condition, when it requires one: from the context
 * of its point and the target it binds, the parameters of the condition.
 */
type Requirement<context, binds, requires> = requires extends Condition
  ? {
      readonly creator: (context: context) => (bound: Bound<binds>) => ConditionInput<requires>
    }
  : { readonly creator?: never }

/**
 * A node's condition made of predicates is itself; another asks for a field
 * no node has, whose name says why and whose type lists the paths of the
 * strays. DOM-5, D105.2
 */
type NodePredicates<requires> = requires extends Condition
  ? [Strays<Leaves<requires>, Path<'predicate'>>] extends [never]
    ? unknown
    : {
        readonly 'a node requires a condition made of predicates (D105.2)': PathOf<
          Strays<Leaves<requires>, Path<'predicate'>>
        >
      }
  : unknown

/** The keys a node would bind again, bound above it (D105.2): none, or a field no node has. */
type NotRebound<context, binds> = [
  binds extends z.ZodObject ? Extract<keyof z.output<binds>, keyof context> : never,
] extends [never]
  ? unknown
  : {
      readonly 'a node binds what no node above it bound (D105.2)': binds extends z.ZodObject
        ? Extract<keyof z.output<binds>, keyof context>
        : never
    }

/** The lookups of a node that runs none: nothing is found, and no name reads. */
type NoLookups = Readonly<Record<string, never>>

/** What a node gives: its bindings, or nothing more when it has none. */
type Given<gives> = gives extends undefined ? unknown : gives

/** How one node may close a request, by the names of what it declares. */
type ClosesBy<lookups, perimeters extends string, limits extends string> =
  | ([lookups] extends [NoLookups] ? ([perimeters] extends [never] ? never : NotFound) : NotFound)
  | ([limits] extends [never] ? never : Refused<limits>)
