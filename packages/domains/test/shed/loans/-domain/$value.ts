// generated

import { z } from 'zod'
import {
  booked_reservation,
  ongoing_loan_entry,
  reservation_entry,
  tool_name,
  loan,
  loan_ongoing,
  loan_progress,
  loan_returned,
  loan_stage,
  ongoing_loan,
  reservation,
  reservation_booked,
  reservation_progress,
  reservation_stage,
  return_condition,
  returned_loan,
} from './value'

export type $loan_stage = z.output<typeof loan_stage>

export type $return_condition = z.output<typeof return_condition>

export type $loan_ongoing = z.output<typeof loan_ongoing>

export type $loan_returned = z.output<typeof loan_returned>

export type $loan_progress = z.output<typeof loan_progress>

export type $loan = z.output<typeof loan>

export type $ongoing_loan = z.output<typeof ongoing_loan>

export type $returned_loan = z.output<typeof returned_loan>

export type $reservation_stage = z.output<typeof reservation_stage>

export type $reservation_booked = z.output<typeof reservation_booked>

export type $reservation_progress = z.output<typeof reservation_progress>

export type $reservation = z.output<typeof reservation>

export type $booked_reservation = z.output<typeof booked_reservation>

export type $tool_name = z.output<typeof tool_name>

export type $ongoing_loan_entry = z.output<typeof ongoing_loan_entry>

export type $reservation_entry = z.output<typeof reservation_entry>
