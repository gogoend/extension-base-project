<script setup lang="ts">
import { computed } from 'vue'
import { Divider as ElDivider } from 'element-ui'
import { usePageStore } from '../../../sidepanel/store'
import { SuggestMessageFrom } from '../types'
import HeaderContent from '~/components/HeaderContent.vue'

const emit = defineEmits(['send-query'])
const pageStore = usePageStore()
const suggestQueries = computed(() => pageStore.suggestQueries)
const pageAbstract = computed(() => pageStore.pageAbstract)

function handleItemClick(content: string, from: SuggestMessageFrom) {
  emit('send-query', {
    content,
    from,
  })
}
</script>

<template>
  <div class="suggest-screen">
    <div class="content-wrap">
      <div class="header-content-wrap">
        <HeaderContent />
      </div>
      <template v-if="pageAbstract">
        <ElDivider>网页总结</ElDivider>
        <a class="page-abstract-card" @click.prevent="handleItemClick(`帮我总结：\n${pageAbstract.content}`, SuggestMessageFrom.pageSummary)">
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
      <ElDivider>示例问题</ElDivider>
      <div class="suggest-list">
        <a
          v-for="(it, index) in suggestQueries"
          :key="index"
          class="suggest-item"
          @click.prevent="handleItemClick(it, SuggestMessageFrom.exampleQuery)"
        >
          {{ it }}
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.suggest-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .content-wrap {
    width: 100%;
    max-width: 400px;
    .header-content-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
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
  }
}
</style>
