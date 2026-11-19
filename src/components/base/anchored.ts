import { shallowRef, type ShallowRef } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'

/** 浮层与视口边缘的最小间距 */
export const VIEWPORT_PADDING = 8

export type Side = 'top' | 'bottom'
export type Align = 'start' | 'center' | 'end'

export type AnchoredPosition = {
  top: number
  left?: number
  right?: number
  maxHeight?: number
}

export type AnchoredOptions = {
  /** 优先出现的一侧，放不下时翻到另一侧 */
  side?: Side
  /** 相对触发元素的水平对齐方式 */
  align?: Align
  /** 水平方向的额外偏移，在按视口边缘收口之前叠加 */
  alignOffset?: number
  /** 与触发元素之间的间距 */
  offset?: number
  /**
   * 浮层纵向可用高度的上限。给出时按视口剩余空间收缩并允许滚动，
   * 未给出时按浮层自身高度整体摆放。
   */
  maxHeight?: number
  /** 判定「空间不足、需要翻面」的最小纵向空间 */
  minSpace?: number
  /**
   * 用触发元素的第一个子元素作为测量与对齐基准。触发元素自身不产生盒子时
   * （如 display: contents），它的 getBoundingClientRect 是空矩形。
   */
  measureFirstChild?: boolean
  /**
   * 浮层内容标识，变化时在绘制前同步重新测量。内容变化交给 ResizeObserver 会先按
   * 旧位置绘制一帧再回弹，所以需要这个同步入口。
   */
  measureKey?: unknown
}

const clampLeft = (left: number, width: number) =>
  Math.max(VIEWPORT_PADDING, Math.min(left, window.innerWidth - width - VIEWPORT_PADDING))

const alignLeft = (anchor: DOMRect, width: number, align: Align, alignOffset: number) => {
  if (align === 'center') {
    return clampLeft(anchor.left + anchor.width / 2 - width / 2 + alignOffset, width)
  }
  if (align === 'end') {
    return Math.max(VIEWPORT_PADDING, anchor.right - width + alignOffset)
  }
  return clampLeft(anchor.left + alignOffset, width)
}

/** 只有一侧放得下时用那一侧；两侧都放得下用优先侧；都放不下时退到空间更大的一侧 */
const resolveSide = (spaceAbove: number, spaceBelow: number, preferred: Side, needed: number) => {
  const fitsAbove = spaceAbove >= needed
  const fitsBelow = spaceBelow >= needed
  if (fitsAbove && !fitsBelow) {
    return 'top'
  }
  if (fitsBelow && !fitsAbove) {
    return 'bottom'
  }
  if (fitsAbove) {
    return preferred
  }
  return spaceAbove > spaceBelow ? 'top' : 'bottom'
}

/**
 * 相对触发元素给浮层定位。浮层挂在 body 上并用 position: fixed 按视口坐标摆放，
 * 因此需要在挂载后测量自身尺寸：未测量到之前位置为 null。
 */
