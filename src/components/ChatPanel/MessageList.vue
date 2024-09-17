<script setup lang="ts">
import type { PropType } from 'vue'
import { Button as ElButton, Tooltip as ElTooltip } from 'element-ui'
import { ReceiveStatus } from './types'
import type { MessageItem } from './types'
import { copyStr } from '~/utils/clipboard'

defineProps({
  messageList: {
    type: Array as PropType<MessageItem[]>,
    default: () => [],
  },
})

function handCopyClicked(message: MessageItem) {
  copyStr(message.content)
}
const hoveringMessageIndex = ref<null | number>(null)
</script>

<template>
  <div class="message-list">
    <div
      v-for="(item, index) in messageList"
      :key="index"
      class="message-item__wrap"
      @mouseenter.self="hoveringMessageIndex = index"
      @mouseleave.self="hoveringMessageIndex = null"
    >
      <div
        class="message-item" :class="[
          `inserted-by-${item.insertedBy}`,
        ]"
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
        class="message-bottom-operations" :class="[
          `inserted-by-${item.insertedBy}`,
        ]"
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
    .message-item {
      max-width: calc(100% - 32px);
      width: fit-content;
      padding: 10px 16px;
      &.inserted-by-user {
        background-color: #f0f0f0;
        align-self: flex-end;
      }
      &.inserted-by-system {
        align-self: center;
      }
      &.inserted-by-robot {
        background-color: #cefeff;
        align-self: flex-start;
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
      &.inserted-by-user {
        align-self: flex-end;
      }
      &.inserted-by-robot {
        align-self: flex-start;
      }
    }
  }
}
</style>
