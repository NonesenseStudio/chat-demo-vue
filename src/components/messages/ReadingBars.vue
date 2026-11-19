<script setup lang="ts">
import { computed, ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'

/**
 * 朗读按钮 loading / playing 两态的动画竖条（4 根，SVG 绘制，随 mode 换动画与颜色）。
 *
 * playing 波形通过 SMIL 同步改变 rect 的 height 与 y，保持圆角形状和竖直居中。
 * 两个高度极值之间使用 ease-in-out 插值；prefers-reduced-motion 启用时显示静态帧。
 *
 * SVG 在两种状态间保持挂载，使 SMIL 时间轴连续运行，涵盖 Chromium 的容器启动延迟。
 * 挂载时调用 unpauseAnimations()，确保 WebKit 中的动画时间轴启动。
 * 入场相位取决于容器当前时间，相邻竖条的相位差由 begin 决定。
 */

const props = defineProps<{ mode: 'loading' | 'playing' }>()

/** 条宽 2、间距 2，总宽 14 在 16 视口内居中 */
const BAR_XS = [1, 5, 9, 13]

/** 相邻条相位滞后 0.25 周期（0.4s），波从左往右传；begin 相对常驻时间容器解析，差值定错峰 */
const WAVE_BEGINS = ['0s', '-1.2s', '-0.8s', '-0.4s']

/** reduced-motion 的静态帧（换算到 4–14 档） */
const STATIC_PLAYING_HEIGHTS = [7, 14, 4, 10]

/** ease-in-out 的 cubic-bezier */
const EASE_IN_OUT = '0.42 0 0.58 1'

const SWEEP_CLASSES = ['sweep1', 'sweep2', 'sweep3', 'sweep4']

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const reduced = ref(window.matchMedia(REDUCED_MOTION_QUERY).matches)
watchAfterRender(() => {
  const queryList = window.matchMedia(REDUCED_MOTION_QUERY)
  const listener = ({ matches }: { matches: boolean }) => {
    reduced.value = matches
  }
  // addListener 支持 iOS 12 的 MediaQueryList。
  queryList.addListener(listener)
  return () => queryList.removeListener(listener)
})

const playing = computed(() => props.mode === 'playing')
const heights = computed(() =>
  BAR_XS.map((_, index) =>
    playing.value ? (reduced.value ? STATIC_PLAYING_HEIGHTS[index] : 14) : 4
  )
)
const svgRef = ref<SVGSVGElement | null>(null)
watchAfterRender(() => {
  // 显式启动 SMIL 时间轴，支持容器初始处于暂停状态的 WebKit。
  svgRef.value?.unpauseAnimations()
})
</script>

<template>
  <svg
    ref="svgRef"
    :class="['bars', playing ? 'playing' : 'loading']"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <template v-for="(x, index) in BAR_XS" :key="index">
      <rect
        class="bar"
        :x="x"
        :y="(16 - heights[index]) / 2"
        width="2"
        :height="heights[index]"
        rx="1"
      >
        <template v-if="playing && !reduced">
          <!-- height 与 y 同 spline 同 begin：都是条高的仿射函数，逐帧严格同步，竖向恒居中 -->
          <animate
            attributeName="height"
            values="14;4;14"
            keyTimes="0;0.5;1"
            calcMode="spline"
            :keySplines="`${EASE_IN_OUT};${EASE_IN_OUT}`"
            dur="1.6s"
            :begin="WAVE_BEGINS[index]"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y"
            values="1;6;1"
            keyTimes="0;0.5;1"
            calcMode="spline"
            :keySplines="`${EASE_IN_OUT};${EASE_IN_OUT}`"
            dur="1.6s"
            :begin="WAVE_BEGINS[index]"
            repeatCount="indefinite"
          />
        </template>
      </rect>
      <!-- 扫光蒙层：黑 rect 盖在条上，fill-opacity 走逐条高斯 keyframes -->
      <rect
        v-if="!playing"
        :class="['sweep', SWEEP_CLASSES[index]]"
        :x="x"
        :y="(16 - heights[index]) / 2"
        width="2"
        :height="heights[index]"
        rx="1"
      />
    </template>
  </svg>
</template>

<style scoped>
.bars {
  display: block;
}

.loading .bar {
  fill: var(--dsw-static-neutral-300);
}

:global([data-ds-dark-theme]) .loading .bar {
  fill: var(--dsw-static-neutral-550);
}

.sweep {
  fill: #000;
  fill-opacity: 0;
  animation-duration: 1.5s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.sweep1 {
  animation-name: tts-sweep-1;
}

.sweep2 {
  animation-name: tts-sweep-2;
}

.sweep3 {
  animation-name: tts-sweep-3;
}

.sweep4 {
  animation-name: tts-sweep-4;
}

@keyframes tts-sweep-1 {
  0% {
    fill-opacity: 0.4;
  }

  4.17% {
    fill-opacity: 0.38;
  }

  8.33% {
    fill-opacity: 0.325;
  }

  12.5% {
    fill-opacity: 0.25;
  }

  16.67% {
    fill-opacity: 0.174;
  }

  20.83% {
    fill-opacity: 0.109;
  }

  25% {
    fill-opacity: 0.061;
  }

  29.17% {
    fill-opacity: 0.031;
  }

  33.33% {
    fill-opacity: 0.014;
  }

  37.5% {
    fill-opacity: 0.006;
  }

  41.67% {
    fill-opacity: 0.002;
  }

  45.83%,
  100% {
    fill-opacity: 0;
  }
}

@keyframes tts-sweep-2 {
  0% {
    fill-opacity: 0.014;
  }

  4.17% {
    fill-opacity: 0.031;
  }

  8.33% {
    fill-opacity: 0.061;
  }

  12.5% {
    fill-opacity: 0.109;
  }

  16.67% {
    fill-opacity: 0.174;
  }

  20.83% {
    fill-opacity: 0.25;
  }

  25% {
    fill-opacity: 0.325;
  }

  29.17% {
    fill-opacity: 0.38;
  }

  33.33% {
    fill-opacity: 0.4;
  }

  37.5% {
    fill-opacity: 0.38;
  }

  41.67% {
    fill-opacity: 0.325;
  }

  45.83% {
    fill-opacity: 0.25;
  }

  50% {
    fill-opacity: 0.174;
  }

  54.17% {
    fill-opacity: 0.109;
  }

  58.33% {
    fill-opacity: 0.061;
  }

  62.5% {
    fill-opacity: 0.031;
  }

  66.67% {
    fill-opacity: 0.014;
  }

  70.83% {
    fill-opacity: 0.006;
  }

  75% {
    fill-opacity: 0.002;
  }

  79.17%,
  100% {
    fill-opacity: 0;
  }
}

@keyframes tts-sweep-3 {
  0%,
  20.83% {
    fill-opacity: 0;
  }

  25% {
    fill-opacity: 0.002;
  }

  29.17% {
    fill-opacity: 0.006;
  }

  33.33% {
    fill-opacity: 0.014;
  }

  37.5% {
    fill-opacity: 0.031;
  }

  41.67% {
    fill-opacity: 0.061;
  }

  45.83% {
    fill-opacity: 0.109;
  }

  50% {
    fill-opacity: 0.174;
  }

  54.17% {
    fill-opacity: 0.25;
  }

  58.33% {
    fill-opacity: 0.325;
  }

  62.5% {
    fill-opacity: 0.38;
  }

  66.67% {
    fill-opacity: 0.4;
  }

  70.83% {
    fill-opacity: 0.38;
  }

  75% {
    fill-opacity: 0.325;
  }

  79.17% {
    fill-opacity: 0.25;
  }

  83.33% {
    fill-opacity: 0.174;
  }

  87.5% {
    fill-opacity: 0.109;
  }

  91.67% {
    fill-opacity: 0.061;
  }

  95.83% {
    fill-opacity: 0.031;
  }

  100% {
    fill-opacity: 0.014;
  }
}

@keyframes tts-sweep-4 {
  0%,
  54.17% {
    fill-opacity: 0;
  }

  58.33% {
    fill-opacity: 0.002;
  }

  62.5% {
    fill-opacity: 0.006;
  }

  66.67% {
    fill-opacity: 0.014;
  }

  70.83% {
    fill-opacity: 0.031;
  }

  75% {
    fill-opacity: 0.061;
  }

  79.17% {
    fill-opacity: 0.109;
  }

  83.33% {
    fill-opacity: 0.174;
  }

  87.5% {
    fill-opacity: 0.25;
  }

  91.67% {
    fill-opacity: 0.325;
  }

  95.83% {
    fill-opacity: 0.38;
  }

  100% {
    fill-opacity: 0.4;
  }
}

.playing {
  animation: tts-settle 0.15s cubic-bezier(0.22, 1, 0.36, 1);
}

.playing .bar {
  fill: var(--dsw-alias-brand-primary);
}

@keyframes tts-settle {
  from {
    transform: scaleY(0.2857);
  }

  to {
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .playing,
  .sweep {
    animation: none;
  }
}
</style>
