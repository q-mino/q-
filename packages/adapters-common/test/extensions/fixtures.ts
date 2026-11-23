import * as boundary from '@q-mino/boundary'
import * as zz from '@q-mino/domains/library'
import * as z from 'zod'

// A made-up extension for the kernel's side (part 12.4): `waves`, a leaf on
// `known` that waves back to a bond and a leaf on `self` that waves, its
// manifest as data made with the boundary's functions from zod schemas, as
// an extension's build makes it (EXT-10). No extension package: the tests
// of `adapters-common` import none (GR-10).

/** What a peer asks `wave` on `known`. */
export const wave_input = z.strictObject({ to: z.string().min(1).max(40) })

/** `wave`'s one event. */
export const waved = z.strictObject({
  event: z.literal('waved'),
  payload: z.strictObject({ to: z.string() }),
})

/** A leaf of a surface, from zod schemas, as `zz.the_surface_of` gives it. */
export const a_leaf = (
  input: z.ZodType,
  events: Readonly<Record<string, z.ZodType>>,
  more: { readonly kind?: 'command' | 'read'; readonly answers_in_one_event?: boolean } = {},
) => ({
  kind: more.kind ?? 'command',
  input: zz.json_schema_of(input),
  events: Object.fromEntries(
    Object.entries(events).map(([name, event]) => [name, zz.json_schema_of(event)]),
  ),
  answers_in_one_event: more.answers_in_one_event ?? true,
})

/** The manifest of `waves` as data, its parts given where a test changes them. */
export const the_manifest_of_waves = (
  changed: {
    readonly name?: string
    readonly touches?: readonly boundary.port[]
    readonly sees?: readonly boundary.seen_on_known[]
    readonly known?: z.input<typeof boundary.a_surface>
    readonly self?: z.input<typeof boundary.a_surface>
    readonly actions?: Readonly<
      Record<string, { readonly on: boundary.place; readonly invokes: string }>
    >
  } = {},
): boundary.the_manifest =>
  boundary.the_manifest_as_data({
    declaration: {
      name: changed.name ?? 'waves',
      touches: changed.touches ?? ['the_port_of_requests', 'its_storage'],
      sees: { known: changed.sees ?? [] },
      actions: changed.actions ?? { wave: { on: 'a_bond', invokes: 'usecase/wave_to_a_bond' } },
    },
    version: '1.0.0',
    surfaces: {
      known:
        changed.known ??
        boundary.below_the_kernels_node('known')({
          version: '1.0.0',
          majors: { 1: { 'usecase/wave': a_leaf(wave_input, { waved }) } },
        }),
      self:
        changed.self ??
        boundary.below_the_kernels_node('self')({
          version: '1.0.0',
          majors: {
            1: {
              'usecase/wave_to_a_bond': a_leaf(z.strictObject({ bond: z.string().min(1) }), {
                the_wave_is_sent: z.strictObject({
                  event: z.literal('the_wave_is_sent'),
                  payload: z.strictObject({}),
                }),
              }),
            },
          },
        }),
    },
  })
