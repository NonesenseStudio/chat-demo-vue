import { onMounted, onScopeDispose, watch } from 'vue'

/** Run DOM-dependent work after mount and after any tracked input changes. */
export const watchAfterRender = (effect: () => unknown, sources?: () => unknown[]) => {
  let cleanup: (() => void) | undefined
  const run = () => {
    cleanup?.()
    const result = effect()
    cleanup =
      typeof result === 'function'
        ? () => {
            result()
          }
        : undefined
  }
  onMounted(run)
  if (sources) {
    watch(
      sources,
      (next, previous) => {
        if (next.some((value, index) => !Object.is(value, previous[index]))) {
          run()
        }
      },
      { flush: 'post' }
    )
  }
  onScopeDispose(() => cleanup?.())
}
