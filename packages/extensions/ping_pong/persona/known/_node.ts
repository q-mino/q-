// generated

// The point of `persona/known`, mounted below a node of another tree (EXT-11):
// the context that node gives here, composed of the schemas `@q-mino/boundary`
// exports by these names (PER-6, "A mounted folder"). The one module of the
// tree that imports them; the scopes below read the context from here, and no
// node takes it again (D105.2).

import * as z from 'zod'
import type * as zz from '../../../../domains/src/library/index.ts'
import { the_bond } from '@q-mino/boundary'

/** The folder `persona/known`, mounted: the context given to everything below it, from outside (EXT-11). */
export const known = {
  mounted: 'persona/known',
  context: z.strictObject({ ...the_bond.shape }),
} satisfies zz.Mounted

/** The context given at the mounted folder `known` to everything below it. */
export type known_context = zz.ContextOf<typeof known>
