<script setup lang="ts">
import { v4 as uuid } from 'uuid'
import { Button as ElButton, Input as ElInput, Option as ElOption, Select as ElSelect } from 'element-ui'
import { handleMessageFactory, sendToOffscreen } from '~/utils/messaging'
import {
  WorkerRequestAiSessionId,
  WorkerRequestStreamAi,
  WorkerResponseStreamAi,
} from '~/type/worker-message'
import MarkdownContent from '~/components/MarkdownContent.vue'

const currentInstance = getCurrentInstance()!

const prompt = ref('')
const aiResponse = ref('')
const askLoading = ref(false)
const hasError = ref(false)
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

  let sessionId
  try {
    sessionId = await sendToOffscreen(new WorkerRequestAiSessionId())
  }
  catch {
    askLoading.value = false
    return
  }

  sendToOffscreen(new WorkerRequestStreamAi({
    connectId: uuid(),
    sessionId,
    prompt: prompt.value,
  }))

  ;(['tab', 'sidepanel'] as const).forEach((context) => {
    handleMessageFactory(context)(WorkerResponseStreamAi.tag, ({ message }) => {
      if (message.payload.index === 0)
        aiResponse.value = ''

      aiResponse.value += message.payload.text

      if (message.payload.index === -1) {
        askLoading.value = false
        if (message.payload.errorCode !== 0)
          hasError.value = true
      }
    })
  })
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
