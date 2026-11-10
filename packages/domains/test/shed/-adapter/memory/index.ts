// A sketch of the in-memory state adapter, the oracle of the shed (TST-2):
// one module per domain, the state of every domain in one value, one command
// at a time. The links between domains are typed in the modules (`loans.ts`
// imports `tools.ts`), and their imports are the graph of who reads whom.
// Nothing runs: the library is wished.
//
// Commands only. The reads wait for a finding: `QuerySource` gives one
// fragment type to the source, the fields and the selection, which fits SQL
// (everything is `sql`) but not a typed in-memory read, where each query has a
// candidate of its own type (a tool, a loan).

import * as wlib from '../../wlib.ts'
import { add_a_tool, retire_a_tool } from '../../tools/-domain/command.ts'
import { borrow_a_tool, reserve_a_tool, return_a_tool } from '../../loans/-domain/command.ts'
import { loans_fragments, loans_writes, type LoansState } from './loans.ts'
import { tools_fragments, tools_writes, type ToolsState } from './tools.ts'

/** The state of every domain. */
export interface State extends ToolsState, LoansState {}

/** A condition, read on the state. */
type Fragment = (state: State) => boolean

/** A fact's write: the part of the state it changes. */
type Write = (state: State) => Partial<State>

/** Where the oracle keeps the state: a port, so that a test can look at it. */
export interface Cell {
  readonly get: () => State
  readonly set: (state: State) => void
}

const algebra = <fragments>(predicate: fragments) => ({
  predicate,
  and:
    (components: readonly Fragment[]): Fragment =>
    (state) =>
      components.every((component) => component(state)),
  or:
    (components: readonly Fragment[]): Fragment =>
    (state) =>
      components.some((component) => component(state)),
  not:
    (operand: Fragment): Fragment =>
    (state) =>
      !operand(state),
})

/**
 * A serial writer (DOM-9): every branch and every leaf read on one state; the
 * first branch that holds writes; if none does, the leaves name the failures.
 */
const execute =
  (cell: Cell): wlib.Execute<Fragment, Write> =>
  (plan) => {
    const state = cell.get()
    const applied = plan.findIndex((branch) => branch.condition(state))
    const branch = plan[applied]
    if (branch === undefined) {
      return Promise.resolve<wlib.Execution>({
        outcome: 'rejected',
        leaves: plan.map((planned) => planned.leaves.map((leaf) => leaf(state))),
      })
    }
    cell.set({ ...state, ...branch.write(state) })
    return Promise.resolve<wlib.Execution>({ outcome: 'applied', branch: applied })
  }

export const memory_adapter = (cell: Cell) => ({
  tools: wlib.command_ports({ add_a_tool, retire_a_tool })({
    algebra: algebra(tools_fragments),
    write: tools_writes,
    execute: execute(cell),
  }),
  loans: wlib.command_ports({ borrow_a_tool, reserve_a_tool, return_a_tool })({
    algebra: algebra(loans_fragments),
    write: loans_writes,
    execute: execute(cell),
  }),
})
