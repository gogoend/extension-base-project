<script setup lang="ts">
import type { PropType } from 'vue'
import { Button as ElButton, Tooltip as ElTooltip } from 'element-ui'
import { ReceiveStatus } from './types'
import type { MessageItem } from './types'
import { copyStr } from '~/utils/clipboard'
import gtag from '~/utils/gtag'

defineProps({
  messageList: {
    type: Array as PropType<MessageItem[]>,
    default: () => [],
  },
})

const currentInstance = getCurrentInstance()!
function handCopyClicked(message: MessageItem) {
  gtag('ai_chat__click_copy_button', { chatSessionId: message.sessionId, messageInsertedBy: message.insertedBy, messageContentLength: message.content.length })

  copyStr(message.content)
  currentInstance.proxy.$message({
    type: 'success',
    message: '复制成功',
  })
}
const hoveringMessageIndex = ref<null | number>(null)
</script>

<template>
  <div class="message-list">
    <div
      v-for="(item, index) in messageList"
      :key="index"
      class="message-item__wrap"
      :class="[
        `inserted-by-${item.insertedBy}`,
      ]"
      @mouseenter.self="hoveringMessageIndex = index"
      @mouseleave.self="hoveringMessageIndex = null"
    >
      <div
        class="message-item"
      >
        <template v-if="item.receiveStatus === ReceiveStatus.INITIALIZING">
          <i class="el-icon-loading" />
        </template>
        <template v-else>
          <MarkdownContent :content="item.content" />
          <template v-if="item.receiveStatus === ReceiveStatus.ERROR">
            <i class="el-icon-error color-red" />
          </template>
        </template>
      </div>
      <div
        v-show="hoveringMessageIndex === index"
        class="message-bottom-operations"
      >
        <ElTooltip v-if="item.receiveStatus === ReceiveStatus.FINISHED" content="复制" placement="top" :enterable="false">
          <ElButton type="text" @click="handCopyClicked(item)">
            <i class="el-icon-copy-document" />
          </ElButton>
        </ElTooltip>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.suggest-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  .suggest-item {
    padding: 8px 16px;
    background-color: #f4f4f4;
    border-radius: 9999px;
    &:hover {
      text-decoration: underline;
    }
  }
}
.message-list {
  display: flex;
  flex-direction: column;
  padding-inline-end: 10px;
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
    border-radius: 9999px;
  }
  &::-webkit-scrollbar-thumb {
    width: 8px;
    background-color: rgb(233, 232, 232);
    border-radius: 9999px;
  }
  .message-item__wrap {
    display: flex;
    flex-direction: column;
    padding-bottom: 28px;
    position: relative;
    width: fit-content;
    max-width: calc(100% - 32px);
    .message-item {
      width: 100%;
      padding: 10px 16px;
    }
    &.inserted-by-user {
      align-self: flex-end;
      .message-item {
        background-color: #f0f0f0;
      }
    }
    &.inserted-by-system {
      align-self: center;
      .message-item {
      }
    }
    &.inserted-by-robot {
      align-self: flex-start;
      .message-item {
        background-color: #cefeff;
      }
    }
    .message-bottom-operations {
      height: 0;
      overflow: visible;
      position: relative;
      top: 6px;
      .el-button--text {
        padding: 0
      }
    }
    &.inserted-by-user .message-bottom-operations{
      align-self: flex-end;
    }
    &.inserted-by-robot .message-bottom-operations{
      align-self: flex-start;
    }
  }
}
</style>
