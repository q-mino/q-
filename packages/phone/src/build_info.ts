// The release this page is (PWA-1, PWA-2): where its files come from, shown
// in the update prompt and in "Informazioni", and the relay its tickets
// declare. The build writes these values over this file's emission
// (`build/compose.ts`, in place of a bundler's `define`); the values here
// are a page not built, the tests'. [Q, C, 24 Nov 2026]

export interface TheBuild {
  /** `git describe`, or the tag of the release. */
  readonly version: string
  readonly commit: string
  /** When the commit was made, ISO 8601 in UTC, or 'unknown' (A, 23 Nov 2026). */
  readonly committed_at: string
  /** 'release' on q-mino, 'test' on q-mino-prova, 'dev' locally. */
  readonly channel: 'release' | 'test' | 'dev'
  /** The relay the node's tickets declare (PWA-2): the release's configuration. */
  readonly relay: string
  /** The path the app is served from, its service worker's scope. */
  readonly base: string
}

export const the_build: TheBuild = {
  version: '0.0.0',
  commit: '0000000000000000000000000000000000000000',
  committed_at: 'unknown',
  channel: 'dev',
  relay: 'https://relay.cumino.test',
  base: '/q-/',
}
