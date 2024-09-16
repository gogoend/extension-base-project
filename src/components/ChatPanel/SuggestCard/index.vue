<script setup lang="ts">
import { computed } from 'vue'
import { Divider as ElDivider } from 'element-ui'
import { usePageStore } from '../../../sidepanel/store'

const emit = defineEmits(['send-query'])
const pageStore = usePageStore()
const suggestQueries = computed(() => pageStore.suggestQueries)
const pageAbstract = computed(() => pageStore.pageAbstract)

function handleItemClick(query: string) {
  emit('send-query', query)
}
</script>

<template>
  <div class="suggest-screen">
    <template v-if="pageAbstract">
      <ElDivider>猜你想问</ElDivider>
      <a class="page-abstract-card" @click.prevent="handleItemClick(`帮我总结：\n${pageAbstract.content}`)">
        <div class="left-content icon">
          <el-icon class="el-icon-discover" />
        </div>
        <div class="right-content">
          <div class="title">
            {{ pageAbstract.title }}
          </div>
          <div class="content">
            {{ pageAbstract.content }}
          </div>
        </div>
      </a>
    </template>
    <ElDivider>大家都在问</ElDivider>
    <div class="suggest-list">
      <a
        v-for="(it, index) in suggestQueries"
        :key="index"
        class="suggest-item"
        @click.prevent="handleItemClick(it)"
      >
        {{ it }}
      </a>
    </div>
  </div>
</template>

<style lang="css" scoped>
.suggest-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.suggest-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  .suggest-item {
    padding: 0 8px;
    background-color: #f4f4f4;
    border-radius: 9999px;
    white-space: nowrap;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
}
.page-abstract-card {
  display: flex;
  cursor: pointer;

  .left-content.icon {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    padding: 10px;
    color: #999;

    border-radius: 8px;
  }
  .right-content {
    .title {
      font-weight: 700;
    }
    .content {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
  }
}
</style>
