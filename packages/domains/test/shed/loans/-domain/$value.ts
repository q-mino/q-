// generated

import { z } from 'zod'
import {
  booked_reservation,
  day,
  loan,
  loan_id,
  loan_ongoing,
  loan_progress,
  loan_returned,
  loan_stage,
  member_id,
  ongoing_loan,
  reservation,
  reservation_booked,
  reservation_id,
  reservation_progress,
  reservation_stage,
  return_condition,
  returned_loan,
} from './value'

export type $loan_id = z.output<typeof loan_id>

export type $member_id = z.output<typeof member_id>

export type $loan_stage = z.output<typeof loan_stage>

export type $return_condition = z.output<typeof return_condition>

export type $loan_ongoing = z.output<typeof loan_ongoing>

export type $loan_returned = z.output<typeof loan_returned>

export type $loan_progress = z.output<typeof loan_progress>

export type $loan = z.output<typeof loan>

export type $ongoing_loan = z.output<typeof ongoing_loan>

export type $returned_loan = z.output<typeof returned_loan>

export type $reservation_id = z.output<typeof reservation_id>

export type $day = z.output<typeof day>

export type $reservation_stage = z.output<typeof reservation_stage>

export type $reservation_booked = z.output<typeof reservation_booked>

export type $reservation_progress = z.output<typeof reservation_progress>

export type $reservation = z.output<typeof reservation>

export type $booked_reservation = z.output<typeof booked_reservation>
