import { mittBus } from './utils/mittBus'

let styleTextInShadowPromise: null | Promise<string> = null

function attachFontFaceToMainWorld(cssText: string) {
  // Create an empty "constructed" stylesheet
  const stylesheet = new CSSStyleSheet()
  // Apply a rule to the sheet
  stylesheet.replaceSync(cssText)

  const fontFaceRules = [...stylesheet.cssRules].filter(it => [it instanceof CSSFontFaceRule].includes(true))

  const stylesheetToMain = new CSSStyleSheet()
  fontFaceRules.forEach((it) => {
    stylesheetToMain.insertRule(it.cssText)
  })

  document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheetToMain]

  mittBus.on('extension-background-destroyed', () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(it => it !== stylesheetToMain)
  })
}

export function initCsuiStyle() {
  if (!styleTextInShadowPromise) {
    styleTextInShadowPromise = fetch(
      browser.runtime.getURL(`dist/contentScripts/style.css`),
    )
      .then((res) => {
        return res.text()
      })
      .then((cssText) => {
        attachFontFaceToMainWorld(cssText)
        return cssText
      })
      .catch((err) => {
        styleTextInShadowPromise = null
        throw err
      })
  }
  else {
    return styleTextInShadowPromise
  }
}
