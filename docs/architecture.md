# Architecture

The rules of this code, derived from the architecture paper _Architettura a domini_ (Alessandro Giansanti, in Italian, not public) and from the architecture decisions of Q-. Read this before writing code; read [`glossary.md`](glossary.md) for the words.

## Version and how to read

- **Paper version**: vault commit `a14d825` (2026-10-14), last decision **D114**. If the paper changes, this document is updated in a dedicated pass; until then this version holds.
- **Q- decisions**: Alessandro's notes on the architecture (5–6 Nov 2026) and on the project setup (6 Nov 2026), in Italian.
- **References**: `D<n>` is a numbered decision of the paper, `§<n>` a paragraph of its foundations; `[Q]` is a decision of Q-, `[Q, paper gap]` a Q- choice where the paper is silent. `[Q, plan]` is a point this document left open, closed with the [development plan](plan.md) (6 Nov 2026). A rule with both applies the paper to Q-.
- **Rule ids** (`F3`, `DOM-7`…) are stable: cite them in reviews and commits.
- **When this document does not answer**, stop and ask. Never invent an architecture rule in the code. A gap of the paper is reported to the paper, not filled here.
- **Levels** (D114): the paper fixes _semantics_ (what an author or a user can observe); the library fixes _interpreter rules_ (any rule would do, but only one), each with its test case; everything else (execution, internal shapes, technology) is _implementation freedom_ and is not written down.

## 1. The frame: Q- inside the paper

The paper assumes a trusted server. Q- has none; it recovers the server like this.

- **F1** Every node is the server of itself. The phone runs the whole stack of the paper: UI → user → persona → business → state ports. No node trusts another. Wherever the paper says "trusted server side" (D99, D100), read "my node". [Q]
- **F2** A remote peer is always a client. Everything inside a letter (persona and use case invoked, declared time, content) is a claim. What my node verifies or measures (signature, arrival mailbox, collect time) is trusted. D99 [Q]
- **F3** The signature of the letter is the credential. `post` opens the envelope and verifies the signature; the inbound interface turns the verified signer into the `Caller`. D30 [Q]
- **F4** A letter is a request, not a shared fact. The sender records its own fact ("I wrote M") with the effect "deliver M on bond L"; the receiver treats the letter as an invocation on its node and, if it accepts, records its own fact ("I received M from X"). No synchronous reply: a receipt is a new letter that invokes a use case on the sender's node. The outbound letter is an effect (D73, D108); the answer comes back in as an actor with its own identity (D91, D92). [Q]
- **F5** Sending is an effect (DOM-13, DOM-14); collecting from a mailbox is a read on its stream from a position (DOM-17). D108, D64 [Q]
- **F6** The software informs, it does not guarantee. Nothing happens in silence: annotations are part of the facts, dead letters are kept per effect, and both are shown to the local user. A rejection records no fact: a rejected letter goes to the persona's trace, which is eventual and without guarantees, and the UI shows it from there. Hiding (perimeter constraints, PER-14) applies to remote peers, never to the user of the node. D54, D106 [Q]

## 2. Packages and the graph

| package           | contains                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `domains`         | the pure domains, one folder each: `library/`, `seals`, `post`, `mailbox`, `desk`, `bonds`, `conversations`, `auth`, `persona`, `user`, `ui` |
| `adapters-common` | adapters that run in the browser and in Node                                                                                                 |
| `adapters-web`    | browser adapters                                                                                                                             |
| `adapters-node`   | Node adapters                                                                                                                                |
| `phone`           | configurator: the PWA                                                                                                                        |
| `relay`           | configurator: the relay server                                                                                                               |
| `memory`          | configurator: phone and relay in one process, the oracles                                                                                    |

Arrows between domains, from consumer to consumed (enforced by [`.dependency-cruiser.cjs`](../.dependency-cruiser.cjs)):

| domain          | may import                                  |
| --------------- | ------------------------------------------- |
| `library`       | nothing                                     |
| `seals`         | `library`                                   |
| `post`          | `library`, `seals`                          |
| `mailbox`       | `library`                                   |
| `desk`          | `library`, `mailbox`                        |
| `bonds`         | `library`                                   |
| `conversations` | `library`                                   |
| `auth`          | `library`                                   |
| `persona`       | `library`, `auth`, `bonds`, `conversations` |
| `user`          | `library`, `persona`                        |
| `ui`            | `library`, `user`                           |

- **GR-1** The graph is acyclic. A consumer uses another domain's exported use cases and predicates, never its internals or its ports. D36, D43
  - Business domains import no other domain (GR-3, V11). Who reads whom among them is not declared by hand: it emerges from the imports of the in-memory oracle (TST-2). Reads may form cycles; cycles of reactions are checked when reactions come (DOM-16, step 8 of the plan). [Q]
- **GR-2** Arrows are strict, not transitive: `user` does not import `bonds`, `ui` does not import `persona`. This is stricter than the paper and follows from it: the UI goes through the user domain (D76), an actor reaches the business only through its persona (D88, D24). [Q]
- **GR-3** A business domain imports no other domain, except its identities (`$id.ts`, DOM-24): the id of a tool is the key of the link, of which there is no view of one's own (D48, D96.2). It models its own view of the concepts of the others, in its own language, with its own values, predicates and queries: a concept may have another name or another shape there, or a value the other domain does not have (`loans` may call a tool's category its _type_). The link is the state adapter's: its fragments and sources implement the downstream's predicates and queries over the upstream's state (ADP-8). `conversations` has its own predicates ("the bond exists", "is a member"), implemented over the stores of `bonds`. A write in a domain after a fact of another is a reaction (DOM-16), never a direct call. D35, D68, D88, V11 [Q]
  - Atomicity: a predicate over another domain's state, inside a command condition, is read atomically with the write only when one state adapter serves both domains: the IndexedDB transaction of a `conversations` command covers the `bonds` stores it reads. Otherwise the adapter reads first and the command is not atomic, a declared feature (F6), not a defense. D71 (its scope), D59 [Q]
  - A value two views share (a category, a `type` in `loans`) is not imported: the downstream declares its own, and the oracle links them with an exhaustive map (`satisfies Record<category of tools, type of loans>`), so that a new value upstream fails to compile until the link decides what it becomes downstream. [Q]
  - The fragments that cross domains are tested on the oracle and on each adapter (TST-1, TST-2): recommended; a prototype may defer the tests, and says so in its log. [Q]
