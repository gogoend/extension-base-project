<script setup lang="ts">
import { Button as ElButton, Input as ElInput, Option as ElOption, Select as ElSelect } from 'element-ui'
import MessageList from './MessageList.vue'
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
  sessionId.value = await sendToOffscreen(new WorkerRequestAiSessionId())
  aiResponse.value = ''
  askLoading.value = false
}
async function askAi() {
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

  askLoading.value = true

  const askMessage: MessageItem = {
    insertedBy: 'user',
    content: prompt.value.trim(),
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
        prompt: prompt.value,
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

const presetQueries = [
  `Different between Google and Baidu`,
  `1000 words novel`,
  `Should I choose Android Phone or iPhone?`,
]

initNewSession()
</script>

<template>
  <div>
    <MessageList :message-list="messageList" />
    <ElButton @click="initNewSession">
      新会话
    </ElButton>
    <form @submit.prevent="askAi">
      <ElInput v-model="prompt" type="textarea" />
      <div>
        <ElButton type="primary" :loading="askLoading" @click="askAi">
          问Ai
        </ElButton>
        <ElButton :disabled="!chatCanceller" @click="chatCanceller?.()">
          停止回答
        </ElButton>
      </div>
      <div class="suggest-list">
        <a
          v-for="(it, index) in presetQueries"
          :key="index"
          class="suggest-item"
          :loading="askLoading"
          href="javascript:void(0);"
          @click="() => {
            prompt = it
            askAi()
          }"
        >
          {{ it }}
        </a>
      </div>
    </form>
  </div>
</template>

<style lang="css" scoped>
.suggest-list {
  display: flex;
  gap: 8px;
  .suggest-item {
    padding: 8px 16px;
    background-color: #f4f4f4;
    border-radius: 9999px;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
