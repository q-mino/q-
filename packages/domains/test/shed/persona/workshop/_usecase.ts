// generated

// The use cases of `workshop` under their names (DOM-2), the leaves of its tree.

import { z } from 'zod'
import * as usecase from './usecase.ts'

/**
 * Rossi's system closes a job (SC-34): the drill is back on the shelf, and
 * the job names the shed's tool and the stay in repair, from the ticket Luca
 * handed over with it. Its notification is the operation (D91.2): sent again
 * when the shed does not answer, the same, it is the duplicate branch and
 * one fact; the same id with another job is `identity_already_used`.
 *
 * @see {@link usecase.close_a_job}
 */
export const close_a_job = usecase.close_a_job

/**
 * The input of `close_a_job`, declared inline.
 *
 * @see {@link usecase.close_a_job}
 */
export const close_a_job_input = usecase.close_a_job.input
export type close_a_job_input = z.output<typeof close_a_job_input>
