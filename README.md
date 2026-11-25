# q-

**q-** (read _Cumino_) is a network of messages between real people, with no center: people exchange their signs in person or at a distance, and every node decides what to spread. This repository holds the first prototype, a PWA for a small test community.

Status: skeleton. Nothing works yet.

## Structure

| Package           | What it is                                                                             |
| ----------------- | -------------------------------------------------------------------------------------- |
| `domains`         | The pure domains, one folder each (`library/`, `seals`, `post`, `mailbox`, `bonds`, …) |
| `adapters-common` | Adapters that run both in the browser and in Node                                      |
| `adapters-web`    | Browser adapters: IndexedDB, relay client, rendering, service worker                   |
| `adapters-node`   | Node adapters: the relay's HTTP server and storage                                     |
| `phone`           | Configurator: the PWA                                                                  |
| `relay`           | Configurator: the relay server                                                         |
| `memory`          | Configurator: phone and relay in one process, the stack of the oracles                 |

Architecture: [`docs/architecture.md`](docs/architecture.md). Development plan: [`docs/plan.md`](docs/plan.md). Vocabulary: [`docs/glossary.md`](docs/glossary.md).

## Development

Node 24 and pnpm (via `corepack enable pnpm`).

```sh
pnpm install
pnpm check            # type check, lint, format, architecture graph, tests
pnpm --filter @q-mino/phone dev
```

### The gallery

Every component of the app's look, in every case, in Roano (light) and Lavagna (dark) side by side: the page `galleria.html`, composed on every channel but the release.

- **On the test origin**: [q-mino-prova.github.io/q-/galleria.html](https://q-mino-prova.github.io/q-/galleria.html), from the phone or the computer. If the test app is installed in that browser, its worker serves the gallery of the version it holds: accept the update in the app first (or open the link in a private window).
- **On your computer**, from the project's folder:

  ```sh
  pnpm gallery            # composes dist/, serves it, prints the gallery's address
  pnpm gallery --watch    # composes it again at each change (reload the page by hand)
  ```

  One story alone, in one theme: `galleria.html?story=design-gesture--a-primary-gesture&theme=dark`.

- **Screenshots** as an Android phone (headless Chrome over CDP, light and dark), into `screens/`:

  ```sh
  pnpm screens                       # every story
  pnpm screens --only design-screen  # the stories whose id holds it
  pnpm screens --forced-dark         # also with Chrome's "darken websites"
  ```

The stories are in the Component Story Format (`packages/phone/src/gallery/stories/*.stories.tsx`), so they move to Storybook as they are if it is ever wanted.

- **The contrast** of the design's tokens, every text and graphic on its grounds in both themes, AA (it runs with the tests too):

  ```sh
  pnpm contrast
  ```

- **The icons** of the installed app, drawn from the logo (`packages/phone/assets/logo.svg`) into `packages/phone/public/` by headless Chrome; run it again when the logo changes, and commit what it writes:

  ```sh
  pnpm icons
  ```

## Where the app is published

- `q-mino.github.io/q-/`: releases, from the tags `v*`.
- `q-mino-prova.github.io/q-/`: test origin, from every push on `acceptance`, the branch where the work is merged before it goes to `main` in review.

## License

q- is free software under the [GNU AGPL-3.0](LICENSE). A commercial license is available on request for those who cannot meet the AGPL's terms. Contributions require signing the [CLA](CLA.md). The names and the logo are trademarks: see [TRADEMARK.md](TRADEMARK.md).
