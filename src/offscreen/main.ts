import { handleStreamResponsePort, sendToBackground, sendToTabById } from '../utils/messaging'
import { startupPromptStream } from './ai-connection-manager'
import { createSession } from './ai-sessiom-manager'
import { handleMessageFactory } from '~/utils/messaging'
import { WorkerRequestAiSessionId, WorkerRequestStreamAi, WorkerResponseStreamAi } from '~/type/worker-message'

handleMessageFactory('offscreen')(WorkerRequestAiSessionId.tag, async () => {
  return (await createSession()).id
})

handleStreamResponsePort(WorkerRequestStreamAi.tag, (message, port) => {
  const { connectId, sessionId, prompt } = message.payload

  startupPromptStream({
    connectId,
    sessionId,
    prompt,
  }, (response) => {
    port.postMessage(
      new WorkerResponseStreamAi({
        ...response,
      }),
    )
    if (response.index === -1)
      port.disconnect()
  })
})

export default {}
