import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import * as prettier from 'prettier'
import { words } from '../texts/it.ts'

// The build's step that writes the words as data (EXT-16, WEB-22): `texts/it.json`,
// the one form the kernel reads, from the typed module (`texts/it.ts`),
// formatted as the repository's files are, as `scripts/manifest.ts` writes
// the manifest. Its file is written here, outside what the extension bundles.

const path = fileURLToPath(new URL('../texts/it.json', import.meta.url))
const options = (await prettier.resolveConfig(path)) ?? {}
await writeFile(path, await prettier.format(JSON.stringify(words), { ...options, filepath: path }))
