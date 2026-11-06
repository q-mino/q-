// From the facts of a source tree to its domains and components (LIB-14..17), or the errors.
import { isName, join, libraryFolder, roleOf, surfaceKinds, type Kind } from './names.ts'

/** How a module exports a name. Only `value` makes a component; the others are errors in a suffixed module. */
export type ExportForm = 'value' | 'type' | 'default' | 'star'

export interface SourceExport {
  readonly name: string
  readonly form: ExportForm
}

/** A `.ts` module, with its path relative to the compiled root ('/' separators). */
export interface SourceModule {
  readonly path: string
  readonly exports: readonly SourceExport[]
}

/** A marker, with the domain paths it consumes; `null` when the marker does not declare them as a literal. */
export interface SourceMarker {
  readonly folder: string
  readonly consumes: readonly string[] | null
}

/** What the compiler reads from disk: every folder (relative, the root excluded), every module, every marker. */
export interface SourceTree {
  readonly folders: readonly string[]
  readonly modules: readonly SourceModule[]
  readonly markers: readonly SourceMarker[]
}

export type CompileErrorCode =
  | 'name-invalid'
  | 'kind-unknown'
  | 'domain-at-root'
  | 'domain-in-domain'
  | 'outside-domain'
  | 'export-not-value'
  | 'path-duplicate'
  | 'path-is-node'
  | 'schema-missing'
  | 'reads-missing'
  | 'reads-orphan'
  | 'marker-invalid'
  | 'consumes-unknown'
  | 'consumes-self'
  | 'consumes-cycle'

export interface CompileError {
  readonly code: CompileErrorCode
  /** The path of the module, folder or component at fault. */
  readonly at: string
  readonly detail: string
}

export type ComponentKind = 'command' | 'predicate' | 'schema'

/** A component: a function (command, predicate) with its schema, or a schema alone (a type of the language). */
export interface Component {
  readonly path: string
  readonly domain: string
  readonly kind: ComponentKind
}

/** A module node: the modules `<name>.<kind>.ts` of one folder, merged (LIB-16). */
export interface ModuleNode {
  readonly folder: string
  readonly name: string
  readonly kinds: readonly Kind[]
  /** Exports per kind, sorted. */
  readonly exports: Readonly<Record<Kind, readonly string[]>>
}

export interface Domain {
  readonly path: string
  readonly consumes: readonly string[]
}

export interface Analysis {
  readonly folders: readonly string[]
  readonly domains: readonly Domain[]
  readonly nodes: readonly ModuleNode[]
  readonly components: readonly Component[]
}

export type AnalysisResult =
  | { readonly ok: true; readonly analysis: Analysis }
  | { readonly ok: false; readonly errors: readonly CompileError[] }

const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

const isInside = (path: string, folder: string): boolean =>
  folder === '' || path === folder || path.startsWith(`${folder}/`)

/** The domain that owns a folder: the nearest marker at or above it. */
const ownerOf = (folder: string, domains: readonly string[]): string | undefined =>
  domains.filter((d) => isInside(folder, d)).sort((a, b) => b.length - a.length)[0]

