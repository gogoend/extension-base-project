<script setup lang="ts">
import { Button as ElButton, Option as ElOption, Select as ElSelect } from 'element-ui'
import { sendMessage } from 'webext-bridge/content-script'
import mountElDialogAsApp from '../../utils/mount-el-dialog-as-app'
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
  mountElDialogAsApp(CloseConfirm, { uniqueElId: 'close-confirm-dialog' }).show()
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
}
</script>

<template>
  <div class="search-engine-insertion">
    <ElButton @click="handleCloseClick">
      关闭
    </ElButton>
    <br>
    {{ r }}
    <div v-dompurify-html="r" />
    <ElSelect :teleported="false">
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
