// generated

// The scope of `member` (DOM-25): every builder, bound to the context of its
// point in the tree (PER-6), the context the node `member` gives. The authored
// files take them from the scope of their kind (`_scope_usecase.ts`), never
// from this file.

import * as wlib from '../../wlib.ts'
import type { member_closes, member_context } from './_node.ts'

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
  cursor_step,
  query,
  command_use_case,
  read_use_case,
  command_use_case_over,
  read_use_case_over,
  lookup,
  reaction,
  node,
  version,
  earlier,
  delegate,
} = wlib.builders_at<member_context, member_closes>()
