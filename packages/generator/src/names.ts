// The names a generated file gives (DOM-25): a scope's members, a door's
// namespaces, a registry's imports. Two under one name would not compile; the
// generator names them first, in the tree's words.

/** A name a generated file gives, and what it stands for, in the tree's words. */
export interface Named {
  readonly name: string
  readonly what: string
}

/** The names given twice among these, in their order: each with the first that gave it. */
export const given_twice = (names: readonly Named[]): readonly (readonly [Named, Named])[] =>
  names.flatMap((named, index) => {
    const first = names.slice(0, index).find((other) => other.name === named.name)
    if (first === undefined) return []
    const pair: readonly [Named, Named] = [first, named]
    return [pair]
  })
