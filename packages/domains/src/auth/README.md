# Auth: `auth`

Auth's office of the kernel (PER-9, GR-4): the register of whom the node knows, at which of its mailboxes, and what it offers them. It answers with data, never decisions: the comparisons are the personas' nodes' and the kernel's. It sees no other domain (`sight.ts`: `auth: {}`): its data is its adapters', over the read use cases of `bonds` and `extensions`, in its own language (GR-4: never the address book's words nor the office's). Its rules are PER-9 and GR-4 of [`architecture.md`](../../../../docs/architecture.md), with PER-4, PER-7, PER-8, PER-11, PER-13, EXT-6 and F2; its words in the [glossary](../../../../docs/glossary.md) (the acquaintances, a face at my mailbox, the bond of a face, the ticket a face presents).

- [`acquaintances/`](acquaintances/), the office (`conoscenze`, part 13.1): its own identities (`bond_id`, `face_id`, the same keys as the address book's, linked by the adapter) and values (the formats of the address book, the post and the office of the extensions, declared again); its key, **a face at my mailbox**, the key that signed a letter and the mailbox of mine it came to, both verified by `post` (F2, PER-13); three lookups, each one key and one value or "not known": `the_bond_of_a_face_at_my_mailbox` (read by the node of `known`), `the_ticket_a_face_presents_at_my_mailbox` (by the node of `unknown`), `the_extensions_offered_to_the_bond_of_a_key` (by the kernel's entry, before the gate, EXT-6).

## Stories to prove

Each story is the test named after it, in `packages/memory/test/auth/acquaintances.test.ts` (part 13.3), on q-'s oracle: a phone's cell with the address book's state and the office of the extensions', as their stories make them (MBX-7), the lookups over the adapters of part 13.2, entered with the key as the kernel's entry gives it.

The names, as the address book's stories give them: Anna's phone, her face F_a "Anna"; her bond L_b with Bruno, his key K_b, his mailbox D_b, hers for him D_mb; her bond L_c with Carla, K_c, D_c, hers for her D_mc. Her ticket L_d, ready at D_md, sent to Dario in a link; Dario's key K_d, a face her phone never saw. Greetings preinstalled, as the office's stories have it.

1. **The bond of a face** (`the bond of a face at my mailbox is the bond kept there with that face`). K_b at D_mb: L_b, F_a, K_b, "Bruno"; renamed "Bru", the name follows. K_c at D_mc: L_c, F_a, K_c, "Carla".
2. **A known key outside its bond** (`a face at a mailbox of another bond is not known`). K_b at D_mc, the mailbox of Anna's bond with Carla: not known; K_b at D_b, his own mailbox, not hers: not known; K_c at D_mc once Anna removed L_c: not known.
3. **The ticket a face presents** (`a ready ticket of mine is what any face presents at its mailbox`). K_d at D_md: L_d, F_a, K_d (the key the lookup was asked with). Once L_d expired: not known. K_d at D_mb, a mailbox of a bond kept with another face: not known.
4. **The crossed QR** (`a bond kept with that face is what it presents at its mailbox`). Anna opened Bruno's ticket presenting L_b's: K_b at D_mb gives L_b, F_a, K_b, for his introduction to complete it; K_c at D_mb: not known. Once Dario's introduction made L_d, K_d at D_md gives L_d, and K_e, another face, not known: a ticket is used once.
5. **The extensions offered** (`the extensions offered to the bond of a key: a list, empty, or not known`). Greetings active: K_b at D_mb gives greetings at major 1. Anna withdraws its offer from L_b: an empty list; greetings deactivated: an empty list. K_b at D_mc, or K_d at D_md (a ticket, no bond): not known, so the routing stays silent (F8).
6. **Data, never decisions** (`the acquaintances answer with data`). Every answer is the value its schema declares or "not known", with no reason and no list: why a key is not known (no bond, another face, removed) is the trace's, told by the node or the entry that reads it (F6, PER-14).

## Open

- The adapters over the read use cases of `bonds` (`the_bond_at_my_mailbox`, `the_ticket_at_my_mailbox`) and of `extensions` (`the_extensions_offered_to_a_bond`), in the kernel's composition (part 13.2): they link auth's ids to the address book's and select by the face as well as by the mailbox.
- The face of mine a bond belongs to, read by `known`'s leaves and the extensions as the face that answers: one in stage 1; the active face on `self` with stage 2 (PER-3).
