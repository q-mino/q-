import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { z } from 'zod'
import {
  replied_if_it_fits,
  run_with_its_time,
  the_answer_in,
  the_bwrap_arguments,
  the_command_line,
  the_prompt_of,
} from '../src/answerer/index.ts'

// The answerer (AST-7..AST-9; README stories 16, 17, 23, 24): Claude Code's
// command line, in either cage; its output read, from two outputs of the
// real `claude -p` 2.1.302 kept as fixtures (28 Nov 2026: a reply with its
// structured output, the bot's configuration logged in; "Not logged in",
// an empty configuration); the cage refusing a path, where `bwrap` runs.

const fixture = (name: string): string =>
  readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8')

const folders: string[] = []
afterAll(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true })
})

const settings = { model: 'sonnet', effort: 'low', seconds: 180, budget: 0.5 }
const place = {
  claude: '/usr/local/bin/claude',
  configuration: '/config/claude',
  system_prompt: '/opt/cumino-assistente/the_system_prompt.md',
  data: '/data',
  source: '/srv/source',
  never_copied: '/config/never-copied.txt',
  notes: '/srv/notes',
}

describe('the tools of the answerer', () => {
  test('claude is started with Read, Grep and Glob only, its own configuration, no session kept; the prompt never on the command line', () => {
    const line = the_command_line(
      settings,
      { ...place, cage: 'the_container' },
      '/data/copy/1',
      () => true,
    )
    expect(line.file).toBe('/usr/local/bin/claude')
    expect(line.cwd).toBe('/data/copy/1')
    expect(line.args.slice(0, 24)).toEqual([
      '-p',
      '--model',
      'sonnet',
      '--effort',
      'low',
      '--tools',
      'Read,Grep,Glob',
      '--allowedTools',
      'Read,Grep,Glob',
      '--permission-mode',
      'dontAsk',
      '--permission-prompts',
      'none',
      '--restricted',
      '--strict-mcp-config',
      '--disable-slash-commands',
      '--no-chrome',
      '--no-session-persistence',
      '--output-format',
      'json',
      '--json-schema',
      expect.stringContaining('"reply"'),
      '--system-prompt-file',
      '/opt/cumino-assistente/the_system_prompt.md',
    ])
    // In the container, the deny rules name what is mounted beside the copy (AST-8).
    const settings_given = line.args[line.args.indexOf('--settings') + 1] ?? ''
    const { deny } = z
      .object({ permissions: z.object({ deny: z.array(z.string()) }) })
      .parse(JSON.parse(settings_given)).permissions
    expect(deny).toEqual(
      expect.arrayContaining([
        'Read(//data/node.sqlite*)',
        'Read(//data/stand.key)',
        'Read(//srv/source/**)',
        'Read(//config/claude/**)',
        'Read(//config/never-copied.txt)',
        'Read(//srv/notes/**)',
        'Read(//home/**)',
        'Read(//tmp/**)',
      ]),
    )
    // An attempt's ceiling (B6).
    expect(line.args[line.args.indexOf('--max-budget-usd') + 1]).toBe('0.50')
    expect(line.env).toEqual({
      HOME: '/tmp/home',
      PATH: '/usr/local/bin:/usr/bin:/bin',
      CLAUDE_CONFIG_DIR: '/config/claude',
      TMPDIR: '/tmp',
      LANG: 'C.UTF-8',
      DISABLE_AUTOUPDATER: '1',
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    })
    const prompt = the_prompt_of({ before: [], covered: ['Una domanda segreta'] })
    expect(line.args.join(' ')).not.toContain('Una domanda segreta')
    expect(prompt).toContain('<<<\nUna domanda segreta\n>>>')
  })

  test('through bwrap: the copy and the system prompt read-only inside, the configuration bound writable, the environment cleared', () => {
    const line = the_command_line(
      settings,
      { ...place, cage: 'bwrap', claude: '/home/a/.local/share/claude/versions/2.1.302' },
      '/home/a/.local/share/cumino-assistente/copy/1',
      (path) => path !== '/lib64',
    )
    expect(line.file).toBe('bwrap')
    expect(line.env).toEqual({})
    const args = line.args.join(' ')
    expect(args).toContain('--unshare-all --share-net --die-with-parent --new-session --clearenv')
    expect(args).toContain('--ro-bind /home/a/.local/share/cumino-assistente/copy/1 /srv/cumino')
    expect(args).toContain('--bind /config/claude /home/assistente/claude')
    expect(args).toContain('--chdir /srv/cumino')
    expect(args).toContain('/opt/claude/claude -p --model sonnet')
    expect(args).not.toContain('--settings')
    expect(args).not.toContain('/lib64')
  })
})

