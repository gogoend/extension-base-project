<script setup lang="ts">
import markdownit from 'markdown-it'

import hljs from 'highlight.js'
import javascript from 'highlight.js/lib/languages/javascript'

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
})

hljs.registerLanguage('javascript', javascript)

const md = markdownit({
  breaks: true,
  highlight(str: string, lang = 'javascript') {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre><code class="hljs">${
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
               }</code></pre>`
      }
      catch (__) {}
    }

    return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`
  },
})

const renderedHtml = computed(() => {
  return md.render(props.content)
})
</script>

<template>
  <div v-dompurify-html="renderedHtml" />
</template>

<style src="highlight.js/styles/github.css"></style>

<style scoped>
.root-wrap {
  position: fixed;
  right: 0;
  z-index: 2147483646;
  cursor: pointer;
  width: fit-content;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}
button {
}
</style>
