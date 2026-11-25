// The build this relay is (REL-4, REL-5): its version, its commit, and the
// repository its source is in, which `GET /` tells (AGPL § 13). The build
// writes these values over this module in the bundle (`build/bundle.ts`), as
// the phone's build writes its own (`phone/src/build_info.ts`); the values
// here are a relay not built: the tests', and `node src/main.ts`'s.
// [Q, C, 25 Nov 2026]

export interface TheBuild {
  /** `git describe`, or the tag of the release. */
  readonly version: string
  readonly commit: string
  /** The repository whose commit the relay was built from. */
  readonly repository: string
}

export const the_build: TheBuild = {
  version: '0.0.0',
  commit: '0000000000000000000000000000000000000000',
  repository: 'https://github.com/q-mino/q-',
}

/** What `GET /` says (REL-4): the version, the commit, and the source of that commit. */
export const about = (build: TheBuild) => ({
  version: build.version,
  commit: build.commit,
  source: `${build.repository}/tree/${build.commit}`,
})
