# The assistant in a container

Cumino's assistant (`packages/assistant`, AST-1..AST-16) runs on Alessandro's laptop in a Docker container, which is its cage (AST-8): its root read-only, every capability dropped, no new privileges, its user Alessandro's uid, and only these folders mounted (`compose.yaml`):

| In the container           | On the laptop                                    | How        |
| -------------------------- | ------------------------------------------------ | ---------- |
| `/srv/source`              | `~/my-brain/wt/q/projects/q` (the copy's source) | read-only  |
| `/srv/notes`               | `~/my-brain/wt/q/projects/q/richieste`           | read-write |
| `/data`                    | `~/.local/share/cumino-assistente`               | read-write |
| `/config/claude`           | `~/.config/cumino-assistente/claude`             | read-write |
| `/config/never-copied.txt` | `~/.config/cumino-assistente/never-copied.txt`   | read-only  |

Inside, the node runs (`/opt/cumino-assistente/assistant.mjs`, the bundle), and for each turn `claude -p` (Claude Code 2.1.302, pinned in the image) with Read, Grep and Glob only, `--restricted`, its working directory the copy, and deny rules for `/data`'s files, the source, the configuration and the system (AST-9). The node's journal is the container's log: never a text, a name or a bond.

All commands from the repository's root, in a checkout of the commit to run (a clean one: `git status` empty). The container running now was built on 28 November 2026 from `~/code/q--asst` (a worktree of the night's sessions); any clean checkout of `q-` builds and replaces the same container (the project's name, `cumino-assistente`, is in `compose.yaml`).

## In the morning: is it there, what runs, where the notes are

```bash
docker ps --filter name=cumino-assistente --format '{{.Status}}'
```

```bash
docker logs cumino-assistente 2>&1 | grep ' started: ' | tail -1
```

The second says the version and the commit running, its answerer (`claude (sonnet, low, caged by the_container)`) and its copy. Then each turn by its outcome, never a text: `a turn answered in 12.3 s (Claude Code's estimate $0.041)` (the estimate is what the reply would cost on the API: a measure of the quota it used, which the subscription does not bill in dollars), `an attempt over its time`, `an attempt over its budget … the apology`, `a turn closed: replied | the_apology | the_notice_of_… | passed_over`, `the stand topped up: …`. `the answerer is not logged in: the turns wait` means the bot's login is gone: log in again (below), nothing is lost.

**The notes** of the requests people asked to save land in `~/my-brain/wt/q/projects/q/richieste/` (the project's worktree, untracked), one file each, `<day>-<title>-<six hex>.md`, `owner: claude`, `status: draft`; the journal says `a note written`. They are committed at the project's passes, after a look.

**The chats** stay in `~/.local/share/cumino-assistente/node.sqlite`, as on a phone (the welcome and the page say so).

## Before the first start

```bash
mkdir -p ~/my-brain/wt/q/projects/q/richieste ~/.local/share/cumino-assistente
chmod 700 ~/.local/share/cumino-assistente
```

The bot's login, once, in its own configuration (never `~/.claude`):

```bash
CLAUDE_CONFIG_DIR=~/.config/cumino-assistente/claude claude
```

then `/login` with the account, then `/exit`. Until then the assistant answers nothing and loses nothing (story 17).

## Build

```bash
Q_COMMIT=$(git rev-parse HEAD) Q_VERSION=$(git describe --tags --always) docker compose -f deploy/assistant/compose.yaml build
```

## Start

```bash
docker compose -f deploy/assistant/compose.yaml up -d
```

`restart: always`: Docker starts it again after a fault and at the laptop's start. Its first start makes the face «Assistente di Cumino», activates messaging and ping pong, draws the stand's key and tells its public half in the log:

```bash
docker logs cumino-assistente 2>&1 | grep "the stand's key"
```

That key goes into the relay's configuration (`deploy/relay/cumino-relay.service`, `CUMINO_RELAY_STANDS`, `"inviter":"<key>"`), then `deploy/relay/deploy.sh provision`: until then every ticket it leaves is refused (`not_found`), and the page says the assistant is not there yet.

A run with the scripted answerer (no Claude, a test reply): `CUMINO_ASSISTANT_ANSWERER=scripted docker compose -f deploy/assistant/compose.yaml up -d`.

**Its numbers** are settings (`packages/assistant/src/settings.ts`): `CUMINO_ASSISTANT_TURNS_PER_BOND` (15 a day), `CUMINO_ASSISTANT_TURNS_PER_DAY` (60), `CUMINO_ASSISTANT_SECONDS` (180 an answer), `CUMINO_ASSISTANT_ATTEMPTS` (2), `CUMINO_ASSISTANT_BUDGET_USD` (0.50 an attempt), `CUMINO_ASSISTANT_MODEL` (`sonnet`), `CUMINO_ASSISTANT_EFFORT` (`low`). To change one, add it under `environment:` in `compose.yaml`, then `up -d` again. `CUMINO_ASSISTANT_TURNS_PER_DAY: '0'` keeps it answering nothing but the day's notice.

## The round end to end

With the container running and its key in the relay's configuration (the stand topped up within five minutes):

```bash
pnpm end-to-end:assistant --commit <the test site's commit>
```

Two visitors in two headless Chromes, from the page `/assistente` to the assistant's replies (stories 26–28, 21, 22 of `packages/assistant/README.md`): four turns of the answerer (with `claude`, four replies of the bot's quota), two links of the stand, two bonds kept by the assistant (Ottavia and Ludovica, test faces), and the container stopped, started and restarted once each. The note it makes is deleted at its end (`--keep-the-notes` to keep it).

## Logs, stop

```bash
docker logs -f cumino-assistente
```

```bash
docker compose -f deploy/assistant/compose.yaml stop
```

`stop` sends `SIGTERM`: the answerer's process ended, the turn in progress left as the register has it, the node stopped. With `restart: always` a container stopped by hand starts again at the laptop's next start (Docker's daemon); to keep it off, `down`, which removes the container (the data stay on the laptop); `up -d` makes it again.

From anywhere, without a checkout, to stop it now and keep it off until it is started again:

```bash
docker update --restart=no cumino-assistente
```

```bash
docker stop cumino-assistente
```

`docker update --restart=always cumino-assistente` and `docker start cumino-assistente` undo them.

## Update

```bash
git fetch origin
```

```bash
git checkout --detach origin/acceptance
```

```bash
Q_COMMIT=$(git rev-parse HEAD) Q_VERSION=$(git describe --tags --always) docker compose -f deploy/assistant/compose.yaml up -d --build
```

Claude Code's version is the image's `CLAUDE_CODE_VERSION` (`Dockerfile`), Node's the `NODE_IMAGE`: change them there, then build again.

## What the container does not keep from Claude Code

`bwrap` (the other cage, for a run outside a container) gives the answerer a filesystem of its own; in the container the answerer's process is the node's child, so it sees what the container mounts (the node's storage, the register, the stand's key, the source read-only). Only its tools are kept from them (`--restricted` and the deny rules, checked on 28 November 2026 with the real `claude`: `/home`, `/config/claude`, `/srv/source`, `/data/stand.key` and `/etc` refused, the copy read; again in B6, with a neutral prompt asking the tools: `/tmp`, `/data` by `../..`, `/config`, `/srv/notes`, `/opt` and `/` refused as outside the working directory). A declared flaw (AST-8, AST-15).
