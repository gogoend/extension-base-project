<script setup lang="ts">
import { Button as ElButton, Input as ElInput, Option as ElOption, Select as ElSelect } from 'element-ui'
import Vue from 'vue'
import MessageList from './MessageList.vue'
import SuggestCard from './SuggestCard/index.vue'
import GeminiNanoNotAvailableTipDialog from './GeminiNanoNotAvailableTipDialog.vue'
import GeminiNanoDownloadingTipDialog from './GeminiNanoDownloadingTipDialog.vue'
import { sendToOffscreen, sendToStreamResponsePort } from '~/utils/messaging'
import {
  WorkerRequestAiSessionId,
  WorkerRequestStreamAi,
  WorkerRequestStreamAiResponseErrorCode,
} from '~/type/worker-message'
import { ReceiveStatus } from '~/components/ChatPanel/types'
import type { MessageItem, SuggestMessageFrom } from '~/components/ChatPanel/types'
import mountElDialogAsApp from '~/utils/mount-el-dialog-as-app'
import gtag from '~/utils/gtag'

const currentInstance = getCurrentInstance()!

const messageList = ref<MessageItem[]>([])
const prompt = ref('')
const aiResponse = ref('')
const askLoading = ref(false)
const sessionId = ref<null | string>(null)
const chatCanceller = ref<null | (() => any)>(null)

