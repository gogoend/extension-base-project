<script setup lang="ts">
import {
  TabPane as ElTabPane,
  Tabs as ElTabs,
} from 'element-ui'
import ChatPanel from '~/components/ChatPanel/index.vue'
</script>

<template>
  <main class="main px-4 py-5 text-gray-700">
    <ElTabs type="card">
      <ElTabPane label="聊天">
        <ChatPanel class="main__chat-panel-wrap" />
      </ElTabPane>
      <ElTabPane label="翻译">
        Hello
      </ElTabPane>
    </ElTabs>
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
  &::v-deep(.el-tabs) {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }
  &::v-deep(.el-tabs__content) {
    height: 100%;
  }
  &::v-deep(.el-tab-pane) {
    height: 100%;
  }
}
</style>
