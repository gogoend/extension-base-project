const antfu = require('@antfu/eslint-config').default

module.exports = antfu({
  vue: {
    sfcBlocks: {
      // https://github.com/antfu/eslint-config/issues/367
      blocks: {
        styles: false,
      },
    },
    vueVersion: 2,
  },
  rules: {
    'vue/custom-event-name-casing': 'off',
  },
})
