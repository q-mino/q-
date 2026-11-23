// Persistent storage (WEB-11): the writer asks the browser to keep the node's
// storage, which it may otherwise clear when the device runs short of room.
// The browser decides, and its answer is shown (F6): it guarantees nothing.

/** The browser's `navigator.storage`, given (WEB-5); absent outside a secure context. */
export type AStorageManager = Pick<StorageManager, 'persist' | 'persisted'>

/**
 * What the browser said: `persistent` (it clears the node's storage only if
 * the user does), `best_effort` (it may clear it under pressure), or
 * `not_told` (no storage manager, or it failed to answer).
 */
export type TheStorage = 'persistent' | 'best_effort' | 'not_told'

/** Asks once per start of the writer; `persisted()` first, so a storage kept already asks nothing. */
export const ask_to_keep_the_storage = async (
  storage: AStorageManager | undefined,
): Promise<TheStorage> => {
  if (storage === undefined) return 'not_told'
  try {
    if (await storage.persisted()) return 'persistent'
    return (await storage.persist()) ? 'persistent' : 'best_effort'
  } catch {
    return 'not_told'
  }
}
