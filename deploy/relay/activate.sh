#!/usr/bin/env bash
# A release of Cumino's relay made current, on the machine, as `deploy`
# (REL-7): deploy.sh sends this script over SSH at every deploy, so the
# machine keeps none of it.
#
#   activate.sh activate <commit>   releases/<commit> made current
#   activate.sh rollback            the release before made current again
#   activate.sh status              the releases, and which is current
#
# Activating: the link `current` moved to the release (and `previous` to the
# one it leaves), the relay restarted, and its `GET /` on 127.0.0.1 asked
# until it answers with the release's commit and still does a few seconds
# later. If it does not, the links go back, the relay is restarted on the
# release before, and the activation fails. The last three releases are kept,
# the current and the previous among them. [Q, C, 25 Nov 2026]

set -euo pipefail

home='/opt/cumino-relay'
releases="$home/releases"
kept=3
origin='http://127.0.0.1:8080/'

say() { printf '%s\n' "$*"; }
fail() { printf 'activate.sh: %s\n' "$*" >&2; exit 1; }

release_of() { # <link>: the release's name a link points to, or nothing
  local target
  target="$(readlink "$home/$1" 2>/dev/null)" || return 0
  basename "$target"
}

restart() {
  sudo -n /usr/bin/systemctl reset-failed cumino-relay.service 2>/dev/null || true
  sudo -n /usr/bin/systemctl restart cumino-relay.service
}

# Whether the relay answers GET / with this commit, within the seconds given.
answers_with() { # <commit> <seconds>
  local deadline=$((SECONDS + $2)) body
  while ((SECONDS < deadline)); do
    body="$(curl -fsS --max-time 2 "$origin" 2>/dev/null || true)"
    [[ "$body" == *"\"commit\":\"$1\""* ]] && return 0
    sleep 1
  done
  return 1
}

healthy() { # <commit>
  answers_with "$1" 20 || return 1
  sleep 5
  systemctl is-active --quiet cumino-relay.service && answers_with "$1" 3
}

point() { # <link> <release>
  ln -sfn "releases/$2" "$home/$1.next"
  mv -Tf "$home/$1.next" "$home/$1"
}

switch_to() { # <release>: made current, or back to the one before
  local to="$1" from before
  [[ -f "$releases/$to/relay.mjs" ]] || fail "no release $to"
  from="$(release_of current)"
  before="$(release_of previous)"
  point current "$to"
  [[ -n "$from" && "$from" != "$to" ]] && point previous "$from"
  restart || true
  if healthy "$to"; then
    say "current: $to"
    return 0
  fi
  say "release $to does not answer with its commit; its journal:" >&2
  journalctl -u cumino-relay.service -n 15 --no-pager -o cat >&2 || true
  if [[ -z "$from" || "$from" == "$to" ]]; then
    fail "no release before $to to go back to"
  fi
  say "back to $from" >&2
  point current "$from"
  if [[ -n "$before" ]]; then point previous "$before"; else rm -f "$home/previous"; fi
  restart || true
  healthy "$from" || fail "the release before, $from, does not answer either"
  fail "release $to rolled back; current: $from"
}

prune() {
  local current previous count=0 name
  current="$(release_of current)"
  previous="$(release_of previous)"
  while read -r name; do
    [[ -z "$name" ]] && continue
    if [[ "$name" == "$current" || "$name" == "$previous" ]]; then continue; fi
    count=$((count + 1))
    ((count + 2 > kept)) && rm -rf "${releases:?}/$name" && say "removed release $name"
  done < <(ls -1t "$releases")
}

status() {
  say "current:  $(release_of current)"
  say "previous: $(release_of previous)"
  say "releases: $(ls -1t "$releases" | tr '\n' ' ')"
  say "answers:  $(curl -fsS --max-time 2 "$origin" 2>/dev/null || echo 'nothing')"
}

case "${1:-}" in
  activate)
    [[ "${2:-}" =~ ^[0-9a-f]{40}$ ]] || fail "activate <commit>"
    switch_to "$2"
    prune
    ;;
  rollback)
    before="$(release_of previous)"
    [[ -n "$before" ]] || fail "no release before"
    switch_to "$before"
    ;;
  status) status ;;
  *) fail "activate <commit> | rollback | status" ;;
esac
