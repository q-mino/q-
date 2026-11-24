# q- — rules for Claude

q- (read _Cumino_) is a network of messages between real people, with no center. This repository is its first prototype: a PWA for a test community of eight adults, plus a relay. See [README.md](README.md).

## Before writing code

- Read [`docs/architecture.md`](docs/architecture.md): it derives the rules of this code from the architecture paper. Until it exists, write no domain code.
- Use the words of [`docs/glossary.md`](docs/glossary.md). A new domain term goes there first.
- If the architecture does not answer a question, decide with your judgement and go on: mark the choice `[Q, C, high impact: A to discuss]` where it lives (the code, `docs/architecture.md`), and note the scenario, the case, the decision and the alternatives set aside in the pull request ("High impact, for A") and in the session's log. Alessandro discusses it afterwards, in a session of its own (A, 24 Nov 2026). Never leave a rule unwritten in the code: the rule goes to `docs/architecture.md`, marked.

## Language

- English: identifiers, comments, docs, commits, pull requests, issues.
- Italian: the texts the users read, only in `packages/phone/src/texts/` (Italian is the first language), and an extension's own words in its `texts/` (EXT-16, WEB-22).

## TypeScript and the graph

- Strict everywhere. Never loosen a `tsconfig`, never use `@ts-ignore`: fix the type.
- Casts, `any` and the tools' directives (`eslint-disable-next-line`, `@ts-expect-error`) make typed code unreliable. Never in the domains' trees (Shed's, q-'s), where ESLint keeps it. Elsewhere avoided; allowed in a section hard to type (the library's builders and ports, the generator, the inside of an adapter or of the PWA where it meets I/O or a complex mapping) when: it stays confined to a small section that exposes precise types; it is reliable (what it asserts is checked, by parsing or by construction), never over data from outside, which is parsed; typing it correctly is impossible, or costs more than it gives. Prefer `unknown` and a type guard; no `any` in an exported signature. Each one says why on its line: a directive with `-- <reason>`, for one rule and the next line only (ESLint keeps it, and fails on one no longer needed); a cast with `// cast: <reason>`; a compiler's limit or a third party's wrong types named as such. The library's are listed in DOM-25.
- `domains` compiles without DOM and without Node: no `fetch`, `crypto`, `window`, `indexedDB`, `console`. Effects are declared as data and executed by adapters.
- Imports follow the arrows in [`.dependency-cruiser.mjs`](.dependency-cruiser.mjs). A folder is imported only through its `index.ts`. In the tree of the domains (the folders Shed's map, `sight.ts`, names, and those below them) an authored file imports only the generated scope of its kind (`_scope_command.ts`): the builders, its folder's components, its ancestors and the doors of the folders it sees, by the map (DOM-25). Changing an arrow is an architecture decision, not a fix.
- `domains/src/library/` imports no domain and contains no word of q-.
- Functional style: pure functions and immutable data; algebraic data types (discriminated unions) wherever a value has cases, states or outcomes.

## Preact

The screens are Preact with `@preact/signals`, JSX compiled by `tsc` (WEB-18).

- A component is drawn again at each change of what it reads. State lives in signals made once (`kept`), read with `.value`: in the render it subscribes the component; in a handler use `.peek()`. Derived values are computed in the render, not effects that set signals.
- An effect goes in `useEffect`, and its cleanup is what it returns: `signal.subscribe(...)`, or `while_it_is_open` for an effect with a cleanup of its own. Nothing outlives the component (a camera, a listener, a timer).
- Only `useEffect`, `useRef`, `useContext` from `preact/hooks` (the lint keeps it). No `useState`, no `useMemo`.
- Never HTML as a string: no `dangerouslySetInnerHTML`, no `innerHTML` (the lint keeps it).
- A screen's case goes in `data-state` where it has an ADT; no class or style chosen in code by the case.
- Lists get a `key` that follows the thing (a name, an id), not the index, where the item keeps state.

## Working

- One session per step of the [development plan](docs/plan.md), on its own branch, through a pull request. Never push to `main`; Alessandro reviews and merges. Releases (tags `v*`) are his.
- "Done" means `pnpm check` and `pnpm build` pass locally (a diff with no code — Markdown, text, images — only `pnpm format:check`).
- **While writing**, check the package you touch: `timeout 300 pnpm check:package <folder under packages/>` (its projects, its lint, its tests; TST-12). It does not see what breaks downstream.
- **The whole check**, `timeout 900 pnpm check` (TST-11), at the end of each level of work, before every commit and before every push.
- **One watch per checkout**: a `tsc -b --watch` on the package being written may run alongside (then `pnpm check:package <folder> --only=lint,test`); reuse the live one (`pgrep -af 'tsc -b'`), stop it before the whole check, a merge or a change of branch.
- **Every heavy command inside `timeout`** (check, typecheck, lint, tests, build).
- **One worktree per session that writes code**: two writers never share a checkout; heavy measures of two sessions at once are serialized by one lock outside the worktrees (`flock /tmp/q-heavy.lock <command>`).
- **Three red runs on the same failure**: stop, write it down, go on with what does not depend on it.
- The software informs, it does not guarantee: when you add a guarantee, ask "can it be tampered with?"; if yes, it becomes a declared feature, not a defense.
- Decisions and the session log live in Alessandro's notes, outside this repository: see `CLAUDE.local.md` if present.
