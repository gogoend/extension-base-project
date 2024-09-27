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
      <Transition
        name="popup"
      >
        <div
          v-if="show"
          class="popup flex flex-col bg-white position-fixed right-0 top-0 bottom-0 text-gray-800 rounded-l-20px shadow w-400px"
          transition="transform duration-500"
        >
          <div class="flex flex-justify-end">
            <button class="w32px h32px bg-transparent cursor-pointer padding-0 border-0" @click="show = false">
              <i class="el-icon-close" />
            </button>
          </div>
          <div
            class="
              pt0 pb20px pl20px pr20px flex-1 overflow-auto
            "
          >
            <ChatPanel class="main__chat-panel-wrap" />
          </div>
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
.popup-enter,
.popup-leave-to {
  transform: translateX(100%);
}
</style>
