import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

// The contrast of the tokens, measured (WEB-26, the MVP's part 5): every pair
// of a text and its ground, and of a graphic a hand finds and its ground, in
// Roano and in Lavagna, by WCAG 2.2's ratio of relative luminances: AA, 4.5:1
// for a text (1.4.3), 3:1 for a graphic (1.4.11). The colours are read from
// `tokens.css` as the pages read them (`light-dark(Roano, Lavagna)`), the
// extensions' hue of the kernel's mark included (WEB-30). `--roan-line` is a
// line between parts, never what tells a component (a card has its ground
// and shadow, a field its `--roan-edge`): decorative, not measured. Run
// alone with `pnpm contrast`. [Q, C, 25 Nov 2026]

const the_tokens = readFileSync(
  join(import.meta.dirname, '..', '..', 'src', 'design', 'styles', 'tokens.css'),
  'utf8',
)

type ATheme = 'roano' | 'lavagna'

/** Every colour token, in each theme: `light-dark(a, b)`, or one colour for both. */
const the_colours: ReadonlyMap<string, Readonly<Record<ATheme, string>>> = new Map(
  [
    ...the_tokens.matchAll(
      /(--[a-z-]+):\s*(?:light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)|(#[0-9a-f]{6}))\s*;/gi,
    ),
  ].map((match) => {
    const [, name = '', light, dark, both] = match
    return [name, { roano: light ?? both ?? '', lavagna: dark ?? both ?? '' }] as const
  }),
)

const the_colour = (token: string, theme: ATheme): string => {
  const colour = the_colours.get(token)?.[theme]
  if (colour === undefined || colour === '') throw new Error(`no colour ${token} in tokens.css`)
  return colour
}

/** WCAG's relative luminance of an sRGB colour. */
const luminance = (hex: string): number => {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((at) => {
    const channel = Number.parseInt(hex.slice(at, at + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG's contrast ratio of two colours. */
const the_ratio = (one: string, other: string): number => {
  const [lighter, darker] = [luminance(one), luminance(other)].sort((a, b) => b - a)
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

const grounds = ['--paper', '--paper-raised', '--paper-sunken'] as const
const the_extension_s_grounds = ['--extension-paper', '--extension-raised'] as const

/** What is read, and where (4.5:1). */
const texts: readonly (readonly [string, readonly string[]])[] = [
  ['--ink', [...grounds, ...the_extension_s_grounds]],
  ['--ink-soft', [...grounds, ...the_extension_s_grounds]],
  ['--cumin-ink', grounds],
  ['--danger', grounds],
  ['--fault', grounds],
  ['--waiting', grounds],
  ['--focus', grounds],
  ['--on-cumin', ['--cumin']],
  ['--extension-ink', [...the_extension_s_grounds, '--paper-raised']],
  ['--qr-ink', ['--qr-paper']],
]

/** What a hand finds, and where (3:1): an edge, a fill, the focus ring, the dots of the introduction. */
const graphics: readonly (readonly [string, readonly string[]])[] = [
  ['--roan-edge', grounds],
  ['--cumin', grounds],
  ['--focus', [...grounds, ...the_extension_s_grounds]],
  ['--extension-edge', [...grounds, ...the_extension_s_grounds]],
  ['--ink-soft', grounds],
  ['--danger', grounds],
]

const pairs = (
  of: readonly (readonly [string, readonly string[]])[],
  at_least: number,
): readonly (readonly [string, string, ATheme, number])[] =>
  of.flatMap(([ink, on]) =>
    on.flatMap((ground) =>
      (['roano', 'lavagna'] as const).map((theme) => [ink, ground, theme, at_least] as const),
    ),
  )

describe('the contrast of the tokens (AA)', () => {
  test('reads both themes of every colour it measures', () => {
    for (const [ink, on] of [...texts, ...graphics])
      for (const token of [ink, ...on])
        for (const theme of ['roano', 'lavagna'] as const)
          expect(the_colour(token, theme)).toMatch(/^#[0-9a-f]{6}$/i)
  })

  test('measures as WCAG does', () => {
    expect(the_ratio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(the_ratio('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  })

  test.each(pairs(texts, 4.5))(
    'a text: %s on %s, %s, at least %d:1',
    (ink, ground, theme, at_least) => {
      expect(the_ratio(the_colour(ink, theme), the_colour(ground, theme))).toBeGreaterThanOrEqual(
        at_least,
      )
    },
  )

  test.each(pairs(graphics, 3))(
    'a graphic: %s on %s, %s, at least %d:1',
    (ink, ground, theme, at_least) => {
      expect(the_ratio(the_colour(ink, theme), the_colour(ground, theme))).toBeGreaterThanOrEqual(
        at_least,
      )
    },
  )
})
