<script lang="ts" setup>
import {
  Button as ElButton,
  Dialog as ElDialog,
  Radio as ElRadio,
  RadioGroup as ElRadioGroup,
} from 'element-ui'
import { getCurrentInstance, ref } from 'vue'
import PromiseDialog from '../../utils/mount-el-dialog-as-app/PromiseDialog.vue'
import { WorkerActivateAiComponentForFirstUse } from '../../type/worker-message'
import { sendToOffscreen } from '~/utils/messaging'

const promiseDialogRef = ref<InstanceType<typeof PromiseDialog>>()

const currentInstance = getCurrentInstance()
async function activateAiComponentForFirstUse() {
  await sendToOffscreen(new WorkerActivateAiComponentForFirstUse())
  currentInstance?.proxy.$message({
    message: `已调用激活相关方法，请在Chrome 组件页面查找“Optimization Guide On Device Model”`,
    type: 'success',
  })
}
</script>

<template>
  <PromiseDialog
    v-bind="$attrs"
    ref="promiseDialogRef"
    class="dialog"
    title="😵‍💫 抱歉，扩展不可用……"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    :show-close="false"
    width="calc(100% - 20px)"
    :modal-append-to-body="false"
    v-on="$listeners"
  >
    <div class="article">
      <p>目前本扩展程序需要满足一些<strong>简单条件</strong>，且经过一些<strong>简易配置</strong>之后，方可使用。</p>
      <br>
      <p><b>浏览器版本</b></p>
      <ul>
        <li>最新、正式版本 Chrome 浏览器（当前最新版本为128，截至2024.9.17）；低于此版本的 Chrome 浏览器不能使用</li>
      </ul>
      <br>
      <p><b>额外配置</b></p>
      <ol>
        <li>
          <div>
            打开 chrome://flags/#prompt-api-for-gemini-nano 并启用 Prompt API for Gemini Nano
          </div>
          <div>
            <img class="guide-figure" width="400" src="./resources/config-guide/p1.jpg">
          </div>
        </li>
        <li>
          <div>
            打开 chrome://flags/#optimization-guide-on-device-model 并启用 Enables optimization guide on device
          </div>
          <div>
            <img class="guide-figure" width="400" src="./resources/config-guide/p2.jpg">
          </div>
        </li>
        <li>
          <div>
            按照页面要求，点击右下方“重新启动”
          </div>
          <div>
            <img class="guide-figure" width="400" src="./resources/config-guide/p3.jpg">
          </div>
        </li>
        <li>
          浏览器重新启动后，激活本扩展；本弹窗应当会重新弹出，此时请
          <ElButton type="primary" size="mini" @click="activateAiComponentForFirstUse">
            点击此处
          </ElButton>
          ，以“激活”相关组件
        </li>
        <li>
          <div>
            打开 chrome://components/ ，找到 Optimization Guide On Device Model （如果找不到，请点击上一步按钮激活后刷新页面），点击“检查是否有更新”；如果是第一次使用，点击后将开始下载模型
          </div>
          <div>
            <img class="guide-figure" width="300" src="./resources/config-guide/p4.jpg">
          </div>
        </li>
        <li>模型将在后台静默下载，下载完毕后，再次激活本扩展程序，将可以继续使用</li>
        <li>Good Luck!</li>
      </ol>
    </div>
    <template #footer>
      <ElButton type="primary" size="mini" @click="promiseDialogRef?.resolvers.resolve()">
        重试
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
