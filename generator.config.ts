import type { Configuration } from './packages/generator/src/index.ts'
import { sight } from './packages/domains/test/shed/sight.ts'

// The trees the generator writes (DOM-25): `pnpm generate`, `pnpm generate:check`.

export default {
  trees: [
    {
      // Shed, the test domains: its generated files import the wished library
      // until the library is whole (step 7); its registries are not compared
      // with main's, since it changes as design, not as releases.
      root: 'packages/domains/test/shed',
      sight,
      library: '../../src/library/index.ts',
      compared_with_main: false,
      // Held for A (DOM-25, "Held for A"): what a reaction's scope and a past
      // major's scope see, kept as written until A decides; the generator
      // would give them more (docs/architecture.md, DOM-25).
      held: [
        'business/tools/_scope_reaction.ts',
        'business/loans/_scope_reaction.ts',
        'business/loans/1/_scope_fact.ts',
        'business/loans/1/_scope_effect.ts',
        'persona/member/1/_scope_usecase.ts',
      ],
    },
  ],
} satisfies Configuration
