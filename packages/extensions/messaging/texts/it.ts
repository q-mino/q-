import type * as boundary from '@q-mino/boundary'
import type { manifest } from '../manifest.ts'
import type { registry } from '../persona/self/_registry.ts'

// Messaging's words in Italian (EXT-16, WEB-22; MSG-10; part M2), the texts
// the kernel draws for it: its name and the labels of its slots, typed by its
// declaration and the registry of `self`, so that a word missing does not
// compile. No action, so no words of events: the part tells its messages
// in its own words (part M5). Provisional [Q, C, provisional: A to
// confirm]. Its build writes it as data, `texts/it.json`
// (`pnpm --filter @q-mino/messaging words`), the one form the kernel reads.

export const words = {
  name: 'Messaggi',
  actions: {},
  // The slot on a row of her contacts (MSG-15, part M4): the same part, the same word.
  slots: { the_chat: 'Chat', the_chat_in_my_contacts: 'Chat' },
  pages: {},
  events: {},
} satisfies boundary.Words<typeof manifest, typeof registry>
