<script setup lang="ts">
import { WorkerGetLocalStorage } from '../type/worker-message'
import { sendToBackground } from '../utils/messaging'
import { storageDemo } from '~/logic/storage'

sendToBackground(new WorkerGetLocalStorage()).then((_res) => {
})

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}
</script>

<template>
  <main class="w-[300px] px-4 py-5 text-center text-gray-700">
    <Logo />
    <div>Popup</div>
    <SharedSubtitle />

    <button class="btn mt-2" @click="openOptionsPage">
      Open Options
    </button>
    <div class="mt-2">
      <span class="opacity-50">Storage:</span> {{ storageDemo }}
    </div>
  </main>
</template>
