# The extensions on the oracle

The tests of the kernel's side of the extensions on q-'s oracle (part 12.4; F7, F8, EXT-2..EXT-15 of [`architecture.md`](../../../../docs/architecture.md)), with `greetings`, the test extension ([`packages/extensions/greetings`](../../../extensions/greetings/README.md)), in place of ping pong (step 14):

- [`the_port_of_requests.test.ts`](the_port_of_requests.test.ts): the kernel's port of requests over the post's oracle, Bruno's node played.
- [`the_kernels_port_of_requests.test.ts`](the_kernels_port_of_requests.test.ts): the kernel's own port of requests (EXT-8), the path it shares with the extensions' port, over the post's oracle, Bruno's node played: the identity `{ of: 'the_kernel', … }`, what it sends invokes the kernel, no refusal.
- [`greetings.test.ts`](greetings.test.ts): greetings composed from its `manifest.json`, hosted in process over its partition; the partitions.
- [`activations/`](activations/): the stories of the kernel's office of the extensions (EXT-7, EXT-8).
- [`on_the_oracle.test.ts`](on_the_oracle.test.ts), over [`harness.ts`](harness.ts): the checks of step 12 ([`plan.md`](../../../../docs/plan.md), "Checks") with two nodes.
- [`ping_pong.test.ts`](ping_pong.test.ts), over the same harness with the apps carrying ping pong (`carries: 'ping_pong'`; part 14.2): the checks of step 14, stories 10–14 of [ping pong's README](../../../extensions/ping_pong/README.md).

## The harness of two nodes

Anna's, Bruno's and Carla's nodes of q-'s oracle ([`../node/harness.ts`](../node/README.md), part 13.3): one cell each with the safe, the requests, the address book and the office of the extensions; one relay; faults injected on each node's transport; the story's clock. Their bonds are made for real, by Anna's tickets in a link that Bruno and Carla open, each introduction carried back and accepted (Anna's `B-BRUNO` and `B-CARLA`, theirs `B-ANNA`; Carla has no bond with Bruno), so that each bond has its own mailbox. Greetings is installed, activated from `self` and hosted in process through the boundary's messages. The asker's side is the kernel's: greetings' leaf on `self` through its mounted port, its delivery through the kernel's port of requests. The server's side is **the kernel's entry of part 13.2** (`the_kernels_entry`) over what the node's collector reads at its mailboxes: the letters opened; a request routed (`route`, over the office's reads and auth's `the_extensions_offered_to_the_bond_of_a_key`), silent with its case in the kernel's trace, or served by greetings' leaves mounted below **q-'s node of `known`** (auth's `the_bond_of_a_face_at_my_mailbox`, `not_found` when not known), its event the response, answered on the bond (PST-9); a response taken (PST-7), or annotated (`a_response_not_awaited`). A node closed is greetings unloaded; its post runs only when a story says so (`runs_at`).

Until part 13.3 the server's side was played by the harness, below a stand-in of the kernel's node on `known`, over two cells side by side; the checks it changed, by what the real entry and trees do: a node writes at the mailbox of its bond with the other (Carla to Anna at the mailbox Anna keeps for her; to Bruno, with no bond, at the mailbox of his bond with Anna); the `Caller` a leaf of `known` is given names the mailbox it wrote to (PER-23); a response lost on its way is in the server's kernel trace, `a_response_not_deposited`, `unreachable` (PER-25, 5).

## The checks of step 12, proven here

Each check by the name of its test in `on_the_oracle.test.ts`.

1. **A request and its response** (F7).
   - A request and its response, the return given once; the scope on `known` holds no key (EXT-2): `Anna greets Bruno: his node greets her back through the kernel’s entry, …`.
   - The response lost (on its way, `lost`: the relay never sees it), the request sent again, the same response from the server's duplicate branch: `the response lost on its way: …`.
   - No response in the asker's time, `no_response`; a late response annotated in the asker's kernel trace: `no response in the asker’s time: …`.
   - A response to no request of the node's, or from another face, annotated: `a response to no request of Anna’s, or from another face …`.
2. **The silence and the gate** (F8, EXT-6).
   - Not installed, not active, not offered to the bond: no letter back, the three alike from outside (`no_response`), each in the server's trace with its case: `greetings not installed, not active, or not offered …`.
   - `version_not_supported` only for an extension offered: `version_not_supported only for an extension offered: …`.
   - An undeclared leaf, `invalid_request` `not_a_leaf`: `an undeclared leaf of an extension offered: …`.
   - A peer's malformed input `invalid_request` before the kernel's node; a peer with no bond reads `not_found` only after it, and at the entry meets silence: `a peer’s malformed input: …`.
3. **An offer withdrawn, both ways** (EXT-7, F8).
   - The peer's requests meet silence, a request of the extension on that bond refused by the port of requests (`not_offered_to_the_bond`, nothing sent), the asker's greeting closed as called off, no dead letter (EXT-12; A, 21 Nov 2026): `Bruno withdraws greetings’ offer from Anna: …`.
   - A retry after a withdrawal or a deactivation meets silence, the asker records `no_response` and the server keeps its answer: `a retry after a withdrawal, or after a deactivation, …`.
4. **Claude's fixes at the gate** (F7, DOM-14, EXT-2, EXT-12).
   - Anna greets Bruno (P1, his phone off) and Carla (P2, answered), her phone closed and started again: P1 `no_response` at its time, P2 delivered again reads Carla's answer from the port's kept answer, one closing, no dead letter: `Anna greets Bruno (P1, his phone off) and Carla (P2, …`.
   - The port answers a bond gone, a refused call sends nothing: `the port answers a bond gone: …`, and the refusal of check 3.
   - A response that does not parse is a dead letter, the effect goes on toward the other bonds: `a response that does not parse (Bruno’s code changed): …`.
   - Each silence in the kernel's trace with its case: check 2's first test. The scope a peer's command gives the extension holds no key: check 1's first test.
