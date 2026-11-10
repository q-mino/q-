# Shed: the test domains

A neighbourhood tool shed, invented to drive the library with no word of Q- (LIB-2). Members borrow, reserve and return tools; a keeper manages the catalogue and the repairs; a visitor browses the catalogue.

| domain  | language                                              | role                               |
| ------- | ----------------------------------------------------- | ---------------------------------- |
| `tools` | tool; added, retired, under repair                    | upstream business                  |
| `loans` | loan, reservation, return (on time, late, damaged)    | downstream business, reads `tools` |
| `shed`  | the personas `visitor`, `member`, `keeper`, with auth | persona                            |

[`wlib.ts`](wlib.ts) is the wished library: the types and signatures the domains want from the library, without bodies. The code typechecks; nothing here runs until the library exists. It becomes the requirement of the library steps of [the plan](../../../../docs/plan.md).

Steps, in the order of the nucleus and the triggers (§ 3 of [`architecture.md`](../../../../docs/architecture.md)):

1. First command and fact: `tools`, "add tool".
2. Branches, predicates, duplicates: "retire tool".
3. A second domain that reads the first: `loans`.
4. Reads and streams.
5. Use cases.
6. Persona, auth, interface.
7. Effects and outbox: the due-date reminder.
8. Reactions: "tool retired → cancel reservations".
9. Processes: the repair after a damaged return.
10. (optional) Fact translation; bulk operation with a cursor.

## Experiments

Shed tries different approaches to the same question, one per domain, to compare them before one becomes a rule in [`architecture.md`](../../../../docs/architecture.md).

| question            | `tools`                                                                                                                                                                                                     | `loans`                                                                                                                                                                                                                                                                                                                                                        | `shed` |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| a value with states | by subtraction: a schema with every field of every state, each state `.extend`s it with its discriminant and marks the fields it lacks `absent` (`?: undefined`); a discriminated union of compatible types | by nesting: the fields every state shares stay flat; the state is one field, a discriminated union of states with only their own fields (`loan.progress`); a state of the whole is the schema `.extend`ed with one state (`ongoing_loan`); a fact that changes the state writes the new state whole (`returned_loan.pick({ id, progress })`), with no `absent` |        |

### A value with states: subtraction and nesting compared (step 3)

- **Nesting** (`loans`) gives honest types: a stage has only its own fields, a field of a stage reads only after narrowing on `progress.stage`; no `absent`. A transition writes the new stage whole, so an adapter has one rule for it (replace `progress`). Its limit: the creator does not read the state, so a fact can write only what it knows (input, context, constants); a field that must survive a transition belongs to the common part. Reading "the return date, if any" in a list needs narrowing or a `dsl` function.
- **Subtraction** (`tools`) lets any field read without narrowing, and a fact picks the fields it changes and leaves the others; the types carry `?: undefined` for the fields a state lacks.
- Reading so far: nesting for values with a life cycle in stages (loans, reservations: processes, DOM-19); subtraction for catalogue entries, where most fields are shared and states differ by a few. No rule yet: the test is step 9, when `tools` gains `underRepair`, a state with data of its own in the middle of a life cycle.
