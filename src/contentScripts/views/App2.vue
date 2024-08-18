<script setup lang="ts">
import { ElButton, ElOption, ElSelect } from 'element-plus'
import request from '../../utils/request'
import mountElDialogAsApp from '../../utils/mount-el-dialog-as-app'
import CloseConfirm from './components/CloseConfirm.vue'

const r = ref()
onMounted(() => {
  request.get('https://example.com').then((res) => {
    r.value = res.data
  })
})
// 通过getCurrentInstance().appContext访问全局属性
const currentInstance = getCurrentInstance()!
async function handleCloseClick() {
  mountElDialogAsApp(CloseConfirm, reactive({}), 'close-confirm-dialog').show()
    .then(({ promise }) => {
      return promise
    })
    .then(() => {
      currentInstance.appContext.config.globalProperties.disposeCsui()
    })
}
</script>

<template>
  <div class="search-engine-insertion">
    <ElButton @click="handleCloseClick">
      关闭
    </ElButton>
    <br>
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
