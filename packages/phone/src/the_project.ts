// What the app knows of the project that publishes it (REL-8): where its code
// is (AGPL § 13: "Informazioni" links the commit), the project's relay, which
// the test and the release channels declare, and that relay's public
// configuration at a commit (`docs/relay.md`, REL-7), which screen 1c points
// to. Not in `build_info.ts`, whose emission the build writes over.
// [Q, C, 25 Nov 2026]

/** The repository of Cumino's code. */
export const the_repository = 'https://github.com/q-mino/q-'

/** The project's relay (REL-7): the one of the test and the release channels (REL-8). */
export const the_project_s_relay = 'https://relay.cumino.aleclofabbro.it'

/** The project's relay's public configuration, as the code at `commit` declares it. */
export const the_public_configuration_at = (commit: string): string =>
  `${the_repository}/blob/${commit}/docs/relay.md`
