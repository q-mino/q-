// The build this assistant is (AST-14): its version, its commit, the
// repository its source is in, told in its journal's first line. The build
// writes these values over this module in the bundle (`build/bundle.ts`), as
// the relay's; the values here are an assistant not built: the tests', and
// `node src/main.ts`'s, which reads its commit from git. [Q, C, 28 Nov 2026]

export interface TheBuild {
  readonly version: string
  readonly commit: string
  readonly repository: string
}

export const the_build: TheBuild = {
  version: '0.0.0',
  commit: '0000000000000000000000000000000000000000',
  repository: 'https://github.com/q-mino/q-',
}
