import { Show } from 'solid-js'
import { useRegisterSW } from 'virtual:pwa-register/solid'
import { texts } from './texts/index.ts'

// The new service worker downloads and waits: the old code keeps running
// until the user chooses "Aggiorna". Nothing happens in silence.
export const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <Show when={needRefresh()}>
      <div role="alertdialog" aria-live="polite">
        <p>{texts.update.available}</p>
        <p>{texts.update.whatChanges}</p>
        <button type="button" onClick={() => void updateServiceWorker(true)}>
          {texts.update.apply}
        </button>
        <button type="button" onClick={() => setNeedRefresh(false)}>
          {texts.update.later}
        </button>
      </div>
    </Show>
  )
}
