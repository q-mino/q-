import { z } from 'zod'
import { command, identity_of, AND, NOT, fact, id, predicate, value } from './_scope_command.ts'

/** No tool of the catalogue has the requested id. */
export const the_tool_is_new = NOT(predicate.a_tool_has_this_id)

export const add_a_tool = command({
  input: z.strictObject({
    id: id.tool_id,
    name: value.tool_name,
    category: value.category,
    notes: value.notes.optional(),
  }),
  outcomes: {
    the_tool_is_new_so_it_is_added: [the_tool_is_new, fact.a_tool_has_been_added],
  },
  creator: (context) => (input) => ({
    the_tool_is_new_so_it_is_added: [
      { tool_id: input.id },
      { added_tool: { ...input, status: 'inService', addDate: context.now } },
    ],
  }),
})

/** The requested tool is in the catalogue and in service. */
export const the_tool_can_be_retired = AND({
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_in_service: predicate.the_tool_is_in_service,
})

/** The requested tool is in the catalogue and in the workshop: beyond repair, it can be retired. */
export const the_tool_is_in_the_workshop = AND({
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_under_repair: predicate.the_tool_is_under_repair,
})

/** The requested tool is in the catalogue and already retired. */
export const the_tool_is_already_retired = AND({
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_retired: predicate.the_tool_is_retired,
})

export const retire_a_tool = command({
  input: z.strictObject({
    id: id.tool_id,
    reason: value.retire_reason,
    notes: value.notes.optional(),
  }),
  outcomes: {
    the_tool_is_in_service_so_it_is_retired: [
      the_tool_can_be_retired,
      fact.a_tool_has_been_retired,
    ],
    the_tool_is_beyond_repair_so_it_is_retired: [
      the_tool_is_in_the_workshop,
      fact.a_tool_has_been_retired,
    ],
    the_tool_is_already_retired_so_nothing_changes: [
      the_tool_is_already_retired,
      fact.the_tool_was_already_retired,
    ],
  },
  creator: (context) => (input) => ({
    the_tool_is_in_service_so_it_is_retired: [
      {
        a_tool_has_the_requested_id: { tool_id: input.id },
        the_requested_tool_is_in_service: { tool_id: input.id },
      },
      {
        retired_tool: {
          id: input.id,
          status: 'retired',
          retirement: { date: context.now, reason: input.reason, notes: input.notes },
        },
      },
    ],
    the_tool_is_beyond_repair_so_it_is_retired: [
      {
        a_tool_has_the_requested_id: { tool_id: input.id },
        the_requested_tool_is_under_repair: { tool_id: input.id },
      },
      {
        retired_tool: {
          id: input.id,
          status: 'retired',
          retirement: { date: context.now, reason: input.reason, notes: input.notes },
        },
      },
    ],
    the_tool_is_already_retired_so_nothing_changes: [
      {
        a_tool_has_the_requested_id: { tool_id: input.id },
        the_requested_tool_is_retired: { tool_id: input.id },
      },
      { tool_id: input.id },
    ],
  }),
})

/**
 * The tool goes to the workshop: Marta returned the drill damaged, and a
 * standing order brings the news (`reaction/damage`); or Luca found it broken
 * on the shelf. Neither can name the stay in repair, so `tools` derives its
 * id from the operation (D75.8): a redelivery is the duplicate branch, the
 * same stay. Invoked by a reaction, it rejects no expected occurrence (D93):
 * a tool already in the workshop, or retired, records a fact and changes
 * nothing.
 */
