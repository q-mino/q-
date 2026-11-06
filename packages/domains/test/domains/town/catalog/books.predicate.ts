import type { Book, IsAvailable } from './books.types.ts'

export const isAvailable = (_params: IsAvailable, book: Book): boolean => book.copies > 0
