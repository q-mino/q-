import { reaction, nothing, dsl, tools, loans } from './_scope_reaction.ts'

// The procedure of a damaged return: what the offices of the shed do when a
// member brings a tool back damaged (GR-9, DOM-16). A standing order speaks
// the language of both offices; neither knows it.

/**
 * When a member brings a tool back damaged, the workshop takes it in: Marta
 * returns the drill damaged on Tuesday, and it goes to repair; Paolo returns
 * the ladder whole on Monday, and nothing happens (D88.2).
 */
export const the_damaged_tool_goes_to_repair = reaction({
  when: loans.fact.a_tool_has_been_returned,
  invokes: tools.usecase.send_a_tool_to_repair,
  translation: (fact) =>
    dsl.the_tool_came_back_damaged(fact) ? { tool_id: fact.returned_loan.tool_id } : nothing,
})