export const send_a_tool_to_repair = command({
  input: z.strictObject({
    tool_id: id.tool_id,
  }),
  outcomes: {
    the_tool_is_in_service_so_it_goes_to_repair: [
      the_tool_can_be_retired,
      fact.a_tool_has_been_sent_to_repair,
    ],
    the_tool_is_already_in_the_workshop_so_nothing_changes: [
      the_tool_is_in_the_workshop,
      fact.the_tool_was_already_under_repair,
    ],
    the_tool_is_retired_so_nothing_changes: [
      the_tool_is_already_retired,
      fact.the_tool_was_retired_before_the_repair,
    ],
  },
  creator: (context) => (input) => ({
    the_tool_is_in_service_so_it_goes_to_repair: [
      {
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_in_service: { tool_id: input.tool_id },
      },
      {
        tool_under_repair: {
          id: input.tool_id,
          status: 'underRepair',
          repair: { id: identity_of(id.repair_id)(context.operation), since: context.now },
        },
      },
    ],
    the_tool_is_already_in_the_workshop_so_nothing_changes: [
      {
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_under_repair: { tool_id: input.tool_id },
      },
      { tool_id: input.tool_id },
    ],
    the_tool_is_retired_so_nothing_changes: [
      {
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_retired: { tool_id: input.tool_id },
      },
      { tool_id: input.tool_id },
    ],
  }),
})

/** Luca puts the repaired drill back on the shelf: it can be lent and booked again. */
export const put_a_repaired_tool_back_in_service = command({
  input: z.strictObject({
    tool_id: id.tool_id,
  }),
  outcomes: {
    the_tool_is_in_the_workshop_so_it_is_back_in_service: [
      the_tool_is_in_the_workshop,
      fact.a_tool_has_been_repaired,
    ],
  },
  creator: () => (input) => ({
    the_tool_is_in_the_workshop_so_it_is_back_in_service: [
      {
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_under_repair: { tool_id: input.tool_id },
      },
      { repaired_tool: { id: input.tool_id, status: 'inService' } },
    ],
  }),
})

/** The requested tool is in the catalogue and in the workshop for the requested stay (SC-34). */
export const the_tool_is_in_the_workshop_for_this_repair = AND({
  a_tool_has_the_requested_id: predicate.a_tool_has_this_id,
  the_requested_tool_is_under_the_requested_repair: predicate.the_tool_is_under_this_repair,
})

/**
 * The workshop closes a stay in repair (SC-34): Rossi's van brought the
 * drill back on the shelf, and his system says so, naming the stay it closes
 * (RP1, from the job ticket Luca handed over with the drill). The stay, not
 * the tool alone: a notice that comes late, after Luca put the drill back by
 * hand and Marta broke it again (RP2), finds the drill in another stay and
 * changes nothing, so a retry from outside is safe by the business, not only
 * by the operation's identity (D91.2). Luca, who holds the drill, puts it
 * back by the tool alone.
 */
export const close_a_repair = command({
  input: z.strictObject({
    tool_id: id.tool_id,
    repair_id: id.repair_id,
  }),
  outcomes: {
    the_tool_is_under_this_repair_so_it_is_back_in_service: [
      the_tool_is_in_the_workshop_for_this_repair,
      fact.a_tool_has_been_repaired,
    ],
  },
  creator: () => (input) => ({
    the_tool_is_under_this_repair_so_it_is_back_in_service: [
      {
        a_tool_has_the_requested_id: { tool_id: input.tool_id },
        the_requested_tool_is_under_the_requested_repair: {
          tool_id: input.tool_id,
          repair_id: input.repair_id,
        },
      },
      { repaired_tool: { id: input.tool_id, status: 'inService' } },
    ],
  }),
})

/**
 * Luca gives the drill a name the members recognise on the shelf: any tool
 * of the catalogue, retired ones too, since their name stays in the history
 * of the loans (SC-19).
 */
export const rename_a_tool = command({
  input: z.strictObject({
    tool_id: id.tool_id,
    name: value.tool_name,
  }),
  outcomes: {
    the_tool_is_in_the_catalogue_so_it_is_renamed: [
      predicate.a_tool_has_this_id,
      fact.a_tool_has_been_renamed,
    ],
  },
  creator: () => (input) => ({
    the_tool_is_in_the_catalogue_so_it_is_renamed: [
      { tool_id: input.tool_id },
      { renamed_tool: { id: input.tool_id, name: input.name } },
    ],
  }),
})
