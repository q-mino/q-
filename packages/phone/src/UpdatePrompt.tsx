import { createSignal, onMount, Show } from 'solid-js'
import { the_build } from './build_info.ts'
import { texts } from './texts/index.ts'

// The update with notice (PWA-5): the new service worker downloads and
// waits, and the old code keeps running until she chooses "Aggiorna";
// nothing happens in silence. Before the switch the node stops (its
// consumers, its extensions unloaded, the writer let go, WEB-10), so that
// the new release opens the database alone. On the browser's own events
// (`navigator.serviceWorker`), with no library. [Q, C, 24 Nov 2026]

/** The worker of a new release once it is installed and waits: there is one only if a release runs already. */
const when_a_new_one_waits = (
  registration: ServiceWorkerRegistration,
  waits: (worker: ServiceWorker) => void,
): void => {
  const a_page_runs = (): boolean => navigator.serviceWorker.controller !== null
  if (registration.waiting !== null && a_page_runs()) waits(registration.waiting)
  registration.addEventListener('updatefound', () => {
    const installing = registration.installing
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed' && a_page_runs()) waits(installing)
    })
  })
}

export const UpdatePrompt = (props: { readonly before_the_update: () => Promise<void> }) => {
  const [waiting, set_waiting] = createSignal<ServiceWorker | undefined>()

  onMount(() => {
    // No service worker out of a secure context (a page over plain http, not localhost).
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register(`${the_build.base}sw.js`, { scope: the_build.base, updateViaCache: 'none' })
      .then((registration) => {
        when_a_new_one_waits(registration, set_waiting)
      })
      // Not registered, the app works online only: nothing to tell before an update.
      .catch(() => undefined)
  })

  const updates = async (worker: ServiceWorker): Promise<void> => {
    await props.before_the_update()
    // The new release takes the page, then the page opens again under it.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      location.reload()
    })
    worker.postMessage({ type: 'SKIP_WAITING' })
  }

  return (
    <Show when={waiting()}>
      {(worker) => (
        <div role="alertdialog" aria-live="polite">
          <p>{texts.update.available}</p>
          <p>{texts.update.whatChanges}</p>
          <button type="button" onClick={() => void updates(worker())}>
            {texts.update.apply}
          </button>
          <button
            type="button"
            onClick={() => {
              set_waiting(undefined)
            }}
          >
            {texts.update.later}
          </button>
        </div>
      )}
    </Show>
  )
}
