// `node scripts/icons.mjs`: draws the app's icons from Cumino's logo
// (`packages/phone/assets/logo.svg`, strokes on a grid of 24) into
// `packages/phone/public/`: `favicon.svg`, and, photographed by headless
// Chrome, `icon-192.png`, `icon-512.png` (the logo on a rounded slate,
// transparent corners) and `icon-maskable-512.png` (the slate to the edges,
// the logo inside the safe circle of a maskable icon, 40% of the side as its
// radius, so that no launcher's mask cuts it). The colours are Lavagna's:
// the slate of `--paper` and the chalk of `--ink` in the dark theme, the
// drawing's own (chalk on a blackboard). No dependencies; run it again when
// the logo changes, and commit what it writes. [Q, C, 25 Nov 2026]
//
// Usage: node scripts/icons.mjs [--chrome <path>]

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import console from 'node:console'
import process from 'node:process'

const the_phone = join(import.meta.dirname, '..', 'packages', 'phone')
const the_public = join(the_phone, 'public')
const flag = process.argv.indexOf('--chrome')
const chrome = flag > 0 ? process.argv[flag + 1] : (process.env.CHROME ?? '/usr/bin/google-chrome')

const slate = '#1b2023'
const chalk = '#ebe9e3'

/** The logo's strokes, without its `<svg>` and its comment. */
const the_strokes = readFileSync(join(the_phone, 'assets', 'logo.svg'), 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>[\s\S]*$/, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .trim()

/**
 * An icon on a grid of 24: the slate (rounded, or to the edges) and the
 * logo scaled to `size` units, in the middle.
 */
const an_icon = (props) => {
  const offset = (24 - props.size) / 2
  const scale = props.size / 24
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"${props.pixels === undefined ? '' : ` width="${String(props.pixels)}" height="${String(props.pixels)}"`}>`,
    `<rect width="24" height="24" rx="${String(props.radius)}" fill="${slate}"/>`,
    `<g transform="translate(${String(offset)} ${String(offset)}) scale(${String(scale)})" fill="none" stroke="${chalk}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`,
    the_strokes,
    '</g>',
    '</svg>',
    '',
  ].join('\n')
}

/** The rounded icon: the logo at three quarters of the side. */
const rounded = (pixels) => an_icon({ size: 18, radius: 5.25, pixels })
/** The maskable icon: the logo inside the safe circle (a square of 0.8 × √½ of the side fits it). */
const maskable = (pixels) => an_icon({ size: 14, radius: 0, pixels })

writeFileSync(join(the_public, 'favicon.svg'), rounded(undefined))

const where = mkdtempSync(join(tmpdir(), 'q-icons-'))
try {
  for (const [name, svg, pixels] of [
    ['icon-192.png', rounded(192), 192],
    ['icon-512.png', rounded(512), 512],
    ['icon-maskable-512.png', maskable(512), 512],
  ]) {
    const page = join(where, `${name}.html`)
    writeFileSync(
      page,
      `<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`,
    )
    execFileSync(
      chrome,
      [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--default-background-color=00000000',
        `--window-size=${String(pixels)},${String(pixels)}`,
        `--screenshot=${join(the_public, name)}`,
        `file://${page}`,
      ],
      { stdio: 'ignore', timeout: 60_000 },
    )
    console.log(`ok   ${join(the_public, name)}`)
  }
} finally {
  rmSync(where, { recursive: true, force: true })
}
console.log(`ok   ${join(the_public, 'favicon.svg')}`)
