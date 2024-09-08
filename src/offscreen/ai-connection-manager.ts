import { getSession } from './ai-sessiom-manager'

const connectionMapById: Record<string, true> = {}

enum ResponseErrorCode {
  NO_ERROR = 0,
  UNKNOWN_ERROR = 1,
}
interface ResponsePayload {
  connectId: string
  text: string
  index: number
  errorCode: ResponseErrorCode
  errorContent?: any
}

interface RequestPayload {
  connectId: string
  sessionId: string
  prompt: string
}

export async function startupPromptStream(
  {
    connectId,
    sessionId,
    prompt,
  }: RequestPayload,
  callback: (payload: ResponsePayload) => void,
) {
  const session = await getSession(sessionId)
  connectionMapById[connectId] = true
  let index = 0
  let lastText = ''

  try {
    for await (const text of session.promptStreaming(prompt)) {
      if (!connectionMapById[connectId])
        return

      callback({
        connectId,
        text: text.substr(lastText.length),
        index,
        errorCode: ResponseErrorCode.NO_ERROR,
      })
      index++
      lastText = text
    }
  }
  catch (error) {
    index = -1
    callback({
      connectId,
      text: '',
      index,
      errorCode: ResponseErrorCode.UNKNOWN_ERROR,
      errorContent: error,
    })
    return
  }

  index = -1
  callback({
    connectId,
    text: '',
    index,
    errorCode: ResponseErrorCode.NO_ERROR,
  })
  delete connectionMapById[connectId]
}

export async function stopPromptStream(connectId: string) {
  delete connectionMapById[connectId]
}
