import { reaction, tools, loans } from './_scope_reaction.ts'

// The procedure of a repair: what the offices of the shed do when the
// workshop takes a tool in (GR-9, DOM-16). A standing order speaks the
// language of both offices; neither knows it.

/**
 * When the workshop takes a tool in, the reservations desk notifies the
 * members who booked it: the drill goes to repair on Tuesday, after Marta's
 * damaged return or found broken on the shelf by Luca, and Gianni, booked
 * for Thursday, and Paolo, booked three weeks on, hear of it, one by one, on
 * the round the desk begins in `loans` (D97, D112). The round is keyed by
 * the stay in repair, which `tools` named (DOM-12).
 */
export const the_members_who_booked_the_tool_are_notified = reaction({
  when: tools.fact.a_tool_has_been_sent_to_repair,
  invokes: loans.usecase.notify_the_members_of_a_repair,
  translation: (fact) => ({
    repair_id: fact.tool_under_repair.repair.id,
    tool_id: fact.tool_under_repair.id,
  }),
})
