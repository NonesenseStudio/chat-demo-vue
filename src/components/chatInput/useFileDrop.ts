import { ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'

const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false

/**
 * 拖拽上传：页面任意位置拖入文件即显示全屏遮罩，松手后交给 onDrop。
 */
export const useFileDrop = (onDrop: (files: File[]) => void) => {
  const dragging = ref(false)
  const onDropRef = ref(onDrop)
  onDropRef.value = onDrop
  watchAfterRender(() => {
    // dragenter / dragleave 会在子元素间反复触发，用计数判断是否真正离开页面
    let depth = 0
    const enter = (event: DragEvent) => {
      if (hasFiles(event)) {
        depth++
        dragging.value = true
      }
    }
    const leave = (event: DragEvent) => {
      if (hasFiles(event) && --depth <= 0) {
        depth = 0
        dragging.value = false
      }
    }
    const over = (event: DragEvent) => {
      if (hasFiles(event)) {
        event.preventDefault()
      }
    }
    const drop = (event: DragEvent) => {
      if (!hasFiles(event)) {
        return
      }
      event.preventDefault()
      depth = 0
      dragging.value = false
      onDropRef.value(Array.from(event.dataTransfer?.files ?? []))
    }
    document.addEventListener('dragenter', enter)
    document.addEventListener('dragleave', leave)
    document.addEventListener('dragover', over)
    document.addEventListener('drop', drop)
    return () => {
      document.removeEventListener('dragenter', enter)
      document.removeEventListener('dragleave', leave)
      document.removeEventListener('dragover', over)
      document.removeEventListener('drop', drop)
    }
  })
  return dragging
}
