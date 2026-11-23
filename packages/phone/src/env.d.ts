declare const __Q_VERSION__: string
declare const __Q_COMMIT__: string
/** When the commit was made, ISO 8601 in UTC, or 'unknown' (A, 23 Nov 2026). */
declare const __Q_COMMITTED_AT__: string
declare const __Q_CHANNEL__: 'release' | 'test' | 'dev'
/** The relay the node's tickets declare (PWA-2): the release's configuration. */
declare const __Q_RELAY__: string

declare module 'virtual:q-realms' {
  /** The realms' scripts of the extensions the app carries, by name (PWA-3). */
  export const realms: Readonly<Record<string, string>>
}
