<script setup lang="ts">
import ChatPanel from '~/components/ChatPanel/index.vue'
</script>

<template>
  <main class="main px-4 py-5 text-gray-700">
    <ChatPanel class="main__chat-panel-wrap" />
  </main>
</template>

<style lang="css" scoped>
main.main {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .main__chat-panel-wrap {
    flex: 1 1 auto;
    overflow: auto;
  }
}
</style>
