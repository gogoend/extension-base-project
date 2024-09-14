<script setup lang="ts">
import CloseConfirm from '../contentScripts/views/components/CloseConfirm.vue'
import mountElDialogAsApp from '../utils/mount-el-dialog-as-app'
import ChatPanel from '~/components/ChatPanel/index.vue'
import { handleMessageFactory } from '~/utils/messaging'
import { storageDemo } from '~/logic/storage'
import { SidepanelUpdateContextByPageContent } from '~/type/worker-message'

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

const pageAbstract = ref(null)
const cancelPageContentUpdateListen = handleMessageFactory('sidepanel')(SidepanelUpdateContextByPageContent.tag, (message) => {
  pageAbstract.value = message.message.payload
})
onUnmounted(cancelPageContentUpdateListen)
</script>

<template>
  <main class="px-4 py-5 text-gray-700">
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
    <div v-if="pageAbstract">
      <div>{{ pageAbstract?.title }}</div>
      <div>{{ pageAbstract?.content }}</div>
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

    <ChatPanel />
  </main>
</template>
