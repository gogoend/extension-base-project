<script setup lang="ts">
import { Button as ElButton, Input as ElInput, Option as ElOption, Select as ElSelect } from 'element-ui'
import mountElDialogAsApp from '../../../utils/mount-el-dialog-as-app'
import { sendToBackground } from '../../../utils/messaging'
import CloseConfirm from './components/CloseConfirm.vue'
import request from '~/contentScripts/utils/request'
import {
  WorkerGetLocalStorage,
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
  mountElDialogAsApp(CloseConfirm, { uniqueElId: 'close-confirm-dialog', mountInContentScript: true })
    .then(({ promise }) => {
      return promise
    })
    .then(async (closeScope) => {
      currentInstance.proxy.$root.$disposeCsui()
      if (closeScope === 2) {
        let localStorage = (await sendToBackground(new WorkerGetLocalStorage()))
        localStorage = {
          ...localStorage,
          searchEngineEnhanceDisabled: true,
        }
        await sendToBackground(new WorkerUpdateLocalStorage(localStorage))
      }
    })
    .catch(() => void 0)
}

const selectValue = ref(1)
</script>

<template>
  <div class="csui-root search-engine-insertion">
    <ElButton type="text" @click="handleCloseClick">
      关闭
    </ElButton>
    <br>

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
