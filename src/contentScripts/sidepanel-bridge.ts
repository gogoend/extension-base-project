import { SidepanelUpdateContextByPageContent } from '~/type/worker-message'
import { sendToSidepanel } from '~/utils/messaging'

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    sendToSidepanel(new SidepanelUpdateContextByPageContent({
      title: document.title,
      // eslint-disable-next-line unicorn/prefer-dom-node-text-content
      content: document.body.innerText?.substring(0, 800) ?? '',
    }))
  }
})

export {}
