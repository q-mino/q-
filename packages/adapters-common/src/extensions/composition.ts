import * as boundary from '@q-mino/boundary'
import type * as zz from '@q-mino/domains/library'
import * as z from 'zod'

// The composition of an extension (EXT-4 at composition, EXT-6, EXT-9,
// EXT-10, CFG-2; part 12.4): from its manifest as data (`manifest.json`,
// parsed by the boundary's `the_manifest`) and what the kernel offers (the
// window of boundary majors it speaks, the ports it offers extensions, the
// names already installed), the extension composed, with per persona the
// surface its leaves are mounted with (`zz.MountedSurface`: inputs and
// events read from JSON Schema by zod's `fromJSONSchema`), or a composition
// fault naming every fault in one message: the node does not start with it.

/** What the kernel offers its extensions (EXT-4, EXT-9): the boundary majors it speaks, the ports it offers, the names already installed. */
export interface TheKernelsOffer {
  readonly boundary_majors: readonly number[]
  readonly ports: readonly boundary.port[]
  readonly installed: readonly string[]
}

/** What this kernel offers in stage 1, beside the names installed: its boundary's major, both ports (EXT-2). */
export const the_kernels_offer = (installed: readonly string[]): TheKernelsOffer => ({
  boundary_majors: [major_of(boundary.version)],
  ports: boundary.port.options,
  installed,
})

/** An extension composed (EXT-4): its manifest as the kernel read it, and the surface it mounts on each persona where it adds leaves. */
export interface Composed {
  readonly manifest: boundary.the_manifest
  readonly surfaces: {
    readonly self?: zz.MountedSurface
    readonly known?: zz.MountedSurface
  }
}

/**
 * A fault of composition (EXT-4, CFG-2), an ADT by `fault`: the manifest
 * does not parse; built with a boundary major the kernel does not speak
 * (EXT-9); a name already installed (EXT-3); a port the kernel does not
 * offer; a leaf on `known` that does not answer in one event (F7); a leaf on
 * `known` whose input holds a refinement JSON Schema cannot tell (EXT-6); a
 * surface with no leaves at its version's major; a JSON Schema zod cannot
 * read; an action whose leaf is no leaf of `self` at its version (EXT-10); a
 * `ready` that differs from the manifest (EXT-15, when it is loaded).
 */
export type ACompositionFault =
  | { readonly fault: 'the_manifest_does_not_parse'; readonly issues: readonly string[] }
  | {
      readonly fault: 'a_boundary_major_not_spoken'
      readonly boundary_version: string
      readonly spoken: readonly number[]
    }
  | { readonly fault: 'a_name_not_unique' }
  | { readonly fault: 'a_port_not_offered'; readonly port: boundary.port }
  | {
      readonly fault: 'a_leaf_on_known_that_does_not_answer_in_one_event'
      readonly major: number
      readonly leaf: string
    }
  | {
      readonly fault: 'an_input_on_known_the_kernel_cannot_check'
      readonly major: number
      readonly leaf: string
      readonly marks: readonly string[]
    }
  | {
      readonly fault: 'a_surface_with_no_leaves_at_its_version'
      readonly persona: 'self' | 'known'
      readonly version: string
    }
  | {
      readonly fault: 'a_json_schema_not_read'
      readonly persona: 'self' | 'known'
      readonly major: number
      readonly leaf: string
      readonly schema: string
      readonly error: string
    }
  | {
      readonly fault: 'an_action_on_no_leaf_of_self'
      readonly action: string
      readonly invokes: string
    }
  | {
      readonly fault: 'a_ready_that_differs'
      readonly ready: {
        readonly name: string
        readonly version: string
        readonly boundary_version: string
      }
    }

/** A composition (CFG-2), an ADT: composed, or every fault in one message. */
export type Composition =
  | { readonly composition: 'composed'; readonly composed: Composed }
  | {
      readonly composition: 'a_fault'
      readonly name: string
      readonly faults: readonly ACompositionFault[]
      readonly message: string
    }

/** A version's major. */
const major_of = (version: string): number => Number(version.split('.')[0])