- **GR-4** `auth` does not import `bonds`. Auth reads its data through its own outbound read ports, in its own language; the configurator implements them with an adapter over the read use cases of `bonds`. The logical edge `auth → bonds` remains (acyclic): the actor's data live in a business domain (V8). D29, D43, D41 (This corrects the arrow `auth → bonds` of the bootstrap.) GR-3 extends the same choice to the business domains.
- **GR-5** `post → seals` is a domain import: `post` speaks the protocol, `seals` the cryptography; the primitives are behind a port of `seals`. D36, D37, §2
- **GR-6** `post` imports neither `mailbox` nor `persona`. The mailbox port of `post` is implemented by an HTTP adapter (to the relay) or by the imported `mailbox` domain (in memory). The inbound path (opened letter → interface → persona) and the effect executor (outbox → `post`) are wired by the configurator. D5, D30, D65, D108 [Q]
- **GR-7** `ui → user` is an import: the UI drives the user domain. `user → persona` is an import of the persona's _contract_ surface; the _execution_ surface is wired by the configurator. `user` uses only the persona `self`, never the personas of remote peers. D76, D38, D40, D75
  - Enforced by type and by lint: the port of `user` toward the persona is typed on the contract of `self`, and an ESLint `no-restricted-imports` rule on `domains/src/user/**` forbids the names of the other personas. [Q, plan]
- **GR-8** A domain is a folder of `domains` whose `index.ts` is its only exported surface. Domains compile without DOM and Node and import only `library`, other domains along the arrows, and `zod`. Identity, clock and randomness enter as parameters. D39, D20, D48 [Q]
- **GR-9** The steps of a process across domains (DOM-23) are reactions in a module above the domains: no domain imports it, the configurator wires it. A saga goes both ways (A → B, then B → A), so its steps inside the domains would make a cycle. D88, D68 [Q, plan]
  - A one-way reaction, not a step of a process, may live in the domain whose command it invokes, reading the producer's stream, only along a read arrow of this graph (or one added by an architecture decision). D89, D36, D65 [Q, plan] With GR-3 there are no read arrows between business domains: to revisit with the reactions (step 8).
  - The module's place in the tree is set when the first step is written: the ticket, step 8 of the [development plan](plan.md).

## 3. Library (`domains/src/library/`)

The paper foresees one library that implements, once for every domain, what is the same everywhere. Q- is its pilot. [Q]

