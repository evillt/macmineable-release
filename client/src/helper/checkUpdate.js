import { createToast } from 'vercel-toast'
import 'vercel-toast/dist/vercel-toast.css'
import { ipc } from '../ipc'
import { compareVersion } from '../util/compareVersion'
import pkg from '../../../package.json'
import { ticker } from '../util/ticker'
import { onDestroy } from 'svelte'
import { listen } from 'svelte/internal'

const appVersion = pkg.version

const url =
  'https://api.github.com/repos/evillt/macmineable-release/releases?per_page=1'
let toast

export function checkUpdate() {
  if (import.meta.env.PROD) {
    check()

    const checkUpdateTicker = ticker(1800, check)

    function check() {
      fetch(url)
        .then((res) => res.json())
        .then(([release]) => {
          const version = release.name.startsWith('v')
            ? release.name.slice(1)
            : release.name

          if (compareVersion(version, appVersion)) {
            checkUpdateTicker.stopTicker()
            toast = createToast('New release avaliable!', {
              action: {
                text: 'Download',
                callback: () => {
                  ipc.send('emitOpenURL', release.html_url)
                },
              },
              cancel: 'Ignore',
            })
          }
        })
    }

    const unlisten = listen(
      document,
      'visibilitychange',
      () => {
        if (toast) return
        if (document.visibilityState === 'visible') {
          checkUpdateTicker.startTicker()
        } else {
          checkUpdateTicker.stopTicker()
        }
      },
      false,
    )

    onDestroy(() => {
      unlisten()
      checkUpdateTicker.stopTicker()
    })
  }
}
