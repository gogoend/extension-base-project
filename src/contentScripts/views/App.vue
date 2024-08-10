<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import 'uno.css'

const [show, toggle] = useToggle(false)
</script>

<template>
  <div class="fixed right-0 bottom-0 m-50px z-100 flex items-end font-sans line-height-16px">
    <Transition name="popup">
      <div
        v-if="show"
        class="popup bg-white text-gray-800 rounded-20px shadow w-max h-min"
        p="x-40px y-20px"
        m="y-auto r-20px"
        transition="opacity duration-300"
      >
        <h1 class="text-16px">
          Vitesse WebExtee
        </h1>
        <SharedSubtitle />
        <img src="../../assets/google-doodle.png">
      </div>
    </Transition>
    <button
      class="flex w-60px h-60px rounded-full shadow cursor-pointer border-none"
      bg="teal-600 hover:teal-700"
      @click="toggle()"
    >
      <pixelarticons-power class="block m-auto text-white text-24px" />
    </button>
  </div>
</template>

<style scoped>
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}
button {
}
</style>
