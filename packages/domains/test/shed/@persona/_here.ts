// generated

// The point of `persona` in the tree (PER-6, DOM-25): every builder, bound to
// the context the node `persona` gives. The authored files take them from the
// here of their kind (`_here_usecase.ts`), never from this file.

import * as wlib from '../wlib.ts'
import type { persona_context } from './_node.ts'

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
