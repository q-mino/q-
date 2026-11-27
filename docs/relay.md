# Cumino's relay: its public configuration

This is what the relay at `https://relay.cumino.aleclofabbro.it` is, who runs it, and what it sees, keeps and forgets. The phone's screen 1c points here. It is a declaration, not a guarantee: the software informs, it does not guarantee (see [Flaws, declared](#flaws-declared)). The rules behind it are in [`architecture.md`](architecture.md) § 7, "The relay" (REL-1..REL-7) and § 4 (MBX-1..MBX-9; the stand, INV-1..INV-10).

## Who runs it

- **Operator**: the Cumino project (q-mino). Contact: the [issues of the repository](https://github.com/q-mino/q-/issues).
- **Where**: one machine on AWS Lightsail in Frankfurt (`eu-central-1`, Germany), Debian 13. One relay, the phone's default (from part 3 of step 24).
- **Software**: this repository's relay (`packages/relay`, built into one module, REL-5), run by Node 24 LTS under systemd, with Caddy before it for HTTPS. Which build runs, and its source, the relay says itself: `GET /` (below).

## What it is for

A relay holds sealed envelopes for the phones that are not online at the same time (MBX-1). A phone deposits an envelope on a deposit address D; the phone that holds that mailbox collects it by showing the mailbox's collect secret R, whose hash is D (SEA-4). Anyone may deposit on any D; only who holds R may collect.

Since 27 November 2026 it also keeps **a stand of invitations** for **the assistant** (INV-1): a contact inside Cumino who answers questions about the project, run on Alessandro's laptop, its replies written by Claude ([`packages/assistant/README.md`](../packages/assistant/README.md)). A ticket is used once and expires in 48 hours, so no page can hold a fixed link: the assistant leaves fresh tickets on the stand, signed with a key of the stand's own, and each visitor of the page [`/assistente`](https://relay.cumino.aleclofabbro.it/assistente) who presses its button takes one.

## What it sees

- **The deposit addresses** (D) of the deposits and the collects, and the **operation ids** of the deposits (random, drawn by the phones).
- **When** envelopes arrive and **how large** they are; when a mailbox is collected and for how long a collect stays open.
- **The envelopes, sealed**: it cannot open them. Who wrote one, to whom, and what it says are inside the seal.
- **A collect secret R**, at each collect, in the `Authorization` header: it turns R into D and forgets R at once (MBX-6). R is never written.
- **The IP address** of whoever connects, as any server does: in memory, for the connection, and never written by the relay or by Caddy.
- **The assistant's tickets**, in clear, as the assistant leaves them: a ticket is a link to bond with the assistant, so whoever reads it (the relay, its operator, its provider) could bond with the assistant, as any visitor of the page can. A ticket holds no secret of a visitor.
- **When a link is taken** from the page, and which: not who took it (no account, no cookie; the address only in memory, as above).

## What it keeps, and for how long

In one SQLite database on the machine's disk (MBX-8):

- the envelopes, sealed, with their D, their position in the mailbox and the time they arrived;
- the deposits' operations (so that a phone that sends again the same deposit meets the same answer);
- the stand's **invitations** (INV-1..INV-4): at most five on the stand, each a ticket of at most 4 KiB, when it was left and until when it can be taken (24 hours, at most 48); a taken one keeps its ticket, for the one who took it to read once, until it is forgotten; one nobody took loses its ticket when its time is over.

A collected envelope is discarded by its holder's phone; whatever is left is **forgotten after eight days** (MBX-8), checked every hour. An invitation is **forgotten a day after its time to be taken is over** (INV-8): nothing of it stays past three days.

## What it does not keep

- **No access logs**: neither the relay nor Caddy writes a line per request (CFG-3). Caddy's two loggers that would tell of a request when it fails (its address, its path, its headers) are switched off.
- **No IP addresses**, of anyone who deposits or collects.
- **No backups**: a lost disk loses the envelopes not yet collected. The phones send again what was not answered.
- **No accounts**, no cookies, no tracking.

## The machine's journal

The machine keeps a journal for **a week** (200 MB at most): the relay's own lines (when it starts, with its version and commit; when it stops; its faults, never a request), Caddy's faults and its certificates' renewals, and the system's (among them the logins over SSH: the operator's, and the address of anyone who tries).

## The assistant's page

`GET https://relay.cumino.aleclofabbro.it/assistente` (INV-7) tells what the assistant is, that what one writes to it **leaves Cumino's network** (Claude, an external service, reads it), when it answers, and the steps; it takes nothing, so a preview of the link, a crawler or a reload spends no ticket. Its button sends `POST /assistente`, which takes the oldest ticket on the stand and shows its link to the test site (`https://q-mino-prova.github.io/q-/#ticket=…`) and its QR, or says there are none now. Until the assistant's key is in the relay's configuration, the page says the assistant is not there yet. The page is drawn by the relay for each request: no script, no cookie, not cached (`Cache-Control: no-store`), a strict `Content-Security-Policy`, `Referrer-Policy: no-referrer`, no CORS.

The assistant speaks to the stand over two paths (INV-5): `POST /inviter/leave_an_invitation`, signed (`Authorization: Signature <s>`, Ed25519 over `q-stand/` and the body as sent, verified with the stand's public key in the relay's configuration), and `POST /passer_by/the_invitations_on_a_stand`, which anyone may read: each invitation's id and until when, never its ticket. The configuration is public, in the unit: `CUMINO_RELAY_STANDS`, the stand's name, its inviter's public key, the site its links open (INV-6).

## The disk

The relay refuses deposits when the disk's free space falls below the greater of 1 GiB and 10% of the disk (REL-3): the answer is `507` `{ "fault": "the_relay_is_full" }`, and the phones try again later. Collects still answer. The relay looks at the disk as a whole: nothing of who fills it, nor of how much a mailbox holds.

## Version and source

`GET https://relay.cumino.aleclofabbro.it/` answers with the relay's version, its commit, and the link to the source of that commit, as the AGPL asks of a program used over a network (§ 13):

```json
{ "version": "…", "commit": "…", "source": "https://github.com/q-mino/q-/tree/<commit>" }
```

Every answer allows any origin (CORS, MBX-9): a page served anywhere, a fork's included, speaks to the relay as the PWA does.

## How the machine is kept

- HTTPS only (HTTP redirects to it); the certificate from Let's Encrypt, renewed by Caddy.
- Open to the world: ports 443 and 80 (Caddy), 22 (SSH, by key only, no root, no passwords). The relay itself listens on `127.0.0.1` only, as a user made for it at each start, and may write only its own database (systemd's isolation, REL-7).
- Debian's security updates installed every day by themselves, and the machine restarted at 04:00 UTC when an update asks for it; the relay starts again with it. Node is updated by the operator.
- Deployed by the operator from a commit pushed to this repository; if a new release does not answer with its commit, the release before comes back by itself (REL-7).

## Flaws, declared

- **The name tells whose domain it is**: `relay.cumino.aleclofabbro.it` is under a personal domain of one of the project's people. When Cumino has a domain of its own, the relay moves, and the bonds that name this one move with it.
- **The provider sees what the machine has**: AWS runs the machine, so it can read its disk (the database: sealed envelopes, D, times) and, in principle, its memory (the addresses of the connections, a collect's R in flight, the TLS keys). The traffic is encrypted up to the machine, not beyond it.
- **The relay sees the traffic's shape**: which mailboxes get envelopes, when, how large, and when they are collected, from which address (in memory). It cannot read an envelope, and it does not know who holds a mailbox; but whoever runs it could watch patterns.
- **The AGPL is a norm, not a proof**: `GET /` says what the operator's build says. Nothing on the network proves that the code running is that commit, or that this page is true. Who does not trust it can run a relay of their own, from the same source.
- **Anyone can fill it** (REL-3): then every deposit is refused alike, until the relay forgets or the operator makes room; the relay says so.
- **The certificate makes the name public**: certificates are logged in public, so the name was known, and probed, from the first minute.
- **The journal holds the addresses that try SSH**, for a week: the operator's and strangers', not the phones'.
- **Anyone may empty the stand** (INV-9): each press of the button takes a link, so a script can take the day's links (twenty, AST-13), and the page then says there are none until the next day. Nothing tells a person from a script: the relay keeps no address.
- **The relay's operator, and its provider, can take links**, or read the tickets kept, and bond with the assistant, as anyone can.
- **A leaked key of the stand** lets whoever holds it put tickets of another face on the page, until the configuration changes: a visitor would bond with that face, believing it the assistant. The face's name is in the ticket, and the phone shows it.
- **A link taken while the assistant is off** works only if the assistant comes back within its ticket's 48 hours (BND-10); the page says to take another after a couple of days.
- **What you write to the assistant leaves the network**: the relay carries it sealed, like any message, but the assistant's node opens it and Claude, a service outside Cumino, reads it (AST-1, the page says so).

## Its memory

The machine has 512 MB, the relay at most 320 MB (`MemoryMax`, REL-7). Measured on the laptop (28 Nov 2026, INV-8): the relay's build is about 100 MB resident at its start and 150–165 MB after its first hundred leaves and pages with their QR (the code's first use; a second hundred adds nothing). The stand keeps nothing in memory: a page is drawn for its request and kept nowhere.

## For the operator

The machine and its deploy are in [`deploy/relay/`](../deploy/relay/): `deploy.sh` (from a clean checkout of a pushed commit: `deploy/relay/deploy.sh`; `rollback`, `status`, `provision`), `provision.sh` (the machine made ready, idempotent), `activate.sh` (a release made current, with the rollback), `smoke.sh` (the relay asked as a phone would, and the stand's page and count, taking no link), the systemd unit and the Caddyfile. The rules: REL-7.

**The assistant's key** (INV-6, AST-13): the assistant draws its stand's key pair at its first start. Its public half (43 characters of base64url) goes into the unit's `CUMINO_RELAY_STANDS`, `[{"name":"assistente","inviter":"<key>","app":"https://q-mino-prova.github.io/q-/"}]`, committed and pushed; then, from a clean checkout of that commit, `deploy/relay/deploy.sh provision` installs the unit again and restarts the relay, and `deploy/relay/smoke.sh` says the page has its button.
