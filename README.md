# Q-

**Q-** (read _Cumino_) is a network of messages between real people, with no center: people exchange their signs in person or at a distance, and every node decides what to spread. This repository holds the first prototype, a PWA for a small test community.

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
| `memory`          | Configurator: phone and relay in one process, the oracle of the tests                  |

Architecture: [`docs/architecture.md`](docs/architecture.md). Development plan: [`docs/plan.md`](docs/plan.md). Vocabulary: [`docs/glossary.md`](docs/glossary.md).

## Development

Node 24 and pnpm (via `corepack enable pnpm`).

```sh
pnpm install
pnpm check            # type check, lint, format, architecture graph, tests
pnpm --filter @q-mino/phone dev
```

## Where the app is published

- `q-mino.github.io/q-/`: releases, from the tags `v*`.
- `q-mino-prova.github.io/q-/`: test origin, from every merge on `main`.

## License

Q- is free software under the [GNU AGPL-3.0](LICENSE). A commercial license is available on request for those who cannot meet the AGPL's terms. Contributions require signing the [CLA](CLA.md). The names and the logo are trademarks: see [TRADEMARK.md](TRADEMARK.md).
