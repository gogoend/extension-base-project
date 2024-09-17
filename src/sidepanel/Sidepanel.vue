<script setup lang="ts">
import {
  TabPane as ElTabPane,
  Tabs as ElTabs,
} from 'element-ui'
import ChatPanel from '~/components/ChatPanel/index.vue'
import TranslatePanel from '~/components/TranslatePanel/index.vue'
import gtag, { gtagPageView } from '~/utils/gtag'

gtagPageView()
const currentTabName = ref('chatPanel')
watch(() => currentTabName.value, (val) => {
  gtag('sidepanel__tab_switch', { tabName: val })
}, {
  immediate: true,
})
</script>

<template>
  <main class="main px-4 py-5 text-gray-700">
    <ElTabs v-model="currentTabName" type="card">
      <ElTabPane label="聊天" name="chatPanel">
        <ChatPanel class="main__chat-panel-wrap" />
      </ElTabPane>
      <ElTabPane label="翻译" name="translatePanel">
        <TranslatePanel class="main__translate-panel-wrap" />
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
  .main__translate-panel-wrap,
  .main__chat-panel-wrap {
    overflow: auto;
    height: 100%;
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
