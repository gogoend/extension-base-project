<script setup lang="ts">
import { Button as ElButton, Input as ElInput, Option as ElOption, Select as ElSelect } from 'element-ui'
import MessageList from './MessageList.vue'
import SuggestCard from './SuggestCard/index.vue'
import { sendToOffscreen, sendToStreamResponsePort } from '~/utils/messaging'
import {
  WorkerRequestAiSessionId,
  WorkerRequestStreamAi,
  WorkerRequestStreamAiResponseErrorCode,
} from '~/type/worker-message'
import { type MessageItem, ReceiveStatus } from '~/components/ChatPanel/types'

const currentInstance = getCurrentInstance()!

const messageList = ref<MessageItem[]>([])
const prompt = ref('')
const aiResponse = ref('')
const askLoading = ref(false)
const sessionId = ref('')
const chatCanceller = ref<null | (() => any)>(null)

async function initNewSession() {
  await chatCanceller.value?.()
  messageList.value = []
  sessionId.value = await sendToOffscreen(new WorkerRequestAiSessionId())
  aiResponse.value = ''
  askLoading.value = false
}
function handleSendClick() {
  if (askLoading.value) {
    currentInstance.proxy.$message({
      type: 'warning',
      message: 'AI正在回答哦',
    })
    return
  }
  if (!prompt.value.trim()) {
    currentInstance.proxy.$message({
      type: 'warning',
      message: '请输入文本~',
    })
    return
  }
  const p = askAi(prompt.value)
  prompt.value = ''
  return p
}
async function handleSendQuery(content: string) {
  if (askLoading.value) {
    currentInstance.proxy.$message({
      type: 'warning',
      message: 'AI正在回答哦',
    })
    return
  }
  if (!content.trim()) {
    currentInstance.proxy.$message({
      type: 'warning',
      message: '请输入文本~',
    })
    return
  }
  return askAi(content)
}
async function askAi(content: string) {
  askLoading.value = true

  const askMessage: MessageItem = {
    insertedBy: 'user',
    content: content.trim(),
    modifiedTime: new Date(),
    createdTime: new Date(),
    receiveStatus: ReceiveStatus.FINISHED,
  }
  messageList.value.push(askMessage)

  const respondingMessage: MessageItem = {
    insertedBy: 'robot',
    content: '',
    modifiedTime: new Date(),
    createdTime: new Date(),
    receiveStatus: ReceiveStatus.INITIALIZING,
  }
  messageList.value.push(respondingMessage)
  try {
    askLoading.value = true
    const { promise, cancel } = sendToStreamResponsePort(
      new WorkerRequestStreamAi({
        sessionId: sessionId.value,
        prompt: content.trim(),
      }),
      {
        streamHandler(message) {
          if (message.payload.index === 0)
            respondingMessage.content = ''

          respondingMessage.content += message.payload.text
          respondingMessage.modifiedTime = new Date()
          respondingMessage.receiveStatus = ReceiveStatus.PENDING
        },
        resolvePredict(message) {
          return (message.payload.index === -1) && message.payload.errorCode === WorkerRequestStreamAiResponseErrorCode.NO_ERROR
        },
        rejectPredict(message) {
          return message.payload.errorCode !== WorkerRequestStreamAiResponseErrorCode.NO_ERROR
        },
      },
    )
    chatCanceller.value = cancel
    await promise
  }
  catch (e) {
    if (e.message === 'CANCELLED')
      respondingMessage.receiveStatus = ReceiveStatus.CANCELLED
    else
      respondingMessage.receiveStatus = ReceiveStatus.ERROR
  }
  finally {
    respondingMessage.modifiedTime = new Date()

    askLoading.value = false
    chatCanceller.value = null
  }
}

initNewSession()
</script>

<template>
  <div class="chat-panel">
    <MessageList v-if="messageList.length" class="chat-panel__message-list" :message-list="messageList" />
    <SuggestCard v-else class="chat-panel__suggest-list" @send-query="handleSendQuery" />
    <ElButton @click="initNewSession">
      新会话
    </ElButton>
    <form class="submit-area" @submit.prevent="handleSendClick">
      <ElInput v-model="prompt" type="textarea" />
      <div>
        <ElButton type="primary" :loading="askLoading" @click="handleSendClick">
          问Ai
        </ElButton>
        <ElButton :disabled="!chatCanceller" @click="chatCanceller?.()">
          停止回答
        </ElButton>
      </div>
    </form>
  </div>
</template>

<style lang="css" scoped>
.chat-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .chat-panel__message-list {
    flex: 1 1 auto;
    overflow-y: auto;
    width: 100%;
  }
  .chat-panel__suggest-list {
    flex: 1 1 auto;
    overflow-y: auto;
    width: 100%;
  }
  .submit-area {
    width: 100%;
  }
}
</style>
