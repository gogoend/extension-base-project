/// <reference types="vitest" />

import { dirname, relative } from 'node:path'
import process from 'node:process'
import { execSync } from 'node:child_process'
import type { UserConfig } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import Vue from '@vitejs/plugin-vue2'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import UnoCSS from 'unocss/vite'
import Replace from 'unplugin-replace/vite'
import { isDev, port, r } from './scripts/utils'
import packageJson from './package.json'

process.env = { ...process.env, ...loadEnv(process.env.NODE_ENV!, process.cwd()) }
const currentBuildHash = execSync('git rev-parse HEAD').toString().trim()

export const sharedConfig: UserConfig = ({
  root: r('src'),
  resolve: {
    alias: {
      '~/': `${r('src')}/`,
    },
    dedupe: ['vue'],
  },
  define: {
    __DEV__: isDev,
    __NAME__: JSON.stringify(packageJson.name),
  },
  plugins: [
    Vue(),

    AutoImport({
      imports: [
        'vue',
        {
          'webextension-polyfill': [
            // https://github.com/antfu-collective/vitesse-webext/issues/171
            ['default', 'browser'],
          ],
        },
      ],
      dts: r('src/auto-imports.d.ts'),
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      dirs: [r('src/components')],
      // generate `components.d.ts` for ts support with Volar
      dts: r('src/components.d.ts'),
      resolvers: [
        // auto import icons
        IconsResolver({
          prefix: 'icon',
        }),
      ],
    }),

    // https://github.com/antfu/unplugin-icons
    Icons(),

    // https://github.com/unocss/unocss
    UnoCSS(),
    Replace({
      delimiters: ['', ''],
      sourcemap: true,
      include: ['**/node_modules/element-ui/**/*.css', '**/node_modules/element-ui/**/*.scss'],
      values: [
        {
          find: /(:root)/g,
          replacement: ':host',
        },
      ],
    }),
    Replace({
      delimiters: ['', ''],
      sourcemap: true,
      include: ['**/src/background/utils/gtag.ts'],
      values: [
        {
          find: /<measurement_id>/g,
          replacement: process.env.VITE_APP_GTAG_MEASUREMENT_ID as string,
        },
        {
          find: /<api_secret>/g,
          replacement: process.env.VITE_APP_GTAG_API_SECRET as string,
        },
      ],
    }),
    Replace({
      delimiters: ['', ''],
      sourcemap: true,
      include: ['**/src/env.ts'],
      values: [
        {
          find: /<app-version>/g,
          replacement: packageJson.version as string,
        },
        {
          find: /<app-build-hash>/g,
          replacement: currentBuildHash as string,
        },
      ],
    }),

    // rewrite assets to use relative path
    {
      name: 'assets-rewrite',
      enforce: 'post',
      apply: 'build',
      transformIndexHtml(html, { path }) {
        return html.replace(/"\/assets\//g, `"${relative(dirname(path), '/assets')}/`)
      },
    },
  ],
  optimizeDeps: {
    include: [
      'vue',
      '@vueuse/core',
      'webextension-polyfill',
    ],
    exclude: [
      'vue-demi',
    ],
  },
})

export default defineConfig(({ command }) => {
  return ({
    ...sharedConfig,
    base: command === 'serve' ? `http://localhost:${port}/` : '/dist/',
    server: {
      port,
      hmr: {
        host: 'localhost',
      },
      origin: `http://localhost:${port}`,
    },
    build: {
      watch: isDev
        ? {}
        : undefined,
      outDir: r('extension/dist'),
      emptyOutDir: false,
      sourcemap: isDev ? 'inline' : false,
      // https://developer.chrome.com/docs/webstore/program_policies/#:~:text=Code%20Readability%20Requirements
      terserOptions: {
        mangle: false,
      },
      rollupOptions: {
        input: {
          sidepanel: r('src/sidepanel/index.html'),
          offscreen: r('src/offscreen/index.html'),
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
    },
  })
},

)
