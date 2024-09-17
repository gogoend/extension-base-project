import { WorkerStopStreamPort, handleStreamResponsePort, parseConnectName } from '../utils/messaging'
import { startupPromptStream, stopPromptStream } from './ai-connection-manager'
import { createSession, destroySession } from './ai-session-manager'
import { handleMessageFactory } from '~/utils/messaging'
import { WorkerRequestAiSessionId, WorkerRequestStreamAi, WorkerResponseStreamAi } from '~/type/worker-message'

handleMessageFactory('offscreen')(WorkerRequestAiSessionId.tag, async ({ message }) => {
  if (
    message.payload.oldSessionId
  )
    destroySession(message.payload.oldSessionId)

  return (await createSession()).id
})

handleStreamResponsePort(WorkerRequestStreamAi.tag, (message, port) => {
  const [,connectId] = parseConnectName(port.name)
  switch (message.messageType) {
    case WorkerRequestStreamAi.tag: {
      const { sessionId, prompt } = message.payload
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
      break
    }
    case WorkerStopStreamPort.tag: {
      return stopPromptStream(connectId)
    }
  }
})

export default {}
