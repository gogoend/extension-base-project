<script setup lang="ts">
import CloseConfirm from '../contentScripts/views/components/CloseConfirm.vue'
import mountElDialogAsApp from '../utils/mount-el-dialog-as-app'
import { storageDemo } from '~/logic/storage'

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}
const visible = ref(false)

function handleImperativeDialog() {
  mountElDialogAsApp(CloseConfirm, { uniqueElId: 'close-confirm-dialog' })
    .then(({ promise }) => {
      return promise
    })
    .then(async (closeScope) => {
      void closeScope
    })
    .catch(() => void 0)
}
</script>

<template>
  <main class="w-full px-4 py-5 text-center text-gray-700">
    <Logo />
    <div>Sidepanel</div>
    <SharedSubtitle />
    <img src="../assets/google-doodle.png">
    <button class="btn mt-2" @click="openOptionsPage">
      Open Options
    </button>
    <div class="mt-2">
      <span class="opacity-50">Storage:</span> {{ storageDemo }}
    </div>
    <div class="mt-2">
      <ElButton @click="visible = true">
        声明式对话框测试
      </ElButton>
      <ElButton @click="handleImperativeDialog">
        命令式对话框测试
      </ElButton>
    </div>
    <CloseConfirm :visible.sync="visible" />
  </main>
</template>
