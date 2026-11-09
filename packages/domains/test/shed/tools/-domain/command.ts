import z from 'zod'
import * as wlib from '../../wlib.ts'
import type { $tool } from './$value.ts'
import { a_tool_has_been_added } from './fact.ts'
import { $no_other_tool_has_this_id } from './$predicate.ts'
import { no_other_tool_has_this_id } from './predicate.ts'
import { category, notes, tool, tool_id, tool_name } from './value.ts'

export const add_a_tool_input = z.strictObject({
  id: tool_id,
  name: tool_name,
  category: category,
  notes: notes.optional(),
})

export const add_a_tool = wlib.command(
  add_a_tool_input,
  (commandContext) => (add_a_tool_input) => {
    const tool_to_add: $tool = {
      ...add_a_tool_input,
      status: 'inService',
      addDate: commandContext.now,
    }
    return [{ tool_to_add }, [$no_other_tool_has_this_id({ id: tool_to_add.id })]]
  },
  [[no_other_tool_has_this_id, a_tool_has_been_added]],
)

// -----------------------------------------------------------------------------
// optB_ (CHOSEN, DOM-5 and V9 of architecture.md): THE FACT CARRIES THE CHANGE.
// The state stays primary, written atomically with the fact (DOM-8).
//
// The branch only says which fact, with which payload. How a fact changes the
// state is declared once per fact (here as an `apply`, its form is question 7).
// Consequence: the payload carries at least what the change needs (D56), and
// a change of what a fact does to the state is a new fact version (DOM-22).
// To be moved into fact.ts and wlib, without the prefix.
// -----------------------------------------------------------------------------

export const optB_a_tool_has_been_added = z
  .strictObject({
    id: tool_id,
    name: tool_name,
    category: category,
    notes: notes.optional(),
    addDate: tool.shape.addDate,
  })
  .brand<'optB_a_tool_has_been_added'>()

declare function optB_command<inputSchema extends z.ZodType, values extends object>(
  inputSchema: inputSchema,
  creator: (
    commandContext: wlib.CommandContext,
  ) => (input: z.output<inputSchema>) => readonly [values, readonly object[]],
  branches: readonly (readonly [wlib.Predicate, wlib.Fact, (values: values) => object])[],
): unknown

declare function optB_apply<factSchema extends wlib.Fact, entitySchema extends z.ZodObject>(
  fact: factSchema,
  entity: entitySchema,
  apply: (
    current: z.output<entitySchema> | undefined,
    payload: z.output<factSchema>,
  ) => z.input<entitySchema> | undefined,
): unknown

export const optB_add_a_tool = optB_command(
  add_a_tool_input,
  (commandContext) => (add_a_tool_input) => {
    const tool_to_add = { ...add_a_tool_input, addDate: commandContext.now }
    return [{ tool_to_add }, [$no_other_tool_has_this_id({ id: tool_to_add.id })]]
  },
  [
    [
      no_other_tool_has_this_id,
      optB_a_tool_has_been_added,
      ({ tool_to_add }) => tool_to_add, // the full payload: it IS the change
    ],
  ],
)

// Declared once, in fact.ts or next to the entity; the adapter folds the facts.
export const optB_tool_added = optB_apply(
  optB_a_tool_has_been_added,
  tool,
  (_current, payload): $tool => ({
    ...payload,
    status: 'inService',
  }),
)