async function initNewSession() {
  await chatCanceller.value?.()
  messageList.value = []
  aiResponse.value = ''
  askLoading.value = false
  try {
    sessionId.value = await sendToOffscreen(new WorkerRequestAiSessionId({ oldSessionId: sessionId.value ?? undefined }))
  }
  catch (err) {
    if (err instanceof Error) {
      switch (err.message) {
        case 'GEMINI_NANO_IS_UNAVAILABLE': {
          mountElDialogAsApp(GeminiNanoNotAvailableTipDialog, {}).then(({ promise }) => promise).then(() => {
            initNewSession()
          })
          break
        }
        case 'GEMINI_NANO_IS_DOWNLOADING': {
          mountElDialogAsApp(GeminiNanoDownloadingTipDialog, {}).then(() => {
            initNewSession()
          })
          break
        }
        default: {
          mountElDialogAsApp(GeminiNanoNotAvailableTipDialog, {}).then(() => {
            initNewSession()
          })
        }
      }
    }
  }
}
function handleSendClick() {
  gtag('ai_chat__click_send', { chatSessionId: sessionId.value })

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
async function handleSendQuery({ content, from }: { content: string, from: SuggestMessageFrom }) {
  gtag('ai_chat__click_recommend', { chatSessionId: sessionId.value, chatFrom: from })

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

const messageListRef = ref<InstanceType<typeof MessageList>>()
function scrollMessageListElToBottom() {
  if (messageListRef.value?.$el) {
    const scrollEl = messageListRef.value?.$el
    scrollEl.scrollTo({
      top: scrollEl.scrollHeight - scrollEl.clientTop,
      behavior: 'smooth',
    })
  }
}
async function askAi(content: string) {
  askLoading.value = true
  const askMessage: MessageItem = {
    insertedBy: 'user',
    content: content.trim(),
    modifiedTime: new Date(),
    createdTime: new Date(),
    receiveStatus: ReceiveStatus.FINISHED,
    receivedPayloadIndex: -1,
    sessionId: sessionId.value!,
  }
  gtag('ai_chat__ask_start', {
    chatSessionId: sessionId.value,
    queryLength: askMessage.content.length,
    createdTime: Number(askMessage.createdTime),
    modifiedTime: Number(askMessage.modifiedTime),
  })

  messageList.value.push(askMessage)

  const respondingMessage: MessageItem = {
    insertedBy: 'robot',
    content: '',
    modifiedTime: new Date(),
    createdTime: new Date(),
    receiveStatus: ReceiveStatus.INITIALIZING,
    receivedPayloadIndex: -1,
    sessionId: sessionId.value!,
  }
  messageList.value.push(respondingMessage)
  Vue.nextTick(() => {
    scrollMessageListElToBottom()
  })

  try {
    askLoading.value = true
    const { promise, cancel } = sendToStreamResponsePort(
      new WorkerRequestStreamAi({
        sessionId: sessionId.value!,
        prompt: content.trim(),
      }),
      {
        streamHandler(message) {
          if (message.payload.index === 0)
            respondingMessage.content = ''
          respondingMessage.receivedPayloadIndex = message.payload.index >= 0 ? message.payload.index : respondingMessage.receivedPayloadIndex

          respondingMessage.content += message.payload.text
          respondingMessage.modifiedTime = new Date()
          respondingMessage.receiveStatus = ReceiveStatus.PENDING

          if (message.payload.index === 0) {
            gtag('ai_chat__receive_start', {
              chatSessionId: sessionId.value,
              segIndexAt: respondingMessage.receivedPayloadIndex,
              responseLength: respondingMessage.content.length,
              createdTime: Number(respondingMessage.createdTime),
              modifiedTime: Number(respondingMessage.modifiedTime),
            })
          }
          scrollMessageListElToBottom()
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
    respondingMessage.receiveStatus = ReceiveStatus.FINISHED
    gtag('ai_chat__receive_done', {
      chatSessionId: sessionId.value,
      segIndexAt: respondingMessage.receivedPayloadIndex,
      responseLength: respondingMessage.content.length,
      createdTime: Number(respondingMessage.createdTime),
      modifiedTime: Number(respondingMessage.modifiedTime),
    })
  }
  catch (e) {
    if (e.message === 'CANCELLED') {
      respondingMessage.receiveStatus = ReceiveStatus.CANCELLED
      gtag('ai_chat__receive_cancelled', {
        chatSessionId: sessionId.value,
        segIndexAt: respondingMessage.receivedPayloadIndex,
        responseLength: respondingMessage.content.length,
        createdTime: Number(respondingMessage.createdTime),
        modifiedTime: Number(respondingMessage.modifiedTime),
      })
    }
    else {
      respondingMessage.receiveStatus = ReceiveStatus.ERROR
      gtag('ai_chat__receive_error', {
        chatSessionId: sessionId.value,
        segIndexAt: respondingMessage.receivedPayloadIndex,
        responseLength: respondingMessage.content.length,
        createdTime: Number(respondingMessage.createdTime),
        modifiedTime: Number(respondingMessage.modifiedTime),
      })
    }
  }
  finally {
    respondingMessage.modifiedTime = new Date()

    askLoading.value = false
    chatCanceller.value = null
  }
}

initNewSession()

const isInputFocusing = ref(false)
</script>

<template>
  <div class="chat-panel">
    <MessageList v-if="messageList.length" ref="messageListRef" class="chat-panel__message-list" :message-list="messageList" />
    <SuggestCard v-else class="chat-panel__suggest-list" @send-query="handleSendQuery" />
    <div class="toolbar">
      <ElButton
        size="mini" type="text" :disabled="!messageList.length" @click="() => {
          gtag('ai_chat__click_new_chat_button')
          initNewSession()
        }"
      >
        <i class="el-icon-brush" /> 新会话
      </ElButton>
    </div>
    <form class="submit-area" :class="{ 'submit-area--focusing': isInputFocusing }" @submit.prevent="handleSendClick">
      <div class="main-wrap">
        <ElInput v-model="prompt" class="query-input" type="textarea" @focus="isInputFocusing = true" @blur="isInputFocusing = false" />
        <div class="operation-button-wrap">
          <ElButton v-if="!askLoading" size="mini" type="primary" :loading="askLoading" @click="handleSendClick">
            问Ai
          </ElButton>
          <ElButton
            v-else size="mini" @click="() => {
              gtag('ai_chat__click_cancel_button')
              chatCanceller?.()
            }"
          >
            停止
          </ElButton>
        </div>
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
    margin: 0 auto;
    .query-input {
      &::v-deep(.el-textarea__inner) {
        border: 0;
        resize: none;
        border-radius: 0;
      }
    }
    .operation-button-wrap {
      width: 100%;
      background-color: #fafafa;
      display: flex;
      justify-content: flex-end;
    }
    position: relative;
    &::before {
      content: '';
      display: block;
      position: absolute;
      inset: 0px;
      background-color: rgb(235, 235, 235);
      z-index: -1;
      border-radius: 8px;
    }
    &.submit-area--focusing {
      &::before {
        content: '';
        background-color: transparent;
        background-image: linear-gradient(45deg, #2af8e0, #00f, #ff9bf0);
      }
    }
    .main-wrap {
      border-radius: 6px;
      overflow: hidden;
      width: calc(100% - 4px);
      height: calc(100% - 4px);
      position: relative;
      left: 2px;
      top: 2px;
    }
  }
}
</style>

<style lang="css">
.el-message-box.session-init-error-message-box {
  width: calc(100% - 40px);
  max-width: 480px;
}
</style>
