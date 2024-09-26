<script setup lang="ts">
import {
  TabPane as ElTabPane,
  Tabs as ElTabs,
} from 'element-ui'
import { usePageStore } from './store'
import ChatPanel from '~/components/ChatPanel/index.vue'
import TranslatePanel from '~/components/TranslatePanel/index.vue'
import SvgIconGithub from '~/components/SvgIcon/Github.vue'
import gtag, { gtagPageView } from '~/utils/gtag'
import { handleMessageFactory } from '~/utils/messaging'
import { SidepanelUpdateContextByPageContent } from '~/type/worker-message'

gtagPageView()
const currentTabName = ref('chatPanel')
watch(() => currentTabName.value, (val) => {
  gtag('sidepanel__tab_switch', { tabName: val })
})

function handleGithubButtonClick() {
  gtag('sidepanel__tab_github_entry')
}

const pageStore = usePageStore()
handleMessageFactory('sidepanel')(SidepanelUpdateContextByPageContent.tag, ({ message }) => {
  pageStore.pageAbstract = message.payload
})
</script>

<template>
  <main class="main px-4 py-5 text-gray-700">
    <div class="tab-right-insert">
      <a class="github-link" href="https://github.com/gogoend" target="_blank" @click="handleGithubButtonClick">
        <SvgIconGithub width="16" height="16" class="mr-4px color-black" />gogoend
      </a>
    </div>
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
  --tab-item-height: 32px;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  .tab-right-insert {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    position: absolute;
    right: 20px;
    height: var(--tab-item-height);
    z-index: 1;
    .github-link {
      display: flex;
      align-items: center;
      &:hover {
        color: #409EFF;
      }
    }
  }
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
    &::v-deep(.el-tabs__item) {
      height: var(--tab-item-height);
      line-height: var(--tab-item-height);
    }
    &::v-deep(.el-tabs__content) {
      height: 100%;
    }
    &::v-deep(.el-tab-pane) {
      height: 100%;
    }
  }
}
</style>
