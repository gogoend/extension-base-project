/**
 * 将字符串复制到剪切板
 * @param val {string}
 */
export function copyStr(str: string): void {
  const textAreaEl = document.createElement('textarea')
  Object.assign(textAreaEl.style, {
    opacity: 0,
    position: 'fixed',
    top: 0,
    left: 0,
  })
  textAreaEl.value = str
  document.body.appendChild(textAreaEl)
  textAreaEl.focus()
  textAreaEl.select()
  document.execCommand('copy')
  document.body.removeChild(textAreaEl)
}
