# Scenarios of the library

The catalogue of the scenarios that the library, zen0, must hold: its own use cases, and those typical of applications and systems (Alessandro's goal, 16 Nov 2026). Each scenario is a story of Shed, the test domains in [`packages/domains/test/shed/`](../packages/domains/test/shed/README.md), with the rules it exercises (ids of [`architecture.md`](architecture.md)), its status and the library step of [the plan](plan.md) that runs it.

- **Covered**: Shed holds it, in the step named; the library step runs it as a test on the oracle at its close.
- **Open, reshapes**: Shed does not hold it yet, and it may change the shape of what the library builds (LIB-3: no rule without its case).
- **Open, adds**: Shed does not hold it yet; it adds a component or a test without changing a shape.
- **Out of scope**: not the library's in stage 1, with the reason.

Every open scenario is written in Shed at step 2 of the plan, before any code of the library, those that reshape first in each part (Alessandro, 17 Nov 2026); at its close every scenario in scope is covered. The catalogue is closed at the start of step 2: a scenario found later is added as open and enters step 2 only if Alessandro decides. Ids are stable: a scenario keeps its id when its status changes. A new scenario takes the next id.

## Commands and facts (step 4)

- **SC-1** (covered, Shed 1) Luca adds the drill to the catalogue: a command, its branch, its fact. DOM-1, DOM-5, DOM-10.
- **SC-2** (covered, Shed 2) Luca retires the drill, already retired: the branch "nothing to do" records a fact, never a silent no-op; a rejection names every failed predicate. DOM-5, DOM-6, D95.
- **SC-3** (covered, Shed 2, 6) The same command sent twice: the duplicate branch gives the fact recorded; the same operation with another input is `identity_already_used`. DOM-11, D100, D106.
- **SC-4** (covered, Shed 3) Marta borrows the drill: `loans` keeps its own view of the tools, keyed by `tools`' identity, and the adapter links them. GR-3, V11, DOM-24.
- **SC-5** (covered, Shed 3, 9) A value with states: a loan by stages (nesting), a tool under repair (subtraction). DOM-19, § Experiments of Shed.
- **SC-6** (covered, Shed 4) Gianni books the ladder for a day outside the window: `invalid_request`, a static rule over the input and `now`. DOM-21.
- **SC-7** (covered, Shed 9) The drill goes to the workshop: its stay named by `tools` from the operation, since nobody outside can name it. DOM-23, D75.8.
- **SC-8** (covered, Shed 10) Marta's loan of `loans` 1.x read after 2.0.0, by every reader at the current shape; the SQL table rebuilt from the log. DOM-22, V14.
- **SC-9** (covered, Shed 10) `business/loans/1/` deleted while a fact of 1.x is kept: the release stops at its start. DOM-22, PER-17.
- **SC-10** (covered, Shed 11) Gianni takes the drill on the day he booked it: the loan withdraws the reservation, one fact in two parts outside a step (`composes` outside the step). DOM-19, DOM-20, D111.
- **SC-11** (covered, Shed 11) Marta and Gianni ask for the last drill at the same instant: one loan, the other `the_tool_is_not_available`; concurrency equals some serial order; a retry in flight reads the first's fact. DOM-9, DOM-11, ADP-8.
- **SC-12** (covered, Shed 11) The day of an instant: Marta borrows at 23:30 in her town, which is already the next day in UTC; `day_of` and `end_of` need the shed's time zone. LIB-2, DOM-22, PER-17.
- **SC-13** (covered, Shed 11) Luca lent the wrong tool: a compensating command with its fact, never a fact removed. DOM-22, D101.

## Reads and streams (step 5)

- **SC-14** (covered, Shed 4, 6) The visitor's catalogue: a query with its selection, order and identity; the snapshot alone, no stream; projected field by field, without the keeper's notes. DOM-18, LIB-9, PER-18.
- **SC-15** (covered, Shed 4, 6) Marta's live "my loans": the stream from a position, `entered`, `left`, `fact`, `caught_up`, a resume, `position_unavailable`. DOM-17, D64, D72.6.
- **SC-16** (covered, Shed 7) "Your loan is overdue": a fact by name in a persona's stream; every other fact as the row. PER-18, D72.5.
- **SC-17** (covered, Shed 9) Gianni's R8 reads "the tool you booked is in repair" from the part of a composite fact that touches it. DOM-17, D111.
- **SC-18** (covered, Shed 9) A fact of `loans` does not reach the visitor's catalogue: a query's stream sees its domain's facts only. DOM-17, DOM-8.
- **SC-19** (covered, Shed 11) Luca renames the drill: the row of Marta's "my loans" shows the new name, an entry that reads another domain. DOM-17, GR-3, V11.
- **SC-20** (covered, Shed 11) Gianni's "my reservations" shows whether the tool is in the workshop: a selection over another domain's state. DOM-18, GR-3.
- **SC-21** (covered, Shed 11) Luca asks how many loans each tool had this month: a read that counts, not a list of entries; a calculation beside the fields. DOM-18, D50.7.
- **SC-22** (covered, Shed 11) The catalogue holds 2,000 tools: the snapshot read in pages, a stream of snapshots pulled by the consumer, each with its position, the total and the next page's cursor. DOM-18, D50, D72.8.

## Trees and personas (step 6)

- **SC-23** (covered, Shed 5, 6) Luca retires a tool as keeper: a leaf in the full form, its own input and events, creator, projection of every branch and of the rejection. PER-6, DOM-2, D45.
- **SC-24** (covered, Shed 6) Marta's node: her card from auth, the hat as a perimeter (`not_found`); an expired card blocks borrowing, not reading her loans (`refused`, a limit of the leaf). PER-7, PER-9, PER-14.
- **SC-25** (covered, Shed 6) The visitor, worn by anyone, signed in or not. PER-7, V13.
- **SC-26** (covered, Shed 6) The base events: `invalid_request`, and `identity_already_used` crossing the leaf unprojected. PER-5, D106.
- **SC-27** (covered, Shed 9) Marta returns the drill damaged and her screen follows it to the workshop, or `the_wait_is_over` after a minute. DOM-3, DOM-10, D58.2.
- **SC-28** (covered, Shed 10) Marta's old phone at `1.4.0` and Gianni's new one at `2.0.0` borrow by the same path and read the deadline each in its own words. PER-17, D72.7.
- **SC-29** (covered, Shed 10) The gate: `2.1.0` on a server at 2.0.0, `1.2.0` after `1/` is deleted, `3.0.0` during a release. PER-17.
- **SC-30** (covered, Shed 10) A past read leaf names its rows by a field it declares, checked by type. PER-17, PER-18.
- **SC-31** (covered, Shed 11) A business domain's own tree: a business use case under a node that adds its conditions to the command ("a pending order"): Marta extends her loan under "an ongoing loan". D105, D51.
- **SC-32** (open, adds) A persona's limit on reads: a leaf that streams for some wearers and not for others, by their values. PER-18, D80.
- **SC-33** (covered, Shed 11) Which buttons are active on each row of "my loans" (return, extend): a command's applicability evaluated per entry. D51.
- **SC-34** (open, reshapes) The workshop's system confirms a repair by a call from outside: a caller that is neither a person nor an internal entry. PER-4, PER-12.

## Effects, reactions, processes (step 7)

- **SC-35** (covered, Shed 7) The due-date reminder: a wait until the eve, its return reminds Marta only if she still has the tool. DOM-13..15, D68.3.
- **SC-36** (covered, Shed 7) The deadline as a fact: the overdue wait stamps the loan. D68.3, D92.4.
- **SC-37** (covered, Shed 7) The executor down past the due date: the eve's reminder comes late and records that the due date came first. D108, D95.
- **SC-38** (covered, Shed 10) Marta's waits queued at 1.x: the eve with the new shape, the overdue wait put off to the end of her due day. DOM-22.
- **SC-39** (covered, Shed 8) Luca retires the ladder: a reaction opens the desk's work sheet, whose steps cancel R3 then R5 by a cursor; a redelivery cancels R5 once. DOM-16, DOM-20, D97, D112, TST-4.
- **SC-40** (covered, Shed 9) A damaged return sends the drill to the workshop, a whole one does nothing; a redelivery opens one stay. DOM-16, D88.2.
- **SC-41** (covered, Shed 9) The round of repair notices: one notice per repair and reservation, a second round for a second stay. DOM-13, DOM-20.
- **SC-42** (open, reshapes) A fact of the drill goes to a dead letter, and the next fact of the drill waits behind it. D94.7, DOM-16.
- **SC-43** (open, adds) Every Monday the desk sends the week's summary: a wait whose return queues the next. DOM-13, D48.
- **SC-44** (open, adds) Luca loads 200 tools from a sheet: a bulk operation with a cursor. DOM-20, D112.

## The generator (step 3)

- **SC-45** (covered, Shed 2-10) The map: a persona sees of a business domain its use cases, identities and facts; a business domain of another only its identities; a reaction above them. DOM-25, GR-1, GR-3, GR-9.
- **SC-46** (covered as a rule, Shed 10) A component declared under two names, a component of a past major forgotten in its folder, a schema changed without a new version, each by direction: the generator or CI stops. DOM-22, DOM-24, PER-17.

## Out of scope

- **SC-47** Marta leaves the shed and asks to be forgotten, while the log is never rewritten: in stage 1 every node keeps only its owner's data and its peers' letters; with its case.
- **SC-48** The audit of every message, fact and event, with provenance: later (the library's functions noted on 10 Nov 2026).
- **SC-49** The transport given to the library (a FIFO, a broker): later, an adapter of the use cases (ADP-4).
- **SC-50** Two sheds on one server: a node of q- has one owner.
- **SC-51** Full-text search of the catalogue: an adapter's index; the library stays logic (LIB-14, V10).
- **SC-52** Restoring an export on a new device: q-'s step of export and import (G1).
