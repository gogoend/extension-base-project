<script setup lang="ts">
import { v4 as uuid } from 'uuid'
import { Button as ElButton, Input as ElInput, Option as ElOption, Select as ElSelect } from 'element-ui'
import { handleMessageFactory, sendToOffscreen, sendToStreamResponsePort } from '~/utils/messaging'
import {
  WorkerRequestAiSessionId,
  WorkerRequestStreamAi,
  WorkerRequestStreamAiResponseErrorCode,
  WorkerResponseStreamAi,
} from '~/type/worker-message'
import MarkdownContent from '~/components/MarkdownContent.vue'

const currentInstance = getCurrentInstance()!

const prompt = ref('')
const aiResponse = ref('')
const askLoading = ref(false)
const hasError = ref(false)
const sessionId = ref('')
const chatCanceller = ref<null | (() => any)>(null)
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
  hasError.value = false

  if (!sessionId.value) {
    try {
      sessionId.value = await sendToOffscreen(new WorkerRequestAiSessionId())
    }
    catch {
      askLoading.value = false
      return
    }
  }

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
            aiResponse.value = ''

          aiResponse.value += message.payload.text
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
    hasError.value = true
  }
  finally {
    askLoading.value = false
    chatCanceller.value = null
  }
}

const presetQueries = [
  `Different between Google and Baidu`,
  `1000 words novel`,
  `Should I choose Android Phone or iPhone?`,
]
</script>

<template>
  <div>
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
    <div class="ai-content">
      <MarkdownContent :content="aiResponse" />
    </div>
    <template v-if="hasError">
      &nbsp;&nbsp;<i class="el-icon-error color-red" />
    </template>
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
