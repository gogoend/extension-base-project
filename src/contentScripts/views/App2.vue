<script setup lang="ts">
import 'uno.css'
import request from '../../utils/request'

const r = ref()
onMounted(() => {
  request.get('https://example.com').then((res) => {
    r.value = res.data
  })
})
</script>

<template>
  <div class="search-engine-insertion">
    <div v-html="r" />
  </div>
</template>

<style scoped>

</style>
