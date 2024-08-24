<script lang="ts" setup>
import { Button as ElButton, Dialog as ElDialog, Radio as ElRadio, RadioGroup as ElRadioGroup } from 'element-ui'

defineProps({
  resolvers: {
    type: Object,
  },
})

const selectedValue = ref(null)
</script>

<template>
  <ElDialog
    v-bind="$attrs"
  >
    <ElRadioGroup v-model="selectedValue">
      <ElRadio :value="1">
        临时关闭
      </ElRadio>
      <ElRadio :value="2">
        永久关闭
      </ElRadio>
    </ElRadioGroup>
    <template #footer>
      <ElButton @click="resolvers.reject()">
        取消
      </ElButton>
      <ElButton :disabled="selectedValue === null" type="primary" @click="resolvers.resolve(selectedValue)">
        确定
      </ElButton>
    </template>
  </ElDialog>
</template>