describe('the answer', () => {
  test('a reply read from claude’s structured output', () => {
    const answer = the_answer_in(fixture('claude_replied.json'), '', 0)
    expect(answer.answer).toBe('replied')
    expect(answer.answer === 'replied' ? answer.reply : '').toContain('Cumino')
  })

  test('a reply carries the cost Claude Code estimates; an attempt over its budget, as 2.1.302 says it (B6)', () => {
    const replied = JSON.stringify({
      is_error: false,
      structured_output: { reply: 'Ciao' },
      total_cost_usd: 0.0412,
    })
    expect(the_answer_in(replied, '', 0)).toEqual({
      answer: 'replied',
      reply: 'Ciao',
      cost: 0.0412,
    })
    // The result of `claude -p --max-budget-usd 0.01 --output-format json` on 28 Nov 2026, its keys read.
    const over = JSON.stringify({
      type: 'result',
      subtype: 'error_max_budget_usd',
      is_error: true,
      num_turns: 4,
      stop_reason: 'tool_use',
      total_cost_usd: 0.015484,
      errors: ['Reached maximum budget ($0.01)'],
    })
    expect(the_answer_in(over, '', 1)).toEqual({ answer: 'over_its_budget' })
  })

  test('before the bot’s login: not logged in, as claude 2.1.302 says it', () => {
    expect(the_answer_in(fixture('claude_not_logged_in.json'), '', 1)).toEqual({
      answer: 'not_logged_in',
    })
  })

  test('an answer that does not parse, or a reply too long for a message: out of its form; a fault: failed, its first line', () => {
    expect(replied_if_it_fits({ reply: 'x'.repeat(3001) })).toEqual({ answer: 'out_of_its_form' })
    expect(replied_if_it_fits({ reply: 'Ciao', other: 1 })).toEqual({ answer: 'out_of_its_form' })
    expect(
      replied_if_it_fits({
        reply: 'Ciao',
        note: { title: 'T', kind: 'idea', request: 'R', context: '' },
      }),
    ).toMatchObject({ answer: 'replied', note: { kind: 'idea' } })
    const no_structured = JSON.stringify({ is_error: false, result: 'Ciao' })
    expect(the_answer_in(no_structured, '', 0)).toEqual({ answer: 'out_of_its_form' })
    expect(the_answer_in('', 'Segmentation fault\nmore', 139)).toEqual({
      answer: 'failed',
      exit: 139,
      fault: 'Segmentation fault',
    })
  })

  test('the answerer over its time: its process group ended', async () => {
    const started = performance.now()
    const ran = await run_with_its_time(
      { file: '/bin/sh', args: ['-c', 'sleep 30 & sleep 30'], env: {}, cwd: '/' },
      '',
      1,
    )
    expect(ran).toEqual({ ran: 'over_its_time' })
    expect(performance.now() - started).toBeLessThan(5_000)
  })
})

/** Whether `bwrap` runs here (the laptop; not a CI runner without user namespaces). */
const bwrap_runs = spawnSync('bwrap', ['--ro-bind', '/', '/', 'true']).status === 0

describe('the cage', () => {
  test.skipIf(!bwrap_runs)(
    'inside the cage: the copy and /usr, no home, no ssh, no aws, no vault (where bwrap runs)',
    () => {
      const folder = mkdtempSync(join(tmpdir(), 'cumino-cage-'))
      folders.push(folder)
      const copy = join(folder, 'copy')
      const configuration = join(folder, 'claude')
      mkdirSync(join(copy, 'progetto'), { recursive: true })
      mkdirSync(configuration)
      writeFileSync(join(copy, 'progetto', 'definizione.md'), 'Cumino')
      writeFileSync(join(folder, 'the_system_prompt.md'), 'prompt')
      const home = homedir()
      const args = the_bwrap_arguments(
        {
          claude: '/bin/sh',
          copy,
          configuration,
          system_prompt: join(folder, 'the_system_prompt.md'),
        },
        existsSync,
      )
      const script = [
        'cat /srv/cumino/progetto/definizione.md; echo',
        `for p in ${home} ${home}/.ssh ${home}/.aws ${home}/my-brain ${home}/.claude ${folder}; do test -e "$p" && echo "seen $p"; done`,
        'touch /srv/cumino/x 2>/dev/null && echo "copy writable"',
        'touch /usr/x 2>/dev/null && echo "usr writable"',
        'touch /tmp/x /home/assistente/claude/x && echo "own writable"',
        'env | sort | cut -d= -f1 | tr "\\n" " "',
      ].join('\n')
      const ran = spawnSync('bwrap', [...args, '/opt/claude/claude', '-c', script], {
        encoding: 'utf8',
        env: { HOME: home, AWS_PROFILE: 'cumino', PATH: '/usr/bin:/bin' },
      })
      expect(ran.stderr).toBe('')
      const [cumino, ...lines] = ran.stdout.trim().split('\n')
      expect(cumino).toBe('Cumino')
      const [writable, environment] = lines
      expect(writable).toBe('own writable')
      // The environment set again, nothing of the caller's (AWS_PROFILE); the shell's own aside.
      expect(
        (environment ?? '').split(' ').filter((name) => !['', 'PWD', 'SHLVL', '_'].includes(name)),
      ).toEqual([
        'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
        'CLAUDE_CONFIG_DIR',
        'DISABLE_AUTOUPDATER',
        'HOME',
        'LANG',
        'PATH',
        'TMPDIR',
      ])
      expect(lines).toHaveLength(2)
      expect(existsSync(join(configuration, 'x'))).toBe(true)
    },
  )
})
