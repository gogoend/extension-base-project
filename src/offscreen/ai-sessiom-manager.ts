import { v4 as uuid } from 'uuid'

const sessionMapById: Record<string, any> = {}

export async function getSession(sessionId: string) {
  const session = sessionMapById[sessionId]
  if (!session)
    throw new Error('AI_SESSION_NOT_EXIST')

  return session
}

export async function createSession(options?) {
  const session = await window.ai.assistant.create(options)
  const sessionId = uuid()

  sessionMapById[sessionId] = session
  return {
    id: sessionId,
  }
}

export function destroySession(sessionId: string) {
  const session = sessionMapById[sessionId]
  session?.destroy()
}
