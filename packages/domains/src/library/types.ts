import type * as z from 'zod'

// Tools of the type level, with no concept of the library: the literal of a
// brand, a union told apart from a single type.

export type BrandOf<value> = value extends { readonly [z.core.$brand]: infer brand }
  ? keyof brand & string
  : never

type UnionToIntersection<union> = (
  union extends unknown ? (member: union) => void : never
) extends (member: infer intersection) => void
  ? intersection
  : never

export type IsUnion<type> = [type] extends [UnionToIntersection<type>] ? false : true
