import type { PartFields, StoredPart } from './envelope.ts'
import { $Version } from './version.ts'
import {
  $Versions,
  type Majors,
  type Registry,
  type StoredVersions,
  type Versions,
} from './registry.ts'
import { is_a_schema } from './kind.ts'

// The versions of a store (DOM-22, A, 17 Nov 2026): the one place where a
// stored part of a fact becomes a parsed one, by its path and its version.
// Part 4.1 reads the current majors; part 4.4 gives the past majors their
// translation (`earlier`, `delegate`) and the checks at wiring.

/**
 * The versions of a store, composed once by the configurator from the
 * majors of every domain whose data it keeps (`versions([loans, tools])`),
 * and given to every builder that reads stored data (A, 17 Nov 2026). A part
 * written at the current major, at its minor or a lower one, parses with the
 * current schema of its path (a minor leaves every shape it wrote parsable,
 * DOM-22); any other version stops the reader, which retries: a 2.1.0
 * written by a newer instance during a rolling release, read at 2.0.0, is
 * never guessed.
 */
export type VersionsBuilder = (
  majors: readonly Majors[],
) => (store: { readonly stored: StoredVersions }) => Promise<Versions>

/** The major and the minor of a version. */
const major_and_minor = (version: string): readonly [number, number] => {
  const [major, minor] = version.split('.').map(Number)
  return [major ?? Number.NaN, minor ?? Number.NaN]
}

/** The version a registry declares (`version.ts`): the current major's; none for a past major's. */
const declared_version = (registry: Registry): string | undefined =>
  Object.values(registry).flatMap((entry) =>
    typeof entry === 'object' && $Version in entry ? [entry[$Version]] : [],
  )[0]

/** A part as stored, at the current shape of its path, or the reader stops. */
const part_at_the_current_shape =
  (majors: readonly Majors[]) =>
  (stored: StoredPart): PartFields => {
    const registries = majors
      .map((domain) => Object.values(domain))
      .find((domain) => domain.some((registry) => stored.path in registry))
    const current = registries?.find((registry) => declared_version(registry) !== undefined)
    const version = current === undefined ? undefined : declared_version(current)
    if (current === undefined || version === undefined) {
      throw new Error(
        `${stored.path} is of no domain whose majors the store was given: the reader stops (DOM-22)`,
      )
    }
    const [major, minor] = major_and_minor(version)
    const [stored_major, stored_minor] = major_and_minor(stored.version)
    const schema = current[stored.path]
    if (stored_major !== major || stored_minor > minor || !is_a_schema(schema)) {
      throw new Error(
        `${stored.path} at ${stored.version} is not known at ${version}: the reader stops, and retries (DOM-22)`,
      )
    }
    return { path: stored.path, payload: schema.parse(stored.payload), resources: stored.resources }
  }

export const versions: VersionsBuilder = (majors) => () =>
  Promise.resolve({ [$Versions]: { part: part_at_the_current_shape(majors) } })
