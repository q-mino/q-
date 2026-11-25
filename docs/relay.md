# Cumino's relay: its public configuration

This is what the relay at `https://relay.cumino.aleclofabbro.it` is, who runs it, and what it sees, keeps and forgets. The phone's screen 1c points here. It is a declaration, not a guarantee: the software informs, it does not guarantee (see [Flaws, declared](#flaws-declared)). The rules behind it are in [`architecture.md`](architecture.md) § 7, "The relay" (REL-1..REL-7) and § 4 (MBX-1..MBX-9).

## Who runs it

- **Operator**: the Cumino project (q-mino). Contact: the [issues of the repository](https://github.com/q-mino/q-/issues).
- **Where**: one machine on AWS Lightsail in Frankfurt (`eu-central-1`, Germany), Debian 13. One relay, the phone's default (from part 3 of step 24).
- **Software**: this repository's relay (`packages/relay`, built into one module, REL-5), run by Node 24 LTS under systemd, with Caddy before it for HTTPS. Which build runs, and its source, the relay says itself: `GET /` (below).

## What it is for

A relay holds sealed envelopes for the phones that are not online at the same time (MBX-1). A phone deposits an envelope on a deposit address D; the phone that holds that mailbox collects it by showing the mailbox's collect secret R, whose hash is D (SEA-4). Anyone may deposit on any D; only who holds R may collect.

## What it sees

- **The deposit addresses** (D) of the deposits and the collects, and the **operation ids** of the deposits (random, drawn by the phones).
- **When** envelopes arrive and **how large** they are; when a mailbox is collected and for how long a collect stays open.
- **The envelopes, sealed**: it cannot open them. Who wrote one, to whom, and what it says are inside the seal.
- **A collect secret R**, at each collect, in the `Authorization` header: it turns R into D and forgets R at once (MBX-6). R is never written.
- **The IP address** of whoever connects, as any server does: in memory, for the connection, and never written by the relay or by Caddy.

## What it keeps, and for how long

In one SQLite database on the machine's disk (MBX-8):

- the envelopes, sealed, with their D, their position in the mailbox and the time they arrived;
- the deposits' operations (so that a phone that sends again the same deposit meets the same answer).

A collected envelope is discarded by its holder's phone; whatever is left is **forgotten after eight days** (MBX-8), checked every hour.

## What it does not keep

- **No access logs**: neither the relay nor Caddy writes a line per request (CFG-3). Caddy's two loggers that would tell of a request when it fails (its address, its path, its headers) are switched off.
- **No IP addresses**, of anyone who deposits or collects.
- **No backups**: a lost disk loses the envelopes not yet collected. The phones send again what was not answered.
- **No accounts**, no cookies, no tracking.

## The machine's journal

The machine keeps a journal for **a week** (200 MB at most): the relay's own lines (when it starts, with its version and commit; when it stops; its faults, never a request), Caddy's faults and its certificates' renewals, and the system's (among them the logins over SSH: the operator's, and the address of anyone who tries).

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

## For the operator

The machine and its deploy are in [`deploy/relay/`](../deploy/relay/): `deploy.sh` (from a clean checkout of a pushed commit: `deploy/relay/deploy.sh`; `rollback`, `status`, `provision`), `provision.sh` (the machine made ready, idempotent), `activate.sh` (a release made current, with the rollback), `smoke.sh` (the relay asked as a phone would), the systemd unit and the Caddyfile. The rules: REL-7.
