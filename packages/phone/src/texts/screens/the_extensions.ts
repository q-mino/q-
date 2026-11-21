import type { TheExtensionsTexts } from '@q-mino/adapters-web/screens'

// The extensions installed (provisional, A to confirm).

export const the_extensions = {
  title: 'Estensioni',
  none: 'Nessuna estensione installata.',
  the_version: (version) => `versione ${version}`,
  is: {
    active: 'accesa',
    not_active: 'spenta',
    waiting_for_the_new_manifest: 'aspetta che accetti il nuovo manifesto',
  },
} satisfies TheExtensionsTexts
