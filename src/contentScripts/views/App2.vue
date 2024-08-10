<script setup lang="ts">
import { ElButton, ElOption, ElSelect } from 'element-plus'
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
    {{ r }}
    <div v-dompurify-html="r" />
    <ElSelect :teleported="false">
      <ElOption :value="1">
        1
      </ElOption>
      <ElOption :value="2">
        2
      </ElOption>
      <ElOption :value="3">
        3
      </ElOption>
    </ElSelect>
  </div>
</template>

<style scoped>

</style>
