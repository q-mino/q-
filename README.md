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

## The relay

`https://relay.cumino.aleclofabbro.it`, the project's, declared by the test and the release channels (REL-8): what it is and what it keeps, in [`docs/relay.md`](docs/relay.md), its public configuration; its deploy, in [`CLAUDE.md`](CLAUDE.md) § The relay and its deploy and `deploy/relay/`. A local build declares an address of no relay; `Q_RELAY=https://relay.cumino.aleclofabbro.it pnpm build` makes one on the project's.

- **The round, end to end**, on a published site and its relay: two nodes, each a headless Chrome with a profile of its own, through the first faces, the handshake by link, ping pong activated by both, a ping and its pong, and a ping to a node that has not activated it, which meets silence (about a minute and a half, most of it the silence's 60 seconds). A line per step and the time from the ping to the pong; the report as JSON; exit 0 only if every step is ok:

  ```sh
  pnpm end-to-end                                         # the test site, q-mino-prova.github.io/q-/
  pnpm end-to-end --url http://localhost:5173/q-/         # a local build made with Q_RELAY, served by `pnpm --filter @q-mino/phone preview`
  pnpm end-to-end --out round.json --tries 6              # where the report goes; loads of a page that does not open
  ```

  `--commit <sha>` also asks that the site serve that commit (after a push on `acceptance`, once the workflow `Test origin` is green; the CDN keeps a file up to ten minutes). A cold load is about 900 requests, and GitHub Pages answers 429 to an address that asks too much (two runs back to back are enough): the profiles are loaded one at a time, a page that does not open is loaded again after 30 seconds, then 60, then 120, and the 429s are counted in the report. Each run leaves two bonds' mailboxes on the relay, forgotten after eight days (MBX-8).

## License

q- is free software under the [GNU AGPL-3.0](LICENSE). A commercial license is available on request for those who cannot meet the AGPL's terms. Contributions require signing the [CLA](CLA.md). The names and the logo are trademarks: see [TRADEMARK.md](TRADEMARK.md).
