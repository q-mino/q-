// The cage the answerer runs in (AST-8), two ways [Q, C, high impact: A to
// discuss] (28 Nov 2026; Alessandro, 28 Nov 2026: «Invece di un servizio
// Ubuntu puoi deployare il nodo in un container Docker. Gli monti solamente
// le cartelle che gli servono»):
//
// - **`bwrap`**, outside a container (a run on the laptop, B1's design):
//   only the system's `/usr` read-only, the files of `/etc` that name
//   resolution and TLS need, Claude Code's binary at `/opt/claude/claude`,
//   the copy at `/srv/cumino` (its working directory), the system prompt,
//   `/proc`, `/dev`, a `/tmp` and a home of its own in memory, the bot's
//   configuration bound in it, writable; the environment set again.
// - **the container**, which is the cage (`deploy/assistant/compose.yaml`):
//   its root read-only, every capability dropped, no new privileges, and
//   only the folders the assistant needs mounted; `claude` runs as a child
//   of the node, its environment set again, its working directory the copy.
//   What the container does not give, and `bwrap` gave: the answerer's
//   process sees the node's files (its storage, the register, the stand's
//   key, mounted at `/data`) and the source of the copy (read-only); only
//   its tools are kept from them (`--restricted` confines them to the copy,
//   and the deny rules name those folders). A declared flaw (AST-15).
//   Rejected: `bwrap` inside the container (user namespaces need the
//   capabilities and the seccomp profile the container drops); a second
//   container for `claude` (the node would need Docker's socket, which is
//   root on the laptop).
//
// Each gives the command line that starts Claude Code in it, from AST-9's.

/** Where the answerer's things are on this machine, as the cage binds them. */
export interface TheCagesFolders {
  /** Claude Code's binary (the native install's version, or the image's `claude`). */
  readonly claude: string
  /** The copy (AST-11): read-only, the answerer's working directory. */
  readonly copy: string
  /** The bot's own Claude Code configuration (`~/.config/cumino-assistente/claude`). */
  readonly configuration: string
  /** The system prompt's file (AST-10). */
  readonly system_prompt: string
}

/** How the answerer is caged (AST-8): by `bwrap`, or by the container it runs in. */
export type ACage = 'bwrap' | 'the_container'

/** A command line to start: the program, its arguments, its whole environment, its working directory. */
export interface ACommandLine {
  readonly file: string
  readonly args: readonly string[]
  readonly env: Readonly<Record<string, string>>
  readonly cwd: string
}

/** Where the copy, the system prompt and the configuration are, inside `bwrap`. */
const inside = {
  claude: '/opt/claude/claude',
  copy: '/srv/cumino',
  home: '/home/assistente',
  configuration: '/home/assistente/claude',
  system_prompt: '/opt/cumino/the_system_prompt.md',
} as const

/** The environment of Claude Code in the cage (AST-8): nothing of the node's or of Alessandro's. */
const the_environment = (home: string, configuration: string): Record<string, string> => ({
  HOME: home,
  PATH: '/usr/local/bin:/usr/bin:/bin',
  CLAUDE_CONFIG_DIR: configuration,
  TMPDIR: '/tmp',
  LANG: 'C.UTF-8',
  DISABLE_AUTOUPDATER: '1',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
})

/** The files of `/etc` that name resolution and TLS need (AST-8), each bound if this system has it. */
export const the_files_of_etc = [
  '/etc/resolv.conf',
  '/etc/hosts',
  '/etc/nsswitch.conf',
  '/etc/ssl',
  '/etc/ca-certificates',
  '/etc/passwd',
  '/etc/group',
] as const

/**
 * `bwrap`'s arguments (AST-8): every namespace unshared but the network's,
 * the cage dies with the node, a session of its own, the environment
 * cleared and set again; read-only binds of the system, writable only its
 * own `/tmp`, its home in memory and the bot's configuration.
 */
export const the_bwrap_arguments = (
  folders: TheCagesFolders,
  present: (path: string) => boolean,
): readonly string[] => [
  '--unshare-all',
  '--share-net',
  '--die-with-parent',
  '--new-session',
  '--clearenv',
  '--ro-bind',
  '/usr',
  '/usr',
  ...['/bin', '/lib', '/lib64', '/sbin'].flatMap((link) =>
    present(link) ? ['--symlink', `usr${link}`, link] : [],
  ),
  ...the_files_of_etc.flatMap((path) => (present(path) ? ['--ro-bind', path, path] : [])),
  ...(present('/run/systemd/resolve')
    ? ['--ro-bind', '/run/systemd/resolve', '/run/systemd/resolve']
    : []),
  '--ro-bind',
  folders.claude,
  inside.claude,
  '--ro-bind',
  folders.copy,
  inside.copy,
  '--ro-bind',
  folders.system_prompt,
  inside.system_prompt,
  '--proc',
  '/proc',
  '--dev',
  '/dev',
  '--tmpfs',
  '/tmp',
  '--tmpfs',
  inside.home,
  '--bind',
  folders.configuration,
  inside.configuration,
  '--chdir',
  inside.copy,
  ...Object.entries(the_environment(inside.home, inside.configuration)).flatMap(([name, value]) => [
    '--setenv',
    name,
    value,
  ]),
]

/**
 * The deny rules (AST-8, the container): the tools of the answerer read
 * nothing of the node's, of the source, of the configuration, of the
 * system; `--restricted` confines them to the copy already, these name what
 * the container mounts beside it. Absolute paths begin with `//` in Claude
 * Code's rules.
 */
export const the_deny_rules = (folders: {
  readonly data: string
  readonly source: string
  readonly configuration: string
  readonly never_copied: string
  readonly notes: string
}): readonly string[] =>
  [
    `${folders.data}/node.sqlite*`,
    `${folders.data}/register.sqlite*`,
    `${folders.data}/stand.key`,
    `${folders.source}/**`,
    `${folders.configuration}/**`,
    // B6: the words never copied and the notes are mounted beside the copy too.
    folders.never_copied,
    `${folders.notes}/**`,
    '/home/**',
    '/proc/**',
    '/sys/**',
    '/etc/**',
    '/root/**',
    '/tmp/**',
  ].map((path) => `Read(/${path})`)

/** The settings given on the command line (`--settings`, which `--restricted` keeps): the deny rules, nothing else. */
export const the_settings_of = (deny: readonly string[]): string =>
  JSON.stringify({ permissions: { deny } })

/**
 * The command line that starts Claude Code in its cage, AST-9's arguments
 * after it: through `bwrap`, its folders bound inside; in the container,
 * the folders as they are.
 */
export const in_the_cage = (
  cage: ACage,
  folders: TheCagesFolders,
  claude_s_arguments: (where: { readonly system_prompt: string }) => readonly string[],
  present: (path: string) => boolean,
): ACommandLine =>
  cage === 'bwrap'
    ? {
        file: 'bwrap',
        args: [
          ...the_bwrap_arguments(folders, present),
          inside.claude,
          ...claude_s_arguments({ system_prompt: inside.system_prompt }),
        ],
        env: {},
        cwd: '/',
      }
    : {
        file: folders.claude,
        args: claude_s_arguments({ system_prompt: folders.system_prompt }),
        env: the_environment('/tmp/home', folders.configuration),
        cwd: folders.copy,
      }
