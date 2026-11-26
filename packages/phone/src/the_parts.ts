import type { APartsComponent, ThePartsOfTheApp } from '@q-mino/adapters-web/screens'
import * as boundary from '@q-mino/boundary'
import type { AnExtensionOfTheApp } from '@q-mino/memory'

// The parts the app carries (K-3, WEB-23, EXT-13; part M4 of messaging):
// each extension carried with the modules of its parts, by the path its
// points name (`shows`, `parts/<name>.js`, the package's export of that
// subpath), each imported when first drawn, so that an extension off loads
// none of its files (only an active extension's part is drawn, A, 24 Nov
// 2026). Its importer is written beside its realm, by the composition root:
// a static specifier the build walks (PWA-4), the same subpath `shows`
// names, which a test of the phone keeps equal to the manifests.
// [Q, C, high impact: A to discuss] (27 Nov 2026)

/** The module of a part, imported (`import('@q-mino/<name>/parts/<name>.js')`): its export `part`, a component of the extension's. */
export interface APartsModule {
  readonly part: APartsComponent
}

/** An extension the app carries (EXT-9, EXT-13): its manifest and its realm, and its parts' modules by the path its points name. */
export interface AnExtensionCarried extends AnExtensionOfTheApp {
  readonly parts?: Readonly<Record<string, () => Promise<APartsModule>>>
}

/** The path a point names (`shows`), from a manifest as data: a slot's or a page's by its name; none for a manifest that does not parse, which its composition tells. */
const the_module_of = (
  manifest: unknown,
  point: { readonly point: 'slot' | 'page'; readonly name: string },
): string | undefined => {
  const parsed = boundary.the_manifest.safeParse(manifest)
  if (!parsed.success) return undefined
  const points = point.point === 'slot' ? parsed.data.slots : parsed.data.pages
  return Object.hasOwn(points, point.name) ? points[point.name]?.shows : undefined
}

/** The name a manifest gives its extension, none for one that does not parse. */
const the_name_of = (manifest: unknown): string | undefined => {
  const parsed = boundary.the_manifest.safeParse(manifest)
  return parsed.success ? parsed.data.name : undefined
}

/**
 * The parts the screens draw (`ThePartsOfTheApp`), from the extensions the
 * app carries: a point's part carried when its extension's manifest names a
 * module there and the app carries that module; else not carried, the
 * app's fault (WEB-23).
 */
export const the_parts_carried =
  (extensions: readonly AnExtensionCarried[]): ThePartsOfTheApp =>
  (extension, point) => {
    const carried = extensions.find((each) => the_name_of(each.manifest) === extension)
    const shows = carried === undefined ? undefined : the_module_of(carried.manifest, point)
    const imports =
      shows === undefined || carried?.parts === undefined || !Object.hasOwn(carried.parts, shows)
        ? undefined
        : carried.parts[shows]
    return imports === undefined
      ? { part: 'not_carried' }
      : { part: 'carried', imports: async () => (await imports()).part }
  }
