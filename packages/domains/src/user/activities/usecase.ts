import { command_use_case, read_use_case, command, effect, query } from './_scope_usecase.ts'

// The use cases of the activities (USR-1): the entry of the screens (ADP-7).

/** An activity is asked: kept in progress, and carried out. */
export const ask_for_an_activity = command_use_case({ command: command.ask_for_an_activity })

/** An activity ends, how in her words: the return of its carrying out. */
export const end_an_activity = command_use_case({
  command: command.end_an_activity,
  returns_from: effect.carry_out_an_activity,
})

/** An activity, by its id. */
export const an_activity = read_use_case({ query: query.an_activity })

/** The activities in progress. */
export const the_activities_in_progress = read_use_case({ query: query.the_activities_in_progress })
