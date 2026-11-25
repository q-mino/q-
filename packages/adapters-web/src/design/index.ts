// The components of Cumino's look (WEB-26, WEB-27), the start of its design
// system: semantic HTML, one static class each, its parts by `data-part`,
// its variant by `data-kind`, its case by `data-state`; their look in
// `styles/`, which the pages link. Imported by the screens and the gallery
// (`@q-mino/adapters-web/design`). [Q, C, 24 Nov 2026]
export { Card } from './card.tsx'
export { Corner } from './corner.tsx'
export { Field, type WhatAFieldHolds, type WhatAFieldTells } from './field.tsx'
export { Flaw } from './flaw.tsx'
export { Gesture, type AGestureKind, type WhatAGestureDoes } from './gesture.tsx'
export { the_glyphs, type AGlyph } from './glyphs.ts'
export { Icon } from './icon.tsx'
export { List, Row } from './list.tsx'
export { Mark } from './mark.tsx'
export { Menu } from './menu.tsx'
export { Notice, type ANoticeKind } from './notice.tsx'
export { Qr } from './qr.tsx'
export { Question, QuestionsHoldThePage, type AQuestionKind } from './question.tsx'
export { Screen } from './screen.tsx'
export { Slot, SlotsTakeTheScreen, type TheWordsOfASlot, type WhereASlotIs } from './slot.tsx'
export { Strip } from './strip.tsx'
export { Viewfinder } from './viewfinder.tsx'
export { Why } from './why.tsx'
