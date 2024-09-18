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
import gtag from '~/utils/gtag'

const currentInstance = getCurrentInstance()!

const query = ref('')
const aiResponse = ref('')
const askLoading = ref(false)
const hasError = ref(false)
const createdTime = ref<null | Date>(null)
const modifiedTime = ref<null | Date>(null)
const receivedPayloadIndex = ref(-1)
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

watch(() => {
  return selectedLang.value
}, (val) => {
  gtag('ai_translate__target_lang_switch', { lang: val })
})

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
const sessionId = ref<string | null>(null)
async function requestTranslate() {
  gtag('ai_translate__click_translate_button')
  if (!selectedLang.value) {
    gtag('ai_translate__request_startup_error_no_target_lang')
    currentInstance.proxy.$message({
      type: 'warning',
      message: '请先选择一个语言哦~',
    })
    return
  }
  if (askLoading.value) {
    gtag('ai_translate__request_startup_error_ai_busy')
    currentInstance.proxy.$message({
      type: 'warning',
      message: 'AI正在回答哦',
    })
    return
  }
  if (!query.value.trim()) {
    gtag('ai_translate__content_validate_error_empty')
    currentInstance.proxy.$message({
      type: 'warning',
      message: '请输入要翻译的文本~',
    })
    return
  }

  askLoading.value = true
  hasError.value = false
  aiResponse.value = ''
  createdTime.value = new Date()
  modifiedTime.value = new Date()
  receivedPayloadIndex.value = -1

  try {
    sessionId.value = await sendToOffscreen(new WorkerRequestAiSessionId({ oldSessionId: sessionId.value ?? undefined }))
    gtag('ai_translate__request_start', {
      translateSessionId: sessionId.value,
      createdTime: Number(createdTime.value),
      modifiedTime: Number(modifiedTime.value),
      sourceLength: query.value.length,
    })
  }
  catch {
    askLoading.value = false
    return
  }

  try {
    askLoading.value = true
    const { promise, cancel } = sendToStreamResponsePort(
      new WorkerRequestStreamAi({
        sessionId: sessionId.value,
        prompt: promptForTranslate.value,
      }),
      {
        streamHandler(message) {
          if (message.payload.index === 0)
            aiResponse.value = ''
          receivedPayloadIndex.value = message.payload.index >= 0 ? message.payload.index : receivedPayloadIndex.value
          aiResponse.value += message.payload.text
          modifiedTime.value = new Date()
          scrollTranslateResultToBottom()
          if (message.payload.index === 0) {
            gtag('ai_translate__receive_start', {
              sourceLength: query.value.length,
              createdTime: Number(createdTime.value),
              modifiedTime: Number(modifiedTime.value),
            })
          }
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
    gtag('ai_translate__receive_done', {
      chatSessionId: sessionId.value,
      segIndexAt: receivedPayloadIndex.value,
      responseLength: aiResponse.value.length,
      createdTime: Number(createdTime.value),
      modifiedTime: Number(modifiedTime.value),
    })
  }
  catch (e) {
    if (e.message === 'CANCELLED') {
      gtag('ai_translate__receive_cancelled', {
        chatSessionId: sessionId.value,
        segIndexAt: receivedPayloadIndex.value,
        responseLength: aiResponse.value.length,
        createdTime: Number(createdTime.value),
        modifiedTime: Number(modifiedTime.value),
      })
    }
    else {
      hasError.value = true
      gtag('ai_translate__receive_error', {
        chatSessionId: sessionId.value,
        segIndexAt: receivedPayloadIndex.value,
        responseLength: aiResponse.value.length,
        createdTime: Number(createdTime.value),
        modifiedTime: Number(modifiedTime.value),
      })
    }
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
  gtag('ai_translate__click_copy_result_button', { translateSessionId: sessionId.value, resultContentLength: aiResponse.value.length })
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
