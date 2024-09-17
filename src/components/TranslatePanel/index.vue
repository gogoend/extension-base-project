<script setup lang="ts">
import { Button as ElButton, Divider as ElDivider, Input as ElInput, Option as ElOption, Select as ElSelect } from 'element-ui'
import Vue, { computed, getCurrentInstance, ref } from 'vue'
import { sendToOffscreen, sendToStreamResponsePort } from '~/utils/messaging'
import {
  WorkerRequestAiSessionId,
  WorkerRequestStreamAi,
  WorkerRequestStreamAiResponseErrorCode,
} from '~/type/worker-message'
import { copyStr } from '~/utils/clipboard'

const currentInstance = getCurrentInstance()!

const query = ref('')
const aiResponse = ref('')
const askLoading = ref(false)
const hasError = ref(false)
const chatCanceller = ref<null | (() => any)>(null)
const langList = [
  'English',
  'French',
  'Deutsch',
  'Italian',
  'Japanese',
  'Korean',
  'Russian',
  'Simplified Chinese',
  'Spanish',
  'Traditional Chinese',
]
const selectedLang = ref(langList[0])

const promptForTranslate = computed(() => {
  return `Translate the following text to: ${selectedLang.value}.\n\n${query.value?.trim() ?? ''}`
})
const resultContainerEl = ref<HTMLElement>()
function scrollTranslateResultToBottom() {
  if (resultContainerEl.value) {
    const scrollEl = resultContainerEl.value
    scrollEl.scrollTo({
      top: scrollEl.scrollHeight - scrollEl.clientTop,
      behavior: 'smooth',
    })
  }
}
async function requestTranslate() {
  if (!selectedLang.value) {
    currentInstance.proxy.$message({
      type: 'warning',
      message: '请先选择一个语言哦~',
    })
    return
  }
  if (askLoading.value) {
    currentInstance.proxy.$message({
      type: 'warning',
      message: 'AI正在回答哦',
    })
    return
  }
  if (!query.value.trim()) {
    currentInstance.proxy.$message({
      type: 'warning',
      message: '请输入要翻译的文本~',
    })
    return
  }

  askLoading.value = true
  hasError.value = false
  aiResponse.value = ''

  let sessionId
  try {
    sessionId = await sendToOffscreen(new WorkerRequestAiSessionId())
  }
  catch {
    askLoading.value = false
    return
  }

  try {
    askLoading.value = true
    const { promise, cancel } = sendToStreamResponsePort(
      new WorkerRequestStreamAi({
        sessionId,
        prompt: promptForTranslate.value,
      }),
      {
        streamHandler(message) {
          if (message.payload.index === 0)
            aiResponse.value = ''

          aiResponse.value += message.payload.text
          scrollTranslateResultToBottom()
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
      void 0
    else
      hasError.value = true
  }
  finally {
    askLoading.value = false
    chatCanceller.value = null
  }
  Vue.nextTick(
    scrollTranslateResultToBottom,
  )
}

function handCopyClicked() {
  copyStr(aiResponse.value)
  currentInstance.proxy.$message({
    type: 'success',
    message: '复制成功',
  })
}
</script>

<template>
  <div class="translate-panel">
    <form class="form" @submit.prevent="requestTranslate">
      <ElInput v-model="query" placeholder="键入您要翻译的文本" type="textarea" />
    </form>
    <div class="divider-content">
      目标语言：
      <ElSelect v-model="selectedLang" placeholder="目标语言" size="mini" class="flex-1">
        <ElOption
          v-for="lang in langList"
          :key="lang"
          :label="lang"
          :value="lang"
        >
          {{ lang }}
        </ElOption>
      </ElSelect>
      <ElButton v-if="!askLoading" size="mini" type="primary" @click="requestTranslate">
        翻译
      </ElButton>
      <ElButton v-else size="mini" :disabled="!chatCanceller" @click="chatCanceller?.()">
        停止
      </ElButton>
      <span v-if="[askLoading, hasError].includes(true)" class="status-indicator">
        &nbsp;
        <i v-if="askLoading" class="el-icon-loading color-blue" />
        <i v-else-if="hasError" class="el-icon-error color-red" />
        &nbsp;
      </span>
    </div>
    <div class="translate-result-wrap">
      <div ref="resultContainerEl" class="translate-result">
        {{ aiResponse }}
      </div>
      <div class="translate-operations">
        <ElButton v-if="askLoading === false && hasError === false && aiResponse?.trim()" size="mini" @click="handCopyClicked()">
          <i class="el-icon-copy-document" /> 复制
        </ElButton>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.translate-panel {
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  .form {
    overflow-y: auto;
    &::v-deep(.el-textarea) {
      height: 100%;
      &::v-deep(.el-textarea__inner) {
        height: 100%;
        resize: none;
      }
    }
  }
  .divider-content {
    overflow: hidden;
    margin-top: 10px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    .status-indicator {
      white-space: nowrap;
    }
  }
  .translate-result-wrap {
    display: flex;
    height: 100%;
    flex-direction: column;
    overflow-y: hidden;
    .translate-result {
      flex: 1;
      overflow-y: auto;
      white-space: pre-line;

      padding: 5px 15px;
      line-height: 1.5;
      box-sizing: border-box;
      border: 1px solid #DCDFE6;
      border-radius: 4px;
      font-size: 14px;
    }
    .translate-operations {
    }
  }
}
</style>
