// generated

// The use cases of `user/activities` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import * as usecase from './usecase.ts'

/**
 * An activity is asked: kept in progress, and carried out.
 *
 * @see {@link usecase.ask_for_an_activity}
 */
export const ask_for_an_activity = usecase.ask_for_an_activity

/**
 * An activity ends, how in her words: the return of its carrying out.
 *
 * @see {@link usecase.end_an_activity}
 */
export const end_an_activity = usecase.end_an_activity

/**
 * An activity, by its id.
 *
 * @see {@link usecase.an_activity}
 */
export const an_activity = usecase.an_activity

/**
 * The activities in progress.
 *
 * @see {@link usecase.the_activities_in_progress}
 */
export const the_activities_in_progress = usecase.the_activities_in_progress
