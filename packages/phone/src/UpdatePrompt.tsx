import { Show } from 'solid-js'
import { useRegisterSW } from 'virtual:pwa-register/solid'
import { texts } from './texts/index.ts'

// The update with notice (PWA-5): the new service worker downloads and
// waits, and the old code keeps running until she chooses "Aggiorna";
// nothing happens in silence. Before the switch the node stops (its
// consumers, its extensions unloaded, the writer let go, WEB-10), so that
// the new release opens the database alone.
export const UpdatePrompt = (props: { readonly before_the_update: () => Promise<void> }) => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const updates = async (): Promise<void> => {
    await props.before_the_update()
    await updateServiceWorker(true)
  }

  return (
    <Show when={needRefresh()}>
      <div role="alertdialog" aria-live="polite">
        <p>{texts.update.available}</p>
        <p>{texts.update.whatChanges}</p>
        <button type="button" onClick={() => void updates()}>
          {texts.update.apply}
        </button>
        <button type="button" onClick={() => setNeedRefresh(false)}>
          {texts.update.later}
        </button>
      </div>
    </Show>
  )
}
