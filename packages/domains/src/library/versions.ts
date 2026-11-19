import type * as z from 'zod'
import type { Semver, position } from './format.ts'
import type { Component } from './component.ts'
import type { PartFields, StoredPart } from './envelope.ts'
import type { FactLog } from './stream.ts'
import type { EntryFields, FactWrites, StoredEntry } from './state_adapter.ts'
import { $Delegated, $Earlier, $Version } from './version.ts'
import {
  $Versions,
  type Majors,
  type Registry,
  type StoredVersion,
  type StoredVersions,
  type Versions,
} from './registry.ts'
import { is_a_schema } from './kind.ts'
import { folder_of, is_at_or_above } from './runtime.ts'

// The versions of a store (DOM-22, A, 17 Nov 2026): the one place where a
// stored part of a fact, or a stored outbox entry, becomes a parsed one, by
// its path and its version; the checks at wiring (a domain absent, a current
// major not its `version.ts`'s, a stored version no major reads); the
// rebuild of an adapter's state from its log (`replay`).

/**
 * The versions of a store, composed once by the configurator from the
 * majors of every domain whose data it keeps (`versions([loans, tools])`),
 * and given to every builder that reads stored data (A, 17 Nov 2026). A part
 * or an entry written at the current major, at its minor or a lower one,
 * parses with the current schema of its path (a minor leaves every shape it
 * wrote parsable, DOM-22); one written at a past major parses with that
 * major's folder (`business/loans/1/`) and goes forward, major by major, to
 * the current shape: `earlier` parses with its own shape and steps to the
 * next (`to_next`), `delegate` passes it on as it is. Any other version
 * stops the reader, which retries: a 2.1.0 written by a newer instance
 * during a rolling release, read at 2.0.0, is never guessed.
 *
 * At wiring (CFG-2) it stops (rejects) on a domain whose current major is
 * not the one its `version.ts` declares, and on a path and version the store
 * keeps that no major given reads, naming each (`StoredVersions`): a past
 * major's folder deleted while a fact or an entry of that major is kept, a
 * domain whose majors were not given, a minor newer than the current. So a
 * release that deleted a folder too early does not start (SC-9), rather than
 * a stream in a loop, a wait stuck, a rebuild halfway. The builders that
 * read stored data stop at their wiring on a domain absent from the versions
 * they are given (`reads`).
 */
export type VersionsBuilder = (
  majors: readonly Majors[],
) => (store: { readonly stored: StoredVersions }) => Promise<Versions>

/** The major and the minor of a version. */
const major_and_minor = (version: string): readonly [number, number] => {
  const [major, minor] = version.split('.').map(Number)
  return [major ?? Number.NaN, minor ?? Number.NaN]
}

/** A function of the domain or the adapter called with its one argument (a step to the next major, a write): its result, unknown until parsed. */
const called = (what: string, callee: unknown, argument: unknown): unknown => {
  if (typeof callee !== 'function') throw new Error(`${what} is not a function`)
  const result: unknown = Reflect.apply(callee, undefined, [argument])
  return result
}

/** A domain whose data the store keeps: its folder, its current major and minor, its registries by major. */
interface Domain {
  readonly folder: string
  readonly version: Semver
  readonly major: number
  readonly minor: number
  readonly majors: ReadonlyMap<number, Registry>
  /** The current registry read in reverse: a component's path, by object identity (DOM-24). */
  readonly path_of: ReadonlyMap<unknown, string>
}

/** The versions a registry declares (`version.ts`), with their paths: one for a current major, none for a past one. */
const declared_versions = (registry: Registry): readonly (readonly [string, Semver])[] =>
  Object.entries(registry).flatMap(([path, entry]): readonly (readonly [string, Semver])[] =>
    typeof entry === 'object' && $Version in entry ? [[path, entry[$Version]]] : [],
  )

/**
 * A domain from its majors, or why the store cannot start with it: one of
 * its registries declares the version (its `version.ts`), under the major
 * that version names (DOM-22, A, 17 Nov 2026).
 */
