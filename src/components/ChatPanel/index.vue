<script setup lang="ts">
import { v4 as uuid } from 'uuid'
import { Button as ElButton, Input as ElInput, Option as ElOption, Select as ElSelect } from 'element-ui'
import { handleMessageFactory, sendToOffscreen } from '~/utils/messaging'
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

  const responseDefer = Promise.withResolvers()

  const connectId = uuid()
  const port = browser.runtime.connect({ name: `${WorkerRequestStreamAi.tag}@${connectId}` })
  port.postMessage(
    new WorkerRequestStreamAi({
      connectId,
      sessionId: sessionId.value,
      prompt: prompt.value,
    }),
  )

  port.onMessage.addListener((message) => {
    if (message.payload.index === 0)
      aiResponse.value = ''

    aiResponse.value += message.payload.text

    if (message.payload.errorCode !== WorkerRequestStreamAiResponseErrorCode.NO_ERROR) {
      responseDefer.reject(message.payload)
      return
    }
    if (message.payload.index === -1)
      responseDefer.resolve(message.payload)
  })

  try {
    askLoading.value = true
    await responseDefer.promise
  }
  catch (e) {
    hasError.value = true
  }
  finally {
    askLoading.value = false
    port.disconnect()
  }
}
</script>

<template>
  <div>
    <form @submit.prevent="askAi">
      <ElInput v-model="prompt" type="textarea" />
      <ElButton type="primary" :loading="askLoading" @click="askAi">
        问Ai
      </ElButton>
    </form>
    <div class="ai-content">
      <MarkdownContent :content="aiResponse" />
    </div>
    <template v-if="hasError">
      &nbsp;&nbsp;<i class="el-icon-error color-red" />
    </template>
  </div>
</template>
