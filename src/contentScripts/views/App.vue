<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import useDragOrMove from '../utils/hooks/useDragOrMove'
import ChatPanel from '~/components/ChatPanel/index.vue'
import { usePageStore } from '~/sidepanel/store'
import { handleMessageFactory } from '~/utils/messaging'
import { SidepanelUpdateContextByPageContent } from '~/type/worker-message'

const [show, toggle] = useToggle(false)

const elToBeDraggedRef = ref()
const position = ref<[number, number]>([0, window.innerHeight * 0.6])
const { handleMouseDown } = useDragOrMove({ onClick: () => toggle(), elToBeDraggedRef, position })

const pageStore = usePageStore()
handleMessageFactory('sidepanel')(SidepanelUpdateContextByPageContent.tag, ({ message }) => {
  pageStore.pageAbstract = message.payload
})
</script>

<template>
  <div ref="elToBeDraggedRef" class="root-wrap" :style="{ top: `${position[1]}px` }">
    <div class="z-100 flex items-start font-sans line-height-16px">
      <Transition name="popup">
        <div
          v-if="show"
          class="popup bg-white text-gray-800 rounded-20px shadow w-max h-min"
          p="x-40px y-20px"
          m="y-auto r-20px"
          transition="opacity duration-300"
        >
          <ChatPanel class="main__chat-panel-wrap" />
        </div>
      </Transition>
      <button
        class="flex w-60px h-60px rounded-full shadow cursor-pointer border-none"
        bg="teal-600 hover:teal-700"
        @mousedown="handleMouseDown"
      >
        <icon-pixelarticons-power class="block m-auto text-white text-24px" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.root-wrap {
  position: fixed;
  right: 0;
  z-index: 2147483646;
  cursor: pointer;
  width: fit-content;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}
button {
}
</style>
