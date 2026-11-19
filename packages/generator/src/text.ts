// The text of the generated files: their first line, their header, the JSDoc
// of their members. The shell formats it with the repository's Prettier, so
// that a generated file is what `pnpm format` leaves.

/** The first line of every generated file, which tells it from an authored one. */
export const generated = '// generated'

/** A file: its first line, its header as comment lines, then its parts, one blank line apart. */
export const file = (header: readonly string[], parts: readonly string[]): string =>
  [generated, header.map((line) => `// ${line}`.trimEnd()).join('\n'), ...parts]
    .filter((part) => part !== '')
    .join('\n\n') + '\n'

/** A JSDoc of paragraphs, each a list of lines, the empty ones left out. */
export const jsdoc = (paragraphs: readonly (readonly string[])[]): string => {
  const lines = paragraphs
    .filter((paragraph) => paragraph.length > 0)
    .flatMap((paragraph, index) => (index === 0 ? paragraph : ['', ...paragraph]))
  return ['/**', ...lines.map((line) => ` * ${line}`.trimEnd()), ' */'].join('\n')
}

/** Words cut into comment lines of at most 78 characters. */
export const wrap = (sentence: string): readonly string[] =>
  sentence.split(' ').reduce<readonly string[]>((lines, word) => {
    const last = lines.at(-1)
    return last !== undefined && last.length + 1 + word.length <= 77
      ? [...lines.slice(0, -1), `${last} ${word}`]
      : [...lines, word]
  }, [])
