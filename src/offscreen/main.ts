import type Browser from 'webextension-polyfill'
import { sendToBackground, sendToTabById } from '../utils/messaging'
import { startupPromptStream } from './ai-connection-manager'
import { createSession } from './ai-sessiom-manager'
import { handleMessageFactory } from '~/utils/messaging'
import { BackgroundRelayOffscreenMessageToSender, WorkerRequestAiSessionId, WorkerRequestStreamAi, WorkerResponseStreamAi } from '~/type/worker-message'

handleMessageFactory('offscreen')(WorkerRequestAiSessionId.tag, async () => {
  return (await createSession()).id
})
handleMessageFactory('offscreen')(WorkerRequestStreamAi.tag, async (message, sender: Browser.Runtime.MessageSender) => {
  const { connectId, sessionId, prompt } = message.message.payload

  startupPromptStream({
    connectId,
    sessionId,
    prompt,
  }, (response) => {
    sendToBackground(
      new BackgroundRelayOffscreenMessageToSender(
        {
          sender,
          message: new WorkerResponseStreamAi({
            ...response,
          }),
        },
      ),
    )
  })
})

export default {}
