<script setup lang="ts">
import { Button as ElButton, Input as ElInput, Option as ElOption, Select as ElSelect } from 'element-ui'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import { v4 as uuid } from 'uuid'
import mountElDialogAsApp from '../../utils/mount-el-dialog-as-app'
import CloseConfirm from './components/CloseConfirm.vue'
import request from '~/contentScripts/utils/request'
import {
  WorkerGetLocalStorage,
  WorkerRequestAiSessionId,
  WorkerRequestStreamAi,
  WorkerResponseStreamAi,
  WorkerUpdateLocalStorage,
} from '~/type/worker-message'

const r = ref()
onMounted(() => {
  request.get('https://example.com').then((res) => {
    r.value = res.data
  })
})
// 通过getCurrentInstance().appContext访问全局属性
const currentInstance = getCurrentInstance()!
async function handleCloseClick() {
  mountElDialogAsApp(CloseConfirm, { uniqueElId: 'close-confirm-dialog' })
    .then(({ promise }) => {
      return promise
    })
    .then(async (closeScope) => {
      currentInstance.proxy.$root.$disposeCsui()
      if (closeScope === 2) {
        let localStorage = (await sendMessage(WorkerGetLocalStorage.tag, new WorkerGetLocalStorage()))
        localStorage = {
          ...localStorage,
          searchEngineEnhanceDisabled: true,
        }
        await sendMessage(WorkerUpdateLocalStorage.tag, new WorkerUpdateLocalStorage(localStorage))
      }
    })
    .catch(() => void 0)
}

const selectValue = ref(1)

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
    sessionId = await sendMessage(WorkerRequestAiSessionId.tag, new WorkerRequestAiSessionId())
  }
  catch {
    askLoading.value = false
    return
  }

  sendMessage(WorkerRequestStreamAi.tag, new WorkerRequestStreamAi({
    connectId: uuid(),
    sessionId,
    prompt: prompt.value,
  }))

  onMessage(WorkerResponseStreamAi.tag, (message) => {
    if (message.data.payload.index === 0)
      aiResponse.value = ''

    aiResponse.value += message.data.payload.text

    if (message.data.payload.index === -1) {
      askLoading.value = false
      if (message.data.payload.errorCode !== 0)
        hasError.value = true
    }
  })
}
</script>

<template>
  <div class="search-engine-insertion">
    <ElButton type="text" @click="handleCloseClick">
      关闭
    </ElButton>
    <br>
    <form @submit.prevent="askAi">
      <ElInput v-model="prompt" type="textarea" />
      <ElButton type="primary" :loading="askLoading" @click="askAi">
        问Ai
      </ElButton>
    </form>
    <div class="ai-content">
      {{ aiResponse }}<template v-if="hasError">
        &nbsp;&nbsp;<i class="el-icon-error color-red" />
      </template>
    </div>
    <div v-dompurify-html="r" />
    <ElSelect v-model="selectValue" :teleported="false">
      <ElOption :value="1">
        1
      </ElOption>
      <ElOption :value="2">
        2
      </ElOption>
      <ElOption :value="3">
        3
      </ElOption>
    </ElSelect>
  </div>
</template>

<style scoped>

</style>
