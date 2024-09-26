<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import useDragOrMove from '../../utils/hooks/useDragOrMove'
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
  <div ref="elToBeDraggedRef" class="csui-root" :style="{ top: `${position[1]}px` }">
    <div class="z-100 flex items-start font-sans line-height-16px">
      <Transition name="popup">
        <div
          v-if="show"
          class="popup bg-white position-fixed right-0 top-0 bottom-0 text-gray-800 rounded-20px shadow w-max"
          p="x-40px y-20px"
          transition="transform duration-300"
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
.csui-root {
  position: fixed;
  right: 0;
  z-index: 2147483646;
  width: fit-content;
}
.popup {
  transform: translateX(0);
}
.popup-enter-from,
.popup-leave-to {
  transform: translateX(-100%);
}
button {
}
</style>
