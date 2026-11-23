// `pnpm check`: the generated files first, then typecheck, lint, format and
// graph in parallel, then the tests (TST-11). Each check is a script of package.json, run by pnpm, its output in
// `.check/<name>.log`; at the end one line per check (outcome, time, peak
// memory) and the tail of the log of each red one. The exit code is 1 if one
// is red. With GITHUB_STEP_SUMMARY set (the CI), the same lines go to the job
// summary, with a warning for a check past its threshold (TST-13).
//
// With --package=<folder under packages/> (`pnpm check:package memory`), the
// quick check of the writing loop (TST-12): the package's projects through
// `tsc -b` (what they reference included), ESLint on its folder, its tests;
// no generated files, format or graph. It does not see what breaks downstream:
// the whole check stays before a commit.
//
// Usage: node scripts/check.mjs [--serial] [--only=a,b] [--package=<folder>]
import { spawn } from 'node:child_process'
import {
  appendFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from 'node:fs'
import { join } from 'node:path'
import console from 'node:console'
import { performance } from 'node:perf_hooks'
import process from 'node:process'
import { clearInterval, setInterval } from 'node:timers'

const root = join(import.meta.dirname, '..')
const logs = join(root, '.check')

// The generated files are read by every other check: if they are stale, the
// others would report the staleness under another name, so it runs alone.
const first = ['generate:check']
// Typecheck and lint are the heavy ones (time and memory), and run together,
// with format and graph, which are light.
const together = ['typecheck', 'lint', 'format:check', 'graph']
// The tests run last, alone: with typecheck and lint at the same time, two of
// them failed in two runs out of three (23 Nov 2026, a harness that waits a
// count of timer turns, a property test at the edge of its 5 s).
const last = ['test']

const thresholds = JSON.parse(readFileSync(join(root, 'scripts', 'check-thresholds.json'), 'utf8'))

const args = process.argv.slice(2)
const serial = args.includes('--serial')
const only = args
  .find((a) => a.startsWith('--only='))
  ?.slice('--only='.length)
  .split(',')
const selected = (names) => (only ? names.filter((n) => only.includes(n)) : names)
// `--package=memory`, or `--package memory` (`pnpm check:package memory`).
const package_folder =
  args.find((a) => a.startsWith('--package='))?.slice('--package='.length) ??
  (args.includes('--package') ? args[args.indexOf('--package') + 1] : undefined)

// What a check runs: the script of package.json by its name, or, for a
// package, the same tool on the package's folder.
const bin = (tool) => join(root, 'node_modules', '.bin', tool)
const of_package = (folder) => {
  const dir = join('packages', folder)
  if (!existsSync(join(root, dir, 'package.json'))) {
    console.error(`No package at ${dir}.`)
    process.exit(2)
  }
  const projects = [dir, join(dir, 'test'), join(dir, 'shell')].filter((d) =>
    existsSync(join(root, d, 'tsconfig.json')),
  )
  return {
    typecheck: [bin('tsc'), '-b', ...projects],
    lint: [
      process.execPath,
      '--max-old-space-size=8192',
      join(root, 'node_modules', 'eslint', 'bin', 'eslint.js'),
      dir,
    ],
    test: [bin('vitest'), 'run', `${dir}/`, '--passWithNoTests'],
  }
}
const commands = package_folder === undefined ? undefined : of_package(package_folder)
const command_of = (name) => commands?.[name] ?? ['pnpm', 'run', '--silent', name]

// The resident memory of a process tree, summed, from /proc (Linux only;
// elsewhere no peak is reported).
const has_proc = existsSync('/proc/self/statm')
const parent_of = (pid) => {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf8')
    return Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[1])
  } catch {
    return undefined
  }
}
const resident = (pid) => {
  try {
    return Number(readFileSync(`/proc/${pid}/statm`, 'utf8').split(' ')[1]) * 4096
  } catch {
    return 0
  }
}
// Each root with its descendants.
const trees = (roots) => {
  const pids = readdirSync('/proc')
    .filter((p) => /^\d+$/.test(p))
    .map(Number)
  const children = new Map()
  for (const pid of pids) {
    const parent = parent_of(pid)
    if (parent !== undefined) children.set(parent, [...(children.get(parent) ?? []), pid])
  }
  const of_root = (pid) => [pid, ...(children.get(pid) ?? []).flatMap(of_root)]
  return new Map(roots.map((root_pid) => [root_pid, of_root(root_pid)]))
}
const tree_resident = (roots) =>
  new Map(
    [...trees(roots)].map(([root_pid, pids]) => [
      root_pid,
      pids.reduce((sum, p) => sum + resident(p), 0),
    ]),
  )

const running = new Map() // pid -> { child, peak }
const sampler = has_proc
  ? setInterval(() => {
      const sizes = tree_resident([...running.keys()])
      for (const [pid, entry] of running) entry.peak = Math.max(entry.peak, sizes.get(pid) ?? 0)
    }, 500)
  : undefined

