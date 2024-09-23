import mountSingletonCsui, { mountWithLifeCycle, vanillaMount } from './utils/csui-root-component-common-mount'

export const bodyLevelElement = document.createElement('span')
export async function initBodyLevelElement() {
  const { disposeCsui } = await mountSingletonCsui(vanillaMount, bodyLevelElement)
  return disposeCsui
}

mountWithLifeCycle({
  mount: initBodyLevelElement,
})
