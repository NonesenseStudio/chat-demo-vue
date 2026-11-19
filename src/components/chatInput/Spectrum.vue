<script setup lang="ts">
import { computed, ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'

const props = defineProps<{
  getAnalyser: () => AnalyserNode | null
}>()

/** 与设计稿一致：2px 宽、3px 间距，静止 5px，最高 36px */
const BAR_WIDTH = 2
const BAR_GAP = 3
const BAR_MIN = 5
const BAR_MAX = 36
const MAX_BARS = 60
/** 人声频段，按对数分布到各柱 */
const FREQ_LOW = 100
const FREQ_HIGH = 4000
/** 低于底噪不起跳，避免环境噪声让柱子常亮 */
const DB_FLOOR = -80
const DB_CEIL = -25

/** 人声高频能量自然衰减，按倍频程补偿，避免右侧常年贴底 */
const TILT_DB_PER_OCTAVE = 4

/**
 * 录音中的实时频谱：从左到右依次是低频到高频，按对数分段。
 * 每帧直接改 transform，不触发组件重新渲染。
 */
const rootRef = ref<HTMLDivElement | null>(null)
const count = ref(0)
watchAfterRender(() => {
  const root = rootRef.value
  if (!root) {
    return
  }
  const observer = new ResizeObserver(([entry]) => {
    const fit = Math.floor((entry.contentRect.width + BAR_GAP) / (BAR_WIDTH + BAR_GAP))
    count.value = Math.min(MAX_BARS, fit)
  })
  observer.observe(root)
  return () => observer.disconnect()
})
const barCount = computed(() => count.value)
watchAfterRender(
  () => {
    const root = rootRef.value
    if (!root || count.value < 1) {
      return
    }
    const bars = Array.from(root.children) as HTMLElement[]
    const levels = new Float32Array(count.value)
    const targets = new Float32Array(count.value)
    const tilts = new Float32Array(count.value)
    for (let index = 0; index < count.value; index += 1) {
      tilts[index] =
        TILT_DB_PER_OCTAVE * Math.log2(FREQ_HIGH / FREQ_LOW) * (index / count.value)
    }
    let data = new Float32Array(0)
    let ranges: Range[] = []
    let rangeKey = ''
    let frame = 0

    const draw = () => {
      frame = requestAnimationFrame(draw)
      const analyser = props.getAnalyser()
      if (analyser) {
        if (data.length !== analyser.frequencyBinCount) {
          data = new Float32Array(analyser.frequencyBinCount)
        }
        const key = `${analyser.context.sampleRate}:${analyser.fftSize}`
        if (key !== rangeKey) {
          rangeKey = key
          ranges = buildRanges(
            count.value,
            analyser.context.sampleRate / analyser.fftSize,
            data.length
          )
        }
        analyser.getFloatFrequencyData(data)
      }
      for (let index = 0; index < count.value; index += 1) {
        let target = 0
        if (analyser) {
          const { from, to, center } = ranges[index]
          let peak = -Infinity
          if (to - from <= 1) {
            // 频段窄于一个 bin：在相邻 bin 之间线性插值，避免低频几根柱子完全同步
            const base = Math.min(data.length - 2, Math.floor(center))
            const weight = center - base
            peak = data[base] * (1 - weight) + data[base + 1] * weight
          } else {
            for (let bin = from; bin < to; bin += 1) {
              peak = Math.max(peak, data[bin])
            }
          }
          const db = peak + tilts[index]
          target = Math.min(1, Math.max(0, (db - DB_FLOOR) / (DB_CEIL - DB_FLOOR)))
        }
        targets[index] = target
      }
      for (let index = 0; index < count.value; index += 1) {
        // 和相邻频段做加权平均，填平谐波之间的空隙
        const prev = targets[Math.max(0, index - 1)]
        const next = targets[Math.min(count.value - 1, index + 1)]
        const target = (prev + targets[index] * 2 + next) / 4
        // 起几乎即时，落稍缓，避免闪烁又不拖尾
        levels[index] += (target - levels[index]) * (target > levels[index] ? 0.8 : 0.35)
        const height = BAR_MIN + (BAR_MAX - BAR_MIN) * levels[index]
        bars[index].style.transform = `scaleY(${height / BAR_MIN})`
      }
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  },
  () => [count.value, props.getAnalyser]
)

type Range = { from: number; to: number; center: number }

/** 把 [FREQ_LOW, FREQ_HIGH] 按对数切成 n 段，返回每段的 bin 区间及中心位置（以 bin 为单位） */
const buildRanges = (n: number, binWidth: number, binCount: number) => {
  const ranges: Range[] = []
  const ratio = FREQ_HIGH / FREQ_LOW
  for (let index = 0; index < n; index += 1) {
    const low = FREQ_LOW * ratio ** (index / n)
    const high = FREQ_LOW * ratio ** ((index + 1) / n)
    const from = Math.min(binCount - 1, Math.floor(low / binWidth))
    const to = Math.min(binCount, Math.max(from + 1, Math.ceil(high / binWidth)))
    ranges.push({ from, to, center: Math.sqrt(low * high) / binWidth })
  }
  return ranges
}
</script>

<template>
  <div ref="rootRef" class="spectrum" aria-hidden="true">
    <span v-for="index in barCount" :key="index" class="bar" />
  </div>
</template>

<style scoped>
/*
 * 覆盖输入区，左右边距与正文一致。
 * 纵向居中于「输入框上沿到工具栏按钮」之间：工具栏上方还有 4px 外边距 + 12px 内边距。
 */
.spectrum {
  position: absolute;
  top: calc(50% + 8px);
  translate: 0 -50%;
  left: 16px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 36px;
  opacity: 0.7;
  pointer-events: none;
}

.bar {
  flex-shrink: 0;
  width: 2px;
  height: 5px;
  border-radius: 1px;
  background-color: var(--dsw-alias-button-info-hover, #679efe);
  transform-origin: center;
  will-change: transform;
}
</style>
