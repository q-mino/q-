// A test domain of the library (LIB-2): the town's lending of books, which reads the catalog.
import type { DomainPath } from '../../index.ts'

export const consumes: readonly DomainPath[] = ['town/catalog']
