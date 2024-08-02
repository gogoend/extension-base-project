<script setup lang="ts">
import 'uno.css'
import request from '../../utils/request'

const r = ref()
onMounted(() => {
  request.get('https://qq.com').then((res) => {
    // debugger
    r.value = res
  })
})
</script>

<template>
  <div class="search-engine-insertion">
    123456789<br>
    123456789<br>
    123456789<br>
    <div>{{ r }}</div>
  </div>
</template>

<style scoped>

</style>
