#!/usr/bin/env bash
# The machine of Cumino's relay made ready (REL-7), as root, from the folder it
# is in (deploy.sh provision copies this folder there and runs it with sudo).
# Idempotent: run again, it puts back what drifted and changes nothing else.
#
#   - Debian's packages: Caddy, unattended-upgrades, curl, xz;
#   - Node 24 LTS from nodejs.org's tarball, its SHA-256 pinned here and
#     checked against that release's SHASUMS256.txt;
#   - the user `deploy` (no password, `admin`'s keys, a sudo of two commands)
#     and the releases' folder, /opt/cumino-relay;
#   - SSH by key only, no root; the journal kept a week; no LLMNR; a swap file;
#   - the relay's unit (cumino-relay.service) and Caddy's Caddyfile.
#
# The firewall is Lightsail's (22, 80, 443); nothing else listens but on
# loopback. [Q, C, 25 Nov 2026]

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node_version='24.22.3'
declare -A node_sha256=(
  [x64]='4f2b175a6d53a5c617a80dba2676238a0688cef28c6da4eba35c7d844e66fcfb'
  [arm64]='6e51a2ada00f0011cc266f65d98922b403d7ad88f809ca2aa615a5fe1ce6e86c'
)
relay_home='/opt/cumino-relay'

say() { printf '== %s\n' "$*"; }

if [[ "$(id -u)" != 0 ]]; then
  echo "provision.sh: run as root (sudo)" >&2
  exit 1
fi

# A file put in place only when it differs; says whether it changed.
put() { # <source> <target> <mode>
  if [[ -f "$2" ]] && cmp -s "$1" "$2"; then return 1; fi
  install -D -m "$3" "$1" "$2"
  say "written $2"
}

say 'packages'
export DEBIAN_FRONTEND=noninteractive
apt-get -qq update
apt-get -qq -y install --no-install-recommends caddy curl xz-utils ca-certificates unattended-upgrades >/dev/null

say "node $node_version"
case "$(uname -m)" in
  x86_64) arch=x64 ;;
  aarch64) arch=arm64 ;;
  *) echo "provision.sh: no Node for $(uname -m)" >&2; exit 1 ;;
esac
node_dir="/opt/node-v$node_version-linux-$arch"
if [[ "$(/opt/node/bin/node --version 2>/dev/null || true)" != "v$node_version" ]]; then
  tarball="node-v$node_version-linux-$arch.tar.xz"
  work="$(mktemp -d)"
  trap 'rm -rf "$work"' EXIT
  curl -fsSL --proto '=https' -o "$work/$tarball" "https://nodejs.org/dist/v$node_version/$tarball"
  curl -fsSL --proto '=https' -o "$work/SHASUMS256.txt" "https://nodejs.org/dist/v$node_version/SHASUMS256.txt"
  expected="${node_sha256[$arch]}  $tarball"
  grep -qxF "$expected" "$work/SHASUMS256.txt" || { echo "provision.sh: $tarball not in SHASUMS256.txt with the pinned hash" >&2; exit 1; }
  (cd "$work" && printf '%s\n' "$expected" | sha256sum --check --strict --quiet)
  rm -rf "$node_dir"
  tar -xJf "$work/$tarball" -C /opt
  chown -R root:root "$node_dir"
  ln -sfn "$node_dir" /opt/node
  say "installed $(/opt/node/bin/node --version)"
fi
# The Node releases before this one, gone.
find /opt -maxdepth 1 -name 'node-v*' -not -path "$node_dir" -exec rm -rf {} +

say 'the user deploy'
if ! id deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "Cumino's relay deploys" deploy >/dev/null
fi
usermod -a -G systemd-journal deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy /home/admin/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
install -d -m 755 -o deploy -g deploy "$relay_home" "$relay_home/releases"
visudo -cqf "$here/sudoers"
put "$here/sudoers" /etc/sudoers.d/cumino-relay-deploy 0440 || true

say 'ssh'
if put "$here/sshd.conf" /etc/ssh/sshd_config.d/01-cumino.conf 0644; then
  sshd -t
  systemctl reload ssh
fi

say 'journal, resolver, updates'
put "$here/journald.conf" /etc/systemd/journald.conf.d/cumino.conf 0644 && systemctl restart systemd-journald
put "$here/resolved.conf" /etc/systemd/resolved.conf.d/cumino.conf 0644 && systemctl restart systemd-resolved
put "$here/unattended-upgrades.conf" /etc/apt/apt.conf.d/52cumino-unattended-upgrades 0644 || true
systemctl enable --now unattended-upgrades >/dev/null 2>&1

say 'swap'
if [[ ! -f /swapfile ]]; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
fi
grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
swapon --show=NAME --noheadings | grep -qx /swapfile || swapon /swapfile

say 'the relay'
if put "$here/cumino-relay.service" /etc/systemd/system/cumino-relay.service 0644; then
  systemctl daemon-reload
  [[ -e "$relay_home/current/relay.mjs" ]] && systemctl restart cumino-relay.service
fi
systemctl enable cumino-relay.service >/dev/null 2>&1

say 'caddy'
caddy validate --adapter caddyfile --config "$here/Caddyfile" >/dev/null 2>&1 || {
  caddy validate --adapter caddyfile --config "$here/Caddyfile"
  exit 1
}
if put "$here/Caddyfile" /etc/caddy/Caddyfile 0644; then
  systemctl enable caddy >/dev/null 2>&1
  systemctl reload-or-restart caddy
fi

say "done: node $(/opt/node/bin/node --version), caddy $(caddy version | cut -d' ' -f1), relay $(systemctl is-active cumino-relay.service || true)"
