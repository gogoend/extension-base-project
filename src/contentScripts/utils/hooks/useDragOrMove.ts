export default function useDragOrClick({ onClick, elToBeDraggedRef, position }: { onClick: (ev: MouseEvent) => void, elToBeDraggedRef: Ref<HTMLElement>, position: Ref<[number, number]> }) {
  let startPositionInEl: [number, number] = [0, 0]
  let startPositionInPage: [number, number] = [0, 0]
  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0)
      return

    const currentPosition = elToBeDraggedRef.value.getBoundingClientRect() as DOMRect
    startPositionInEl = [
      e.pageX - currentPosition?.left,
      e.pageY - currentPosition?.top,
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

    startPositionInEl = [0, 0]
    startPositionInPage = [0, 0]
  }
  function handleMouseMove(e: MouseEvent) {
    e.preventDefault()
    position.value = [
      e.pageX - startPositionInEl[0],
      e.pageY - startPositionInEl[1],
    ]
  }

  return { handleMouseDown }
}
