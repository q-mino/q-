# Development plan

How the prototype gets built: stage 1 in steps, stages 2 and 3 in outline. Each step is one Claude session in this repository, or more when it grows past the thresholds below, on its own branch, through a pull request that Alessandro reviews and merges. The rules cited by id are in [`architecture.md`](architecture.md); the words in [`glossary.md`](glossary.md).

Written on 6 Nov 2026, after the derived architecture document (PR #4). Points that document left to the plan are closed there as rules marked `[Q, plan]`: DOM-9, DOM-11, DOM-23, GR-7, GR-9, PER-4, PER-21, TST-9, and the adapters of § 6.

Re-planned on 17 Nov 2026, at the close of step 1 (Alessandro): the library, wished in the test domains of Shed, is wished whole first, every scenario in scope of the [catalogue](scenarios.md) written in Shed (step 2), then built by area in steps 3–7, before the domains of q-.

Steps 3–7 planned in parts on 18 Nov 2026 (Claude, at night, Alessandro's go given in advance for the block): the parts below, the state of each in Alessandro's notes (the block's plan).

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

**3. Library: the language and the generator** — `library`, `generator` · L · 6 parts × 250–320k · `step/03-generator`

- Goal: the authoring language of the library, whole and running, then the compilation of the domains (Alessandro's direction of 6 Nov 2026: convention over configuration). The types of `wlib.ts` move into `domains/src/library/` at once, since they cross the areas (the registry is a union of every kind, the state adapter holds the step's, a command's outcome carries the nodes' conditions); the builders get their bodies before the generator, which imports the authored files and finds the components by their builder (DOM-25), so they must run first (moved here from step 4). Then the generator: from the map (`sight.ts`) and the folders, the twins (`_fact.ts`, …), the scopes by kind (`_scope_<kind>.ts`), the doors by audience, the registries (a past major's with the inputs of its delegated leaves), the majors (`_majors.ts`), the points of the nodes (`_node.ts`); the rules of `.dependency-cruiser.mjs` from the map. Its checks: one object, one path; a past major's folder complete; the registry compared with `main`'s, by direction; generated files committed, regenerated in CI.
- Decisions at its start (Claude, 18 Nov 2026, in DOM-25 and § 2 of `architecture.md`):
  - where the generator lives: a package of its own, `packages/generator`, a pure core and a Node shell, importing only the library and `typescript`; its configuration, `generator.config.ts` at the root, lists the trees;
  - its commands: `pnpm generate` writes, `pnpm generate:check` compares and checks, first in `pnpm check` and in CI; its messages are provisional, for Alessandro;
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
  - **5.1 Queries and the snapshot**: `read_use_case_ports` for the snapshot; a query planned (`PlannedQuery`: a selection over the selection predicates of one subject, its fields, its calculations bound by part); the read adapter (`QuerySource`, `ReadAdapter`, `CalculationFragments`); the entries parsed by their fields; the total order (LIB-9: closed by the identity; text by code point, an absent value last, false before true); the position read at. Scenarios: SC-14 (the business's catalogue), SC-21. Done (C, 19 Nov 2026): the port's snapshot (`read_port.ts`), an input not in its schema read as nothing (`InputNotInSchema`), an entry's identity of another domain by the registries given as `identities` (provisional for A), the oracle's value order with its cases; the snapshot reads no stored part, so the read ports check the versions with the stream (5.2).
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
  - **6.2 Nodes, lookups, limits**: (`lookup_ports`, a node run in its order and a leaf's limits came with 6.1) the checks of their order (`not_found` and `refused`, `NodeEvent`, `closes`); a business tree's node through a persona's leaf (at the command port since 4.1: `binds`, `requires`, `PathFailure`; here its projection, SC-31); the trace of rejections (a perimeter hides from the caller, the trace keeps it, F6, PER-14); the actor from outside (a `Caller` by key, `operation.identity`). Scenarios: SC-31, SC-32, SC-34 (SC-24 at 6.1 and 6.3).
  - **6.3 A leaf's stream, wait and actions**: a read leaf's `stream` (its identity, its events by name, `fact` and `left` projected); a command leaf's `follows` and `ends` (by correlation over the fact log, `the_wait_is_over`); the actions of a read (`Applicability`, strong Kleene logic, `PlannedLeaves`, `with_actions` where the adapter declares `applicability`, a fault at wiring otherwise). Scenarios: SC-15, SC-16 (the persona's side), SC-24's reading half (`my_loans` streams), SC-27 (the fact recorded by the test; the reaction at 7.3), SC-33.
  - **6.4 The versions of a surface**: `LeafPort` (the message's version picks the major), the leaves of a past major (`earlier` and `delegate`, `to_next` and `from_next` with the context first), the gate (`version_not_supported`, with the current version and the oldest major), a past read leaf's identity; the check of `tree_ports` at wiring (a current leaf not of its path, Shed's README § Left by Shed, CFG-2); the step's pull request. Scenarios: SC-28, SC-29, SC-30.
- Rules: DOM-2..4, DOM-11, PER-4..9, PER-13..15, PER-17, PER-18, V13, F6, CFG-2.
- Scenarios: SC-23..34, and SC-14..16 at the persona.
- Checks: the scenarios as tests on the oracle; each entry check in its order; a perimeter hides from the caller, the trace keeps it.
- Depends on: 5. Order: 6.1, 6.2, then 6.3 and 6.4.
- Risks: the heaviest types of the library (the leaves' builders, `ReadUseCasePort`, `TreePorts`) meet their bodies, near tsc's limits; the trace of a persona has no type in `wlib.ts` (eventual, without guarantees, F6): its form is decided at 6.2.
- Stops: a creator or a projection that the types accept and the library cannot run as Shed writes it, when the fix would change a shape Alessandro chose, stops that line.

**7. Library: effects, reactions, processes** — `library` · L · 5 parts × 250–320k · `step/07-effects-reactions-processes`

- Goal: outbox entries with the command's fact; the effect executor as a durable consumer (at least once, the entry's id as key, `not_before`, the return use case, position and dead letters per effect, the holds); the reaction consumers (operation ids from fact, reaction and part; rejections to dead letter; no hat); the step of a process with a cursor; waits queued at a past major; then the whole Shed on its configurator, and `wlib.ts` gone.
- Parts:
  - **7.1 The effect executor**: the entries queued with the fact (`PlannedBranch.entries`, `StoredEntry` with its version and resources); `effect_executor` (at least once, the key (effect, id), `not_before` by the executor's clock, `Delivered`: transient retried, exhausted to dead letter; the return use cases, the waits by `returns_the_payload`), the entries read at the current shape, position and dead letters per effect; injected loss, duplication and abort (TST-4). Scenarios: SC-35, SC-36, SC-37, SC-38, SC-43.
  - **7.2 The executor's holds**: an entry's resources, `WaitingEntry`, `ExecutorState` (`held`, `hold`, `release`, `discarded`), `redeliver` and `discard` through the running executor; `order: 'any'`. Scenarios: SC-53, SC-55, SC-56.
  - **7.3 Reactions**: `reaction_consumers` (a durable consumer per reaction, its position and dead letters, the operation from fact, reaction and part, `reaction_operation`; `nothing`; the parts of other paths skipped; partitions by resource), their holds (`WaitingPart`, `ReactionState`, `redeliver`, `discard`). Scenarios: SC-40, SC-42; SC-7 and SC-27 end to end.
  - **7.4 Processes with a cursor**: `cursor_step` (the choice, `choose`, `PlannedStep`, the `StepAdapter` and its `after`, the cursor written by the library, `advances` and `completes`, an instance passed over); a list loaded element by element. Scenarios: SC-39, SC-41, SC-44.
  - **7.5 The whole Shed; the block closed**: `configurator.ts` wired whole on the oracle, every scenario run through it; `wlib.ts`, by then the re-export alone, deleted: Shed imports the library, the generator's configuration names it, Shed regenerated; Shed's README (§ Left by Shed), the catalogue (each scenario with its test) and this plan read again; the step's pull request. Scenarios: all, through the configurator.
- Rules: DOM-10, DOM-13..16, DOM-19, DOM-20, DOM-22, DOM-23, GR-9, PER-12, LIB-10, TST-4.
- Scenarios: SC-35..44, SC-53, SC-55, SC-56.
- Checks: the scenarios as tests on the oracle; injected loss, duplication and abort (TST-4); a redelivered fact gives one command; an exhausted effect becomes a dead letter, shown, never a business fact.
- Depends on: 6. Order: 7.1, then 7.2 and 7.3; 7.4 after 7.3; 7.5 last.
- Risks: the consumers' positions over the oracle's single log of every domain (DOM-10); the partitions by resource kept serial in the oracle, so the tests check order, not parallelism.
- Stops: none of its own; 7.5 needs every other part done.

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
