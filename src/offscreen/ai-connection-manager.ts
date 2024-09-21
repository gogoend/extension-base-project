import { getSession } from './ai-session-manager'
import { WorkerRequestStreamAiResponseErrorCode } from '~/type/worker-message'
import type { WorkerRequestStreamAiRequestPayload, WorkerRequestStreamAiResponsePayload } from '~/type/worker-message'

const connectionMapById: Record<string, true> = {}

type RequestPayload = WorkerRequestStreamAiRequestPayload & { connectId: string }
type ResponsePayload = WorkerRequestStreamAiResponsePayload
const ResponseErrorCode = WorkerRequestStreamAiResponseErrorCode
interface CallbackMap {
  streamingCallback?: (payload: ResponsePayload) => void
  endCallback?: () => void
}

export async function startupPromptStream(
  {
    connectId,
    sessionId,
    prompt,
  }: RequestPayload,
  {
    streamingCallback,
    endCallback,
  }: CallbackMap,
) {
  const session = await getSession(sessionId)
  connectionMapById[connectId] = true
  let index = 0
  let lastText = ''

  const stream = session.promptStreaming(prompt) as ReadableStream<any>
  try {
    for await (const text of stream) {
      if (!connectionMapById[connectId])
        return

      streamingCallback?.({
        text: text.substr(lastText.length),
        index,
        errorCode: ResponseErrorCode.NO_ERROR,
      })
      index++
      lastText = text
    }
    index = -1
    streamingCallback?.({
      text: '',
      index,
      errorCode: ResponseErrorCode.NO_ERROR,
    })
  }
  catch (error) {
    index = -1
    let repackedError = error
    if (error instanceof DOMException || error instanceof Error) {
      repackedError = {
        ...error,
        stack: error.stack,
        message: error.message,
        name: error.name,
      }
    }
    streamingCallback?.({
      text: '',
      index,
      errorCode: ResponseErrorCode.UNKNOWN_ERROR,
      errorContent: repackedError,
    })
  }
  finally {
    delete connectionMapById[connectId]
    endCallback?.()
  }
}

export async function stopPromptStream(connectId: string) {
  delete connectionMapById[connectId]
}
