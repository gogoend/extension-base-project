<script lang="ts" setup>
import {
  Button as ElButton,
  Dialog as ElDialog,
  Radio as ElRadio,
  RadioGroup as ElRadioGroup,
} from 'element-ui'
import PromiseDialog from '~/utils/mount-el-dialog-as-app/PromiseDialog.vue'

const promiseDialogRef = ref<InstanceType<typeof PromiseDialog>>()
const selectedValue = ref(null)
</script>

<template>
  <PromiseDialog
    v-bind="$attrs"
    ref="promiseDialogRef"
    v-on="$listeners"
  >
    <ElRadioGroup v-model="selectedValue">
      <ElRadio :label="1">
        临时关闭
      </ElRadio>
      <ElRadio :label="2">
        永久关闭
      </ElRadio>
    </ElRadioGroup>
    <template #footer>
      <ElButton @click="promiseDialogRef?.resolvers.reject()">
        取消
      </ElButton>
      <ElButton :disabled="selectedValue === null" type="primary" @click="promiseDialogRef?.resolvers.resolve(selectedValue)">
        确定
      </ElButton>
    </template>
  </PromiseDialog>
</template>
