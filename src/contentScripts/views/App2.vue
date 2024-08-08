<script setup lang="ts">
import 'uno.css'
import { ElButton } from 'element-plus'
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
    <ElButton>12345678</ElButton>
    <hr>
    <div v-html="r" />
  </div>
</template>

<style scoped>

</style>
