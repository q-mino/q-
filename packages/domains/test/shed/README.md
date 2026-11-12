# Shed: the test domains

A neighbourhood tool shed, invented to drive the library with no word of q- (LIB-2). Members borrow, reserve and return tools; a keeper manages the catalogue and the repairs; a visitor browses the catalogue.

| domain                                | language                                           | kind                                                          |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| `business/tools`                      | tool; added, retired, under repair                 | business, upstream                                            |
| `business/loans`                      | loan, reservation, return (on time, late, damaged) | business, downstream, its own view of the tools (V11)         |
| `persona/visitor`, `member`, `keeper` | who browses, who borrows, who keeps the shed       | persona, one domain per hat, with the values of auth (DOM-25) |
| `auth/accounts`                       | account, hat, member card                          | auth: lookups over its adapters' data (PER-9, D43)            |

The library reasons by tree and knows no domain: a component is an export built by a builder of the library (`wlib.fact`, `wlib.command`, …), found by the generator, and its path is its folders, the kind its builder gives and its name (`business/tools/fact/a_tool_has_been_added`); the tree is made of the `@` folders (`@business/@tools/`), and in them the files are the author's choice, `x.ts` the author's and `_x.ts` the generator's, its twin, which the code imports (DOM-25). A domain is the architecture's: a folder in the folder of its kind. No business domain imports another, except its identities, the generated `_id.ts` (GR-3, V11, DOM-24); a persona imports of a business domain only its door, `_index.ts`, which exposes its use cases and identities and nothing else (GR-1): `loans` has its own view of the tools, keyed by the `tool_id` of `tools`, and the adapters link it to `tools`. The twins brand identities, facts, predicates and selection predicates with their path; `_registry.ts` lists each path with its component, for the library to find a path at runtime (DOM-24). Formats (`date_time_string`, `day`) are the library's. [`adapter/sql.ts`](adapter/sql.ts) is a sketch of a SQL state adapter; [`adapter/memory/`](adapter/memory/) a sketch of the in-memory oracle, the reference interpreter (TST-2, V10), one module per domain, whose imports show who reads whom, with its reads typed by subject (DOM-18).

[`wlib.ts`](wlib.ts) is the wished library: the types and signatures the domains want from the library, without bodies. The code typechecks; nothing here runs until the library exists. It becomes the requirement of the library steps of [the plan](../../../../docs/plan.md).

Steps, in the order of the nucleus and the triggers (§ 3 of [`architecture.md`](../../../../docs/architecture.md)):

1. First command and fact: `tools`, "add tool".
2. Branches, predicates, duplicates: "retire tool".
3. A second domain that reads the first: `loans`.
4. Reads and streams.
5. Use cases.
6. Persona, auth, interface. Left from step 5:
   - done: `keeper`, a domain of kind persona, and its leaf `retire_a_tool` in the full form (PER-6: own input and events, creator, projection; `wlib.command_use_case_over`).
   - done: `auth/accounts`, a domain of kind auth, its lookups (`wlib.lookup`) of the hats of an account and of its member card, distinct from the account (PER-1, PER-9); its data in the oracle, `adapter/memory/accounts.ts`.
   - the personas `visitor`, `member`, a domain each (DOM-25), and their trees (PER-6): leaves that invoke the use cases of `tools` and `loans`, a persona use case with an input of its own, a creator that injects the values of the caller (`member_id` from the `Caller`, D33) and its events projected for the actor (D45), the first case of a use case's own parts (DOM-2);
   - the node per folder (A, 12 Nov 2026), decided in principle on 12 Nov 2026 (2) (PER-6, PER-9, DOM-25): a node (`wlib.node`) in any folder, whatever the tree; its context, typed, given by the entry (the interface; for an invoked tree, the leaf), extended going down, never rewritten, read by every construct below; its lookups of auth (`wlib.lookup`: one key, one value or "not known"), then its conditions and bindings, pure; never a query or a read of business state. A node above the personas gives context and constraints, never leaves (D78). Start from Marta's scenario: `persona/member/`, the `member_id` from auth, injected by the creator of `borrow_a_tool` (D33).
   - done: the context (PER-6): the library's `RootContext` (`now`), which the application extends, `OperationContext` for a command, beside the context; a creator declares the part it reads. The `Caller` (PER-4) is the persona's context, not the library's: it replaced the placeholder `CommandContext.uid`.
   - the hat (PER-7); the interface: contract version, then hat (PER-5); auth as a domain whose read use cases a node reads (PER-9, D43): all the architecture's, with the mechanisms of no kind the library gives (LIB-1);
   - the base events no use case declares: hat not available, version not supported, invalid request, identity already used (DOM-11);
   - done: the kind of a domain declared by its folder (`business/`, `persona/`), and the persona importing a business domain's `usecase` and `id` only, never `command` or `query` (`.dependency-cruiser.cjs`);
   - the consumers: a live view takes a read use case port that streams (`wlib.Streamed`); a persona's limit on reads (a visitor keeps no stream open), if a case asks.
   - a business domain's own tree (D105): a business use case under a node ("a pending order") that adds the node's conditions to its command, a possible first business use case written by hand, beside the persona's.
7. Effects and outbox: the due-date reminder; the deadline as a fact, so that an overdue loan can enter a stream (no fact makes a loan overdue before then: time is not a fact, D68.3, D92.4).
8. Reactions: "tool retired → cancel reservations". The fact log of the adapters (DOM-2, DOM-17) is what they read. A scenario to weigh (A, 12 Nov 2026): a command, then the facts that cascade from it, followed by correlation (DOM-10): Marta returns a tool damaged, her screen follows the repair it opens. In the paper a use case may stay open after the outcome until the final event it expects (D58.2), with the events it declares; listening beyond what a persona exposes is excluded (pub/sub discarded, D64).
9. Processes: the repair after a damaged return. A transition composed into another's (D111, DOM-19): a command with no use case of its own, and a fact in parts.
10. (optional) Fact translation; bulk operation with a cursor.

## Experiments

Shed tries different approaches to the same question, one per domain, to compare them before one becomes a rule in [`architecture.md`](../../../../docs/architecture.md).

| question            | `tools`                                                                                                                                                                                                     | `loans`                                                                                                                                                                                                                                                                                                                                                        | personas |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| a value with states | by subtraction: a schema with every field of every state, each state `.extend`s it with its discriminant and marks the fields it lacks `absent` (`?: undefined`); a discriminated union of compatible types | by nesting: the fields every state shares stay flat; the state is one field, a discriminated union of states with only their own fields (`loan.progress`); a state of the whole is the schema `.extend`ed with one state (`ongoing_loan`); a fact that changes the state writes the new state whole (`returned_loan.pick({ id, progress })`), with no `absent` |          |

### A value with states: subtraction and nesting compared (step 3)

- **Nesting** (`loans`) gives honest types: a stage has only its own fields, a field of a stage reads only after narrowing on `progress.stage`; no `absent`. A transition writes the new stage whole, so an adapter has one rule for it (replace `progress`). Its limit: the creator does not read the state, so a fact can write only what it knows (input, context, constants); a field that must survive a transition belongs to the common part. Reading "the return date, if any" in a list needs narrowing or a `dsl` function.
- **Subtraction** (`tools`) lets any field read without narrowing, and a fact picks the fields it changes and leaves the others; the types carry `?: undefined` for the fields a state lacks.
- Reading so far: nesting for values with a life cycle in stages (loans, reservations: processes, DOM-19); subtraction for catalogue entries, where most fields are shared and states differ by a few. No rule yet: the test is step 9, when `tools` gains `underRepair`, a state with data of its own in the middle of a life cycle.