const domain_of = (majors: Majors): Domain | string => {
  const by_major = new Map(
    Object.entries(majors).map(([major, registry]) => [Number(major), registry] as const),
  )
  const declared = [...by_major].flatMap(([major, registry]) =>
    declared_versions(registry).map(([path, version]) => ({ major, path, version })),
  )
  const [current] = declared
  if (current === undefined || declared.length > 1) {
    return `majors given with ${String(declared.length)} versions declared: a domain's majors hold one current registry, whose version.ts declares its version (DOM-22)`
  }
  const [major, minor] = major_and_minor(current.version)
  const folder = folder_of(current.path)
  if (major !== current.major) {
    return `${folder} is at ${current.version} by its version.ts, and its majors give it as major ${String(current.major)}: the current major is the one its version declares (DOM-22, CFG-2)`
  }
  const registry = by_major.get(major) ?? {}
  return {
    folder,
    version: current.version,
    major,
    minor,
    majors: by_major,
    path_of: new Map(Object.entries(registry).map(([path, entry]) => [entry, path])),
  }
}

/** A step of a past major's component to the next major's: its shape, and the step (`earlier`). */
interface Step {
  readonly schema: z.ZodType
  readonly to_next: unknown
}

/**
 * Where a stored path and version leads, or why no major reads it: the
 * current path, the steps from the major it was written at, and the current
 * schema that parses the last.
 */
type Resolution =
  | {
      readonly read: true
      readonly path: string
      readonly steps: readonly Step[]
      readonly current: z.ZodType
    }
  | { readonly read: false; readonly why: string }

/** A stored path and version no major reads, and why. */
const unread = (stored: StoredVersion, why: string): Resolution => ({
  read: false,
  why: `${stored.path} at ${stored.version}: ${why}`,
})

/**
 * From a component of a past major to the current one's, through the next
 * majors' components as each folder names them (`earlier`: its shape and its
 * step; `delegate`: the next's as it is), with the steps met; a component
 * that is neither is where the chain ends. The generator checks that every
 * next is the next major's (DOM-22).
 */
const chain = (
  component: unknown,
  steps: readonly Step[],
): { readonly component: unknown; readonly steps: readonly Step[] } | string => {
  if (typeof component === 'object' && component !== null && $Delegated in component) {
    return chain(component[$Delegated], steps)
  }
  if (!is_a_schema(component) || !($Earlier in component)) return { component, steps }
  const earlier: unknown = component[$Earlier]
  if (typeof earlier !== 'object' || earlier === null || !('next' in earlier)) {
    return 'a component of a past major with no next (DOM-22)'
  }
  return chain(earlier.next, [
    ...steps,
    { schema: component, to_next: 'to_next' in earlier ? earlier.to_next : undefined },
  ])
}

/**
 * The chain of a stored path and version to the current shape (DOM-22): the
 * component of its path in the registry of the major it was written at,
 * then, while it is a past major's, its next major's (`earlier`: its shape
 * and its step; `delegate`: the next's as it is), until the current major's.
 */
const resolution =
  (domains: readonly Domain[]) =>
  (stored: StoredVersion): Resolution => {
    const domain = domains.find((each) => is_at_or_above(each.folder, folder_of(stored.path)))
    if (domain === undefined) {
      return unread(stored, 'of no domain whose majors the store was given (DOM-22)')
    }
    const [major, minor] = major_and_minor(stored.version)
    if (major > domain.major || (major === domain.major && minor > domain.minor)) {
      return unread(
        stored,
        `newer than ${domain.folder} at ${domain.version}: written by a newer release, the reader stops and retries (DOM-22)`,
      )
    }
    const registry = domain.majors.get(major)
    if (registry === undefined) {
      return unread(
        stored,
        `${domain.folder} keeps no folder of major ${String(major)}: deleted while the store keeps it (DOM-22, D101)`,
      )
    }
    const chained = chain(registry[stored.path], [])
    if (typeof chained === 'string') return unread(stored, chained)
    const { component, steps } = chained
    const path = domain.path_of.get(component)
    if (path === undefined || !is_a_schema(component)) {
      return unread(
        stored,
        `no component of ${domain.folder} at major ${String(major)} leads to one of ${domain.version} (DOM-22)`,
      )
    }
    return { read: true, path, steps, current: component }
  }

/** A payload at the current shape: through each step of the chain, then the current schema (DOM-22). */
const translated = (resolved: Resolution & { readonly read: true }, payload: unknown): unknown =>
  resolved.current.parse(
    resolved.steps.reduce(
      (written, step) =>
        called('a step to the next major', step.to_next, step.schema.parse(written)),
      payload,
    ),
  )

