import { v4 as uuid } from 'uuid'
import { startupPromptStream } from './ai-connection-manager'
import { createSession } from './ai-sessiom-manager'

(async () => {
  const sessionId = (await createSession()).id
  startupPromptStream({
    connectId: uuid(),
    sessionId,
    prompt: 'Start a dynamic chat',
  }, console.warn)
})()

export default {}
