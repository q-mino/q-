#!/usr/bin/env bash
# Cumino's relay asked, from here, as a phone would (REL-7): its `GET /` over
# valid TLS (with the commit given, if one is); the CORS preflight of a
# collect; a deposit on a mailbox drawn for the test, and a collect with its
# R that finds it and, left open, hears the next deposit; then the machine's
# journal since the first request, which must say nothing of them (CFG-3).
# The test's mailbox is forgotten with its envelopes after eight days (MBX-8).
#
#   deploy/relay/smoke.sh [<commit>]
#
# Needs curl, python3 (BLAKE2b-256 of R, SEA-4) and the deploy key for the
# journal (CUMINO_RELAY_JOURNAL=no to skip it). [Q, C, 25 Nov 2026]

set -euo pipefail

name='relay.cumino.aleclofabbro.it'
origin="https://$name"
host="${CUMINO_RELAY_HOST:-$name}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
failed=0

ok() { printf 'ok    %s\n' "$*"; }
no() { printf 'FAIL  %s\n' "$*"; failed=1; }
b64url() { base64 -w0 | tr '+/' '-_' | tr -d '='; }

since="$(date -u '+%Y-%m-%d %H:%M:%S')"
R="$(head -c 32 /dev/urandom | b64url)"
D="$(python3 -I -c '
import base64, hashlib, sys
r = sys.argv[1]
d = hashlib.blake2b(base64.urlsafe_b64decode(r + "=" * (-len(r) % 4)), digest_size=32).digest()
print(base64.urlsafe_b64encode(d).decode().rstrip("="))' "$R")"
run="smoke-$(head -c 6 /dev/urandom | b64url)"
E1="$(printf '%s 1' "$run" | b64url)"
E2="$(printf '%s 2' "$run" | b64url)"

deposit() { # <operation> <envelope>
  curl -fsS --max-time 10 -H 'Content-Type: application/json' \
    -d "{\"version\":\"1.0.0\",\"operation\":\"$1\",\"input\":{\"deposit_address\":\"$D\",\"envelope\":\"$2\"}}" \
    "$origin/depositor/deposit_an_envelope"
}

# GET /, over TLS that curl verifies.
about="$(curl -fsS --max-time 10 "$origin/")" && ok "GET / over valid TLS: $about" || no 'GET / over valid TLS'
if [[ -n "${1:-}" ]]; then
  [[ "$about" == *"\"commit\":\"$1\""* ]] && ok "GET / says commit $1" || no "GET / does not say commit $1"
fi

# The preflight of a collect, from a page of another origin.
preflight="$(curl -sS --max-time 10 -o /dev/null -D - -X OPTIONS \
  -H 'Origin: https://example.org' -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type' \
  "$origin/holder/collect_the_envelopes" | tr -d '\r')"
grep -qi '^access-control-allow-origin: \*$' <<<"$preflight" &&
  grep -qi '^access-control-allow-headers:.*authorization' <<<"$preflight" &&
  ok "CORS preflight: $(head -1 <<<"$preflight"), $(grep -i '^access-control-allow-methods' <<<"$preflight")" ||
  no "CORS preflight: $preflight"

# A deposit, then a collect left open that finds it and hears the next one.
kept="$(deposit "$run-1" "$E1")" && [[ "$kept" == *the_envelope_is_kept* ]] && ok "deposit: $kept" || no "deposit: ${kept:-}"
curl -sS --max-time 6 -H 'Content-Type: application/json' -H "Authorization: Bearer $R" \
  -d "{\"version\":\"1.0.0\",\"input\":{\"deposit_address\":\"$D\"}}" \
  "$origin/holder/collect_the_envelopes" >"$work/collect" 2>/dev/null &
collecting=$!
sleep 2
deposit "$run-2" "$E2" >/dev/null || no 'the second deposit'
wait "$collecting" || true # the collect stays open: curl's time ends it
grep -q "\"envelope\":\"$E1\"" "$work/collect" && grep -q '"event":"caught_up"' "$work/collect" &&
  ok 'collect: a snapshot with the deposit, caught up' || no "collect: $(cat "$work/collect")"
grep -q '"event":"fact"' "$work/collect" && grep -q "\"envelope\":\"$E2\"" "$work/collect" &&
  ok 'collect left open: the next deposit heard as a fact' || no 'collect left open: no fact'

# The journal since the first request: nothing of the requests.
if [[ "${CUMINO_RELAY_JOURNAL:-yes}" != no ]]; then
  journal="$(ssh -i "$HOME/.ssh/cumino-relay" -o IdentitiesOnly=yes -o BatchMode=yes \
    -o UserKnownHostsFile="$HOME/.ssh/cumino-relay.known_hosts" -o HostKeyAlias=cumino-relay \
    "deploy@$host" "journalctl -u cumino-relay.service -u caddy.service --since '$since UTC' --no-pager -o cat")"
  if grep -qE "$D|$run|collect_the_envelopes|deposit_an_envelope|POST|GET /" <<<"$journal"; then
    no "the journal tells of the requests: $journal"
  else
    ok "the journal since $since UTC: nothing of the requests (${journal:-empty})"
  fi
fi

exit "$failed"
