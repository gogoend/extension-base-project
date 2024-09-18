<script lang="ts" setup>
import {
  Button as ElButton,
  Dialog as ElDialog,
  Radio as ElRadio,
  RadioGroup as ElRadioGroup,
} from 'element-ui'
import { getCurrentInstance, ref } from 'vue'
import PromiseDialog from '../../utils/mount-el-dialog-as-app/PromiseDialog.vue'
import gtag from '~/utils/gtag'

const promiseDialogRef = ref<InstanceType<typeof PromiseDialog>>()
gtag('ai_model__downloading_dialog_show')
</script>

<template>
  <PromiseDialog
    v-bind="$attrs"
    ref="promiseDialogRef"
    class="dialog"
    title="🥴 还差最后一个配置，马上就好"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    :show-close="false"
    width="calc(100% - 60px)"
    :modal-append-to-body="false"
    v-on="$listeners"
  >
    <div class="article">
      <p>您的浏览器可以运行本扩展程序，但相关模型尚未下载</p>
      <br>
      <div>
        请打开 chrome://components/ ，找到 Optimization Guide On Device Model ，检查下载状态，点击“检查是否有更新”尝试启动下载
      </div>
      <div>
        <img class="guide-figure" width="300" src="./resources/config-guide/p4.jpg">
      </div>
      <p>
        下载速度与您的网速有关，请耐心等待
      </p>
      <br>
      <p>
        如下载一直未开始，请自行打开 百度 / Google 查找解决方案
      </p>
    </div>
    <template #footer>
      <ElButton type="primary" size="mini" @click="promiseDialogRef?.resolvers.resolve()">
        刷新
      </ElButton>
    </template>
  </PromiseDialog>
</template>

<style lang="css" scoped>
.article {
  color: #333;
  line-height: 1.5em;
  font-size: 12px;
  ul {
    list-style: initial;
    margin-inline-start: 2em;
  }
  ol {
    list-style: decimal;
    margin-inline-start: 2em;
  }

  .guide-figure {
    margin-top: 1em;
    margin-bottom: 1em;
    box-shadow: 0 0 10px 0px #092e3770;
  }
}
</style>