- **LIB-1** The library contains: the routing of commands (duplicate branch, conditions, the fact with its envelope; state and predicates evaluated by the domain's adapters, LIB-14); the interface component (contract version check, then hat check); the persona component (strict schema, fixed order of entry checks, fingerprint of the entry operation); the durable consumers (reactions, effect executor); the application of fact translations. A domain uses them and never rewrites them. D102
- **LIB-2** No word of Q- in the library. It imports no domain. It ships its own test cases, run on test domains written for the purpose: it is conformant if it passes them. D102 [Q]
- **LIB-3** It grows by need. First the nucleus (below); every other module at its trigger. The smallest rule that closes a point; no generalization or optimization without a case that asks for it. D82, D114 [Q]
- **LIB-4** Every rule that fixes semantics comes with its test cases. Every library rule goes into a registry with its constraint and its case. Test between the two: would the other choice change what an author or a user sees? If yes, it is semantics and belongs in the paper (until then, in this document). D102, D114
- **LIB-5** The library has no reference interpreter (V10). A domain may write in `dsl` a pure implementation of its commands over its own values (relevant state + command → fact or rejection): a building block of the in-memory adapter that is the oracle for the others (DOM-5, TST-2); a tool, not a requirement. D50, D102 [Q]
- **LIB-6** A predicate declares its name and its typed parameters, as a schema (DOM-25). What it reads and its value are the domain's adapters' (helped, if useful, by a pure function in `dsl`): no declared read, so the library derives no read set (V10). D96 [Q]
- **LIB-7** The condition language is closed: AND, OR, NOT and a leaf. The third value ("cannot be evaluated") exists only in applicability results; selections are two-valued (D51). A new construct must be domain-independent, come with test scenarios and bump the library version. D49, D110
- **LIB-8** Adapter capabilities form a closed catalogue of language forms, never domain predicates. The mandatory capabilities are never declared (AND/OR/NOT, version, duplicate branch, total order, at-least-once fact delivery per resource); optional ones are declared per port. D110
- **LIB-9** Every order is total. In Q- the business closes a query's order with a field unique per entry, which its commands keep unique (`not(a_tool_has_this_id)`): the library knows no ids (LIB-14) and cannot check it, the author declares it; the paper's core appends a tie-break on the domain id (D109). [Q] Value order (interpreter rule, registry of the conformance note): text by Unicode code point (no collation), an absent value greater than any value (last ascending, first descending), false before true. Interpreter, adapters and UI must agree. D109
- **LIB-10** The library owns the stable functions: the fingerprint and the delivery identity of a reaction (fact, reaction, part). A stability corpus is re-read at every release; an undeclared change is a fault. D100, D102
- **LIB-11** The fingerprint covers only what the retrier keeps and resends: identity, node, input restricted to the declared fields, computed before the schema's defaults are applied. Not the contract version, nor values added later. D100
- **LIB-12** The queue policy of the user domain (pending activities, retries) belongs to the library. D76
- **LIB-13** License: the repository's (AGPL-3.0 with a commercial license); Apache-2.0 when it becomes a package of its own. [Q]
- **LIB-14** Scope: the library is logic, never state. It routes; it gives the format of commands, branches, predicates and facts, and the operators of the conditions; it derives types; it interfaces the domains with interfaces and adapters, and helps implement the adapters. It does not define entities, keys, generic CRUD or mutation primitives (create, modify, delete), nor how a fact's values reach the state: that is the domain's adapters'. [Q] (V9)
  - It guarantees the typing end to end, and gives typed tools to implement what surrounds a domain: command adapters (an adapter can return only a branch its command declares, with its typed fact, or the rejection with the failed predicates), reads (results typed by their schemas), reactions and every other consumer of facts, inside the domains too (querying an event, matching it against an imported schema through its `$path`, exhaustive matching over facts as over an ADT). [Q]
  - For the command port it gives the condition of each branch as typed data, the tree bound by the creator with its operators and components, with tools to traverse and fold it; from the commands it derives, by `$path`, the predicates and facts an adapter must cover (its own and those of other domains it reads, GR-3), exhaustively; it types the outcome: a declared branch with its fact, or the rejection with the failed predicates. How the adapter evaluates and writes, in one or more steps, is its own. [Q]

**Stage 1** (nucleus, D82; triggers from the paper's cost note):

1. Nucleus: fact with event envelope and operation id; default duplicate branch; stream contract of each use case; schemas, strict; entry checks in their fixed order; routing of commands (conditions, LIB-7; total order); persona tree (shallow is fine); explicit `Caller`. The cost is lowered by implementation, never by removing pieces.
2. Outbox, effect executor and dead letters, with the stream read beneath them (D65, D108): triggered by the first external effect, "deliver M on bond L".
3. Client-generated ids (D62): triggered from the start, there is no server.
4. Contract versions side by side (D75): when peers do not update together; version in the message and "version not supported" are nucleus.
5. Reactions (D88, D89): with the first fact of one domain that causes a write in another. In Q-, the first step of a process: the ticket, `bonds` → `seals` (DOM-23).
6. Processes and scheduling (D92, D93, D97): with the first real coordination or periodic job.
7. Projections; fact translations (D101): with the first change of a fact schema.
8. Optional adapter capabilities: when a domain's code requests them.

## 4. Domains

### Structure

- **DOM-1** Every domain has the same four parts: language, use cases (its primary ports), a pure core (entities, invariants, command builders, predicates), secondary ports. The core does no I/O. D35, D20, D48
- **DOM-2** Two kinds of use case, command and read, and two kinds of port on the state, command port and read port. No port to publish events: whoever wants facts reads the stream. D41, D55
- **DOM-3** A use case receives one message and opens an event stream; it declares the closed set of events it can send and which ones end the stream. D55, D72
- **DOM-4** A use case runs at most one command, in any domain; reads are free. Two commands mean a process. D58

### Modules of a domain

- **DOM-25** A domain's code lives in a folder marked `-domain`, which holds its conventional modules: `id` (its identities, DOM-24), `value`, `fact`, `predicate` (the vocabulary of the conditions), `command`, `selection` (the vocabulary of the selections: predicates over the candidate of a query, which they do not name), `query` (DOM-18), `usecase`, which are the business language, and `dsl`, its interpretation (DOM-5). A module is a file (`fact.ts`) or a folder (`fact/`) with files and folders inside, each adding its segment to the path (DOM-24). Every name (schemas, values, commands, facts, predicates, use cases) is snake_case and as long as its meaning needs, a whole business phrase if needed, with no economy on length (`retire_a_tool`, `a_tool_has_been_retired`, `the_tool_was_already_retired`); a command's input is the schema `<command>_input`; every signature is a zod schema (DOM-21). [Q]
  - Functions of one argument: a builder takes one object whose parts have names (`wlib.command({ input, outcomes, creator })`, `wlib.query({ input, fields, selection, order, creator })`), the creator last, after what it binds; a creator takes one argument per level (`(context) => (input) => …`). [Q]
  - A branch's condition is a predicate or a named condition, and so is a query's selection: never `and`, `or`, `not` composed inline (`[the_tool_is_new, a_tool_has_been_added]`, `selection: the_tool_is_shown_in_the_catalogue`), so that the branch reads as a sentence and the condition has its JSDoc. Enforced by ESLint (`no-restricted-syntax`). [Q]
  - The business language names no primitive, entity or key (DOM-5, V9). Of the library it names only the builders of commands and queries, the parts of a query (`fields`, `selection`, `order`, the paper's words, D50.1) and the operators of the conditions (`and`, `or`, `not`). [Q]
  - `dsl` is the domain's pure functions over its values (DOM-5): no concept of the library, no pairing the library relies on. [Q]
  - Generated modules (`$*`, DOM-24), beside every authored file: the types `$x`; the parse functions `$x` (a value without its generated fields), `$$x` (safe parse), `$$$x` (parse of an `unknown`); for facts and predicates, the schema with its `$path` under the same name, with the author's JSDoc and a `@see {@link …}` to the authored member, so that one click leads from a use to its source. The business code takes facts and predicates only from the `$` modules. [Q]
  - A module folder's door is its generated `$index.ts`: it re-exports every `$` file and every subfolder's `$index.ts` with a namespace per segment (`export * as retirement from './$retirement.ts'`), so that access mirrors the path (`fact.retirement.a_tool_has_been_retired`); it adds no segment. In these folders the graph rule "only through `index.ts`" becomes "only through `$index.ts`" (`.dependency-cruiser.cjs`, rules `module-folder-only-through-$index-*`; first folder: `loans/-domain/selection/`). [Q]
  - The test systems (Shed, `domains/test/`) declare the library they want in a `wlib.ts` ("wished library"): types and `declare` only, no bodies. It becomes the requirement of the library steps of the plan. [Q]

### Commands, facts, outcomes

- **DOM-5** A command is data: an ordered list of branches. A branch has a condition (vocabulary predicates with AND/OR/NOT), the fact it records (a business phrase) with its payload, and outbox follow-ups. At most one branch applies. D16, D47, D49, D94
  - The fact describes what happened, and the change of state with it: the command names conditions and facts, never primitives, instances or the state. The state stays primary, materialized by the interpreter and by every adapter, and written atomically with the fact (DOM-8, D69.2). [Q] (V9)
  - How a fact's values reach the state (which instance, which resources for the envelope, D107) is the concern of the domain's adapters, not of the business language nor of the library: a domain declares no entities, keys or primitives, and the shape of the state emerges from the business descriptions, its values and the names of its elements (LIB-14). [Q]
  - Consequences: a payload carries at least the values its change writes (D56: no thinner than that), and the fact log is enough to rebuild the state, so an event-sourced store can be added beside the materialized one (D69.2); a change of the shape of what a fact writes is a new version of the fact (DOM-22). [Q]
  - A command's branches are a record, each under a business name that says the case and what follows (`the_tool_is_available_so_it_is_lent`, `the_member_already_has_the_tool_so_nothing_changes`); they are tried in the order they are written, and the creator resolves them under the same names. [Q]
  - AND and OR take named components, each name a business phrase (`a_tool_has_the_requested_id: a_tool_has_this_id`); NOT takes one condition. A composed condition is the zod schema of its parameters: one field per component, holding that component's parameters (a predicate's, without `$path`). The creator binds a branch's condition as an object of that schema, component by component: no parameter is shared by name, the same predicate may appear twice with different values, and a rejection can name the failed components. When values repeat, the author may write a function that builds the object. A predicate names each parameter after its value (`tool_id`, never `id`), so that an adapter that links domains (GR-3) reads it without guessing. [Q]
  - The conventional module `dsl` (`dsl.ts` or `dsl/**`) holds the domain's pure functions over its values (the value of a predicate, derived values, queries on the data), added at need and usable by the adapters, the interface and the client. At most it holds a pure implementation of the domain's own commands over its own values; the oracle that links the domains is an in-memory adapter built from these functions (TST-2). [Q]
- **DOM-6** Every applied branch records a fact, even with an empty mutation: "nothing to do" is a branch, not a rejection. A rejection records nothing and names the failed predicates. D95, D54, D17
- **DOM-7** The outcome is typed: the fact (branch, resolved values, outbox entries) or the rejection. The domain returns it raw; the persona projects it. A failure with no business meaning aborts the command and records nothing. D14, D17, D25
- **DOM-8** A fact is written atomically with the state, in its own domain's store. One atomic write touches one domain, even when all domains share one IndexedDB database. D42, D59 [Q]
- **DOM-9** The command port guarantees: same result as the oracle, when there is one (V10), all or nothing, isolation that covers what the command reads (the adapter's: there are no declared reads, V10). A serial writer (one command at a time, its reads inside its own sequence, one transaction per command) gets isolation and duplicates by construction; it still owes atomicity on failure and must never let a read see half a command. Two tabs of the PWA are two writers. D21, D22, D96
  - Q- has **one writer per node**: the Web Locks API gives the node to one tab; the other tabs say that Q- is open elsewhere and offer "use here", which takes the lock; the tab that loses it stops. The IndexedDB adapter is a serial writer, one transaction per command, and the durable consumers (effect executor, reactions, collection from the mailboxes) run only in the writer tab. [Q, plan]
- **DOM-10** The event envelope carries: path, schema version, payload, outcome, event id, operation id and fingerprint, correlation, attribution, the frame stack (each frame with its own time), the resources of the fact; a composite fact carries name, version and resources per part. D56, D99, D100, D107

### Duplicates and identities

- **DOM-11** The duplicate branch is built into the command port and runs first: the same operation id in the same scope returns the recorded fact, at the same position; a different fingerprint is rejected with "identity already used". The scope is `Caller` + hat. A domain may replace this branch with its own. D79, D61, D100
  - For a letter: operation id = the letter's identity; scope = the sender's `Caller` + persona; fingerprint over the invoked use case and the letter's declared fields as sent, without its schema version (LIB-11). Another peer cannot reuse an identity. For `anonymous` every letter is a new operation (PER-4). D91 [Q]
  - How long identities are kept is a deployment choice, at least as long as the sender can retry; beyond it natural idempotency covers. D61, D66, D79
  - Q- keeps them **forever** in the prototype: an accepted letter is kept anyway as a message under its identity, so the record adds one row per message. Revisited with measurements. The window it must cover: the relay's 7 days, plus the sender's time offline, plus a mailbox read again from its start (G1). [Q, plan]
- **DOM-12** A retry keeps the operation id, never rebuilds the command. The user domain creates the id before the first attempt. Resource ids are generated on the node and also serve as keys. D60, D73, D62

### Effects and reactions

- **DOM-13** An outbox entry declares: effect name, payload, entry id (also the event id and the key sent outside), optional delay, optional return use case whose input is the closed set of meaningful outcomes. D108, D12
- **DOM-14** The effect executor is an internal entry, not a persona: a durable consumer that delivers at least once with the entry id as key. Position, order and dead letters are kept per effect; every rejection by the return use case goes to dead letter. D92, D108, D65
  - "Deliver M on bond L" is executed by `post`, which deposits the envelope with the letter's identity as key; the receiver deduplicates (DOM-11). [Q]
- **DOM-15** Effects fail in three ways: transient (retried), definitive with a meaning (back as a business fact through the return use case), exhausted (dead letter, never a business fact by itself). D67
  - On a phone the operator is the user: dead letters are shown, and one must not silently freeze a whole conversation. [Q, F6]
- **DOM-16** A reaction is "when fact E, command C": it reads only the fact, translates it purely, invokes at most one command per part of the fact, through a command use case. Its operation id is deterministic, from (event, reaction, part); a rejection goes to dead letter; each reaction is a delivery unit of its own. Its `Caller` is internal ("system · reaction R"), with no hat. D88, D89, D91, D113

### Reads and streams

- **DOM-17** A fact-stream read goes through the read port: a query and an opaque position; delivery at least once, deduplicated by event id, ordered per resource. Base events: entering and leaving the selection, caught up, "position no longer available" (re-read the state, then resume). Resume from a position is inclusive. D64, D72, D73
  - Collecting from a mailbox is this read; positions are compared only by order. [Q]
- **DOM-18** A query is data. A read sees a consistent snapshot, declares its freshness and may ask to be "at least up to P". Projections (audit, read models) are pure and record no facts. D41, D50, D53, D66
  - A query, in the module `query`, declares its input, its `fields` (the schema of an entry), its `selection` and its `order`, and a creator that binds the selection from the input (DOM-25). The selection is a condition over selection predicates (module `selection`): predicates over the candidate, which they do not name; their parameters are the values of the filter. A command takes only predicates, a query only selection predicates, checked by type. Where the candidates are is the adapter's: one source per query (where it reads, how each field reads), the operators of the commands, a fragment per selection predicate (ADP-8). The query port returns the entries, typed by `fields`, and the position read at (D66). Pagination, freshness and "at least up to P" come when a case asks for them. D50.1, D50.3 [Q]
  - **The subject** (D50.1), decided on 10 Nov 2026: a selection speaks of one kind of thing, its subject, named by the business (a loan, a reservation, an entry of a member's agenda). The module `selection` has one file per subject (`loans/selection/loan.ts`, `loans/selection/reservation.ts`), so the subject is a segment of the path (`loans/selection/loan/the_loan_is_ongoing`, DOM-24); a domain with one subject may keep `selection.ts` until a second one comes. The library checks by type that the leaves of a selection come from one subject's file, and knows the subject only by that path: the subject is not an entity of state (LIB-14), it is a view, where it lives and how it is built is the adapter's. A candidate is an instance of the subject. [Q]
    - A condition about another subject is a predicate of the candidate's subject that reads it (`the_tool_of_the_loan_is_booked_for_the_day`, in `selection/loan.ts`, whose fragment reads the reservations), as a predicate over another domain's state (GR-3). A query whose entries are of two kinds has a subject of its own (an agenda entry: a SQL `union all`, two maps in memory), or is two queries joined above.
    - The adapter groups its selection fragments by subject, each group with its candidate typed (`(state) => (candidate: $loan) => boolean` in memory), and a query's source gives candidates of that type. A read adapter has three fragment types: a selection over a candidate, the source of the candidates, a field read from a candidate. In SQL they are one type, and one adapter serves the queries of every subject; the in-memory oracle builds its query ports one subject at a time, so that its reads are typed (`domains/test/shed/-adapter/memory/`).
    - Subjects appear only where one looks: commands have none (conditions are predicates over values and ids, changes are facts), as the two sides of CQRS.

### Processes

- **DOM-19** Every command is a transition of a process; the simplest process is the life cycle of an entity. In one domain a step composes the target's transition and records one fact with one part per applied branch; across domains it invokes the transition through outbox and reaction. A failed step records a fact, not a rejection. D70, D68, D93, D111
- **DOM-23** A process lives in the business domain that owns its life cycle, or in a business domain dedicated to processes; its state is in the aggregate itself or in a process aggregate. Its steps in other domains are reactions (GR-9): never a direct call, never an outbox entry. The outbox is for effects toward the world, whose outcome comes back only to the domain that queued it. The domain that runs a step does not reject for a business outcome: it records a fact, which a reaction forwards to the process. D68, D70, D65, D92, D93, D111
  - In Q- the ticket (preparing → ready → used or expired), the first face and the founding of a group are processes of `bonds`; the secrets are created by commands of `seals`, reached by reaction (PER-21). [Q, plan]
- **DOM-20** A bulk operation chosen by a condition is a process with a cursor, one instance per step. An operation on a list of named instances stays atomic, with one branch per instance. D97, D112, D113

### Schemas and versions

- **DOM-21** Every signature (use case, port, command, query, fact) has one declarative zod schema: type, validation, JSON Schema export. No parallel hand-written type or validator. An undeclared field never passes; the default is rejecting the request as "invalid request". D46, D75, D106
  - A static business rule over the input is validation, pure, in the domain: a limit (`max(80)`), a window ("a day after today, within 30 days"), even when it reads the context; it fails as "invalid request", not as a rejection. The input schema may be a function of the part of the context it needs (`(context: Now) => schema`), built by the library before parsing; the context is made of small interfaces, so the schema serves any context that has that part. A rule becomes a predicate, evaluated by the adapters, when its limit leaves the code for a configuration that can change. [Q]
- **DOM-22** A fact's name is its meaning and never changes; its version is its shape, in the envelope. The log is never rewritten. The producing domain translates old facts at read time, one version to the next; a translation is pure, adds nothing, touches only the payload and never changes once published. A reader that meets an unknown version stops and retries, never guesses. Stored state is migrated by an adapter only through such a translation; values the business must decide are commands with their facts. D101
  - The shape of the facts (one fact with values, or distinct facts) follows the business language, which the business makes and which represents it; the technical staff may suggest, foreseeing future needs is the business's. Splitting a fact after a release is a new name (D75.6), so the choice is made before. [Q]
  - The export carries the state of every domain with its schema version; every release reads the letters and exports of the previous ones. [Q]
- **DOM-24** Commands, facts, predicates, use cases, and every other component of a domain are identified by their path: the domain, its folders, the conventional module, the folders and files inside it, and the member's name. The path is rigid: it mirrors the representation of the domain, so a module `retirement` inside `fact/` adds `retirement` to the path (`tools/fact/retirement/x`). A default export takes the name of its module, one level above the named exports (`tools/fact/retirement`). The path names the schema when a message is serialized for an adapter, and is the path of the event envelope (DOM-10). A path is an identity: like a fact's name (DOM-22), it never changes once released. [Q]
  - The domains' generator writes a path registry per domain, each path with its schema. It is compared in CI with the registry of `main`: a path that disappears, or whose schema changes without a new version, fails. Moving or renaming a component changes its path, so it is a new version: an explicit decision, with the old path deprecated and, if needed, kept with a translation for backward compatibility; never a side effect of a refactor. [Q]
  - Brands: a value is branded when exchanging it with another value of the same base type is a bug that compiles: identities (a value that names an instance: `tool_id`, `loan_id`) and formats (`date_time_string`, `day`); free text and enumerations are not. The brand's literal is the value's path (`tools/id/tool_id`), so two domains never share a brand by chance; the author never writes it. Formats carry no word of a domain and live in the library (LIB-2); a format's brand is its name (`day`), which no domain path can be. [Q]
  - A domain's identities live in its module `id`: the author declares their shape (`tool_id = z.string().min(1)`), the generator writes in `$id.ts` each one branded with its path, under the same name, and the domain's modules take them from there, as facts from `$fact.ts`. Only `$id.ts` imports `id.ts`, and `$id.ts` is the only module another domain may import (GR-3); both checked by `.dependency-cruiser.cjs`. [Q, 11 Nov 2026]
  - Every generated file (`$*`) is committed; CI regenerates them and fails on any difference. [Q]
  - A fact and a predicate carry their path in a field `$path`, a literal. The author never writes it: the conventional module declares the shape, the generator writes in its `$` module the schema with the `$path` under the same name, and the business code imports from there. The literal is the nominal identity of a fact as a value (two facts of the same shape are never interchangeable), and it keeps a fact out of a condition and a predicate out of a fact at compile time. A folder is never named as a conventional module, and no field of a shape begins with `$`. [Q]

### The domains of Q-

| domain          | language and responsibility                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `seals`         | faces derived from seeds (flat index), seal for, open, sign, verify, group keys. Holds every secret; other domains hold opaque references and public keys. Primitives behind a port. |
| `post`          | the protocol: envelope, letter, receipt, declaration, version. Opens envelopes and verifies signatures; the letter names the persona and use case invoked.                           |
| `mailbox`       | the relay's domain: deposit, collect from a position, keep 7 days, no deletion on collect.                                                                                           |
| `desk`          | the relay's personas: who deposits, who collects with R (PER-19).                                                                                                                    |
| `bonds`         | upstream business: faces, contacts, handshakes and tickets, invitations, groups and memberships, separations.                                                                        |
| `conversations` | downstream business, reads `bonds`: direct and group chats, messages, the news channel, receipts.                                                                                    |
| `auth`          | data on the actor: which faces the local user has, which bond or group a remote face belongs to, which personas a caller may wear.                                                   |
| `persona`       | the four personas and their use-case trees (section 5).                                                                                                                              |
| `user`          | activities and user concepts: drafts, active face, "nothing happens in silence".                                                                                                     |
| `ui`            | the language of the interface: screens, states, gestures (presentational state only).                                                                                                |

Invariants of Q- that the domains keep [Q]: every bond and every membership belongs to exactly one of my faces; no domain deduces a face's position from its key or its key from its position; the derivation of a face is invisible from outside.

## 5. Persona and auth

### The four personas [Q, 6 Nov 2026]

| persona     | who                                                | `Caller`                                                         | can do (prototype)                                                            |
| ----------- | -------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `self`      | the user of this node, from the app                | the local user                                                   | everything its tree exposes; a node "as face X" binds the active face (PER-3) |
| `known`     | valid signature, face known (bond, group, channel) | the sender's face key                                            | write in the chats of its bonds and groups, receipts                          |
| `unknown`   | valid signature, face never seen                   | the sender's face key                                            | introduce itself with a ticket (PER-11)                                       |
| `anonymous` | no signature, or a signature that does not verify  | an id per letter, not a stable identity (as the paper's visitor) | nothing yet: every letter is rejected and annotated                           |

- **PER-1** Personas differ only when the trade differs; differences among wearers are values. Contact, member of group G, channel, the face of mine the bond belongs to and, later, permissions per known face are **values from auth**, not personas or trees. D33, D77 [Q]
- **PER-2** A signature that does not verify gives `anonymous`, with the value "invalid signature, claimed face K" as an annotation; never a `Caller` with the claimed identity. Not a persona of its own: removing the signature is always possible, so it could not be given less than `anonymous`. D106 [Q]
- **PER-3** My faces are not personas. Under `self`, a node "as face X" binds the face as the subject once per request; every constraint states whose value it reads. One face per request. D87 [Q]
- **PER-4** The `Caller` is produced by the interface from verified credentials and passed explicitly to the persona: id mandatory, other fields only if verified; absence is a value, never `null`. `anonymous` has an id per letter: with no stable sender, every letter is a new operation. D30, D78, D91
  - The id of an `anonymous` letter is the BLAKE2b hash of its envelope, computed by `post` when it opens it: the same envelope delivered again is the same operation, a different envelope a new one, and nothing declared inside the letter counts. [Q, plan]
- **PER-5** Order of entry checks, fixed; the first that fails closes the request (D106):
  1. transport (relay or local mailbox) and interface establish the `Caller` (`post` opens and verifies);
  2. interface: contract version ("version not supported"), then hat ("hat not available");
  3. persona: node exists and is a leaf, input in the schema ("invalid request");
  4. persona: perimeter constraints on values and trusted-frame data only ("not found");
  5. persona: limit constraints on values, input and trusted-frame data only (rejection with all reasons);
  6. business, in the atomic operation: duplicate branch, then the composed condition.
     A check may answer before a perimeter only with what the caller already knows.
- **PER-6** A request lands on the root of the persona and invokes a leaf; internal nodes group and accumulate, invoking one is "invalid request". Every wearer gets the same structure. Constraints only accumulate going down. D77, D105
- **PER-7** One hat per request. The hat is in the address of the use case — for a letter, the persona it invokes — and is a claim verified with auth, not a permission. D27, D78
- **PER-8** Access values never come from the peer; an undeclared field never enters. D33, D75
- **PER-9** Auth answers with data, never decisions. It may have commands; its read ports are implemented by adapters (in Q-, by the read use cases of `bonds`, GR-4). D29, D43, D98
- **PER-10** The interface uses auth to verify the hat; the persona uses auth for its values; the business never knows auth. D43, D77
- **PER-11** The introduction with a ticket is the paper's registration: a command of `unknown` that invokes the command of `bonds` creating the bond (in the paper, a command of auth: V8); its fact links the sender's key to the new bond. The sender is `known` from its next letter. D78, D98 [Q]
- **PER-12** Internal entries (reactions, effect executor) are not personas and wear no hat. D88, D91
- **PER-13** Request data lives in the frames of the envelope stack, written by each layer crossed; a datum is worth what its layer is worth. Only frames written by my node feed access constraints. The letter's declared time is a claim; the relay's arrival time is written by the relay and is annotated, not trusted; my node's collect time is trusted. D99 [Q]
- **PER-14** Perimeter or limit, declared by the node. A perimeter that fails gives "not found" without a reason (and filters reads); a limit that fails gives an explicit reason. This hides from the peer; the local user is informed (F6). D44, D80
- **PER-15** Capabilities on three levels, each restricting the previous: the persona's tree, the values from auth, the applicability on one resource. In the UI they are only UX. D25, D47, D77
- **PER-16** An opaque value grants no permission; whoever reads it validates it again. D57 (exception: the collect secret, V5)
- **PER-17** The contract version is the version of the persona's surface. A compatibility window is declared; an incompatible change is expand-contract inside the persona tree, readers first. This holds between peers released independently. D75, D101
- **PER-18** Answers are built field by field; attribution, frame stack, fact schema versions and fact resources never leave the node. Correlation may travel, and is a claim when it comes in. D45, D56, D72, D101, D107
- **PER-19** The relay has its own personas, by the trade of `mailbox`: whoever deposits on D (anyone), whoever collects with R. These are not the four personas of the phone, which hold only for `persona`: the relay has no bonds and no local user, and the envelope is sealed. They live in the domain `desk` (the counter of a post office, where one deposits and collects: the persona layer of `mailbox`; arrows: `library`, `mailbox`), which neither the phone nor other importers of the domains need. Its interface turns R into the `Caller` (id = D = hash(R)); its auth is trivial and gets a folder only when it has rules. The HTTP interface and the `memory` oracle both reach `mailbox` through them, never directly. D77, D88, D103, D75 [Q]
- **PER-20** A future carrier (a nearby device passing an envelope) wears a persona of the local mailbox's tree; whether known carriers differ is decided then, as a value or a persona. The carrier travels as a frame of the letter it carries, independent of the letter's own persona. D77, D99 [Q, not in the prototype]
- **PER-21** The command use cases of `seals` belong to no persona tree: only reactions reach them (internal entries, PER-12), wired by the configurator. No peer and no screen reaches a secret directly. D88 [Q, plan]

## 6. Adapters

- **ADP-1** Adapters are mechanical translators: no business rule, no `if` on the domain's meaning. The logic is in the domains. §4
- **ADP-2** A technical event becomes a concept of the domain it enters. Technical outcomes map to user concepts: the meaning comes from the contract, the name from the user domain, the mapping is a pure function of the user core. D2, D14, D74
- **ADP-3** A port speaks the consumer's language. "Port" alone means a secondary port; primary ports are use cases. D41, D86
- **ADP-4** A transport adapter does not translate: it carries the message and the return stream, keeps order within a stream, signals abort; it may lose and duplicate. Reliability is end to end. D73
  - The HTTP client of the relay is a transport for the mailbox port of `post`. [Q]
- **ADP-5** Cache and retry are decorators of the same port, under its contract: a retry never repeats a domain outcome, and a decorator offers only what it preserves of the inner adapter. D2
- **ADP-6** Storage is reached only through the ports; its shape is private to the adapter. D102
- **ADP-8** Recommended for a state adapter, not required (LIB-14): one state adapter for every domain of a node, so that a predicate over another domain's state is one more fragment of it, read atomically with the command (GR-3, D71); an algebra of fragments in its own language (a SQL condition, a filter, a function over a transaction), one per predicate by `$path` plus AND/OR/NOT, the same for commands and reads, so that a predicate has one translation; one write per fact by `$path`; a command executed in one consistent step of its own (a transaction, a conditional write), reading the failed leaves in the same step when its query language allows it, in a second read otherwise. Searches the state technology cannot do (vectors, full text) are separate projections fed by the facts (DOM-18). Sketch: `domains/test/shed/-adapter/sql.ts`. [Q]
- **ADP-7** The UI is an adapter of the user domain: it renders state, turns gestures into activities, listens to streams. Anything a product manager would name belongs to `user`. Activities are the use cases of `user`, at most one command each. D76, D58
  - In Q- the screen model is the pure domain `ui`, and the Solid rendering is its adapter (V2). [Q]

Adapters of Q- [Q, plan], by package; the order of writing is in the [development plan](plan.md):

| package           | adapters                                                                                                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adapters-common` | the libsodium primitives of `seals` (same wasm in browser and Node)                                                                                                                                                                            |
| `adapters-node`   | the relay's storage (SQLite, `node:sqlite`) and its HTTP interface (Hono), through `desk`                                                                                                                                                      |
| `adapters-web`    | IndexedDB stores with the single writer (DOM-9) and `storage.persist()`; the HTTP client of the relay; the Solid rendering; QR (drawn and scanned with the camera); the ticket link (after `#`); files (export and import); the service worker |

## 7. Configurators

- **CFG-1** A configurator is the composition root (the main): it picks the adapters and wires ports, the inbound interface to the persona, the effect executor to `post`, the reactions, the read port of auth to `bonds`. D88, D92, D104
- **CFG-2** Before the first request it checks what each component requires against what is offered: requirements derived from the code, offers declared by the adapters and proven by the suite; also the `Caller` fields auth reads against those the interface fills, and the frames needed against those written. An unmet requirement is a composition fault: the node does not start. Static wiring is checked by TypeScript; adapters picked by configuration at startup. D104
- **CFG-3** Three configurators [Q]: `phone` (the PWA), `relay` (`mailbox`, HTTP interface, storage port; no access logs, declared), `memory` (phone and relay in one process with `mailbox` imported instead of HTTP, still through the relay's personas (PER-19): the stack of the oracles, and the start of the nearby network of the native version).
- **CFG-4** Adapters never import configurators; domains import no other package. [Q]

## 8. Tests and conformance

- **TST-1** Domain tests run on the in-memory implementation. Run again against each adapter they are its conformance tests: suites parametrized by an adapter factory. A domain writes no separate conformance tests. D102
- **TST-2** The oracle is an in-memory state adapter that knows every domain, one module per domain, built from the domains' `dsl` functions over their own values: the other adapters of the port are compared with it, never adapter with adapter. Recommended, not required (V10): with the business domains isolated (GR-3) it is where the links between domains are typed (a fragment of `loans` over the state of `tools` imports the types of `tools`), and its imports show who reads whom (GR-1). The tests of the fragments that cross domains become one conformance suite run on the oracle and on each adapter. The `memory` configurator is the stack where the oracles run. D103, D102, D38 [Q]
- **TST-3** Compare only what is observable: state through the read port, never storage contents; positions only by order ("at least up to X"). Clock and ids are injected. D102, D48, D57
- **TST-4** Allowed deviations are injected, not hoped absent: loss, duplication and abort on transports (mandatory), resume and "position no longer available"; redeliveries on consumers. D103, D73, D69, D89
- **TST-5** Every command adapter passes: scenarios, differential (against the oracle, when there is one), concurrency (the result equals some serial order, ranges included); fact atomic with its mutation; a rejection leaves no fact; a duplicate returns the recorded fact at the same position, a different fingerprint is rejected; ids are never reassigned. The mid-write failure test is optional. D21, D79, D95, D96, D48
- **TST-6** An adapter is tested exactly on the capabilities it declares. D110
- **TST-7** Stability: the stable functions of the library are re-read against a corpus at every release; the JSON Schema export of every exported signature and fact is snapshotted and diffed in CI. D100, D101, D75
- **TST-8** Business correctness (cores, branches, predicates) belongs to the domain tests; the suite checks only what is mechanical. D102
- **TST-9** When the suite runs and how inputs are generated are left to Q-: on every pull request (`pnpm check`). In stage 1 the fast-check arbitraries are written by hand; generation from the zod schemas comes when hand-written arbitraries start duplicating them. D102, D104 [Q, plan]

Checks:

| automatic                                                                                                    | review                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| dependency-cruiser: arrows, no cycles, only `index.ts`, no Node or other packages in domains, npm only `zod` | an adapter with an `if` on a business rule (ADP-1)                                                                              |
| TypeScript: domains without DOM and Node                                                                     | a semantic rule without its test cases (LIB-4)                                                                                  |
| JSON Schema snapshots of signatures and facts (TST-7)                                                        | a retry that mints a new operation id (DOM-12)                                                                                  |
| transport and consumer suites contain the injected deviations (TST-4)                                        | a fact translation that reads state or clock, or invents a value (DOM-22)                                                       |
| conformance tests import no storage API (TST-3)                                                              | a reaction that reads changing state or invokes more than one command (DOM-16); `user` using a persona other than `self` (GR-7) |

## 9. Divergences of Q- from the paper

- **V1** No trusted server: every node is the server of itself and the trusted level is my node (F1). The paper reasons on a trusted server side. [Q]
- **V2** `ui` is a pure domain (the screen model) inside `domains`, and only its rendering is an adapter; in the paper the UI is the adapter of the user domain (D76). The paper's rule still holds: `ui` holds only presentational state.
- **V3** `seals`, `post` and `mailbox` are technical domains with their own language and use cases, outside the paper's types (user, persona, auth, business). In the paper the interface speaks the protocol and is deliberately not a domain with rules (D5), and technical concerns become user concepts, not a service domain (D2); Q- gives the protocol and the cryptography a domain each. [Q]
- **V4** "Every domain is a package" (D39) is read as a module unit: one package `domains`, a folder per domain, boundaries enforced by tools. [Q]
- **V5** The collect secret R of a mailbox is a bearer credential: whoever holds it collects. It is not an opaque value (D57): it is a transport credential that yields the relay's `Caller`, never a permission carried around.
- **V6** The paper's visitor has an anonymous session; `anonymous` has only an id per letter, and registration (D98) is done by `unknown`, whose key is verified but not known.
- **V7** Q- is the pilot of the paper's library, which grows by Q-'s needs (section 3).
- **V8** The actor's data (faces, bonds, memberships) live in the business domain `bonds`, not in auth: auth reads them through its ports (GR-4), and registration creates a bond, not a user (PER-11). In the paper auth's sources are external (token, database, identity provider, D43) and registration is a command of auth (D98).

- **V9** The change of state is carried by the fact, not by the branch of the command (DOM-5). In the paper a branch carries its own mutation with the primitives create, modify, delete (D16, D47, D94) and the fact records it with the resolved values (D54). The semantics is unchanged (state primary, fact atomic with it); what moves is where an author writes the change: in the content of the fact, read by one rule of the library, so that the business language names no primitive and no instance kind.
- **V10** The library has no semantics of state (LIB-14). In the paper it ships a reference interpreter that is the semantics of conditions and of the mutation primitives, the in-memory adapter and the oracle at once (D50, D102); every predicate declares what it reads, and a command's read set, which isolation covers, is derived from those declarations (D96); every adapter is compared with the oracle (D103). In Q- the domain gives commands, conditions and facts as data in the library's format, and its adapters materialize the state and evaluate the predicates; isolation is the adapters' (one writer per node gives it by construction, DOM-9); a pure implementation of the commands in `dsl` is an optional oracle (DOM-5). What stays as in the paper: the condition language and the rejection that names the failed predicates (LIB-7, DOM-6), the duplicate branch, the envelope, the total order. [Q]

- **V11** The business domains are isolated: none imports another, except the other's identities (GR-3). Each models its own view of the others' concepts, in its own language; the state adapter links them, implementing the downstream's predicates and queries over the upstream's state; the domains meet only above them (persona, user, reactions, adapters, configurators). In the paper two business domains that can import each other are conformist: the downstream consumes the upstream's use cases as its own ports without translating and composes its exported, versioned predicates; a translating adapter between importable domains is a violation (D36, D37, D41, D50.4, D71, D75.7). Q- gives up the compiler's check of the link and the single way of consuming a domain; it gains domains that evolve without touching each other, and a concept that can have another shape in each. The check moves to the in-memory oracle, where the links are typed (TST-2), and to the tests of the fragments that cross domains (GR-3); the value of a predicate was already the adapters' (V10). Atomicity across domains needs one state adapter for both (ADP-8). [Q]
- **V12** A query's selection uses selection predicates, a vocabulary apart from the predicates of the conditions, over the candidate of a subject that they do not name (DOM-18). In the paper commands, selections and applicability share one vocabulary of predicates (D44, D47.1), and the downstream composes the upstream's exported predicates in its selections (D50.4). The condition language (AND, OR, NOT, two-valued, LIB-7) is the same. Q- pays one translation more per concept in the adapters (a predicate and a selection predicate for "in service") and gains selections that read as plain filters over their subject. [Q]

## 10. Gaps of the paper met by Q-

Reported to the paper; until it answers, a point that depends on them is decided case by case and recorded in Q-'s decisions, not invented in the code.

- **G1** Restoring an export on a new device: positions, operation ids, outbox entries not yet executed, duplicates still in the mailbox.
- **G2** Between business domains that can import each other the paper offers only the conformist relation: no own view, no example of one concept with different models in two domains, no rule on how a domain types the ids of another, no reason given for the acyclic graph, nothing on a value over the upstream's data that the upstream does not have. Q- chose isolation (V11).

Outside the paper, to be decided by Q- when it comes: the life cycle of keys (rotating or revoking a face, keeping faces unlinked in shared outputs), which is business or credentials (D98).
