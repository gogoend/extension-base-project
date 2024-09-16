import { handleStreamResponsePort, parseConnectName } from '../utils/messaging'
import { startupPromptStream } from './ai-connection-manager'
import { createSession } from './ai-session-manager'
import { handleMessageFactory } from '~/utils/messaging'
import { WorkerRequestAiSessionId, WorkerRequestStreamAi, WorkerResponseStreamAi } from '~/type/worker-message'

handleMessageFactory('offscreen')(WorkerRequestAiSessionId.tag, async () => {
  return (await createSession()).id
})

handleStreamResponsePort(WorkerRequestStreamAi.tag, (message, port) => {
  const { sessionId, prompt } = message.payload
  const [,connectId] = parseConnectName(port.name)

  startupPromptStream({
    connectId,
    sessionId,
    prompt,
  }, {
    streamingCallback(response) {
      port.postMessage(
        new WorkerResponseStreamAi({
          ...response,
        }),
      )
    },
    endCallback() {
      port.disconnect()
    },
  })
})

export default {}