5. **The life of an extension** (EXT-7, EXT-15).
   - An update whose manifest asks more leaves it inactive (not loaded, its leaves silent) until accepted; one that does not keeps it active: `an update whose manifest asks more: …`.
   - Not active, not loaded; at its deactivation its consumers stop; a delivery in flight meets its request again once it is active again: `deactivated while a greeting waits: …`.
   - A fall answers the local invocations with a technical outcome and the peers' with silence; a second fall leaves it stopped: `greetings falls on Bruno’s node (its partition full): …`.

## Proven by the earlier blocks

- Composition faults (a boundary major not spoken, a port not offered, a leaf on `known` that waits, an input on `known` the kernel cannot check (a refinement, a lossy form, EXT-6), an action's leaf, every fault in one message): `packages/adapters-common/test/extensions/composition.test.ts`; a `ready` that differs: `hosting.test.ts` there and `greetings.test.ts` here.
- zod's `fromJSONSchema` as the kernel's check of a peer's input: `composition.test.ts` ("zod’s fromJSONSchema …"); greetings' surfaces read whole: `greetings.test.ts`.
- Two extensions' partitions never meet, a commit all or none: `greetings.test.ts` ("the extensions’ partitions on the oracle").
- The ports typed by `touches` (a port not declared cannot be named, EXT-3): `packages/boundary/test/ports.test.ts`; an action whose leaf is no leaf of `self` does not compile: `packages/boundary/test/manifest.test.ts`, `packages/extensions/greetings/test/manifest.test.ts`.
- The cruiser's rules of GR-10 (an authored file of an extension's tree importing `boundary`, an extension importing a domain of the kernel): checked by hand in part 12.3, and `pnpm graph` on every check; the generator's `mounted` and a `takes` below it refused: `packages/generator/test/mounts.test.ts`.
- An undeclared call refused and traced; not active; two effects keyed by one value, or two extensions, never meet as one request; the bond gone: `the_port_of_requests.test.ts`; its storage undeclared or not active: `hosting.test.ts`.
- A request names its own extension's leaf only, the name the kernel's: `the_port_of_requests.test.ts` (the identity), `route_and_fence.test.ts` (a frame's).
- On `known` one event, the rest traced; the context and the scope a leaf is given: `hosting.test.ts`.
- An event added to `greet` fails to compile in the delivery: by construction (`adapter/delivery.ts` of greetings, its record mapped over `greet`'s events); greetings' stories: `packages/extensions/greetings/test/stories.test.ts`.
- The office's side of an update that asks more, a withdrawal, the extensions in common empty after the offer is withdrawn: `activations/activations.test.ts`; what asks more: `packages/adapters-common/test/extensions/activations.test.ts`.
- The extensions in common, the server's read (`the_extensions_in_common`) and the asker's question and its return: `activations/activations.test.ts`.

## Deferred, each to its step

- The extensions in common asked of a peer (EXT-8): proven in part 13.3, end to end on the node of q-'s oracle (`../persona/personas.test.ts`, story 5; `../entry/the_kernels_entry.test.ts`, story 3: the kernel never silent while an extension is). That an asker tells a silence from a node off by them (F8, "Another") has no test with the peer off: with `user`'s screens (step 15) or the stack (step 17).
- A frame reaching only its extension's leaves on `self` while active and shown, its invocations in the mark (EXT-4, EXT-16); an action drawn on a bond's screen, and none on a bond whose offer is withdrawn (EXT-7); an action invoking its leaf with its place's bond: steps 15 and 16 (the fence as a function: `route_and_fence.test.ts`).
- A dead letter shown in the extension's mark and redelivered by the user (EXT-2): steps 15 and 16 (at the host's level: `greetings.test.ts`, "its dead letter shown with its name; the user redelivers it").
- The browser's checks (a frame reaches no storage of the app's origin, no `fetch`, opens no window; `frame-src`): step 22.
- Ping pong in place of greetings: proven in part 14.2, below.

## The checks of step 14, proven here

Each check by the name of its test in `ping_pong.test.ts` (part 14.2; PNG-1..PNG-6). The node of the oracle hosts the extension its app carries (`installed`: not installed, `greetings` or `ping_pong`); ping pong's screen on `self` stops following at once there (its realm's time a 2 ms timer), what came back read in its partition; its follow, its 70 seconds and its stories through the boundary are in `packages/extensions/ping_pong/test/stories.test.ts` (stories 1–9).

- Preinstalled and off until the user activates it (PNG-1): `ping pong preinstalled and off: Bruno’s ping meets silence until Anna activates it`.
- A ping between two nodes with ping pong active gives its pong: `a ping between two nodes with ping pong active gives its pong`.
- To a node without it, or not offering it to that bond, no response, the same from outside; each silence in its node's trace with its case; the withdrawer's own ping refused by its port: `to a node without ping pong, or not offering it to that bond, no response: the same from outside`.
- A ping redelivered gives one pong (DOM-11, the server's duplicate branch through the entry): `a ping redelivered gives one pong`.
- The gate's scenario with ping pong (F7, DOM-14): `Anna pings Bruno (P1, his phone off) and Carla (P2): P1 no response, P2 its pong, none behind the other`.
