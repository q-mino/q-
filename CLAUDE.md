# Q- — rules for Claude

Q- (read _Cumino_) is a network of messages between real people, with no center. This repository is its first prototype: a PWA for a test community of eight adults, plus a relay. See [README.md](README.md).

## Before writing code

- Read [`docs/architecture.md`](docs/architecture.md): it derives the rules of this code from the architecture paper. Until it exists, write no domain code.
- Use the words of [`docs/glossary.md`](docs/glossary.md). A new domain term goes there first.
- If the architecture does not answer a question, stop and ask. Never invent an architecture rule in the code.

## Language

- English: identifiers, comments, docs, commits, pull requests, issues.
- Italian: the texts the users read, only in `packages/phone/src/texts/` (Italian is the first language).

## TypeScript and the graph

- Strict everywhere. Never loosen a `tsconfig`, never use `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable` or a cast to silence an error: fix the type.
- `domains` compiles without DOM and without Node: no `fetch`, `crypto`, `window`, `indexedDB`, `console`. Effects are declared as data and executed by adapters.
- Imports follow the arrows in [`.dependency-cruiser.cjs`](.dependency-cruiser.cjs). A folder is imported only through its `index.ts`; a domain's module folder, through its generated `$index.ts` (DOM-25). Changing an arrow is an architecture decision, not a fix.
- `domains/src/library/` imports no domain and contains no word of Q-.
- Functional style: pure functions and immutable data; algebraic data types (discriminated unions) wherever a value has cases, states or outcomes.

## Solid

- A component runs once: it is setup, not a render function.
- Never destructure props; use `props.x`, `splitProps`, `mergeProps`.
- Read signals by calling them inside JSX, `createMemo` or `createEffect`; derived values are `createMemo`, not effects that set signals.
- Control flow with `<Show>`, `<For>`, `<Switch>`; no early `return` on reactive values; lists with `<For>`, not `.map`.

## Working

- One session per step of the [development plan](docs/plan.md), on its own branch, through a pull request. Never push to `main`; Alessandro reviews and merges. Releases (tags `v*`) are his.
- "Done" means `pnpm check` and `pnpm build` pass locally.
- The software informs, it does not guarantee: when you add a guarantee, ask "can it be tampered with?"; if yes, it becomes a declared feature, not a defense.
- Decisions and the session log live in Alessandro's notes, outside this repository: see `CLAUDE.local.md` if present.