// One check: a script of package.json. Its outcome: { name, outcome: 'green' |
// 'red', code, seconds, peak_bytes }.
const run = (name) =>
  new Promise((resolve) => {
    const log = join(logs, `${name.replace(':', '-')}.log`)
    const out = createWriteStream(log)
    const started = performance.now()
    const [command, ...command_args] = command_of(name)
    const child = spawn(command, command_args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const entry = { child, peak: 0 }
    running.set(child.pid, entry)
    child.stdout.pipe(out)
    child.stderr.pipe(out)
    child.on('close', (code, signal) => {
      running.delete(child.pid)
      out.end()
      resolve({
        name,
        outcome: code === 0 ? 'green' : 'red',
        code: code ?? signal,
        seconds: (performance.now() - started) / 1000,
        peak_bytes: has_proc ? entry.peak : undefined,
        log,
      })
    })
  })

// A stop from outside (Ctrl-C, `timeout`, a kill of this process alone) stops
// every check still running, with the processes each one started: pnpm does
// not always pass a signal on to them.
const stop_all = () => {
  const pids = has_proc ? [...trees([...running.keys()]).values()].flat() : [...running.keys()]
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // already gone
    }
  }
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    stop_all()
    process.exit(128 + (signal === 'SIGINT' ? 2 : signal === 'SIGTERM' ? 15 : 1))
  })
}

const in_sequence = async (names) => {
  const results = []
  for (const name of names) {
    const result = await run(name)
    results.push(result)
    if (result.outcome === 'red') break
  }
  return results
}

const gib = (bytes) => (bytes === undefined ? '' : `${(bytes / 2 ** 30).toFixed(1)} GiB`)
// The thresholds are of the whole check; a package's checks have none.
const past = (result) => {
  const limit = commands ? undefined : thresholds[result.name]
  if (!limit) return []
  return [
    ...(limit.seconds !== undefined && result.seconds > limit.seconds
      ? [`over ${limit.seconds} s`]
      : []),
    ...(limit.gib !== undefined &&
    result.peak_bytes !== undefined &&
    result.peak_bytes > limit.gib * 2 ** 30
      ? [`over ${limit.gib} GiB`]
      : []),
  ]
}
const line = (r) =>
  `${r.outcome === 'green' ? 'ok ' : 'RED'}  ${r.name.padEnd(15)} ${`${r.seconds.toFixed(1)} s`.padStart(8)}  ${gib(r.peak_bytes).padStart(8)}${past(r).length ? `  (${past(r).join(', ')})` : ''}`

const tail = (file, lines) =>
  readFileSync(file, 'utf8').trimEnd().split('\n').slice(-lines).join('\n')

const report = (results, seconds) => {
  for (const r of results.filter((r) => r.outcome === 'red')) {
    // In the CI the whole log, which is not kept; here its last lines.
    const lines = process.env.CI ? Infinity : 40
    console.log(`\n--- ${r.name} (exit ${r.code}), ${r.log}:\n${tail(r.log, lines)}`)
  }
  console.log('')
  for (const r of results) console.log(line(r))
  console.log(`total ${seconds.toFixed(1)} s`)
  const summary = process.env.GITHUB_STEP_SUMMARY
  if (summary) {
    const rows = results.map(
      (r) =>
        `| ${r.name} | ${r.outcome === 'green' ? '✅' : '❌'} | ${r.seconds.toFixed(1)} s | ${gib(r.peak_bytes)} | ${past(r).join(', ')} |`,
    )
    appendFileSync(
      summary,
      [
        '### pnpm check',
        '',
        '| check | outcome | time | peak | threshold |',
        '|---|---|---|---|---|',
        ...rows,
        '',
        `Total ${seconds.toFixed(1)} s.`,
        '',
      ].join('\n'),
    )
    for (const r of results)
      for (const p of past(r))
        console.log(`::warning title=${r.name}::${r.name} ${p} (scripts/check-thresholds.json)`)
  }
}

mkdirSync(logs, { recursive: true })
const started = performance.now()
const before = commands ? [] : await in_sequence(selected(first))
// For a package, the same order: its typecheck and lint together, its tests after.
const stage_two = commands ? ['typecheck', 'lint'] : together
const stage_three = commands ? ['test'] : last
const after = before.some((r) => r.outcome === 'red')
  ? []
  : serial
    ? await in_sequence(selected([...stage_two, ...stage_three]))
    : [
        ...(await Promise.all(selected(stage_two).map(run))),
        ...(await Promise.all(selected(stage_three).map(run))),
      ]
if (sampler) clearInterval(sampler)
const results = [...before, ...after]
report(results, (performance.now() - started) / 1000)
process.exit(results.every((r) => r.outcome === 'green') ? 0 : 1)