export function analyze(tree: SourceTree): AnalysisResult {
  const errors: CompileError[] = []
  const fail = (code: CompileErrorCode, at: string, detail: string): void => {
    errors.push({ code, at, detail })
  }

  const folders = tree.folders.filter((f) => !isInside(f, libraryFolder)).sort(byText)
  for (const folder of folders) {
    const name = folder.slice(folder.lastIndexOf('/') + 1)
    if (!isName(name)) fail('name-invalid', folder, `folder name "${name}" is not a camelCase name`)
  }

  // Domains (LIB-14).
  const markers = tree.markers.slice().sort((a, b) => byText(a.folder, b.folder))
  const domainPaths = markers.map((m) => m.folder)
  for (const marker of markers) {
    if (marker.folder === '')
      fail('domain-at-root', 'domain.ts', 'the root is a grouping, not a domain')
    const outer = domainPaths.find((d) => d !== marker.folder && isInside(marker.folder, d))
    if (outer !== undefined) fail('domain-in-domain', marker.folder, `inside the domain ${outer}`)
    if (marker.consumes === null)
      fail(
        'marker-invalid',
        join(marker.folder, 'domain.ts'),
        'consumes must be an array of string literals',
      )
  }
  const domains: Domain[] = markers.map((m) => ({
    path: m.folder,
    consumes: (m.consumes ?? []).slice().sort(byText),
  }))
  for (const domain of domains) {
    for (const consumed of domain.consumes) {
      if (consumed === domain.path)
        fail('consumes-self', domain.path, 'a domain does not consume itself')
      else if (!domainPaths.includes(consumed))
        fail('consumes-unknown', domain.path, `"${consumed}" is not a domain`)
    }
  }
  const cycle = findCycle(domains)
  if (cycle !== undefined) fail('consumes-cycle', cycle[0] ?? '', cycle.join(' → '))

  // Module nodes (LIB-15, LIB-16).
  const nodes = new Map<string, { folder: string; name: string; exports: Map<Kind, string[]> }>()
  for (const module of tree.modules.slice().sort((a, b) => byText(a.path, b.path))) {
    const role = roleOf(module.path)
    if (role.role === 'unknown-kind') {
      fail('kind-unknown', module.path, `".${role.suffix}" is not a kind of component`)
      continue
    }
    if (role.role !== 'component') continue
    if (!isName(role.name))
      fail('name-invalid', module.path, `module name "${role.name}" is not a camelCase name`)
    if (ownerOf(role.folder, domainPaths) === undefined) {
      fail('outside-domain', module.path, 'a component lives inside a domain')
      continue
    }
    const key = join(role.folder, role.name)
    const node = nodes.get(key) ?? { folder: role.folder, name: role.name, exports: new Map() }
    nodes.set(key, node)
    const names: string[] = []
    for (const exported of module.exports) {
      if (exported.form !== 'value') {
        fail(
          'export-not-value',
          module.path,
          `${exported.form} export "${exported.name}": components are named values`,
        )
      } else if (!isName(exported.name)) {
        fail('name-invalid', module.path, `export "${exported.name}" is not a camelCase name`)
      } else names.push(exported.name)
    }
    node.exports.set(role.kind, names.sort(byText))
  }

  // Components and matching by name (LIB-16, LIB-17).
  const components: Component[] = []
  const moduleNodes: ModuleNode[] = []
  for (const [key, node] of [...nodes].sort(([a], [b]) => byText(a, b))) {
    const of = (kind: Kind): readonly string[] => node.exports.get(kind) ?? []
    const domain = ownerOf(node.folder, domainPaths) ?? ''
    const commands = of('command')
    const predicates = of('predicate')
    const schemas = of('schema')
    const reads = of('reads')
    for (const name of commands.filter((n) => predicates.includes(n)))
      fail('path-duplicate', join(key, name), 'both a command and a predicate')
    for (const name of [...commands, ...predicates]) {
      if (!schemas.includes(name))
        fail('schema-missing', join(key, name), `no "${name}" in ${node.name}.schema.ts`)
    }
    for (const name of predicates) {
      if (!reads.includes(name))
        fail('reads-missing', join(key, name), `no "${name}" in ${node.name}.reads.ts`)
    }
    for (const name of reads) {
      if (!predicates.includes(name))
        fail('reads-orphan', join(key, name), `no predicate "${name}"`)
    }
    for (const name of commands) components.push({ path: join(key, name), domain, kind: 'command' })
    for (const name of predicates)
      components.push({ path: join(key, name), domain, kind: 'predicate' })
    for (const name of schemas.filter((n) => !commands.includes(n) && !predicates.includes(n)))
      components.push({ path: join(key, name), domain, kind: 'schema' })
    const nodeKinds = [...node.exports.keys()].sort(byText)
    const exports = {
      schema: of('schema'),
      command: of('command'),
      predicate: of('predicate'),
      reads: of('reads'),
    }
    moduleNodes.push({ folder: node.folder, name: node.name, kinds: nodeKinds, exports })
  }

  // A component's path is never a node (a folder or a module node) (LIB-16).
  const nodePaths = new Set([...folders, ...nodes.keys()])
  for (const component of components) {
    if (nodePaths.has(component.path))
      fail('path-is-node', component.path, 'also a folder or a module node')
  }

  if (errors.length > 0) return { ok: false, errors }
  components.sort((a, b) => byText(a.path, b.path))
  return { ok: true, analysis: { folders, domains, nodes: moduleNodes, components } }
}

/** The paths another domain may reach of this one (GR-1, LIB-21). */
export const surfaceOf = (analysis: Analysis, domain: string): readonly Component[] =>
  analysis.components.filter((c) => c.domain === domain && surfaceKinds.includes(c.kind))

/** One cycle among the arrows, if any (GR-1). */
function findCycle(domains: readonly Domain[]): readonly string[] | undefined {
  const arrows = new Map(domains.map((d) => [d.path, d.consumes]))
  const done = new Set<string>()
  const visit = (path: string, stack: readonly string[]): readonly string[] | undefined => {
    const seen = stack.indexOf(path)
    if (seen >= 0) return [...stack.slice(seen), path]
    if (done.has(path)) return undefined
    for (const next of arrows.get(path) ?? []) {
      const cycle = visit(next, [...stack, path])
      if (cycle !== undefined) return cycle
    }
    done.add(path)
    return undefined
  }
  for (const domain of domains) {
    const cycle = visit(domain.path, [])
    if (cycle !== undefined) return cycle
  }
  return undefined
}