/** The resolution of a path and a version, or the reader stops (throws), and retries. */
const read_or_stop =
  (resolve: (stored: StoredVersion) => Resolution) =>
  (stored: StoredVersion): Resolution & { readonly read: true } => {
    const resolved = resolve(stored)
    if (!resolved.read) throw new Error(`${resolved.why}: the reader stops`)
    return resolved
  }

export const versions: VersionsBuilder = (majors) => async (store) => {
  const domains = majors.map(domain_of)
  const faults = domains.flatMap((domain) => (typeof domain === 'string' ? [domain] : []))
  const known = domains.flatMap((domain) => (typeof domain === 'string' ? [] : [domain]))
  const twice = known.filter(
    (domain, i) => known.findIndex((each) => each.folder === domain.folder) !== i,
  )
  const resolve = resolution(known)
  const kept = faults.length > 0 ? [] : await store.stored()
  const all = [
    ...faults,
    ...twice.map((domain) => `${domain.folder} given twice: one domain, one majors (DOM-22)`),
    ...kept.flatMap((stored) => {
      const resolved = resolve(stored)
      return resolved.read ? [] : [`the store keeps ${resolved.why}`]
    }),
  ]
  if (all.length > 0) throw new Error(all.join('\n'))
  const read = read_or_stop(resolve)
  return {
    [$Versions]: {
      part: (stored: StoredPart): PartFields => {
        const resolved = read(stored)
        return {
          path: resolved.path,
          payload: translated(resolved, stored.payload),
          resources: stored.resources,
        }
      },
      entry: (stored: StoredEntry): EntryFields => {
        const resolved = read({ path: stored.effect, version: stored.version })
        return {
          effect: resolved.path,
          id: stored.id,
          payload: translated(resolved, stored.payload),
          ...(stored.not_before === undefined ? {} : { not_before: stored.not_before }),
          resources: stored.resources,
        }
      },
      reads: (path: string): boolean =>
        known.some((domain) => is_at_or_above(domain.folder, folder_of(path))),
      path: (component: unknown): string | undefined =>
        known.map((domain) => domain.path_of.get(component)).find((path) => path !== undefined),
    },
  }
}

/**
 * The facts of a log for an adapter's rebuild of its state (DOM-22: stored
 * state is migrated only through the translation, A, 17 Nov 2026): from the
 * first fact the log keeps to the end of what it had recorded when the
 * rebuild began, in order, each part at the current shape through the
 * adapter's writes, which know that shape alone; a part of a path the writes
 * do not name is another store's to write, and passes (one log may hold
 * every domain's facts, DOM-8, D64.3). When (a release that changes its
 * tables: `loans` from `due_date` to `due_day`) and how it writes are the
 * adapter's; no adapter rewrites a value by hand. A log that no longer keeps
 * its first fact, or a version no major reads, stops the rebuild.
 *
 * At wiring it stops on a path of the writes whose domain the versions do
 * not read (CFG-2). Its type is its declaration, its body typed by what it
 * meets at runtime, every payload parsed by its schema, as the command
 * ports' (DOM-25, "The ports, typed by their declaration").
 */
export function replay<const facts extends Component, write>(replay: {
  readonly versions: Versions
  readonly writes: FactWrites<facts, write>
}): (
  log: FactLog,
) => AsyncIterable<{ readonly position: position; readonly writes: readonly write[] }>
export function replay(replay: {
  readonly versions: Versions
  readonly writes: Readonly<Record<string, unknown>>
}): unknown {
  const unread = Object.keys(replay.writes).filter(
    (path) => !replay.versions[$Versions].reads(path),
  )
  if (unread.length > 0) {
    throw new Error(
      `the writes name ${unread.join(', ')}, of no domain whose majors the versions were given (DOM-22, CFG-2)`,
    )
  }
  const part = replay.versions[$Versions].part
  return async function* (
    log: FactLog,
  ): AsyncGenerator<{ readonly position: position; readonly writes: readonly unknown[] }> {
    for await (const event of log(undefined)) {
      switch (event.event) {
        case 'fact':
          yield {
            position: event.position,
            writes: event.fact.parts.flatMap((stored) => {
              const write = replay.writes[stored.path]
              if (write === undefined) return []
              return [called(`the write of ${stored.path}`, write, part(stored).payload)]
            }),
          }
          break
        case 'caught_up':
          return
        case 'position_unavailable':
          throw new Error(
            'the log keeps its first fact no longer: the state cannot be rebuilt from it (DOM-22)',
          )
      }
    }
  }
}