/** A fault told as a sentence, with its rule. */
const told = (fault: ACompositionFault): string => {
  switch (fault.fault) {
    case 'the_manifest_does_not_parse':
      return `its manifest does not parse: ${fault.issues.join('; ')} (EXT-10)`
    case 'a_boundary_major_not_spoken':
      return `built with the boundary ${fault.boundary_version}, a major the kernel does not speak (${fault.spoken.join(', ')}) (EXT-9, EXT-4)`
    case 'a_name_not_unique':
      return 'an extension of this name is installed already (EXT-3)'
    case 'a_port_not_offered':
      return `it touches ${fault.port}, a port the kernel does not offer extensions (EXT-4)`
    case 'a_leaf_on_known_that_does_not_answer_in_one_event':
      return `its leaf ${fault.leaf} on known, at major ${String(fault.major)}, does not answer in one event (F7, EXT-4)`
    case 'an_input_on_known_the_kernel_cannot_check':
      return `the input of its leaf ${fault.leaf} on known, at major ${String(fault.major)}, holds a shape its JSON Schema does not tell whole (a refinement, a form with no JSON word, a form its reading loses), at ${fault.marks.join(', ')} (EXT-6, EXT-4)`
    case 'a_surface_with_no_leaves_at_its_version':
      return `its surface on ${fault.persona} speaks ${fault.version}, a major with no leaves (PER-17, EXT-4)`
    case 'a_json_schema_not_read':
      return `the ${fault.schema} of its leaf ${fault.leaf} on ${fault.persona}, at major ${String(fault.major)}, is a JSON Schema the kernel cannot read: ${fault.error} (EXT-6)`
    case 'an_action_on_no_leaf_of_self':
      return `its action ${fault.action} invokes ${fault.invokes}, no leaf of self at its version (EXT-10, EXT-4)`
    case 'a_ready_that_differs':
      return `it said ready as ${fault.ready.name} ${fault.ready.version} with the boundary ${fault.ready.boundary_version}, not as its manifest (EXT-15)`
  }
}

/** Every fault of an extension, in one message (CFG-2): one line each. */
export const a_composition_fault = (
  name: string,
  faults: readonly ACompositionFault[],
): Extract<Composition, { readonly composition: 'a_fault' }> => ({
  composition: 'a_fault',
  name,
  faults,
  message: faults.map((fault) => `${name}: ${told(fault)}`).join('\n'),
})

/** Whether a value is a JSON object. */
const is_an_object = (value: boundary.Json): value is boundary.JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * The places in a JSON Schema where the export marked what JSON Schema
 * cannot tell (`json_schema_of`, DOM-21: `x-refined`, `x-unrepresentable`)
 * or what zod's reading of it loses (`x-lossy`, EXT-6), as JSON Pointers
 * (`/properties/words`).
 */
export const the_marks_in = (schema: boundary.Json, at = ''): readonly string[] => {
  if (Array.isArray(schema)) {
    return schema.flatMap((item: boundary.Json, index) =>
      the_marks_in(item, `${at}/${String(index)}`),
    )
  }
  if (!is_an_object(schema)) return []
  const here =
    Object.hasOwn(schema, 'x-refined') ||
    Object.hasOwn(schema, 'x-unrepresentable') ||
    Object.hasOwn(schema, 'x-lossy')
      ? [at === '' ? '/' : at]
      : []
  return [
    ...here,
    ...Object.entries(schema).flatMap(([key, value]) => the_marks_in(value, `${at}/${key}`)),
  ]
}

/** What zod's `fromJSONSchema` takes: a JSON Schema, an object or a boolean; it throws on one it cannot read. */
const is_a_json_schema = (value: unknown): value is z.core.JSONSchema.JSONSchema | boolean =>
  typeof value === 'boolean' ||
  (typeof value === 'object' && value !== null && !Array.isArray(value))

/** A JSON Schema read into a schema by zod (EXT-6), or why not. */
const read = (
  schema: boundary.Json,
):
  | { readonly read: 'read'; readonly schema: z.ZodType }
  | { readonly read: 'not_read'; readonly error: string } => {
  if (!is_a_json_schema(schema)) return { read: 'not_read', error: 'no JSON Schema' }
  try {
    return { read: 'read', schema: z.fromJSONSchema(schema) }
  } catch (error) {
    return { read: 'not_read', error: error instanceof Error ? error.message : String(error) }
  }
}

