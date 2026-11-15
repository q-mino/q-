import { reaction, tools, loans } from './_here_reaction.ts'

// The procedure of a tool's retirement: what the offices of the shed do when
// the catalogue retires a tool (GR-9, DOM-16). A standing order speaks the
// language of both offices; neither knows it.

/**
 * When the catalogue retires a tool, the reservations desk cancels its
 * reservations: Luca retires the broken ladder, and Marta's Saturday and
 * Gianni's Sunday are cancelled, one by one, by the work sheet it opens in
 * `loans` (D97, D112).
 */
export const the_reservations_of_the_tool_are_cancelled = reaction({
  when: tools.fact.a_tool_has_been_retired,
  invokes: loans.usecase.cancel_the_reservations_of_a_tool,
  translation: (fact) => ({ tool_id: fact.retired_tool.id }),
})
