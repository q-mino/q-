# Development plan

How the prototype gets built: stage 1 in steps, stages 2 and 3 in outline. Each step is one Claude session in this repository, or more when it grows past the thresholds below, on its own branch, through a pull request that Alessandro reviews and merges. The rules cited by id are in [`architecture.md`](architecture.md); the words in [`glossary.md`](glossary.md).

Written on 6 Nov 2026, after the derived architecture document (PR #4). Points that document left to the plan are closed there as rules marked `[Q, plan]`: DOM-9, DOM-11, DOM-23, GR-7, GR-9, PER-4, PER-21, TST-9, and the adapters of § 6.

Re-planned on 17 Nov 2026, at the close of step 1 (Alessandro): the library, wished in the test domains of Shed, is wished whole first, every scenario in scope of the [catalogue](scenarios.md) written in Shed (step 2), then built by area in steps 3–7, before the domains of q-.

## How a step works

- **Order by layer** (Alessandro's principle of development): first the pure domains, from the bottom of the graph, with the library growing by need (LIB-3); then the adapters; then the configurators. A step does not start before the steps it depends on are merged.
- **Branch**: `step/<nn>-<name>` (e.g. `step/01-nucleus-commands`), one pull request per step.
- **Done**: `pnpm check` and `pnpm build` pass locally and in CI; the step's checks below pass; the pull request lists the rules it implements by id.
- **Reading at the start**: `CLAUDE.md`, this step, `architecture.md` (all of it), `glossary.md`, and the code of the steps it depends on. Not the paper.
- **Stop and ask** when `architecture.md` does not answer: a gap is reported (to Alessandro; a gap of the paper goes to the paper), never filled in the code. A decision taken while coding goes back into `architecture.md` in the same pull request, marked `[Q]`.
- **A library step** (3–7) builds the part of Shed's `wlib.ts` of its area in `domains/src/library/` (zen0), and Shed imports it in place of `wlib.ts`. Step 2 writes every scenario in scope of the [catalogue](scenarios.md) in Shed before it, so a library step takes no decision of shape: a scenario that does not fit stops it and goes back to Shed, decided with Alessandro. It closes when every scenario of its area runs as a test on Shed's oracle.
- **Decisions in a step**: some steps carry a decision to take with Alessandro before writing code; they are listed under the step.
- **Context**: the estimate is the session's total, starting from a base of about 90k (tools, rules, `architecture.md`, this plan). Type: _J_ judgment (design, decisions), _L_ local (each piece checks itself). Thresholds: plan 250k (J) or 450k (L), stop 400k (J) or 600k (L). A step that grows past them is split at its last closed milestone.
- **End of a step**: the session writes its log entry in Alessandro's notes (see `CLAUDE.local.md`) and the prompt for the next step.

## Stage 1, "they write to each other"

Scope: first face, introduction, relay; handshake by crossed QR and by link; direct chats; groups without separation (found, invite, join, leave and rejoin); news channel; export and import; update with notice. One face per person, with the data model of faces. The assistant is a normal user, built by a separate project that imports `domains` (it can start after step 17).

### (a) Pure domains

**1. Domains by example (Shed)** — done: `step/01-domains-by-example`, 9–17 Nov 2026

- Goal: the library wished before it is written. Test domains with no word of q- ([Shed](../packages/domains/test/shed/README.md): a tool shed, its catalogue, loans, repairs, personas), written from business specifications one at a time and reviewed against the paper and this document; [`wlib.ts`](../packages/domains/test/shed/wlib.ts), the types and signatures the domains want from the library, without bodies, the requirement of steps 3–7; the catalogue of the scenarios, [`scenarios.md`](scenarios.md).
- Replaces the library steps of the first plan (1, 2, 6, 7), re-planned below from Shed and the catalogue (Alessandro, 17 Nov 2026). What Shed leaves to them: its README, § Left by Shed.

**2. Domains by example II: the catalogue** — done: `step/02-catalogue`, 17–18 Nov 2026, 11 sessions

- Goal: Shed holds every scenario in scope of the [catalogue](scenarios.md) before any code of the library (Alessandro, 17 Nov 2026): each open scenario written as a story of Shed, from a business specification, with what it asks of `wlib.ts`. At its close no scenario in scope is open, and `wlib.ts` is the whole requirement of steps 3–7.
- Parts, by the library's areas, in each the scenarios that reshape first:
  1. formats, commands and facts: SC-12, SC-10, SC-13, SC-11;
  2. reads and streams: SC-19..22;
  3. trees and personas: SC-31, SC-33, SC-34, SC-32;
  4. effects, reactions, processes: SC-42, SC-43, SC-44, SC-53 (found at SC-42, entered by Alessandro on 18 Nov 2026);
  5. the second definitions (Alessandro, 18 Nov 2026: one need has two or more definitions, so that the author uses the one that suits and has a fallback when a technical need arises): SC-54, SC-55, SC-56;
  6. the generator's output for a delegated leaf (Shed's README, § Left by Shed); the closure: README, catalogue and this plan read again.
- The catalogue is closed at the start of the step: a scenario found along the way is added to it as open, and enters the step only if Alessandro decides; otherwise it waits for the library to be built.
- Checks: each scenario's story in Shed's README, with the part that covers it; in the catalogue no scenario in scope left open.
- Depends on: 1.

**3. Library: the generator** — `library` · L · 2–3 sessions × 200k

- Goal: the compilation of the domains (Alessandro's direction of 6 Nov 2026: convention over configuration). From the map (`sight.ts`) and the folders: the twins (`_fact.ts`, …), the scopes by kind (`_scope_<kind>.ts`), the doors by audience, the registries (a past major's with the inputs of its delegated leaves), the majors (`_majors.ts`), the points of the nodes (`_node.ts`); the rules of `.dependency-cruiser.mjs` from the map. Its checks: one object, one path; a past major's folder complete; the registry compared with `main`'s, by direction; generated files committed, regenerated in CI. Where it lives (a package with Node's I/O, a pure core in the library) is decided at its start.
- Rules: DOM-22, DOM-24, DOM-25, GR-1, GR-3, GR-9, PER-17.
- Scenarios: SC-45, SC-46.
- Checks: regenerating Shed gives its hand-written files, each difference decided; each check stops a fixture with its message.

**4. Library: commands and facts** — `library` · L · 3 sessions × 230k

- Goal: the builders at runtime; conditions (AND, OR, NOT, two-valued, every predicate evaluated); commands with their branches and outbox entries, as data; the command port over a state adapter (`FactWrites`), with the operation, the duplicate branch and the fingerprint; the event envelope (path, version, resources, correlation); the versions of the facts (`versions`, `replay`, the store's versions checked at wiring); strict zod schemas and their JSON Schema export; total order. The oracle runs the commands of `tools` and `loans`.
- Rules: LIB-1..11, DOM-1, DOM-5..12, DOM-19..22, DOM-24, TST-1..3, TST-5, TST-7, V9..V11, V14.
- Scenarios: SC-1..13, SC-54, SC-55.
- Checks: the scenarios as tests on the oracle; property tests of the routing (fast-check, hand-written arbitraries, TST-9); a stability corpus for the fingerprint; JSON Schema snapshots in CI.
- Depends on: 3.

**5. Library: reads and streams** — `library` · L · 2–3 sessions × 200k

- Goal: queries as data, selection predicates over a subject, the identity of an entry; read adapters; the read use case, its snapshot and its stream from an opaque position (base events, `position_unavailable`, inclusive resume), native or composed (`FactLog`), over its domain's facts only; facts, and parts of a fact, by name.
- Rules: DOM-2, DOM-8, DOM-17, DOM-18, LIB-8, LIB-9, V12.
- Scenarios: SC-14..22.
- Checks: the scenarios as tests on the oracle; injected redeliveries and resume (TST-4).
- Depends on: 4.

**6. Library: trees and personas** — `library` · L · 3 sessions × 230k

- Goal: use cases, command and read; the leaves (own input, creator, limits, projection, `ends`, `follows`); nodes (lookups, perimeters, limits, bindings) and lookups; the builders at a point; the ports of a tree, with the entry checks in their fixed order (the gate, `invalid_request`, the nodes, the leaf's limits) and the check at wiring; the versions of a surface (`LeafPort`, the leaves of a past major); correlation; the trace of rejections.
- Rules: DOM-2..4, PER-4..9, PER-13, PER-14, PER-17, PER-18, V13, F6.
- Scenarios: SC-23..34.
- Checks: the scenarios as tests on the oracle; each entry check in its order; a perimeter hides from the caller, the trace keeps it.
- Depends on: 5.

**7. Library: effects, reactions, processes** — `library` · L · 3 sessions × 220k

- Goal: outbox entries with the command's fact; the effect executor as a durable consumer (at least once, the entry's id as key, `not_before`, the return use case, position and dead letters per effect); the reaction consumers (operation ids from fact, reaction and part; rejections to dead letter; no hat); the step of a process with a cursor; waits queued at a past major.
- Rules: DOM-13..16, DOM-19, DOM-20, DOM-23, GR-9, PER-12, LIB-10.
- Scenarios: SC-35..44, SC-53, SC-56.
- Checks: the scenarios as tests on the oracle; injected loss, duplication and abort (TST-4); a redelivered fact gives one command; an exhausted effect becomes a dead letter, shown, never a business fact.
- Depends on: 6.

**8. `mailbox` and `desk`** — J · 170k

- Goal: the first real domain, the smallest one, to prove the nucleus. `mailbox`: deposit on D, collect from a position, 7 days of retention, no deletion on collect. `desk`: the relay's personas (whoever deposits; whoever collects with R, `Caller` id = D = hash(R), the hash behind a port).
- Rules: PER-19, DOM-17, F5, V5, GR-8.
- Checks: domain tests on the in-memory ports; collect as a stream read, positions compared only by order; deposits on D reachable only with R.
- Depends on: 7. Feeds back into the library what Shed missed.

**9. `seals`** — J · 200k

- Goal: the secrets and their state: seeds (32 random bytes, declared scheme `slip10-flat`), faces `m/i'` (SLIP-0010 over the HMAC-SHA512 of the primitives port), seal for / open / sign / verify, group keys, R and D of a mailbox. Opaque references outward; indices of a seed never reused.
- Rules: GR-5, GR-8, DOM-8, DOM-21, PER-21, the invariants of § 4 (Domains of q-).
- Checks: core tests with a fake primitives port; derivation invisible from outside (only public keys and references leave). The SLIP-0010 vectors run in step 18, with the real HMAC.
- Depends on: 7.

**10. `post`: the protocol** — J · 200k

- Goal: envelope (D, format version, sealed blob), letter (schema version, 16-byte identity, sender's face key, declared time, persona and use case invoked, content), the signature covering D; opening and verifying: a valid signature gives the `Caller`, otherwise `anonymous` with the id of PER-4 and the annotation of PER-2; the mailbox port of `post`.
- "Deliver M on bond L", executed by `post` with the library's outbox and executor (step 7); from the first plan's step 6.
- Rules: F2, F3, F4, F5, GR-6, PER-2, PER-4, PER-13, DOM-11 (identity of a letter), DOM-13..15.
- Checks: a letter re-addressed to another D fails; a removed or broken signature gives `anonymous`; envelope hash stable for the same bytes; injected loss, duplication and abort on the mailbox port; a duplicate deposit is deduplicated by the receiver; an exhausted delivery becomes a dead letter and is shown, never a business fact.
- Depends on: 9.

**11. `bonds` I: faces, tickets, introduction** — J · 230k

- Goal: faces as data (name, position in the tree, public key, opaque reference; one face in stage 1, model ready for more); the first face, the ticket (preparing → ready → used or expired, 48 hours) and the introduction as processes of `bonds`, with the steps toward `seals` as reactions; bonds (my face, its key, its relay and D, my mailbox, name, annotations such as "in person").
- Rules: DOM-23, GR-9, PER-11, PER-21, DOM-12, the invariants of § 4.
- Decisions: the place of the reactions module in the tree (GR-9), at the first step written.
- Checks: crossed QR = the same flow done by both sides; a ticket used twice or expired is rejected; every bond belongs to exactly one of my faces.
- Depends on: 7, 9.

**12. `bonds` II: groups and channel** — J · 220k

- Goal: groups (shared, no owner: key, mailbox, members with who introduced them), memberships (a group + one of my faces), found, invite, join, leave, rejoin (7 days of history from the mailbox); the news channel (public key, mailbox).
- Decisions with Alessandro, before code: the rules of groups (invitation, entry, who accepts a new member) and the form of the news channel, open in the architecture notes.
- Rules: DOM-19, DOM-20, DOM-23, PER-1.
- Depends on: 11.

**13. `conversations`** — J · 200k

- Goal: chats of a bond or of a group (they are not created); messages ("I wrote M" with "deliver M on bond L"; "I received M from X" with its annotations: valid signature, known bond, arrival mailbox, declared time, relay time); the news channel as a chat that keeps only letters signed by the channel's key.
- Rules: GR-3, F4, F6, DOM-11, DOM-12, PER-13.
- Checks: a duplicate letter gives the recorded fact; the identity of the letter is the message id (natural idempotency).
- Depends on: 12.

**14. `auth` and `persona`** — J · 230k

- Goal: auth's read ports in its own language (which faces I have, which bond or group a key belongs to, which personas a caller may wear); the four persona trees (`self`; `known`: write in the chats of its bonds and groups; `unknown`: introduce itself with a ticket; `anonymous`: empty, reject and annotate); the inbound path from an opened letter to the persona.
- Rules: GR-4, GR-7 (with its ESLint rule), PER-1..18, PER-21, F6.
- Checks: every entry check in order on letters; a known key outside its bond is "not found" to the peer and visible to the user; `anonymous` letters annotated.
- Depends on: 13.

**15. `user`** — J · 200k

- Goal: activities (one command at most each) and user concepts: drafts, active face, pending activities and retries (queue policy of the library), "nothing happens in silence": annotations, dead letters and the trace shown; technical outcomes as user concepts.
- Rules: ADP-2, ADP-7, DOM-12, DOM-15, LIB-12, GR-7, F6.
- Depends on: 14.

**16. `ui`: the screen model** — J · 200k

- Goal: the screens of stage 1, their states and gestures, as a pure domain (presentational state only), from Alessandro's notes on screens and flows.
- Rules: V2, ADP-7, GR-2.
- Depends on: 15.

**17. The `memory` stack** — L · 200k

- Goal: two phones and the relay in one process, `mailbox` imported through `desk`; the scenarios of stage 1 end to end: first face, crossed QR, link, chat, group, channel, leave and rejoin.
- Rules: CFG-1, CFG-3, TST-2, PER-19.
- Checks: the scenarios pass with injected loss and duplication on the mailbox. This stack is the oracle of the adapters.
- Depends on: 16.

### (b) Adapters

**18. libsodium** (`adapters-common`) — L · 160k

- Goal: the primitives port of `seals`; the SLIP-0010 test vectors; the `seals` suite run against it.
- Rules: TST-1, TST-6, ADP-1.

**19. The relay's adapters** (`adapters-node`) — L · 180k

- Goal: `mailbox` storage on SQLite (`node:sqlite`), compared with the in-memory oracle; the Hono HTTP interface through `desk`; no access logs.
- Rules: ADP-4..6, TST-2..5, PER-19, CFG-3.

**20. The relay's HTTP client** (`adapters-web`) — L · 150k

- Goal: the transport for the mailbox port of `post`; injected loss, duplication and abort.
- Rules: ADP-4, ADP-5, TST-4.
- Depends on: 19 (tested against the real relay adapter in Node).

**21. IndexedDB** (`adapters-web`) — J · 240k

- Goal: command and read ports and stream reads of every domain; the single writer with Web Locks ("use here"); `storage.persist()`; one atomic write per domain.
- Rules: DOM-8, DOM-9, DOM-17, ADP-6, TST-1..6.
- Checks: the domain suites parametrized on the adapter factory; concurrency equals some serial order; a rejection leaves no fact; a second tab cannot write.

**22. Solid rendering** (`adapters-web`, texts in `phone`) — L · 2 sessions × 200k

- Goal: the rendering of the `ui` model, gestures to activities, Italian texts in `packages/phone/src/texts/`.
- Rules: ADP-7, V2, the Solid rules of `CLAUDE.md`.

**23. Browser I/O** (`adapters-web`) — L · 160k

- Goal: QR drawn and scanned with the camera; the ticket link (after `#`); files for export and import; clock and randomness as injected sources.
- Rules: ADP-1, ADP-4.

### (c) Configurators

**24. `relay`** — L · 170k

- Goal: the relay's composition root; the deploy script (VPS in the EU, Node under systemd, Caddy); the public configuration that screen 1c points to.
- Rules: CFG-1..4, PER-19.
- Decisions: Alessandro runs the deploy; no server secret in GitHub.

**25. `phone`** — L · 220k

- Goal: the PWA's composition root; the composition check before the first request (a library piece, at its trigger); the service worker and the update with notice.
- Rules: CFG-1, CFG-2, CFG-4, DOM-9.

### (d) Delivery

**26. Export and import** — J · 220k

- Goal: the export of every domain's state with its schema version, encrypted with a phrase (Argon2id); the import on a new device.
- Decisions with Alessandro: gap G1 (positions, operation ids, pending outbox entries, duplicates still in the mailbox), recorded as a q- decision and reported to the paper.
- Rules: DOM-22, G1.

**27. Full-stack trial and release** — L · 160k

- Goal: the scenarios on real phones against the deployed relay; fixes; release notes. The tag `v0.1` is Alessandro's.

## Stage 2, "more faces" (outline)

Same order by layer. `seals`: more faces and more seeds. `bonds`: the tree of faces as data, filtered views and colours, change face (the signed declaration of X and Y). `user` and `ui`: "as whom?", the active face, states. Adapters and configurators: only what the new screens need.

## Stage 3, "the rest" (outline)

`seals`: key renewal. `bonds`: separation. `conversations`: receipts (a receipt is a new letter invoking a use case on the sender's node). `post` and the relay: the handshake through the server. Same order by layer.
