<script setup lang="ts">
import type { PropType } from 'vue'
import { ReceiveStatus } from './types'
import type { MessageItem } from './types'

defineProps({
  messageList: {
    type: Array as PropType<MessageItem[]>,
    default: () => [],
  },
})
</script>

<template>
  <div class="message-list">
    <div
      v-for="(item, index) in messageList" :key="index" class="message-item" :class="[
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
  .message-item {
    max-width: calc(100% - 32px);
    width: fit-content;
    padding: 10px 16px;
    margin-bottom: 24px;
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
}
</style>
