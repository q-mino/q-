import type * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import * as activations_value from '@q-mino/domains/extensions/activations/_value.ts'

// The kernel's adapter over its office of the extensions (EXT-7, GR-3,
// GR-10; part 12.4): `domains` never imports `boundary`, so the kernel's
// adapters translate. The manifest the composition read (`boundary`'s, the
// data form) into the manifest as the office keeps it and the user accepts
// it; and what the kernel's routing, its port of requests and its hosting
// read of the office (`is_active`, `is_offered`, the lists `route` takes),
// as functions over the office's read ports, which the configurator gives:
// the oracle's on `memory`, the phone's from step 22.

/**
 * A composed extension's manifest in the office's words (EXT-7, EXT-10): its
 * name and version, what it sees on `known` and touches, its extension
 * points (each action, slot and page by name, in its place), its leaves on
 * `known` at any major, by path, and the majors of its surfaces on each
 * persona. Parsed by the office's schema, so that a manifest the office
 * cannot keep fails here, at composition, never at the user's gesture.
 */
export const the_manifest_to_accept = (
  manifest: boundary.the_manifest,
): activations_value.manifest =>
  activations_value.manifest.parse({
    name: manifest.name,
    version: manifest.version,
    sees: { known: [...manifest.sees.known] },
    touches: [...manifest.touches],
    extension_points: [
      ...Object.entries(manifest.actions).map(([name, action]) => ({
        point: 'action',
        name,
        place: action.on,
      })),
      ...Object.entries(manifest.slots).map(([name, slot]) => ({
        point: 'slot',
        name,
        place: slot.on,
      })),
      ...Object.entries(manifest.pages).map(([name, page]) => ({
        point: 'page',
        name,
        place: page.on,
      })),
    ],
    leaves_on_known: [
      ...new Set(
        Object.values(manifest.surfaces.known?.majors ?? {}).flatMap((leaves) =>
          Object.keys(leaves),
        ),
      ),
    ],
    majors: {
      self: Object.keys(manifest.surfaces.self?.majors ?? {}).map(Number),
      known: Object.keys(manifest.surfaces.known?.majors ?? {}).map(Number),
    },
  })

/** A read's events as the kernel reads them: its snapshot's entries, or a refusal of its input. */
type ARead<entry> = AsyncIterable<
  | { readonly event: 'snapshot'; readonly entries: readonly entry[] }
  | { readonly event: 'invalid_request' }
>

/**
 * The office's reads the kernel needs (EXT-6, EXT-7), as its read ports give
 * them: an installed extension with whether it is active; the extensions
 * offered to a bond, by name.
 */
export interface TheOfficesReads {
  readonly an_extension: (
    context: zz.RootContext,
    input: { readonly name: string },
  ) => ARead<{ readonly state: activations_value.extension_state }>
  readonly the_extensions_offered_to_a_bond: (
    context: zz.RootContext,
    input: { readonly bond: string },
  ) => ARead<{ readonly name: string }>
}

/** The entries of a read's snapshot, its first event; none for a refused input (a name or a bond out of the office's form). */
const the_entries_of = async <entry>(events: ARead<entry>): Promise<readonly entry[]> => {
  for await (const event of events) return event.event === 'snapshot' ? event.entries : []
  return []
}

/** What the kernel reads of its office of the extensions, by the names its routing, its port of requests and its hosting take. */
export interface TheKernelsReads {
  /** The extension is active (EXT-7): installed, activated, its manifest asking no more than the one accepted. */
  readonly is_active: (extension: string) => Promise<boolean>
  /** The extension is offered to the bond (EXT-7): active, its offer not withdrawn from the bond. */
  readonly is_offered: (extension: string, bond: boundary.bond) => Promise<boolean>
  /** Those of these extensions that are active: `route`'s `active`, from the names installed. */
  readonly the_active_among: (installed: readonly string[]) => Promise<readonly string[]>
  /** The extensions offered to the bond, by name: `route`'s `offered_to_the_bond_of_the_caller`, what auth's lookup tells (PER-9, step 13). */
  readonly the_extensions_offered_to: (bond: boundary.bond) => Promise<readonly string[]>
}

/**
 * The kernel's reads of its office (EXT-6, EXT-7), over the office's read
 * ports and the node's clock: each read at the instant it is asked, so that
 * a deactivation or a withdrawal holds from the next request, the next
 * call, the next load.
 */
export const the_kernels_reads = (wiring: {
  readonly clock: zz.Clock
  readonly office: TheOfficesReads
}): TheKernelsReads => {
  const now = (): zz.RootContext => ({
    now: zz.in_zone(wiring.clock.time_zone)(wiring.clock.now()),
    time_zone: wiring.clock.time_zone,
  })
  const is_active = async (extension: string): Promise<boolean> =>
    (await the_entries_of(wiring.office.an_extension(now(), { name: extension })))[0]?.state.is ===
    'active'
  const the_extensions_offered_to = async (bond: boundary.bond): Promise<readonly string[]> =>
    (await the_entries_of(wiring.office.the_extensions_offered_to_a_bond(now(), { bond }))).map(
      (offered) => offered.name,
    )
  return {
    is_active,
    is_offered: async (extension, bond) =>
      (await the_extensions_offered_to(bond)).includes(extension),
    the_active_among: async (installed) => {
      const active = await Promise.all(installed.map(is_active))
      return installed.filter((_, at) => active[at] === true)
    },
    the_extensions_offered_to,
  }
}
