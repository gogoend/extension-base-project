import { startupPromptStream } from './ai-connection-manager'
import { createSession } from './ai-sessiom-manager'
import { WorkerRequestAiSessionId, WorkerRequestStreamAi, WorkerResponseStreamAi } from '~/type/worker-message'

(async () => {

})()

const handlerMap = {
  [WorkerRequestStreamAi.tag](message) {
    const { connectId, sessionId, prompt } = message.data.payload

    startupPromptStream({
      connectId,
      sessionId,
      prompt,
    }, (response) => {
      browser.runtime.sendMessage(new WorkerResponseStreamAi(response))
    })
  },
  async [WorkerRequestAiSessionId.tag]() {
    return (await createSession()).id
  },
}

browser.runtime.onMessage.addListener((message, sender) => {
  const messageType = message.data.messageType
  if (typeof handlerMap[messageType] !== 'function')
    return

  return handlerMap[messageType](message, sender)
})

export default {}
