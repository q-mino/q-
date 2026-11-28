// Where the system prompt is (AST-10): `the_system_prompt.md` beside this
// module, in the sources; beside the bundle, which the build copies it to
// (`build/bundle.ts`). Its URL is this module's own, so both hold.
// [Q, C, 28 Nov 2026]

import { fileURLToPath } from 'node:url'

/** The system prompt's file. */
export const the_system_prompt_file = (): string =>
  fileURLToPath(new URL('./the_system_prompt.md', import.meta.url))
