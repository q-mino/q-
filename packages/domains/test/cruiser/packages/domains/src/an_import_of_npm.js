// A fixture of the cruiser's test (`../../../../the_cruiser.test.ts`): a domain importing an npm package
// that is not zod, which `domains-npm-allowlist` refuses.
import fc from 'fast-check'

export const a_package_not_allowed = fc
