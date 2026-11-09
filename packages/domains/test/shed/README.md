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

| question            | `tools`                                                                                                                                                                                                     | `loans`  | `shed` |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| a value with states | by subtraction: a schema with every field of every state, each state `.extend`s it with its discriminant and marks the fields it lacks `absent` (`?: undefined`); a discriminated union of compatible types | (step 3) |        |
