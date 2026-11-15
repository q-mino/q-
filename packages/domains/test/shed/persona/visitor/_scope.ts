// generated

// The scope of `visitor` (DOM-25): every builder, bound to the context of its
// point in the tree (PER-6), the context the node of the persona base gives
// (`visitor` has no node). The authored files take them from the scope of their
// kind (`_scope_usecase.ts`), never from this file.

import * as wlib from '../../wlib.ts'
import type { persona_context } from '../_node.ts'

export const {
  id,
  fact,
  predicate,
  selection,
  effect,
  AND,
  OR,
  NOT,
  command,
  query,
  command_use_case,
  read_use_case,
  command_use_case_over,
  read_use_case_over,
  lookup,
  reaction,
  node,
} = wlib.builders_at<persona_context>()
