import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SidepanelUpdateContextByPageContent } from '../type/worker-message'
import { handleMessageFactory } from '../utils/messaging'

export const usePageStore = defineStore('page', () => {
  const suggestQueries = ref([
    `Difference among Baidu, Sina, Netease and Tencent?`,
    `Write an essay about environment protect.`,
    `Should I choose Android Phone or iPhone?`,
    `History of the Great Wall?`,
    `Implement quick sort with JavaScript`,
  ])

  const pageAbstract = ref(null)
  handleMessageFactory('sidepanel')(SidepanelUpdateContextByPageContent.tag, ({ message }) => {
    pageAbstract.value = message.payload
  })

  return {
    suggestQueries,
    pageAbstract,
  }
})