export const useAnchoredPosition = <T extends HTMLElement, F extends HTMLElement>(
  open: () => boolean,
  options: () => AnchoredOptions = () => ({})
) => {
  const anchorRef = shallowRef<T | null>(null) as ShallowRef<T | null>
  const floatingRef = shallowRef<F | null>(null) as ShallowRef<F | null>
  const position = shallowRef<AnchoredPosition | null>(null)
  const setPosition = (
    next: typeof position.value | ((previous: typeof position.value) => typeof position.value)
  ) => {
    position.value = typeof next === 'function' ? next(position.value) : next
  }
  const applyPosition = (next: AnchoredPosition) => {
    setPosition((previous) =>
      previous &&
      previous.top === next.top &&
      previous.left === next.left &&
      previous.right === next.right &&
      previous.maxHeight === next.maxHeight
        ? previous
        : next
    )
  }
  const getAnchor = () =>
    (options().measureFirstChild ?? false)
      ? (anchorRef.value?.firstElementChild as HTMLElement | null)
      : anchorRef.value
  const update = () => {
    const anchor = getAnchor()
    const floating = floatingRef.value
    if (!anchor || !floating) {
      return
    }
    const rect = anchor.getBoundingClientRect()
    const spaceAbove = rect.top - (options().offset ?? 4) - VIEWPORT_PADDING
    const spaceBelow = window.innerHeight - rect.bottom - (options().offset ?? 4) - VIEWPORT_PADDING

    const { maxHeight } = options()
    if (maxHeight === undefined) {
      const { width, height } = floating.getBoundingClientRect()
      const resolved = resolveSide(spaceAbove, spaceBelow, options().side ?? 'bottom', height)
      applyPosition({
        top:
          resolved === 'top'
            ? rect.top - (options().offset ?? 4) - height
            : rect.bottom + (options().offset ?? 4),
        left: alignLeft(rect, width, options().align ?? 'start', options().alignOffset ?? 0),
      })
      return
    }

    const resolved = resolveSide(
      spaceAbove,
      spaceBelow,
      options().side ?? 'bottom',
      options().minSpace ?? 160
    )
    const available = Math.max(0, resolved === 'top' ? spaceAbove : spaceBelow)
    // 内容比可用空间小时按内容收口，避免浮层留出多余空白
    const height = Math.max(40, Math.min(maxHeight, available, floating.scrollHeight + 2))
    applyPosition({
      top:
        resolved === 'top'
          ? Math.max(VIEWPORT_PADDING, rect.top - (options().offset ?? 4) - height)
          : rect.bottom + (options().offset ?? 4),
      right: Math.max(VIEWPORT_PADDING, window.innerWidth - rect.right),
      maxHeight: height,
    })
  }
  watchAfterRender(
    () => {
      if (open()) {
        update()
      }
    },
    () => [options().measureKey, open(), floatingRef.value]
  )
  watchAfterRender(
    () => {
      if (!open()) {
        return
      }
      const floating = floatingRef.value
      if (!floating) {
        return
      }
      const anchor = getAnchor()
      const observer = new ResizeObserver(() => update())
      observer.observe(floating)
      if (anchor) {
        observer.observe(anchor)
      }
      window.addEventListener('scroll', update, { capture: true, passive: true })
      window.addEventListener('resize', update, { passive: true })
      return () => {
        observer.disconnect()
        window.removeEventListener('scroll', update, { capture: true })
        window.removeEventListener('resize', update)
      }
    },
    () => [floatingRef.value, anchorRef.value, open()]
  )
  watchAfterRender(
    () => {
      if (!open()) {
        setPosition(null)
      }
    },
    () => [open()]
  )
  return { anchorRef, floatingRef, position }
}

/** 点击浮层与触发元素之外、或按 Esc 时关闭 */
export const useDismiss = (
  open: () => boolean,
  refs: ShallowRef<HTMLElement | null>[],
  onDismiss: () => void,
  { captureEscape = false }: { captureEscape?: boolean } = {}
) => {
  const onDismissRef = shallowRef(onDismiss)
  onDismissRef.value = onDismiss
  const refsRef = shallowRef(refs)
  refsRef.value = refs
  watchAfterRender(
    () => {
      if (!open()) {
        return
      }
      const onPointerDown = (event: PointerEvent) => {
        const target = event.target as Node
        const inside = refsRef.value.some((ref) => ref.value?.contains(target))
        if (!inside) {
          onDismissRef.value()
        }
      }
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') {
          return
        }
        if (captureEscape) {
          event.stopPropagation()
        }
        onDismissRef.value()
      }
      document.addEventListener('pointerdown', onPointerDown)
      document.addEventListener('keydown', onKeyDown, captureEscape)
      return () => {
        document.removeEventListener('pointerdown', onPointerDown)
        document.removeEventListener('keydown', onKeyDown, captureEscape)
      }
    },
    () => [open(), captureEscape]
  )
}

/** 悬停类浮层的进出延迟：同一时间只有一个待执行的切换 */
export const useDelayedOpen = () => {
  const open = shallowRef(false)
  const setOpen = (next: typeof open.value) => {
    open.value = next
  }
  const timer = shallowRef(0)
  watchAfterRender(() => () => window.clearTimeout(timer.value))
  const schedule = (next: boolean, delay: number) => {
    window.clearTimeout(timer.value)
    if (delay <= 0) {
      setOpen(next)
      return
    }
    timer.value = window.setTimeout(() => setOpen(next), delay)
  }
  const cancel = () => window.clearTimeout(timer.value)
  return { open, setOpen, schedule, cancel }
}

export const anchoredStyles = (position: AnchoredPosition | null) =>
  position
    ? {
        top: position.top + 'px',
        left: position.left === undefined ? undefined : position.left + 'px',
        right: position.right === undefined ? undefined : position.right + 'px',
        maxHeight: position.maxHeight === undefined ? undefined : position.maxHeight + 'px',
      }
    : ({ visibility: 'hidden' } as const)
