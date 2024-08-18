<script lang="ts" setup>
import { ElButton, ElDrawer } from 'element-plus'

defineProps({
  resolvers: {
    type: Object,
  },
})
</script>

<template>
  <ElDrawer
    v-bind="$attrs"
  >
    <template #footer>
      <ElButton @click="resolvers.reject()">
        取消
      </ElButton>
      <ElButton type="primary" @click="resolvers.resolve()">
        确定
      </ElButton>
    </template>
  </ElDrawer>
</template>
