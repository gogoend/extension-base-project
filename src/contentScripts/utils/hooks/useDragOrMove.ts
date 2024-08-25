export default function useDragOrClick({ onClick, elToBeDraggedRef, position }: { onClick: (ev: MouseEvent) => void, elToBeDraggedRef: Ref<HTMLElement>, position: Ref<[number, number]> }) {
  let startPositionInEl: [number, number] = [0, 0]
  let startPositionInPage: [number, number] = [0, 0]
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0)
      return

    const elToBeDraggedBBox = elToBeDraggedRef.value.getBoundingClientRect() as DOMRect
    startPositionInEl = [
      e.pageX - elToBeDraggedBBox?.left,
      e.pageY - elToBeDraggedBBox?.top,
    ]
    startPositionInPage = [
      e.pageX,
      e.pageY,
    ]
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseUp(this: any, e: MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    // 如果移动距离小于10px，触发点击事件
    if (
      Math.abs(e.pageX - startPositionInPage[0]) < 10
      && Math.abs(e.pageY - startPositionInPage[1]) < 10
    )
      onClick.call(this, e)

    checkAndCorrectPosition()
  }
  function handleMouseMove(e: MouseEvent) {
    e.preventDefault()
    position.value = [
      e.pageX - startPositionInEl[0],
      e.pageY - startPositionInEl[1],
    ]
    checkAndCorrectPosition()
  }

  function checkAndCorrectPosition() {
    const elToBeDraggedBBox = elToBeDraggedRef.value.getBoundingClientRect() as DOMRect

    // 鼠标抬起时，判断元素是否位于浮动窗口可视区域内。如果在可视区域外，将移回可视区域内
    if (position.value[0] <= 0)
      position.value.splice(0, 1, 0)

    else if (position.value[0] + elToBeDraggedBBox.width > window.innerWidth)
      position.value.splice(0, 1, window.innerWidth - elToBeDraggedBBox.width)

    if (position.value[1] <= 0)
      position.value.splice(1, 1, 0)

    else if (position.value[1] + elToBeDraggedBBox.height > window.innerHeight)
      position.value.splice(1, 1, window.innerHeight - elToBeDraggedBBox.height)
  }

  window.addEventListener(
    'resize',
    checkAndCorrectPosition,
  )
  onUnmounted(() => {
    window.removeEventListener(
      'resize',
      checkAndCorrectPosition,
    )
  })

  return { handleMouseDown }
}
