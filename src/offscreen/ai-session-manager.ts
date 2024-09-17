import { v4 as uuid } from 'uuid'
import { ModelStatus } from '~/type/gemini-nano-model'

const sessionMapById: Record<string, any> = {}

export async function getSession(sessionId: string) {
  const session = sessionMapById[sessionId]
  if (!session)
    throw new Error('AI_SESSION_NOT_EXIST')

  return session
}

export async function activateAiComponentForFirstUse() {
  try {
    await Promise.allSettled([
      window.ai?.canCreateTextSession?.(),
      window.ai?.createTextSession?.(),
      window.ai?.assistant?.capabilities?.(),
      window.ai?.assistant?.create?.(),
    ])
  }
  catch {

  }
}

export async function checkModelAvailability() {
  let modelStatus = ModelStatus.NO
  if (typeof window.ai?.canCreateTextSession === 'function')
    modelStatus = await window.ai.canCreateTextSession()
  else if (typeof window.ai?.assistant?.capabilities === 'function')
    modelStatus = (await window.ai.assistant.capabilities()).available

  if (modelStatus === ModelStatus.READILY)
    return Promise.resolve()
  else if (modelStatus === ModelStatus.AFTER_DOWNLOAD)
    return Promise.reject(new Error('GEMINI_NANO_IS_DOWNLOADING'))
  else
    return Promise.reject(new Error('GEMINI_NANO_IS_UNAVAILABLE'))
}

export async function createSession(options?) {
  await checkModelAvailability()
  let session
  if (typeof window.ai?.createTextSession === 'function')
    session = await window.ai.createTextSession(options)

  else if (typeof window.ai?.assistant?.create === 'function')
    session = await window.ai.assistant.create(options)

  const sessionId = uuid()

  sessionMapById[sessionId] = session
  return {
    id: sessionId,
  }
}

export function destroySession(sessionId: string) {
  const session = sessionMapById[sessionId]
  try {
    session?.destroy()
  }
  catch (err) {
    console.error('会话销毁失败', err)
  }
  delete sessionMapById[session]
}
