// The order the shell imports the authored files in (DOM-25): an authored
// file imports its scope, which imports the twins of the layers below and the
// doors, which import other authored files; so a file is imported only once
// every authored file its imports reach through generated files is imported,
// and their twins written. The imports are the runtime's: a type-only import
// is erased (Node's type stripping), and reaches nothing.

/** The runtime imports of a module of the tree, by path; none for a module that is missing. */
export type Imports = (path: string) => readonly string[] | undefined

/** What the next import is: a file, or nothing left, or a file blocked by what it reaches. */
export type Next =
  | { readonly is: 'file'; readonly path: string }
  | { readonly is: 'done' }
  | { readonly is: 'blocked'; readonly path: string; readonly by: string }

/** What a pending file reaches that blocks it: another pending file, or a missing module; nothing if it may be imported. */
const blocker = (
  path: string,
  pending: ReadonlySet<string>,
  authored: ReadonlySet<string>,
  imports: Imports,
): string | undefined => {
  const visit = (
    at: string,
    seen: ReadonlySet<string>,
  ): { readonly by?: string; readonly seen: ReadonlySet<string> } => {
    const reached = imports(at)
    if (reached === undefined) return { by: at, seen }
    return reached.reduce<{ readonly by?: string; readonly seen: ReadonlySet<string> }>(
      (state, next) => {
        if (state.by !== undefined || state.seen.has(next)) return state
        const now = new Set([...state.seen, next])
        if (pending.has(next) && next !== path) return { by: next, seen: now }
        if (authored.has(next)) return { seen: now }
        return visit(next, now)
      },
      { seen },
    )
  }
  return visit(path, new Set([path])).by
}

/**
 * The next file to import among the pending ones, in their order: the first
 * whose imports reach no other pending file and no missing module.
 */
export const next_import = (
  pending: readonly string[],
  authored: ReadonlySet<string>,
  imports: Imports,
): Next => {
  const waiting = new Set(pending)
  const blocked = pending.map((path) => ({ path, by: blocker(path, waiting, authored, imports) }))
  const free = blocked.find((one) => one.by === undefined)
  if (free !== undefined) return { is: 'file', path: free.path }
  const first = blocked[0]
  return first === undefined
    ? { is: 'done' }
    : { is: 'blocked', path: first.path, by: first.by ?? '' }
}
