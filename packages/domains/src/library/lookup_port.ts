import type * as z from 'zod'
import { $Lookup } from './lookup.ts'
import type { Answer, Lookup, LookupAdapter, LookupPort, Lookups } from './lookup.ts'
import type { Registry } from './registry.ts'
import { called, is_a_record, paths_in, serving } from './runtime.ts'

// The ports of a set of lookups (PER-9, D30, D43), which the library builds
// over an adapter, as the use case ports over the state adapter: one key in,
// parsed by the lookup's key; one value out or "not known", the value parsed
// by the lookup's value. A node runs them (PER-6). Since part 6.1, moved from
// 6.2: the keeper's node looks up the hats of who asks (SC-23).

/** What the ports are built from, at runtime. */
interface RuntimeLookupPorts {
  readonly registry: Registry
  readonly lookups: Readonly<Record<string, Lookup<z.ZodType, z.ZodType>>>
}

/** A lookup port at runtime: a key in, its answer out, the value parsed. */
type RuntimeLookupPort = (key: unknown) => Promise<Answer<unknown>>

/**
 * The ports of a set of lookups over an adapter, with the registry where the
 * library finds their paths. Curried as `command_use_case_ports`. At wiring
 * (CFG-2) it stops, naming every fault in one message, on a lookup not in
 * the registry and on one the adapter does not give. A key its lookup does
 * not parse is a fault of whoever asks, thrown (a node's key is typed as
 * parsed); a value the adapter gives that the lookup does not parse, or an
 * answer neither known nor not known, a fault of the adapter, thrown.
 */
export function lookup_ports<const lookups extends Lookups>(ports: {
  readonly registry: Registry
  readonly lookups: lookups
}): (adapter: LookupAdapter<lookups>) => {
  readonly [name in keyof lookups]: LookupPort<lookups[name]>
}

// The body, typed by what it meets at runtime (DOM-25, "The ports, typed by
// their declaration").
export function lookup_ports(ports: RuntimeLookupPorts): unknown {
  return runtime_lookup_ports(ports)
}

const runtime_lookup_ports = (
  ports: RuntimeLookupPorts,
): ((
  adapter: Readonly<Record<string, unknown>>,
) => Readonly<Record<string, RuntimeLookupPort>>) => {
  const path_of = paths_in(ports.registry)
  const lookups = Object.entries(ports.lookups).map(([name, lookup]) => ({
    name,
    lookup,
    path: path_of(lookup),
  }))
  const unknown_paths = lookups.flatMap((each) =>
    each.path === undefined
      ? [`the lookup ${each.name} is not in the registry given (DOM-24)`]
      : [],
  )
  if (unknown_paths.length > 0) throw new Error(unknown_paths.join('\n'))

  return (adapter) => {
    const missing = lookups.flatMap((each) =>
      typeof adapter[each.name] === 'function'
        ? []
        : [`the adapter gives no lookup ${each.path ?? each.name} (CFG-2)`],
    )
    if (missing.length > 0) throw new Error(missing.join('\n'))
    return Object.fromEntries(
      lookups.map(({ name, lookup, path }): readonly [string, RuntimeLookupPort] => {
        const where = path ?? name
        const { key, value } = lookup[$Lookup]
        const ask = adapter[name]
        const port = async (sent: unknown): Promise<Answer<unknown>> => {
          const parsed = key.safeParse(sent)
          if (!parsed.success) {
            throw new Error(`${where}: a key its lookup does not parse, a fault of whoever asks`)
          }
          const answer: unknown = await called(ask, parsed.data)
          if (is_a_record(answer) && answer['answer'] === 'not_known') {
            return { answer: 'not_known' }
          }
          if (!is_a_record(answer) || answer['answer'] !== 'known') {
            throw new Error(`${where}: the adapter answers neither known nor not known (D30)`)
          }
          const found = value.safeParse(answer['value'])
          if (!found.success) {
            throw new Error(`${where}: the adapter gives a value the lookup does not parse`)
          }
          return { answer: 'known', value: found.data }
        }
        return [name, serving(port, { component: lookup, path: where })]
      }),
    )
  }
}