/** A surface of the manifest's, read into the surface its leaves are mounted with, and the faults found reading it. */
const a_mounted_surface = (
  persona: 'self' | 'known',
  surface: boundary.a_surface,
): { readonly surface: zz.MountedSurface; readonly faults: readonly ACompositionFault[] } => {
  const faults: ACompositionFault[] = []
  const majors = Object.entries(surface.majors).map(([key, leaves]) => {
    const major = Number(key)
    const read_leaves = Object.entries(leaves).map(([leaf, given]): [string, zz.MountedLeaf] => {
      const not_read = (name: string, error: string): void => {
        faults.push({ fault: 'a_json_schema_not_read', persona, major, leaf, schema: name, error })
      }
      if (persona === 'known' && !given.answers_in_one_event) {
        faults.push({ fault: 'a_leaf_on_known_that_does_not_answer_in_one_event', major, leaf })
      }
      const marks = persona === 'known' ? the_marks_in(given.input) : []
      if (marks.length > 0) {
        faults.push({ fault: 'an_input_on_known_the_kernel_cannot_check', major, leaf, marks })
      }
      const input = read(given.input)
      if (input.read === 'not_read') not_read('input', input.error)
      const events = Object.entries(given.events).flatMap(
        ([name, event]): [string, z.ZodType][] => {
          const read_event = read(event)
          if (read_event.read === 'read') return [[name, read_event.schema]]
          not_read(`event ${name}`, read_event.error)
          return []
        },
      )
      return [
        leaf,
        {
          kind: given.kind,
          input: input.read === 'read' ? input.schema : z.never(),
          events: Object.fromEntries(events),
        },
      ]
    })
    return [major, Object.fromEntries(read_leaves)] as const
  })
  const at_its_version = surface.majors[String(major_of(surface.version))] ?? {}
  if (Object.keys(at_its_version).length === 0) {
    faults.push({
      fault: 'a_surface_with_no_leaves_at_its_version',
      persona,
      version: surface.version,
    })
  }
  return {
    surface: { version: surface.version, majors: Object.fromEntries(majors) },
    faults,
  }
}

/**
 * An extension composed with what the kernel offers (EXT-4, CFG-2): its
 * manifest parsed by the boundary's schema; its boundary major one the
 * kernel speaks; its name not installed already; its ports offered; its
 * surfaces read (each JSON Schema by zod, every leaf on `known` answering in
 * one event and with no refinement in its input); its actions on leaves of
 * `self`. Composed, or every fault in one message.
 */
export const compose_an_extension =
  (offer: TheKernelsOffer) =>
  (manifest_as_data: unknown): Composition => {
    const parsed = boundary.the_manifest.safeParse(manifest_as_data)
    if (!parsed.success) {
      const named: unknown =
        typeof manifest_as_data === 'object' && manifest_as_data !== null
          ? Reflect.get(manifest_as_data, 'name')
          : undefined
      return a_composition_fault(typeof named === 'string' ? named : 'an extension', [
        {
          fault: 'the_manifest_does_not_parse',
          issues: parsed.error.issues.map(
            (issue) => `${issue.path.map(String).join('.')}: ${issue.message}`,
          ),
        },
      ])
    }
    const manifest = parsed.data
    const self = manifest.surfaces.self && a_mounted_surface('self', manifest.surfaces.self)
    const known = manifest.surfaces.known && a_mounted_surface('known', manifest.surfaces.known)
    const leaves_of_self =
      manifest.surfaces.self?.majors[String(major_of(manifest.surfaces.self.version))] ?? {}
    const faults: readonly ACompositionFault[] = [
      ...(offer.boundary_majors.includes(major_of(manifest.boundary_version))
        ? []
        : [
            {
              fault: 'a_boundary_major_not_spoken',
              boundary_version: manifest.boundary_version,
              spoken: offer.boundary_majors,
            } as const,
          ]),
      ...(offer.installed.includes(manifest.name) ? [{ fault: 'a_name_not_unique' } as const] : []),
      ...manifest.touches
        .filter((port) => !offer.ports.includes(port))
        .map((port) => ({ fault: 'a_port_not_offered', port }) as const),
      ...(self?.faults ?? []),
      ...(known?.faults ?? []),
      ...Object.entries(manifest.actions)
        .filter(([, action]) => !Object.hasOwn(leaves_of_self, action.invokes))
        .map(
          ([action, { invokes }]) =>
            ({ fault: 'an_action_on_no_leaf_of_self', action, invokes }) as const,
        ),
    ]
    if (faults.length > 0) return a_composition_fault(manifest.name, faults)
    return {
      composition: 'composed',
      composed: {
        manifest,
        surfaces: {
          ...(self === undefined ? {} : { self: self.surface }),
          ...(known === undefined ? {} : { known: known.surface }),
        },
      },
    }
  }
