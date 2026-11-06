// The marker of the domain `user` (LIB-14): the domains it consumes (docs/architecture.md § 2).
import type { DomainPath } from '../index.ts'

export const consumes: readonly DomainPath[] = ['persona']
