#!/usr/bin/env bash
# Cumino's relay deployed from this checkout (REL-7), over SSH with the key
# ~/.ssh/cumino-relay (its host key in ~/.ssh/cumino-relay.known_hosts).
#
#   deploy/relay/deploy.sh [release]   build HEAD, copy it, make it current
#   deploy/relay/deploy.sh rollback    the release before made current again
#   deploy/relay/deploy.sh status      the machine's releases, and GET /
#   deploy/relay/deploy.sh provision   the machine made ready (provision.sh)
#
# A release is a commit: HEAD of a clean checkout, pushed (the relay's
# `GET /` links its source at that commit, AGPL § 13). It is built here
# (`pnpm --filter @q-mino/relay build`, REL-5), copied to
# /opt/cumino-relay/releases/<commit>, and made current by activate.sh, which
# goes back by itself to the release before if the new one does not answer
# with its commit. Then `GET /` over HTTPS, from here.
#
# The machine: CUMINO_RELAY_HOST (default relay.cumino.aleclofabbro.it).
# CUMINO_RELAY_UNPUSHED=yes deploys a commit not pushed (a test's, such as a
# release broken on purpose). No secret here: the key stays in ~/.ssh.
# [Q, C, 25 Nov 2026]

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(git -C "$here" rev-parse --show-toplevel)"
name='relay.cumino.aleclofabbro.it'
host="${CUMINO_RELAY_HOST:-$name}"
key="$HOME/.ssh/cumino-relay"
ssh_options=(
  -i "$key" -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=15
  -o UserKnownHostsFile="$HOME/.ssh/cumino-relay.known_hosts"
  -o HostKeyAlias=cumino-relay -o StrictHostKeyChecking=accept-new
)

say() { printf '== %s\n' "$*"; }
fail() { printf 'deploy.sh: %s\n' "$*" >&2; exit 1; }
on() { # <user> <command…>
  local user="$1"
  shift
  ssh "${ssh_options[@]}" "$user@$host" "$@"
}
activate() { on deploy bash -s -- "$@" <"$here/activate.sh"; }

[[ -f "$key" ]] || fail "no key $key"

release() {
  local commit dist
  [[ -z "$(git -C "$root" status --porcelain)" ]] || fail 'the checkout is not clean: commit first'
  commit="$(git -C "$root" rev-parse HEAD)"
  if [[ "${CUMINO_RELAY_UNPUSHED:-}" != yes ]]; then
    git -C "$root" fetch --quiet origin
    [[ -n "$(git -C "$root" branch -r --contains "$commit")" ]] || fail "$commit is not pushed: push first"
  fi

  say "build $commit"
  timeout 300 pnpm --dir "$root" --filter @q-mino/relay build
  dist="$root/packages/relay/dist"
  head -1 "$dist/relay.mjs" | grep -qF "($commit)" || fail "the build does not say $commit"

  say "copy to $host"
  tar -C "$dist" -cz relay.mjs relay.mjs.map | on deploy "set -e
    cd /opt/cumino-relay/releases
    rm -rf .$commit; mkdir .$commit; tar -xz -C .$commit
    chmod 755 .$commit; chmod 644 .$commit/*
    rm -rf $commit; mv .$commit $commit"

  say "activate $commit"
  activate activate "$commit"

  say "GET https://$name/"
  local body
  body="$(curl -fsS --max-time 10 "https://$name/" || true)"
  printf '%s\n' "$body"
  [[ "$body" == *"\"commit\":\"$commit\""* ]] || fail "https://$name/ does not answer with $commit (the release is current on the machine)"
}

case "${1:-release}" in
  release) release ;;
  rollback) activate rollback ;;
  status) activate status ;;
  provision)
    say "provision $host"
    tar -C "$here" -cz . | on admin 'set -e
      work="$(mktemp -d)"; trap "rm -rf \"$work\"" EXIT
      tar -xz -C "$work"; sudo bash "$work/provision.sh"'
    ;;
  *) fail 'release | rollback | status | provision' ;;
esac
