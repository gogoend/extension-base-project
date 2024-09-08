<script lang="ts" setup>
import {
  Dialog as ElDialog,
} from 'element-ui'

const props = defineProps({
  resolvers: {
    type: Object,
  },
})

const emit = defineEmits([] as string[])
const mergedResolvers = computed(() => {
  const emitUpdateVisibleToFalse = () => emit('update:visible', false)
  if (!props.resolvers) {
    return {
      resolve: emitUpdateVisibleToFalse,
      reject: emitUpdateVisibleToFalse,
    }
  }
  else {
    return props.resolvers
  }
})

defineExpose({
  resolvers: mergedResolvers,
})
</script>

<template>
  <ElDialog
    v-bind="$attrs"
    v-on="$listeners"
  >
    <template #title>
      <slot name="title" />
    </template>
    <template #default>
      <slot name="default" />
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
  </ElDialog>
</template>
