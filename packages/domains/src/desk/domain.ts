// The marker of the domain `desk` (LIB-14): the domains it consumes (docs/architecture.md § 2).
import type { DomainPath } from '../index.ts'

export const consumes: readonly DomainPath[] = ['mailbox']
