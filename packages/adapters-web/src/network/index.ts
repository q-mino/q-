// The device's network (WEB-4; UI-5's strip): the source the configurator
// injects, as it injects the clock. Nothing else of the phone reads
// `navigator`. The browser tells one thing for sure, that the device has no
// network (`navigator.onLine` false); that it has one says nothing of the
// relay (a network with no way out, a relay silent), so it is not told.

/** What the device tells of its network: no network, for sure; or nothing it can be sure of. */
export type TheNetworkTold = 'offline' | 'not_told'

/** The page's `navigator`, by the part the source reads. */
export interface ANavigatorOnLine {
  readonly onLine: boolean
}

/** The page's `window`, by the events the source listens to: `online` and `offline`. */
export interface AWindowOfTheNetwork {
  readonly addEventListener: (type: 'online' | 'offline', listener: () => void) => void
  readonly removeEventListener: (type: 'online' | 'offline', listener: () => void) => void
}

/** The device's network: what it tells now, and whoever listens, told at each change. */
export interface TheDeviceSNetwork {
  readonly now: () => TheNetworkTold
  readonly when_it_changes: (tell: () => void) => () => void
}

/**
 * The device's network (WEB-4): `navigator.onLine` read at each ask, false
 * told `offline`, true `not_told`; the page's `online` and `offline` events
 * told to whoever listens, until it stops listening.
 */
export const the_device_s_network = (page: {
  readonly navigator: ANavigatorOnLine
  readonly window: AWindowOfTheNetwork
}): TheDeviceSNetwork => ({
  now: () => (page.navigator.onLine ? 'not_told' : 'offline'),
  when_it_changes: (tell) => {
    const told = (): void => {
      tell()
    }
    page.window.addEventListener('online', told)
    page.window.addEventListener('offline', told)
    return () => {
      page.window.removeEventListener('online', told)
      page.window.removeEventListener('offline', told)
    }
  },
})
