# Development plan

How the prototype gets built: stage 1 in steps, stages 2 and 3 in outline. Each step is one Claude session in this repository, on its own branch, through a pull request that Alessandro reviews and merges. The rules cited by id are in [`architecture.md`](architecture.md); the words in [`glossary.md`](glossary.md).

Written on 6 Nov 2026, after the derived architecture document (PR #4). Points that document left to the plan are closed there as rules marked `[Q, plan]`: DOM-9, DOM-11, DOM-23, GR-7, GR-9, PER-4, PER-21, TST-9, and the adapters of § 6.

## How a step works

- **Order by layer** (Alessandro's principle of development): first the pure domains, from the bottom of the graph, with the library growing by need (LIB-3); then the adapters; then the configurators. A step does not start before the steps it depends on are merged.
- **Branch**: `step/<nn>-<name>` (e.g. `step/01-nucleus-commands`), one pull request per step.
- **Done**: `pnpm check` and `pnpm build` pass locally and in CI; the step's checks below pass; the pull request lists the rules it implements by id.
- **Reading at the start**: `CLAUDE.md`, this step, `architecture.md` (all of it), `glossary.md`, and the code of the steps it depends on. Not the paper.
- **Stop and ask** when `architecture.md` does not answer: a gap is reported (to Alessandro; a gap of the paper goes to the paper), never filled in the code. A decision taken while coding goes back into `architecture.md` in the same pull request, marked `[Q]`.
- **Decisions in a step**: some steps carry a decision to take with Alessandro before writing code; they are listed under the step.
- **Context**: the estimate is the session's total, starting from a base of about 90k (tools, rules, `architecture.md`, this plan). Type: _J_ judgment (design, decisions), _L_ local (each piece checks itself). Thresholds: plan 250k (J) or 450k (L), stop 400k (J) or 600k (L). A step that grows past them is split at its last closed milestone.
- **End of a step**: the session writes its log entry in Alessandro's notes (see `CLAUDE.local.md`) and the prompt for the next step.

## Stage 1, "they write to each other"

Scope: first face, introduction, relay; handshake by crossed QR and by link; direct chats; groups without separation (found, invite, join, leave and rejoin); news channel; export and import; update with notice. One face per person, with the data model of faces. The assistant is a normal user, built by a separate project that imports `domains` (it can start after step 14).

### (a) Pure domains

**1. Library nucleus I: commands and facts** — `library` · J · 230k

- Goal: the reference interpreter as a pure function; commands as data (branches, conditions, mutations); predicate declarations and the derived read set; facts with the event envelope; typed outcomes; the in-memory command port with the built-in duplicate branch and the fingerprint; strict zod schemas and their JSON Schema export; total order; the registry of interpreter rules. Driven by test domains written for the purpose, with no word of Q-.
- Rules: LIB-1..11, DOM-1, DOM-5..8, DOM-10..12, DOM-21, LIB-9, TST-1..3, TST-5, TST-7.
- Checks: library test cases on the test domains; property tests (fast-check, hand-written arbitraries, TST-9) of the interpreter against scenarios; duplicate and different-fingerprint cases; a stability corpus for the fingerprint; JSON Schema snapshots in CI.
- Watch: the library must not eat stage 1 (LIB-3). The smallest rule that closes each point.

**2. Library nucleus II: use cases, streams, interface and persona** — `library` · J · 230k

- Goal: use cases that open an event stream with a closed set of events; at most one command per use case; read port and stream read from an opaque position (base events, "position no longer available", inclusive resume); the interface component (contract version, then hat); the persona component (use-case tree, leaves only, entry checks in their fixed order, perimeter and limit constraints, explicit `Caller`); the trace of rejections.
- Rules: DOM-2..4, DOM-17, DOM-18, PER-4..8, PER-13, PER-14, PER-17, PER-18, F6.
- Checks: test cases for each entry check and its order; stream reads with injected redeliveries and resume (TST-4); perimeter hides from the caller, the trace keeps it.
- Depends on: 1.

**3. `mailbox` and `desk`** — J · 170k

- Goal: the first real domain, the smallest one, to prove the nucleus. `mailbox`: deposit on D, collect from a position, 7 days of retention, no deletion on collect. `desk`: the relay's personas (whoever deposits; whoever collects with R, `Caller` id = D = hash(R), the hash behind a port).
- Rules: PER-19, DOM-17, F5, V5, GR-8.
- Checks: domain tests on the in-memory ports; collect as a stream read, positions compared only by order; deposits on D reachable only with R.
- Depends on: 2. Feeds back into the library what the nucleus missed.

**4. `seals`** — J · 200k

- Goal: the secrets and their state: seeds (32 random bytes, declared scheme `slip10-flat`), faces `m/i'` (SLIP-0010 over the HMAC-SHA512 of the primitives port), seal for / open / sign / verify, group keys, R and D of a mailbox. Opaque references outward; indices of a seed never reused.
- Rules: GR-5, GR-8, DOM-8, DOM-21, PER-21, the invariants of § 4 (Domains of Q-).
- Checks: core tests with a fake primitives port; derivation invisible from outside (only public keys and references leave). The SLIP-0010 vectors run in step 15, with the real HMAC.
- Depends on: 2.

**5. `post`: the protocol** — J · 200k

- Goal: envelope (D, format version, sealed blob), letter (schema version, 16-byte identity, sender's face key, declared time, persona and use case invoked, content), the signature covering D; opening and verifying: a valid signature gives the `Caller`, otherwise `anonymous` with the id of PER-4 and the annotation of PER-2; the mailbox port of `post`.
- Rules: F2, F3, F4, GR-6, PER-2, PER-4, PER-13, DOM-11 (identity of a letter).
- Checks: a letter re-addressed to another D fails; a removed or broken signature gives `anonymous`; envelope hash stable for the same bytes.
- Depends on: 4.

**6. Library: outbox, effect executor, dead letters; "deliver M on bond L"** — J · 220k

- Goal: outbox entries with the command's fact; the effect executor as a durable consumer (at least once, entry id as key, position and dead letters per effect); the return use case; the three ways of failing; `post` executes "deliver M on bond L".
- Rules: DOM-13..15, DOM-17, LIB-1, F5, stage 1 point 2 of § 3.
- Checks: injected loss, duplication and abort on the mailbox port; a duplicate deposit is deduplicated by the receiver; an exhausted effect becomes a dead letter and is shown, never a business fact.
- Depends on: 5.

**7. Library: reactions and processes** — J · 200k

- Goal: reactions ("when fact E, command C") with deterministic operation ids from (event, reaction, part), each a delivery unit, rejections to dead letter, internal `Caller`; process steps as reactions (DOM-23); the module for reactions above the domains, on test domains.
- Rules: DOM-16, DOM-19, DOM-23, GR-9, PER-12, LIB-10, stage 1 points 5 and 6 of § 3.
- Checks: redelivered facts give one command (TST-4); a saga with a step that fails records a fact, not a rejection.
- Depends on: 6.

**8. `bonds` I: faces, tickets, introduction** — J · 230k

- Goal: faces as data (name, position in the tree, public key, opaque reference; one face in stage 1, model ready for more); the first face, the ticket (preparing → ready → used or expired, 48 hours) and the introduction as processes of `bonds`, with the steps toward `seals` as reactions; bonds (my face, its key, its relay and D, my mailbox, name, annotations such as "in person").
- Rules: DOM-23, GR-9, PER-11, PER-21, DOM-12, the invariants of § 4.
- Decisions: the place of the reactions module in the tree (GR-9), at the first step written.
- Checks: crossed QR = the same flow done by both sides; a ticket used twice or expired is rejected; every bond belongs to exactly one of my faces.
- Depends on: 7, 4.

**9. `bonds` II: groups and channel** — J · 220k

- Goal: groups (shared, no owner: key, mailbox, members with who introduced them), memberships (a group + one of my faces), found, invite, join, leave, rejoin (7 days of history from the mailbox); the news channel (public key, mailbox).
- Decisions with Alessandro, before code: the rules of groups (invitation, entry, who accepts a new member) and the form of the news channel, open in the architecture notes.
- Rules: DOM-19, DOM-20, DOM-23, PER-1.
- Depends on: 8.

**10. `conversations`** — J · 200k

- Goal: chats of a bond or of a group (they are not created); messages ("I wrote M" with "deliver M on bond L"; "I received M from X" with its annotations: valid signature, known bond, arrival mailbox, declared time, relay time); the news channel as a chat that keeps only letters signed by the channel's key.
- Rules: GR-3, F4, F6, DOM-11, DOM-12, PER-13.
- Checks: a duplicate letter gives the recorded fact; the identity of the letter is the message id (natural idempotency).
- Depends on: 9.

**11. `auth` and `persona`** — J · 230k

- Goal: auth's read ports in its own language (which faces I have, which bond or group a key belongs to, which personas a caller may wear); the four persona trees (`self`; `known`: write in the chats of its bonds and groups; `unknown`: introduce itself with a ticket; `anonymous`: empty, reject and annotate); the inbound path from an opened letter to the persona.
- Rules: GR-4, GR-7 (with its ESLint rule), PER-1..18, PER-21, F6.
- Checks: every entry check in order on letters; a known key outside its bond is "not found" to the peer and visible to the user; `anonymous` letters annotated.
- Depends on: 10.

**12. `user`** — J · 200k

- Goal: activities (one command at most each) and user concepts: drafts, active face, pending activities and retries (queue policy of the library), "nothing happens in silence": annotations, dead letters and the trace shown; technical outcomes as user concepts.
- Rules: ADP-2, ADP-7, DOM-12, DOM-15, LIB-12, GR-7, F6.
- Depends on: 11.

**13. `ui`: the screen model** — J · 200k

- Goal: the screens of stage 1, their states and gestures, as a pure domain (presentational state only), from Alessandro's notes on screens and flows.
- Rules: V2, ADP-7, GR-2.
- Depends on: 12.

**14. The `memory` stack** — L · 200k

- Goal: two phones and the relay in one process, `mailbox` imported through `desk`; the scenarios of stage 1 end to end: first face, crossed QR, link, chat, group, channel, leave and rejoin.
- Rules: CFG-1, CFG-3, TST-2, PER-19.
- Checks: the scenarios pass with injected loss and duplication on the mailbox. This stack is the oracle of the adapters.
- Depends on: 13.

### (b) Adapters

**15. libsodium** (`adapters-common`) — L · 160k

- Goal: the primitives port of `seals`; the SLIP-0010 test vectors; the `seals` suite run against it.
- Rules: TST-1, TST-6, ADP-1.

**16. The relay's adapters** (`adapters-node`) — L · 180k

- Goal: `mailbox` storage on SQLite (`node:sqlite`), compared with the in-memory oracle; the Hono HTTP interface through `desk`; no access logs.
- Rules: ADP-4..6, TST-2..5, PER-19, CFG-3.

**17. The relay's HTTP client** (`adapters-web`) — L · 150k

- Goal: the transport for the mailbox port of `post`; injected loss, duplication and abort.
- Rules: ADP-4, ADP-5, TST-4.
- Depends on: 16 (tested against the real relay adapter in Node).

**18. IndexedDB** (`adapters-web`) — J · 240k

- Goal: command and read ports and stream reads of every domain; the single writer with Web Locks ("use here"); `storage.persist()`; one atomic write per domain.
- Rules: DOM-8, DOM-9, DOM-17, ADP-6, TST-1..6.
- Checks: the domain suites parametrized on the adapter factory; concurrency equals some serial order; a rejection leaves no fact; a second tab cannot write.

**19. Solid rendering** (`adapters-web`, texts in `phone`) — L · 2 sessions × 200k

- Goal: the rendering of the `ui` model, gestures to activities, Italian texts in `packages/phone/src/texts/`.
- Rules: ADP-7, V2, the Solid rules of `CLAUDE.md`.

**20. Browser I/O** (`adapters-web`) — L · 160k

- Goal: QR drawn and scanned with the camera; the ticket link (after `#`); files for export and import; clock and randomness as injected sources.
- Rules: ADP-1, ADP-4.

### (c) Configurators

**21. `relay`** — L · 170k

- Goal: the relay's composition root; the deploy script (VPS in the EU, Node under systemd, Caddy); the public configuration that screen 1c points to.
- Rules: CFG-1..4, PER-19.
- Decisions: Alessandro runs the deploy; no server secret in GitHub.

**22. `phone`** — L · 220k

- Goal: the PWA's composition root; the composition check before the first request (a library piece, at its trigger); the service worker and the update with notice.
- Rules: CFG-1, CFG-2, CFG-4, DOM-9.

### (d) Delivery

**23. Export and import** — J · 220k

- Goal: the export of every domain's state with its schema version, encrypted with a phrase (Argon2id); the import on a new device.
- Decisions with Alessandro: gap G1 (positions, operation ids, pending outbox entries, duplicates still in the mailbox), recorded as a Q- decision and reported to the paper.
- Rules: DOM-22, G1.

**24. Full-stack trial and release** — L · 160k

- Goal: the scenarios on real phones against the deployed relay; fixes; release notes. The tag `v0.1` is Alessandro's.

## Stage 2, "more faces" (outline)

Same order by layer. `seals`: more faces and more seeds. `bonds`: the tree of faces as data, filtered views and colours, change face (the signed declaration of X and Y). `user` and `ui`: "as whom?", the active face, states. Adapters and configurators: only what the new screens need.

## Stage 3, "the rest" (outline)

`seals`: key renewal. `bonds`: separation. `conversations`: receipts (a receipt is a new letter invoking a use case on the sender's node). `post` and the relay: the handshake through the server. Same order by layer.
