import { getSession } from './ai-sessiom-manager'
import { WorkerRequestStreamAiResponseErrorCode } from '~/type/worker-message'
import type { WorkerRequestStreamAiRequestPayload, WorkerRequestStreamAiResponsePayload } from '~/type/worker-message'

const connectionMapById: Record<string, true> = {}

type RequestPayload = WorkerRequestStreamAiRequestPayload
type ResponsePayload = WorkerRequestStreamAiResponsePayload
const ResponseErrorCode = WorkerRequestStreamAiResponseErrorCode

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
    index = -1
    callback({
      connectId,
      text: '',
      index,
      errorCode: ResponseErrorCode.NO_ERROR,
    })
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
  }
  finally {
    delete connectionMapById[connectId]
  }
}

export async function stopPromptStream(connectId: string) {
  delete connectionMapById[connectId]
}
