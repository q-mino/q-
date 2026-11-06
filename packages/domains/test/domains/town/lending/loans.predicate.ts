import type { IsLate, Loan } from './loans.types.ts'

export const isLate = (params: IsLate, loan: Loan): boolean => params.today > loan.due
