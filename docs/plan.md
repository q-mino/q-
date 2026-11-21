# Development plan

How the prototype gets built: stage 1 in steps, stages 2 and 3 in outline. Each step is one Claude session in this repository, or more when it grows past the thresholds below, on its own branch, through a pull request that Alessandro reviews and merges. The rules cited by id are in [`architecture.md`](architecture.md); the words in [`glossary.md`](glossary.md).

Written on 6 Nov 2026, after the derived architecture document (PR #4). Points that document left to the plan are closed there as rules marked `[Q, plan]`: DOM-9, DOM-11, DOM-23, GR-7, GR-9, PER-4, PER-21, TST-9, and the adapters of § 6.

Re-planned on 17 Nov 2026, at the close of step 1 (Alessandro): the library, wished in the test domains of Shed, is wished whole first, every scenario in scope of the [catalogue](scenarios.md) written in Shed (step 2), then built by area in steps 3–7, before the domains of q-.

Steps 3–7 planned in parts on 18 Nov 2026 (Claude, at night, Alessandro's go given in advance for the block): the parts below, the state of each in Alessandro's notes (the block's plan).

Re-scoped on 19 Nov 2026 (Alessandro), from step 8: Cumino is a kernel that extensions extend. The kernel holds faces, bonds, letters, relays and the entry of a request; every other feature is an extension. Stage 1 is the kernel with one extension, ping pong; messaging becomes the first extension after it, groups a feature of the kernel in a later stage. The words: [`glossary.md`](glossary.md), § Domain terms.

Steps 8–23 and 25 planned as a block on 19 Nov 2026 (Claude; a proposal, which Alessandro approves by merging it): the parts below, the state of each in Alessandro's notes (the block's plan).

## How a step works

- **Order by layer** (Alessandro's principle of development): first the pure domains, from the bottom of the graph, with the library growing by need (LIB-3); then the adapters; then the configurators. A step does not start before the steps it depends on are merged.
- **Branch**: `step/<nn>-<name>` (e.g. `step/01-nucleus-commands`), one pull request per step.
- **Done**: `pnpm check` and `pnpm build` pass locally and in CI; the step's checks below pass; the pull request lists the rules it implements by id.
- **Reading at the start**: `CLAUDE.md`, this step, `architecture.md` (all of it), `glossary.md`, and the code of the steps it depends on. Not the paper.
- **Stop and ask** when `architecture.md` does not answer: a gap is reported (to Alessandro; a gap of the paper goes to the paper), never filled in the code. A decision taken while coding goes back into `architecture.md` in the same pull request, marked `[Q]`.
- **A library step** (3–7) builds the part of Shed's `wlib.ts` of its area in `domains/src/library/` (zen0). From step 3 the library's types are there, and `wlib.ts` lists what has no body yet, re-exporting the library: each step moves its declarations out with their bodies, and Shed goes on importing `wlib.ts` until the library is whole (7.5, DOM-25). Step 2 wrote every scenario in scope of the [catalogue](scenarios.md) in Shed before it, so a library step takes no decision of shape: a scenario that does not fit is resolved in Shed with a rule `[Q, C]`, its story in Shed's README, and stops the step only if it would reopen a choice of Alessandro's (18 Nov 2026). It closes when every scenario of its area runs as a test on Shed's oracle (`packages/domains/test/shed/scenarios/`).
- **Parts** (the library's block, 18 Nov 2026): a step is split into parts, each one session that closes it, with a stable id (`3.1`, `3.2`…), committed and pushed on the step's branch; the step's last part opens its pull request, which lists the rules it implements by id, the differences decided and the "Choices for A".
- **Stacked branches** (Alessandro, 18 Nov 2026): a library step starts on the previous step's branch before its merge (`step/04-commands-and-facts` from `step/03-generator`), its pull request toward that branch, or `main` once it is merged; a fix made below is carried up.
- **Autonomy in the block** (Alessandro, 18 Nov 2026): Claude decides architecture, contracts, the generator and its commands, and the developer experience when Alessandro's tendency in his notes decides, noted for the pull request; otherwise Claude's proposal is adopted as provisional (`[Q, C, provisional: A to confirm]` in `architecture.md`), listed in the pull request. A line of work stops when it would reopen a decision of Alessandro's or leave this plan; what does not depend on it goes on. Never a push to `main`, a merge or a tag.
- **The prototype's block** (steps 8–23 and 25; Alessandro's agreement of 19 Nov 2026, the plan proposed by Claude): Claude carries stage 1 to the end of the prototype alone, and the choices it takes are reviewed at the end. Its rules replace, for these steps, the ones above they differ from:
  - **Parts**: a step of the domains has its parts of writing (`.1`, and `.2` where the step has two halves; J): the map, the names, the components read as sentences, the stories to prove, in the domain's README; and its last part, of proof (L): each story a test on the oracle, the fixes, the step's pull request. The adapters and the configurators are parts L, but 21.1.
  - **Order**: the design of step 12 first (12.1, 12.2: documents only, its own pull request toward `main`), then what does not depend on it (8, 9, 11, 18, 19, 23); **the gate**, Alessandro's review of the design in one session; then 10, the code of step 12 (12.3, 12.4), 13–17, 20–22, 25. Nothing is built on the design of step 12 before the gate.
  - **One stack**, in the order of execution: `step/12-extensions-design` from `main`, then `08-mailbox-desk`, `09-seals`, `11-bonds`, `18-libsodium`, `19-relay-adapters`, `23-browser-io`, `10-post`, `12-extensions`, `13-auth-persona`, `14-ping-pong`, `15-user`, `16-ui`, `17-memory-stack`, `20-relay-client`, `21-indexeddb`, `22-solid`, `25-phone`; each pull request toward the branch before it. A fix made below is carried up by merge, and after each merge the new text is looked for on every branch.
  - **Reading**: never `architecture.md`, the library or Shed whole: § 1–3, "The domains of q-", the rules the step cites by id, § 5 for steps 12–14; one domain of Shed as the model; the library's types of the builders the part uses.
  - **Autonomy**: Claude decides the business of q-'s domains and of the kernel within stage 1's scope, the names, the rules of architecture, the adapters' contracts (`[Q, C]`, the discarded alternatives in the pull request). Adopted as provisional (`[Q, C, provisional: A to confirm]`, in "Choices for A"): a new key on a builder that exists, two shapes Alessandro's tendency does not decide between, a word the user reads, a dependency this document does not name, what the wireframe shows. A line of work stops, and what does not depend on it goes on: a choice that would reopen a decision of Alessandro's; a new builder of the library, but those of step 12's design once reviewed; anything built on step 12's design before the gate; a way out of stage 1's scope or of this plan; `pnpm check` red with no fix that respects `CLAUDE.md`. Alessandro's alone: a merge, a push to `main`, a tag; secrets, the deploy, accounts; steps 24, 26, 27.
- **Decisions in a step**: some steps carry a decision to take with Alessandro before writing code; they are listed under the step.
- **Context**: the estimate is the session's total, starting from a base of about 90k (tools, rules, `architecture.md`, this plan). Type: _J_ judgment (design, decisions), _L_ local (each piece checks itself). Thresholds: plan 250k (J) or 450k (L), stop 400k (J) or 600k (L). A step that grows past them is split at its last closed milestone.
- **End of a step**: the session writes its log entry in Alessandro's notes (see `CLAUDE.local.md`) and the prompt for the next step.

## Stage 1, the kernel and ping pong

Scope (Alessandro, 19 Nov 2026): first face, introduction, relay; handshake by crossed QR and by link; keeping one's bonds; requests and responses between bonded faces, a node that stays silent; the extensions: their boundary, manifest, extension points and activation, with the kernel's use case of the extensions in common; ping pong, preinstalled and off until the user activates it, the first conscious act of extension; export and import; update with notice. One face per person, with the data model of faces; a bond's relays a list, of one relay in stage 1 (the preferred relays of a face, overridden per bond, come later). Out of stage 1: groups (the kernel's, a later stage), messaging (an extension), the news channel (kernel or extension, to place), loading an extension from storage. The previous scope ("they write to each other": direct chats, groups, news channel) is the history of this plan; its steps are kept in [§ After stage 1](#after-stage-1).

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

**3. Library: the language and the generator** — `library`, `generator` · L · 6 parts × 250–320k · `step/03-generator`

- Goal: the authoring language of the library, whole and running, then the compilation of the domains (Alessandro's direction of 6 Nov 2026: convention over configuration). The types of `wlib.ts` move into `domains/src/library/` at once, since they cross the areas (the registry is a union of every kind, the state adapter holds the step's, a command's outcome carries the nodes' conditions); the builders get their bodies before the generator, which imports the authored files and finds the components by their builder (DOM-25), so they must run first (moved here from step 4). Then the generator: from the map (`sight.ts`) and the folders, the twins (`_fact.ts`, …), the scopes by kind (`_scope_<kind>.ts`), the doors by audience, the registries (a past major's with the inputs of its delegated leaves), the majors (`_majors.ts`), the points of the nodes (`_node.ts`); the rules of `.dependency-cruiser.mjs` from the map. Its checks: one object, one path; a past major's folder complete; the registry compared with `main`'s, by direction; generated files committed, regenerated in CI.
- Decisions at its start (Claude, 18 Nov 2026, in DOM-25 and § 2 of `architecture.md`):
  - where the generator lives: a package of its own, `packages/generator`, a pure core and a Node shell, importing only the library and `typescript`; its configuration, `generator.config.ts` at the root, lists the trees;
  - its commands: `pnpm generate` writes, `pnpm generate:check` compares and checks, first in `pnpm check` and in CI; its messages one line each, as tsc's (A, 19 Nov 2026);
  - how Shed moves to the library: `wlib.ts` lists what has no body yet and re-exports the library; Shed and its generated files go on importing it until 7.5;
  - the scenarios as tests: `packages/domains/test/shed/scenarios/sc-<nn>.test.ts`, one per scenario, over a harness of the oracle (`scenarios/oracle.ts`: a cell, the clock and the ids injected, TST-3), at the level its step builds (the business's use cases in steps 4–5, the personas' leaves from step 6, the configurator at 7.5); the library's own tests in `packages/domains/test/library/`, the generator's on fixture trees in `packages/generator/test/`.
- Parts:
  - **3.1 The types of the library**: every type of `wlib.ts`, with its JSDoc, into `domains/src/library/`, in files layered by their type dependencies (a type-only import counts for `no-circular`), each folder reached through its `index.ts`; `wlib.ts` re-exports the library and keeps, declared, the builders and the functions with no body. With the types go the values that already had a body (the schemas of the formats and of the library's own values, `day_of`) and the unique symbols the types read, given theirs (`Symbol()`), `nothing` among them, since a reaction's builder types it. Done: `pnpm check` green, no file of Shed changed but `wlib.ts`, which declares values only.
  - **3.2 The language at runtime**: the builders as data (each gives back its parts with its kind, the schemas built with zod), `builders_at`, `pick`, `composes`, `each`, `identity_of` (a stable function, LIB-10: pure, with no `crypto`, GR-8, and its stability corpus), the formats (`start_of`, `end_of`, `in_zone`, the zones over `Intl`; `day_of`, `cursor` and `nothing` left at 3.1), `given_by_the_caller`; they leave `wlib.ts`. Done: a test imports every registry of Shed and finds each component by the kind its builder gave; the formats tested on SC-12's days and instants.
  - **3.3 Reading the tree; twins and scopes**: the package and its configuration (per tree: its root, its map, the module its generated files import the library from, Shed's `wlib.ts`, and whether CI compares its registries with `main`'s, not Shed's: it changes as design, not as releases); the reading (the folders the map names, past majors and `@` folders as DOM-25 says, the authored files imported layer by layer once the files their scope imports are written, the JSDoc from the source); the twins and the scopes; `pnpm generate`. Done: regenerating Shed gives its twins and scopes, each difference decided (the generator or the file) and listed for the pull request. Scenario: SC-45.
  - **3.4 Doors, registries, nodes, majors; the map's rules**: `_door_<audience>.ts`, `_door_below.ts`, `_registry.ts` (a past major's its whole map, the delegated inputs, DOM-24), `_node.ts`, `_majors.ts`, `_version.ts`; the rules of `.dependency-cruiser.mjs` from the map, a function of the core that the configuration imports. Done: regenerating Shed gives every `_*.ts`, each difference decided. Scenarios: SC-45, SC-46 (the delegated input).
  - **3.5 The generator's checks**: it stops on a component under two names, two of one kind with one name in a folder, one reachable and not exported, two ancestors with one name, a door with two components under one name, a past major's component forgotten; `pnpm generate:check` first in `pnpm check` and in CI. Done: each check stops a fixture with its message. Scenario: SC-46.
  - **3.6 The registries by direction**: each major's registry as JSON Schema (`_registry.json`, committed, the snapshot of TST-7) and its comparison with `main`'s by direction (DOM-24, PER-17: what the tree reads only widens, what its clients read only narrows), with `main`'s paths of each major given to the core's `forgotten` (part 3.5: a path gone without a major, a past major's component forgotten), a conservative inclusion over the zod forms the trees use (one it cannot decide is a change); the step's pull request. Done: the comparison stops a fixture changed in the wrong direction and passes one changed in the right one. Scenario: SC-46.
- Rules: DOM-22, DOM-24, DOM-25, GR-1, GR-3, GR-9, PER-17, LIB-2, LIB-10, TST-7.
- Scenarios: SC-45, SC-46.
- Checks: regenerating Shed gives its hand-written files, each difference decided; each check stops a fixture with its message; `pnpm generate:check` in CI.
- Depends on: 2. Order: 3.1, 3.2, 3.3, 3.4, then 3.5 and 3.6 (either first).
- Risks: type cycles across the library's files; tsc's limits once the types are a library's, with declarations emitted (a serialization limit was met at SC-33); the bootstrap (an authored file imports its scope, so the generator writes by layers, and a stale scope stops an import); many small differences from the hand-written files (comments, order).
- Stops: 3.1 or 3.2 without a fix that respects `CLAUDE.md` stops the block, since every part depends on them; a difference whose fix would change what a folder sees (a door, a scope, a layer) is the map's, decided by Alessandro: it stops 3.3–3.4, and 3.5–3.6 go on, on fixtures.

**4. Library: commands and facts** — `library` · L · 4 parts × 260–320k · `step/04-commands-and-facts`

- Goal: the command use case's port over a state adapter; a command's plan from its creator, its condition as typed data with the tools to traverse and fold it (LIB-14); the outcome; the event envelope; the duplicate branch in the adapter's step and the fingerprint; composed transitions and lists; the versions of the facts. The oracle runs the commands of `tools` and `loans`.
- Parts:
  - **4.1 A command on the oracle**: `command_use_case_ports` over a `StateAdapter`; the creator resolved into a `PlannedCommand` (the branches in their order, each condition as data); the adapter's step (`Execute`, `FactWrites`); the outcome (DOM-7: the branch with its fact, or the rejection naming its failed predicates); the envelope (path, version, payload, resources from the identities, correlation, parts, DOM-10); the input parsed strict, a schema over the context (`invalid_request`, DOM-21); `versions` of the current majors, which the oracle takes; the harness `scenarios/oracle.ts`; and, since SC-13's correction is below `loans`' node `an_ongoing_loan` (SC-31), a business node of the use case's path at the command port (`binds`, `requires`, the path's failures once, `PathFailure`), moved from 6.2 (C, 19 Nov 2026). Scenarios: SC-1, SC-2, SC-4, SC-5, SC-6, SC-13.
  - **4.2 Duplicates, fingerprint, concurrency**: the operation (id and scope) and the fingerprint (LIB-11: the declared fields, before defaults, over 3.2's stable function, with its corpus), the duplicate branch in the adapter's step (`AlreadyRecorded`, `StoredEnvelope`), `identity_already_used`; property tests of the routing (fast-check, hand-written arbitraries, TST-9); concurrency equal to some serial order (TST-5). Scenarios: SC-3, SC-7, SC-11.
  - **4.3 Composed transitions and lists**: `composes` outside a step (planned once per branch of each transition), `each` (`PlannedBranchOverAList`, `applies`, `Execution.elements`, all or nothing), the composed parts in the outcome (`ComposedParts`), a fact's declared resources per part (`resources`). Scenarios: SC-10, SC-54, SC-55 (its envelope; its hold at 7.2). Since only the round's step records SC-55's notice in Shed (7.4), the harness enters it alone, by a use case of its own (`alone`, C, 19 Nov 2026), which 7.2 can use too.
  - **4.4 The versions of the facts**: a domain's majors, `earlier` and `delegate` of facts and effects, the translation at the one place (a stored part to a parsed one, by path and version), an unknown version that stops the reader, `versions([…])` with its checks at wiring (a domain absent, a current major not its `version.ts`'s, a stored version no major reads), `replay`; the step's pull request. Scenarios: SC-8, SC-9, SC-12. A builder checks at its wiring the domains it reads (`Versions.reads`): the command ports and `replay` here, each other builder that reads stored data with its part (5.1, 5.2, 6.3, 6.4, 7.1, 7.3), a step's facts with the steps (7.4); the oracle rebuilds its state from a kept log (`rebuilt`), and the harness starts a shed from what its store kept before a release (C, 19 Nov 2026).
- Rules: LIB-1, LIB-3..8, LIB-10, LIB-11, LIB-14, DOM-1, DOM-5..12, DOM-19, DOM-21, DOM-22, DOM-24, TST-1..3, TST-5, TST-7, TST-9, V9..V11, V14.
- Scenarios: SC-1..13, SC-54, SC-55.
- Checks: the scenarios as tests on the oracle; property tests of the routing (TST-9); the fingerprint's stability corpus (TST-7).
- Depends on: 3. Order: 4.1, then 4.2, 4.3, 4.4 (each needs only 4.1).
- Risks: the oracle (`adapter/memory/`) is a sketch that never ran: its faults show here, and are fixed in it; one that would change a scenario's meaning goes back to Shed (a rule `[Q, C]`); the fingerprint's canonical form is fixed once, since its corpus then binds it.
- Stops: a change to the contract of `StateAdapter` that would change a shape Alessandro chose stops that line.

**5. Library: reads and streams** — `library` · L · 3 parts × 200–320k · `step/05-reads-and-streams`

- Goal: queries as data and the read port; the read use case, its snapshot and its stream from an opaque position (base events, `position_unavailable`, inclusive resume), native or composed (`FactLog`), over its domain's facts only; facts, and parts of a fact, by name; pages.
- Parts:
  - **5.1 Queries and the snapshot**: `read_use_case_ports` for the snapshot; a query planned (`PlannedQuery`: a selection over the selection predicates of one subject, its fields, its calculations bound by part); the read adapter (`QuerySource`, `ReadAdapter`, `CalculationFragments`); the entries parsed by their fields; the total order (LIB-9: closed by the identity; text by code point, an absent value last, false before true); the position read at. Scenarios: SC-14 (the business's catalogue), SC-21. Done (C, 19 Nov 2026): the port's snapshot (`read_port.ts`), an input not in its schema read as nothing (`InputNotInSchema`), an entry's identity of another domain by the registries given as `identities` (A, 19 Nov 2026: on the command ports too, DOM-10), the oracle's value order with its cases; the snapshot reads no stored part, so the read ports check the versions with the stream (5.2).
  - **5.2 Streams**: the read use case as a stream (the snapshot at P, then the events from P; from a position, a resume, inclusive); the events of a fact in the oracle (`StreamEvent`, the interpreter's order); the composed stream over the `FactLog` (`StreamStrategy`); the facts of its own domain only, the others' for what they change (`changed`); the facts and parts the read use case names; `position_unavailable`; injected redeliveries and resume (TST-4). Scenarios: SC-15, SC-16, SC-17, SC-18, SC-19, SC-20 (the business's side). Done (C, 19 Nov 2026): the stream after the snapshot with no double, a resume inclusive, native events parsed, the composed stream over the log read again and compared by identity and value (`read_stream.ts`); a composed stream does not resume (`position_unavailable`); the read ports check the versions of the facts they stream; the oracle streams natively or composed, and the harness injects forgotten positions and redeliveries; every scenario on both strategies (D69.3).
  - **5.3 Pages**: a read in pages, a stream of snapshots pulled (`ReadPage`, the total, `next`), the cursor encoded by the library (`cursor_not_in_schema`, an `invalid_request`), the page's size from the creator; the step's pull request. Scenario: SC-22. Done (C, 19 Nov 2026): the port's pages, pulled one snapshot at a time after the cursor of the page before (`read_port.ts`), the cursor's form a stable function (`cursor_of`, `key_of` in `stable.ts`: the order key's fields by name with their values, in canonical JSON, base64url), a cursor that does not decode to the query's order key `cursor_not_in_schema`, a page with no size every entry (`PlannedPage.limit` optional).
- Rules: DOM-2, DOM-8, DOM-17, DOM-18, LIB-8, LIB-9, TST-4, V12.
- Scenarios: SC-14..22.
- Checks: the scenarios as tests on the oracle; injected redeliveries and resume (TST-4); the composed stream agrees with the oracle's (the snapshot at P with the events from P equals the snapshot at Q, D69.3).
- Depends on: 4. Order: 5.1, then 5.2 and 5.3.
- Risks: the oracle's stream (the state before and after each fact) and the composed one must agree; the actions' hooks in the planned query (`PlannedQuery.leaves`) are typed now and run at 6.3.
- Stops: none of its own beyond the block's.

**6. Library: trees and personas** — `library` · L · 4 parts × 280–320k · `step/06-trees-and-personas`

- Goal: the ports of a tree: the leaves (own input, creator, limits, projection, `ends`, `follows`, `stream`, `actions`), the nodes (lookups, perimeters, limits, bindings, `binds`, `requires`) and the lookups; the entry checks in their fixed order (the gate, `invalid_request`, the nodes, the leaf's limits); the versions of a surface (`LeafPort`, the leaves of a past major); correlation; the trace of rejections.
- Parts:
  - **6.1 Leaves and the ports of a tree**: `tree_ports` (the context the entry gives the top, the operation and its scope, `invalid_request` with its formal reason, the leaf found by its path), `command_use_case_over` and `read_use_case_over` (own input, creator, events, a projection per branch and for the rejection), the fingerprint at the leaf, `identity_already_used` crossing it, the correlation from the origin; and, since the keeper's node looks up his hats (SC-23), `lookup_ports` and a node run in its order with the leaf's limits, moved from 6.2 (C, 19 Nov 2026). Scenarios: SC-14 (the visitor's projection), SC-23, SC-25, SC-26, SC-24's borrowing half.
  - **6.2 Nodes, lookups, limits**: (`lookup_ports`, a node run in its order and a leaf's limits came with 6.1) the checks of their order (`not_found` and `refused`, `NodeEvent`, `closes`); a business tree's node through a persona's leaf (at the command port since 4.1: `binds`, `requires`, `PathFailure`; here its projection, SC-31); the trace of rejections (a perimeter hides from the caller, the trace keeps it, F6, PER-14); the actor from outside (a `Caller` by key, `operation.identity`). Scenarios: SC-31, SC-32's refusal (a limit on a read refuses before any read; following the shelf live, and a resume refused, with 6.3, since `the_shelf` streams), SC-34 (SC-24 at 6.1 and 6.3). The trace's form decided here (`Trace`, `Traced`, PER-14, C, 19 Nov 2026).
  - **6.3 A leaf's stream, wait and actions**: a read leaf's `stream` (its identity, its events by name, `fact` and `left` projected); a command leaf's `follows` and `ends` (by correlation over the fact log, `the_wait_is_over`); the actions of a read (`Applicability`, strong Kleene logic, `PlannedLeaves`, `with_actions` where the adapter declares `applicability`, a fault at wiring otherwise). Scenarios: SC-15, SC-16 (the persona's side), SC-24's reading half (`my_loans` streams), SC-32's stream (the shelf live while the card is valid; a resume after midnight on 31 March refused), SC-27 (the fact recorded by the test; the reaction at 7.3), SC-33. A read leaf's stream (the named part by DOM-17's touch, the port below carrying its identity's path and named facts) and a command leaf's wait (by the outcome's fact's correlation, `Elapsed` given by the configurator) since 6.3, with SC-32's stream, SC-17's persona side, SC-27; the actions of a read (`with_actions`, the pass per entry with the marks not known, strong Kleene logic, a leaf's limits outside) with SC-33 and the persona's side of SC-15, SC-16, SC-24 (C, 19 Nov 2026).
  - **6.4 The versions of a surface**: `LeafPort` (the message's version picks the major), the leaves of a past major (`earlier` and `delegate`, `to_next` and `from_next` with the context first), the gate (`version_not_supported`, with the current version and the oldest major), a past read leaf's identity; the check of `tree_ports` at wiring (a current leaf not of its path, Shed's README § Left by Shed, CFG-2); the step's pull request. Scenarios: SC-28, SC-29, SC-30. The window from the majors given (the version from the current registry's `version.ts`), the gate and `not_a_leaf` before any node and in the trace, a past major's input forward after the nodes (each next schema checking it, `invalid_request`), the steps back by event, entry and stream event, the fingerprint over the input as sent at the client's major; at wiring, a leaf given that is not the current major's and a past major's leaf that does not lead to it (C, 19 Nov 2026).
- Rules: DOM-2..4, DOM-11, PER-4..9, PER-13..15, PER-17, PER-18, V13, F6, CFG-2.
- Scenarios: SC-23..34, and SC-14..16 at the persona.
- Checks: the scenarios as tests on the oracle; each entry check in its order; a perimeter hides from the caller, the trace keeps it.
- Depends on: 5. Order: 6.1, 6.2, then 6.3 and 6.4.
- Risks: the heaviest types of the library (the leaves' builders, `ReadUseCasePort`, `TreePorts`) meet their bodies, near tsc's limits; the trace of a persona has no type in `wlib.ts` (eventual, without guarantees, F6): its form is decided at 6.2.
- Stops: a creator or a projection that the types accept and the library cannot run as Shed writes it, when the fix would change a shape Alessandro chose, stops that line.

**7. Library: effects, reactions, processes** — `library` · L · 5 parts × 250–320k · `step/07-effects-reactions-processes`

- Goal: outbox entries with the command's fact; the effect executor as a durable consumer (at least once, the entry's id as key, `not_before`, the return use case, position and dead letters per effect, the holds); the reaction consumers (operation ids from fact, reaction and part; rejections to dead letter; no hat); the step of a process with a cursor; waits queued at a past major; then the whole Shed on its configurator, and `wlib.ts` gone.
- Parts:
  - **7.1 The effect executor**: the entries queued with the fact (`PlannedBranch.entries`, `StoredEntry` with its version and resources); `effect_executor` (at least once, the key (effect, id), `not_before` by the executor's clock, `Delivered`: transient retried, exhausted to dead letter; the return use cases, the waits by `returns_the_payload`), the entries read at the current shape, position and dead letters per effect; injected loss, duplication and abort (TST-4). Scenarios: SC-35, SC-36, SC-37, SC-38, SC-43. Done (C, 19 Nov 2026): an entry carries the correlation of the fact that queued it (`StoredEntry.correlation`, DOM-10); the executor takes the time that passes (`zz.Elapsed`) beside its clock; an entry not yet due holds nothing (A, 19 Nov 2026); `redeliver` and `discard` with no hold yet, for 7.2 to complete with the entries waiting behind a letter (DOM-14, "The effect executor, at runtime").
  - **7.2 The executor's holds**: an entry's resources, `WaitingEntry`, `ExecutorState` (`held`, `hold`, `release`, `discarded`), `redeliver` and `discard` through the running executor; `order: 'any'`. Scenarios: SC-53, SC-55, SC-56. Done (C, 19 Nov 2026): a hold is decided when an entry comes due, against every entry its effect holds, read from the executor's state before each delivery (A, 19 Nov 2026: the order per resource is the order the entries come due); an operator's request served by its effect's unit between two deliveries, on the letter as the state holds it; the entries waiting that go on delivered in the order the state keeps them, before those the unit meets (DOM-14, "The executor's holds, at runtime").
  - **7.3 Reactions**: `reaction_consumers` (a durable consumer per reaction, its position and dead letters, the operation from fact, reaction and part, `reaction_operation`; `nothing`; the parts of other paths skipped; partitions by resource), their holds (`WaitingPart`, `ReactionState`, `redeliver`, `discard`). Scenarios: SC-40, SC-42; SC-7 and SC-27 end to end. Done (C, 19 Nov 2026): the holds and the operator's lane shared with the executor (`consumer.ts`); one partition per reaction, the log's order kept, partitions by resource with an adapter that partitions its log; the log that forgets a consumer's position a fall, never skipped; `reaction_operation` in the stability corpus; SC-42's cost by member corrected, the return naming no member (DOM-16, "The consumers of the reactions, at runtime"). `wlib.ts` is the re-export alone.
  - **7.4 Processes with a cursor**: `cursor_step` (the choice, `choose`, `PlannedStep`, the `StepAdapter` and its `after`, the cursor written by the library, `advances` and `completes`, an instance passed over); a list loaded element by element. Scenarios: SC-39, SC-41, SC-44. Done (C, 19 Nov 2026): a step's port built by the command ports (`step_port.ts`), the walk planned by `choose` over the process as read, the cursor the instance's order key in the page's form (`cursor_of`), found in the read's schema by the library's format; a cursor not of the step's order, a transition's input refused for an instance and a step below a node that binds or requires are faults with their cases; the harness's consumers of the processes' reactions (`processes`), and SC-17's composite fact by the round (DOM-20, "The steps of a process, at runtime").
  - **7.5 The whole Shed; the block closed**: `configurator.ts` wired whole on the oracle, every scenario run through it; `wlib.ts`, by then the re-export alone, deleted: Shed imports the library, the generator's configuration names it, Shed regenerated; Shed's README (§ Left by Shed), the catalogue (each scenario with its test) and this plan read again; the step's pull request. Scenarios: all, through the configurator. Done (C, 19 Nov 2026): the configurator runs on the oracle, the durable consumers given wired, each set to start where the writer runs them, its release (majors, the oracle's adapter as released) a parameter of the test configurator; the harness builds its shed with it, so every scenario runs through it; Shed imports the library by a relative path, its namespace still `wlib` until A's review, `zz` since (A, 19 Nov 2026, DOM-25); the catalogue names each scenario's test (CFG-1, "The shed's configurator, at runtime"; DOM-25).
- Rules: DOM-10, DOM-13..16, DOM-19, DOM-20, DOM-22, DOM-23, GR-9, PER-12, LIB-10, TST-4.
- Scenarios: SC-35..44, SC-53, SC-55, SC-56.
- Checks: the scenarios as tests on the oracle; injected loss, duplication and abort (TST-4); a redelivered fact gives one command; an exhausted effect becomes a dead letter, shown, never a business fact.
- Depends on: 6. Order: 7.1, then 7.2 and 7.3; 7.4 after 7.3; 7.5 last.
- Risks: the consumers' positions over the oracle's single log of every domain (DOM-10); the partitions by resource kept serial in the oracle, so the tests check order, not parallelism.
- Stops: none of its own; 7.5 needs every other part done.

**8. `mailbox` and `desk`** — 8.1 J · 230k, 8.2 L · 280k · `step/08-mailbox-desk`

- Goal: the first real domain, the smallest one, to prove the nucleus. `mailbox`: deposit on D, collect from a position, 7 days of retention, no deletion on collect. `desk`: the relay's personas (whoever deposits; whoever collects with R, `Caller` id = D = hash(R), the hash behind a port).
- Rules: PER-19, DOM-17, F5, V5, GR-8.
- Checks: domain tests on the in-memory ports; collect as a stream read, positions compared only by order; deposits on D reachable only with R.
- Depends on: 7. Feeds back into the library what Shed missed.

**9. `seals`** — 9.1 J · 240k, 9.2 L · 280k · `step/09-seals`

- Goal: the secrets and their state: seeds (32 random bytes, declared scheme `slip10-flat`), faces `m/i'` (SLIP-0010 over the HMAC-SHA512 of the primitives port), seal for / open / sign / verify, R and D of a mailbox. Group keys come with groups, after stage 1. Opaque references outward; indices of a seed never reused.
- Rules: GR-5, GR-8, DOM-8, DOM-21, PER-21, the invariants of § 4 (Domains of q-).
- Checks: core tests with a fake primitives port; derivation invisible from outside (only public keys and references leave). The SLIP-0010 vectors run in step 18, with the real HMAC.
- Depends on: 7.

**10. `post`: the protocol, requests and responses** — 10.1 J · 250k, 10.2 L · 320k · `step/10-post`

- Goal: envelope (D, format version, sealed blob), letter (schema version, identity (32 bytes, PST-2, since F7 hashes it), sender's face key, declared time, the extension, persona and use case invoked with its version, content), the signature covering D; opening and verifying: a valid signature gives the `Caller`, otherwise `anonymous` with the id of PER-4 and the annotation of PER-2; the mailbox port of `post`.
- Requests and responses (Alessandro, 19 Nov 2026): "send request Q on bond L", executed by `post` with the library's outbox and executor (step 7); a response is a letter that names the identity of the request it answers and carries the projection of the leaf that served it; a response asks for no response. The bond's relays are a list (one in stage 1): the letter goes to the bond's D on its relay.
- Rules: F2, F3, F4, F5, GR-6, PER-2, PER-4, PER-13, DOM-11 (identity of a letter), DOM-13..15, and the response's rules of step 12's design.
- Checks: a letter re-addressed to another D fails; a removed or broken signature gives `anonymous`; envelope hash stable for the same bytes; injected loss, duplication and abort on the mailbox port; a duplicate deposit is deduplicated by the receiver; a request redelivered gives the recorded response, no second fact; an exhausted delivery becomes a dead letter and is shown, never a business fact.
- Depends on: 9; step 12's design (the response, the letter's invocation of an extension).

**11. `bonds`: faces, tickets, introduction** — 11.1 J · 240k (faces and bonds), 11.2 J · 250k (ticket and introduction), 11.3 L · 350k · `step/11-bonds`

- Goal: faces as data (name, position in the tree, public key, opaque reference; one face in stage 1, model ready for more); the first face, the ticket (preparing → ready → used or expired, 48 hours) and the introduction as processes of `bonds`, with the steps toward `seals` as reactions; bonds (my face, its key, its relays and D, my mailbox, name, annotations such as "in person"), kept by the user (the list, a name, annotations). At the introduction each side declares where it can be reached: a list of relays, one in stage 1.
- Rules: DOM-23, GR-9, PER-11, PER-21, DOM-12, the invariants of § 4.
- Decisions: the place of the reactions module in the tree (GR-9), at the first step written.
- Checks: crossed QR = the same flow done by both sides; a ticket used twice or expired is rejected; every bond belongs to exactly one of my faces; a bond's relays are those its peer declared.
- Depends on: 7, 9.

**12. The extensions: boundary, manifest, extension points** — design: 12.1 J · 250k (the boundary and the protocol), 12.2 J · 250k (how an extension is built and loaded) · `step/12-extensions-design`; code, after the gate: 12.3 L · 350k (library and generator), 12.4 L · 320k (the kernel's side, a test extension) · `step/12-extensions`

- Goal: what an extension is to the kernel and to the library, decided and written before any code of it: its boundary with the kernel (messages: a request in, an outcome out, the calls to its ports); its manifest (what it sees of the kernel and of the other extensions, what it touches, the leaves it adds to which personas, the use cases it offers to other extensions), enforced by the kernel; isolated by default, in process as a declared choice of trust the user accepts informed, whole or in part; its storage, a partition the kernel gives; the extension points (pages, slots, actions; hooks only where a case shows they are needed); activation; the kernel's use case of the extensions in common, offered to `known`; how an extension is built (its package, its domains, its copy of `zen0`, the generator over its tree) and where it sits in the graph; the request, the response and the silence as rules.
- Decisions, before code (Alessandro, 19 Nov 2026): Claude designs every point of the goal alone and writes the whole proposal; Alessandro reviews it in one session before any step builds on it; loading an extension from storage (OPFS or IndexedDB) and the catalogue of the trusted host are out of stage 1, their shape only as far as the boundary needs it.
- Writes: `architecture.md` § 2 (packages and the graph: `conversations` out, the extensions in), § 4 (the domains of q-: the kernel, ping pong), § 5 (the personas: `known` no longer writes in chats; it reaches the extensions' leaves and the kernel's), new rules for the boundary, the manifest, the response and the silence; then the code the step's design asks of the library and the kernel.
- Checks: decided with the design; at least a test extension wired through the boundary on the oracle. Part 12.1's, on the oracle with two nodes (F7, F8, EXT-1..EXT-8): a request and its response, the return given once; the response lost, the request sent again, the same response; no response in the asker's time, `no_response`, and a late response annotated; a response to no request of the node's, or from another face, annotated; a request for an extension not installed, not active, or not offered to the bond, no letter back, the three alike from outside and in the server's trace; `version_not_supported` only for an extension offered; an undeclared call refused and traced, an undeclared leaf `invalid_request`, a leaf on `known` that waits refused at composition; an update whose manifest asks more, not active until accepted; the extensions in common, empty after the offer is withdrawn.
- Checks of the gate (Alessandro, 20 Nov 2026): a withdrawn offer, both ways (EXT-7): the peer's requests meet silence, a request of the extension on that bond is refused by the port of requests, its points are not drawn on that bond; a retry after a withdrawal or a deactivation meets silence, the asker records `no_response` and the server keeps its answer (F8).
- Checks of Claude's fixes at the gate (the adversarial check, 20 Nov 2026), on the oracle: Anna pings Bruno (P1, his phone off) and Carla (P2, its pong recorded), her phone closed before P1's time, started again: P1 `no_response` at its time, P2 delivered again reads Carla's pong from the port's answer, one pong and no dead letter (DOM-14); two effects keyed by one value never meet as one request (F7); the port answers a bond gone and a refusal (undeclared, not active, not offered to the bond), and a refused call sends nothing (EXT-2); a response that does not parse is a dead letter, and the effect goes on toward the other bonds (EXT-12); a peer's malformed input to an offered extension's leaf reads `invalid_request` before the kernel's node, and a leaf on `known` whose input holds a refinement is refused at composition (EXT-6, EXT-4); each silence in the kernel's trace with its case (EXT-6); an asker that asks the extensions in common tells a silence from a node off, and learns no more (F8, the declared flaw); a frame reaches only its extension's leaves on `self`, while active and shown, its invocations shown in the mark and never as the user's gestures (EXT-4, EXT-16); an extension's dead letter shown in its mark and redelivered by the user (EXT-2); the scope a peer's command gives an extension holds no key (EXT-2); a call to a port not in `touches` does not compile in the extension's configurator (EXT-3); an authored file of an extension's tree that imports `boundary` refused by the cruiser, its mounted point's generated file admitted (GR-10).
- Checks of part 12.2 (EXT-9..EXT-16; on the oracle, but the browser's at step 22): an extension's tree generated with its mounted points bound to the context its manifest declares, a node that `takes` there refused by the generator; an extension's package that imports a domain of the kernel refused by the cruiser; an extension built against a boundary major the kernel does not speak, or whose `ready` differs from its manifest, refused at composition; a manifest that asks more (a name in `sees` or `touches`, a point, a leaf on `known`) leaves the extension inactive, one that does not (a leaf on `self`, a new major) keeps it active; a request names its own extension's leaf only (the kernel adds the name); an event added to the served leaf fails to compile in the delivery; an extension not active is not loaded, and at its deactivation its consumers stop and a delivery in flight meets its request again once it is active again; two extensions' partitions never meet, and a commit is all or none; a fall answers the local invocations with a technical outcome and the peers' with silence, a second fall leaves it stopped; an action invokes its leaf with its place's bond; a frame follows its extension's reads on `self` through the kernel only, in the kernel's mark. Step 22, in the browser: a frame reaches no storage of the app's origin, no `fetch`, opens no window; whether `frame-src` stops a frame navigating itself is measured and written in § 9 or in the user's notice.
- Asks of the library and the generator (12.2), for 12.3: the generator's key `mounted` (EXT-11) and the refusal of a `takes` below it; the library's tree ports given the context at a mounted folder (EXT-11); the deliveries of an effect `order: 'any'` in flight together (F7). No new builder. Of the repository: the package `boundary` (EXT-9, its `manifest`, typed by the paths of `self`'s registry, EXT-10) and an extension's package with its build (EXT-9, EXT-10); the cruiser's rules per extension (GR-10); and, with 12.4 or the first step that writes q-'s tree, `conversations` removed (§ 2).
- Asks from Claude's fixes at the gate (20 Nov 2026). Of the library, for 12.3: the position of an effect `order: 'any'` behind its oldest delivery in flight, the entries handled above it delivered again after a fall (DOM-14, with its scenario); the tree ports serving, below a node at the top of a persona, leaves mounted from outside, given at wiring as data (paths, majors, inputs, events) with the port that invokes them, their leaf and input checked before the node (PER-6, "A mounted folder"; EXT-6). Of the generator, for 12.3: `mounted` naming `boundary`'s context schemas by the names of `sees`, the point's `_node.ts` importing them, and the cruiser admitting `boundary` there only in the tree (EXT-11, GR-10). Of the kernel's side, for 12.4: the request's identity composed by the kernel and hashed (F7); the port of requests' closed answer and the answer kept by identity (F7, EXT-2); the manifest's input schemas read at composition, a refined input on `known` refused (EXT-6, EXT-4); the kernel's trace, a port of its entry (EXT-6); `boundary`'s messages of the life, the frames and the notices, its ports typed by `touches`, the scope composed from the bond, the kernel's node above the mounted folders in its contract (EXT-2, EXT-3, EXT-5). For step 15: `user`'s port of an extension's leaf, taking it as data (GR-7).
- Depends on: 7. Its design runs first in the block (the letter and the response of step 10 follow from it, and Alessandro's review of it is the gate); its code after step 11 and the gate.
- Risks: the paper has no extensions: a gap of the paper, reported to it; the generator's compile-time map (`sight.ts`) and a manifest enforced at runtime must say the same thing.

**13. `auth` and `persona`** — 13.1 J · 250k (auth's ports, the four trees), 13.2 J · 240k (the inbound path, the silence, the response), 13.3 L · 350k · `step/13-auth-persona`

- Goal: auth's read ports in its own language (which faces I have, which bond a key belongs to, which personas a caller may wear, which extensions are active and offered to a bond); the four persona trees (`self`; `known`: the kernel's use cases, such as the extensions in common, and the leaves the active extensions add; `unknown`: introduce itself with a ticket; `anonymous`: empty, reject and annotate); the inbound path from an opened letter to the persona, to the kernel or to an extension; the silence (an extension not installed, or not offered to that bond, look the same from outside); a response accepted only as the return of a request sent to that face, otherwise annotated.
- Rules: GR-4, GR-7 (with its ESLint rule), PER-1..18, PER-21, F6, and step 12's.
- Checks: every entry check in order on letters; a known key outside its bond is "not found" to the peer and visible to the user; `anonymous` letters annotated; a request for an extension not active stays silent, the same as one not offered to that bond; a response that answers no request of ours is annotated, never a fact of the extension.
- Depends on: 11, 12.

**14. Ping pong: the first extension** — 14.1 J · 220k, 14.2 L · 280k · `step/14-ping-pong`

- Goal: the extension, through step 12's boundary: its domain (a ping sent to a bond, its pong received, no response after a time), its leaf `ping` on `known`, whose projection is the pong; its manifest; its extension points (an action on a bond, the place where the pong is shown); preinstalled, off until the user activates it.
- Rules: step 12's, DOM-3 (a leaf's wait, `follows`, `ends`, `zz.Elapsed`).
- Checks: on the oracle, a ping between two nodes with ping pong active gives its pong; to a node without it, or not offering it to that bond, no response; a ping redelivered gives one pong.
- Depends on: 10, 13.

**15. `user`** — 15.1 J · 240k, 15.2 L · 280k · `step/15-user`

- Goal: activities (one command at most each) and user concepts: drafts, active face, the extensions and their activation (what each sees and touches, its trust), pending activities and retries (queue policy of the library), "nothing happens in silence": annotations, dead letters, no response, and the trace shown; technical outcomes as user concepts.
- Rules: ADP-2, ADP-7, DOM-12, DOM-15, LIB-12, GR-7, F6.
- Depends on: 14.

**16. `ui`: the screen model** — 16.1 J · 240k, 16.2 L · 260k · `step/16-ui`

- Goal: the screens of stage 1, their states and gestures, as a pure domain (presentational state only), from Alessandro's notes on screens and flows: first face, bonds and their handshake, the extensions with their activation; the extension points the kernel's screens offer (pages, slots, actions).
- Rules: V2, ADP-7, GR-2.
- Depends on: 15.

**17. The `memory` stack** — L · 350k · `step/17-memory-stack`

- Goal: two phones and the relay in one process, `mailbox` imported through `desk`; the scenarios of stage 1 end to end: first face, crossed QR, link, ping pong activated on both sides, a ping and its pong, a ping to a node that stays silent.
- Rules: CFG-1, CFG-3, TST-2, PER-19.
- Checks: the scenarios pass with injected loss and duplication on the mailbox. This stack is the oracle of the adapters.
- Depends on: 16.

### (b) Adapters

**18. libsodium** (`adapters-common`) — L · 250k · `step/18-libsodium`

- Goal: the primitives port of `seals`; the SLIP-0010 test vectors; the `seals` suite run against it.
- Rules: TST-1, TST-6, ADP-1.

**19. The relay's adapters** (`adapters-node`) — L · 280k · `step/19-relay-adapters`

- Goal: `mailbox` storage on SQLite (`node:sqlite`), compared with the in-memory oracle; the Hono HTTP interface through `desk`; no access logs.
- Rules: ADP-4..6, TST-2..5, PER-19, CFG-3.

**20. The relay's HTTP client** (`adapters-web`) — L · 240k · `step/20-relay-client`

- Goal: the transport for the mailbox port of `post`; injected loss, duplication and abort.
- Rules: ADP-4, ADP-5, TST-4; WEB-6, WEB-7, written by the step (part 20, 21 Nov 2026), and STK-6 amended.
- Depends on: 19 (tested against the real relay adapter in Node).
- Checks: the stack's scenarios (STK-6) over the client to the relay served, under both fault plans; the client's answers under the network's faults injected below it (`memory/test/relay/over_http.test.ts`).

**21. IndexedDB** (`adapters-web`) — 21.1 J · 240k (the stores, the single writer, an extension's partition: the rules and the skeleton), 21.2 L · 350k · `step/21-indexeddb`

- Goal: command and read ports and stream reads of every domain; the single writer with Web Locks ("use here"); `storage.persist()`; one atomic write per domain; an extension's storage, a partition of its own (step 12).
- Rules: DOM-8, DOM-9, DOM-11, DOM-17, ADP-6, TST-1..6; WEB-8..WEB-13, written by part 21.1 (21 Nov 2026); WEB-14..WEB-17, written by part 21.2 (21 Nov 2026), and STK-1, STK-6, WEB-9, WEB-10 amended.
- Checks: the domain suites parametrized on the adapter factory; concurrency equals some serial order; a rejection leaves no fact; a second tab cannot write; the cost of the duplicate branch's lookups measured: a request through a leaf reads its operation twice, at the leaf and at the port, before the step reads it again (DOM-11, "Where the duplicate branch runs", 19 Nov 2026), and A decides on the measure whether to keep the two reads.

**22. Solid rendering** (`adapters-web`, texts in `phone`) — 22.1 L · 300k (the kernel's screens), 22.2 L · 300k (the extension points, ping pong) · `step/22-solid`

- Goal: the rendering of the `ui` model as a very simple wireframe, usable and interactive (Alessandro, 19 Nov 2026), gestures to activities, Italian texts in `packages/phone/src/texts/`; the extension points rendered as step 12 decides (an isolated extension's page or slot, an action).
- Rules: ADP-7, V2, the Solid rules of `CLAUDE.md`.

**23. Browser I/O** (`adapters-web`) — L · 260k · `step/23-browser-io` (before the gate: it does not depend on step 12)

- Goal: QR drawn and scanned with the camera; the ticket link (after `#`); files for export and import; clock and randomness as injected sources.
- Rules: ADP-1, ADP-4; WEB-1..WEB-5, written by the step (part 23, 20 Nov 2026).

### (c) Configurators

**24. `relay`** — L · 170k

- Goal: the relay's composition root; the deploy script (VPS in the EU, Node under systemd, Caddy); the public configuration that screen 1c points to.
- Rules: CFG-1..4, PER-19.
- Decisions: Alessandro runs the deploy; no server secret in GitHub.

**25. `phone`** — L · 320k · `step/25-phone`

- Goal: the PWA's composition root, the kernel with the preinstalled extensions (ping pong, off); the composition check before the first request (a library piece, at its trigger), each extension's manifest checked with it; the service worker and the update with notice.
- Rules: CFG-1, CFG-2, CFG-4, DOM-9.

### (d) Delivery

**26. Export and import** — J · 220k

- Goal: the export of every domain's state with its schema version, encrypted with a phrase (Argon2id); the import on a new device.
- Decisions with Alessandro: gap G1 (positions, operation ids, pending outbox entries, duplicates still in the mailbox), recorded as a q- decision and reported to the paper.
- Rules: DOM-22, G1.

**27. Full-stack trial and release** — L · 160k

- Goal: the scenarios on real phones against the deployed relay; fixes; release notes. The tag `v0.1` is Alessandro's.

## After stage 1

Order to decide with Alessandro (19 Nov 2026). The first three keep the steps of the previous scope (12, 13), to be re-planned on the kernel and step 12's extensions.

- **Groups, in the kernel**: shared, no owner (key, mailbox, members with who introduced them), memberships (a group + one of my faces), found, invite, join, leave, rejoin (7 days of history from the mailbox); group keys in `seals`; the founding a process of `bonds`. Decisions with Alessandro before code: the rules of groups (invitation, entry, who accepts a new member). An extension serves a group as it serves a bond.
- **Messaging, the first extension after ping pong**: chats of a bond or of a group (they are not created); messages ("I wrote M" with its request on bond L; "I received M from X" with its annotations: valid signature, known bond, arrival mailbox, declared time, relay time); the identity of the letter is the message id. A response may serve as its receipt.
- **The news channel**: kernel or extension, to place (public key, mailbox; a chat that keeps only letters signed by the channel's key).
- **Extensions from storage**: loaded at runtime (OPFS or IndexedDB) from the trusted host's catalogue; their update with notice, their removal (their data, their pending requests).
- **The assistant**: a normal user, built by a separate project that imports `domains`, once messaging exists.

## Stage 2, "more faces" (outline)

Same order by layer. `seals`: more faces and more seeds. `bonds`: the tree of faces as data, filtered views and colours, change face (the signed declaration of X and Y). `user` and `ui`: "as whom?", the active face, states. Adapters and configurators: only what the new screens need.

## Stage 3, "the rest" (outline)

`seals`: key renewal. `bonds`: separation. messaging: receipts (a response, or a new letter invoking a use case on the sender's node). `post` and the relay: the handshake through the server. Same order by layer.
