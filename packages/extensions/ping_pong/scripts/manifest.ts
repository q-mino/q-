import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import * as prettier from 'prettier'
import { the_manifest_of_ping_pong } from '../the_manifest.ts'

// The build's step that writes the manifest as data (EXT-10; part 14.1):
// `manifest.json`, the one form the kernel reads, derived from the
// declaration and the tree (`the_manifest.ts`), formatted as the
// repository's files are. Its file is written here, outside the tree and
// outside what the extension bundles: the derivation needs no Node.

const path = fileURLToPath(new URL('../manifest.json', import.meta.url))
const options = (await prettier.resolveConfig(path)) ?? {}
await writeFile(
  path,
  await prettier.format(JSON.stringify(the_manifest_of_ping_pong), { ...options, filepath: path }),
)
