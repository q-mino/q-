// The page of a stand (INV-7), drawn on the relay for each request, with no
// script: what the assistant is, what leaves the network, when it answers,
// the steps, and a form of one button (`GET`); the link taken, as a link and
// as its QR (`POST`); the stand empty; or no inviter yet. Its elements are
// built as data (`hono/jsx`'s `jsx`, which escapes every text and attribute),
// the QR's modules drawn as SVG elements, never markup as a string (INV-7);
// only the doctype is written as it is. Its words are `../texts/it.ts`'s.
// [Q, C, 27 Nov 2026]

import { jsx, type Child } from 'hono/jsx'
import { the_path_of, the_qr_of, type Modules } from '@q-mino/adapters-common'
import type { AStandsPage } from '@q-mino/adapters-node'
import { words } from '../texts/index.ts'

/** An element, its attributes and its children. */
const h = (
  tag: string,
  attributes: Readonly<Record<string, string>> | null,
  ...children: Child[]
) => jsx(tag, attributes === null ? null : { ...attributes }, ...children)

/** The page's look: readable at a phone's width, dark on light, the QR on white whatever the theme. */
const the_style = `
  :root { color-scheme: light dark; --ink: #1d1b16; --paper: #fbf8f1; --soft: #6a6255; --accent: #8a4b14; }
  @media (prefers-color-scheme: dark) { :root { --ink: #f1ece2; --paper: #1b1914; --soft: #b5ab9a; --accent: #e8a35f; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 1.05rem/1.55 system-ui, sans-serif; }
  main { max-width: 36rem; margin: 0 auto; padding: 24px 16px 48px; }
  h1 { font-size: 1.6rem; line-height: 1.25; margin: 0 0 12px; }
  h2 { font-size: 1.15rem; margin: 28px 0 8px; }
  ul, ol { padding-left: 1.3rem; }
  li { margin: 6px 0; }
  a { color: var(--accent); }
  .note { color: var(--soft); font-size: 0.95rem; }
  form { margin: 24px 0 8px; }
  button, .open { display: inline-block; font: inherit; font-weight: 600; padding: 12px 22px; border-radius: 10px; border: 0; background: var(--accent); color: var(--paper); text-decoration: none; cursor: pointer; }
  .qr { width: min(18rem, 100%); margin: 20px 0; background: #fff; padding: 8px; border-radius: 8px; }
  .qr svg { display: block; width: 100%; height: auto; }
  .link { word-break: break-all; font-size: 0.85rem; color: var(--soft); }
`

/** A QR's modules as SVG elements, a module a unit: a light square, the dark runs in one path's data. */
const the_svg_of = (modules: Modules) => {
  const size = String(modules.length)
  return h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${size} ${size}`,
      'shape-rendering': 'crispEdges',
      role: 'img',
      'aria-label': words.the_qr,
    },
    h('rect', { width: size, height: size, fill: '#fff' }),
    h('path', { fill: '#000', d: the_path_of(modules) }),
  )
}

/** What the assistant is, and what to know before writing to it (INV-7, INV-9). */
const what_it_is = (): Child[] => [
  h('p', null, words.what_it_is),
  h('h2', null, words.before_writing),
  h(
    'ul',
    null,
    h(
      'li',
      null,
      words.it_leaves_the_network.before,
      h('strong', null, words.it_leaves_the_network.marked),
      words.it_leaves_the_network.after,
    ),
    h('li', null, words.the_notes),
    h('li', null, words.when_it_answers),
    h('li', null, words.what_it_answers),
  ),
]

/** The steps, the first with the app's link (INV-7). */
const the_steps = (app: string): Child =>
  h(
    'ol',
    null,
    h('li', null, h('a', { href: app }, words.install_cumino)),
    h('li', null, words.make_your_face),
    h('li', null, words.turn_on_messaging),
    h('li', null, words.take_the_link),
  )

/** The form of one button, which takes a link (`POST`, INV-3). */
const the_form = (name: string): Child =>
  h(
    'form',
    { method: 'post', action: `/${name}` },
    h('button', { type: 'submit' }, words.the_button),
  )

/** The link taken, as a link and as its QR. */
const the_link = (link: string): Child[] => {
  const qr = the_qr_of(link)
  return [
    h('h2', null, words.here_is_your_link),
    h('p', null, h('a', { class: 'open', href: link }, words.open_in_cumino)),
    qr.drawn === 'a_qr'
      ? h('div', { class: 'qr' }, the_svg_of(qr.modules))
      : h('p', { class: 'note' }, words.the_qr_too_long),
    h('p', null, words.use_it_soon),
    h('p', { class: 'link' }, link),
  ]
}

/** What the page shows, by its case. */
const the_body_of = (page: AStandsPage): Child[] => {
  switch (page.page) {
    case 'the_stand':
      return [
        ...what_it_is(),
        h('h2', null, words.how_to_add_it),
        the_steps(page.stand.app),
        the_form(page.stand.name),
        h('p', { class: 'note' }, words.one_link_one_person),
      ]
    case 'no_inviter_yet':
      return [...what_it_is(), h('p', null, h('strong', null, words.not_there_yet))]
    case 'a_link_taken':
      return [
        ...the_link(page.link),
        h('p', null, h('a', { href: `/${page.stand.name}` }, words.back)),
      ]
    case 'the_stand_is_empty':
      return [
        h('p', null, h('strong', null, words.no_links_now)),
        h('p', null, h('a', { href: `/${page.stand.name}` }, words.back)),
      ]
  }
}

/** The doctype, the one piece written as it is: no element says it. */
const the_doctype = '<!doctype html>'

/** A stand's page, a whole HTML document (INV-7): the relay's `DrawAStandsPage`. */
export const the_page_of_a_stand = (page: AStandsPage): string => {
  const document = h(
    'html',
    { lang: 'it' },
    h(
      'head',
      null,
      h('meta', { charset: 'utf-8' }),
      h('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      h('meta', { name: 'robots', content: 'noindex' }),
      h('title', null, words.title),
      h('style', null, the_style),
    ),
    h(
      'body',
      null,
      h('main', { 'data-state': page.page }, h('h1', null, words.title), ...the_body_of(page)),
    ),
  )
  return `${the_doctype}${String(document)}`
}
