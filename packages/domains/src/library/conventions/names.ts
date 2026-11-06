// The names of the conventions (LIB-14..16): which module plays which role.

/** The kinds of component, from the module's suffix (LIB-15). Closed; grown by need (LIB-3). */
export const kinds = ['schema', 'command', 'predicate', 'reads'] as const
export type Kind = (typeof kinds)[number]

/** The kinds another domain may reach, along the arrows (GR-1, LIB-21). */
export const surfaceKinds: readonly Kind[] = ['predicate']

/** The marker of a domain (LIB-14). */
export const markerModule = 'domain.ts'

/** The library's folder at the root of `domains`: not a domain, never compiled. */
export const libraryFolder = 'library'

/** The file of the graph's arrows, generated at the root (LIB-19). */
export const arrowsFile = 'arrows.generated.cjs'

const generatedModules = new Set(['index.ts', 'domain.paths.ts'])
const reservedNames = new Set(['index', 'domain'])
const identifier = /^[a-z][A-Za-z0-9]*$/

/** Folder, module and export names are identifiers of the domain's language, in camelCase. */
export const isName = (text: string): boolean => identifier.test(text) && !reservedNames.has(text)

export type ModuleRole =
  | {
      readonly role: 'component'
      readonly folder: string
      readonly name: string
      readonly kind: Kind
    }
  | { readonly role: 'marker'; readonly folder: string }
  | { readonly role: 'unknown-kind'; readonly folder: string; readonly suffix: string }
  | { readonly role: 'generated' | 'helper' | 'library' }

const isKind = (text: string): text is Kind => (kinds as readonly string[]).includes(text)

/** Folder of a path relative to the root ('' for the root itself). */
export const folderOf = (path: string): string => {
  const slash = path.lastIndexOf('/')
  return slash < 0 ? '' : path.slice(0, slash)
}

const baseOf = (path: string): string => path.slice(path.lastIndexOf('/') + 1)

/** Joins path segments, skipping the root's empty folder. */
export const join = (...parts: readonly string[]): string => parts.filter((p) => p !== '').join('/')

/** The role of a `.ts` module, from its path relative to the compiled root. */
export function roleOf(path: string): ModuleRole {
  if (path === libraryFolder || path.startsWith(`${libraryFolder}/`)) return { role: 'library' }
  const folder = folderOf(path)
  const base = baseOf(path)
  if (generatedModules.has(base) || base.endsWith('.types.ts')) return { role: 'generated' }
  if (base === markerModule) return { role: 'marker', folder }
  const parts = base.slice(0, -'.ts'.length).split('.')
  const [name, kind, ...rest] = parts
  if (name === undefined || kind === undefined) return { role: 'helper' }
  if (rest.length === 0 && isKind(kind)) return { role: 'component', folder, name, kind }
  return { role: 'unknown-kind', folder, suffix: [kind, ...rest].join('.') }
}
