<script setup lang="ts">
import { ref, type CSSProperties } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    /** 容器类名，尺寸 / 圆角 / 背景由调用方定义 */
    className?: string
    imgClassName?: string
    /** loading 骨架占位层类名 */
    skeletonClassName?: string
    /** 兜底内容包裹层类名 */
    fallbackClassName?: string
    style?: CSSProperties
  }>(),
  {
    className: undefined,
    imgClassName: undefined,
    skeletonClassName: undefined,
    fallbackClassName: undefined,
    style: undefined,
  }
)

/**
 * 带加载兜底的图片：loading 骨架占位 → 成功显示 → 失败展示 fallback 内容。
 * 只提供三态行为，视觉全部由调用方类名决定。
 */
const loadResult = ref<'loading' | 'error' | 'loaded'>(props.src ? 'loading' : 'error')
</script>

<template>
  <div :class="className" :style="style">
    <img
      v-if="loadResult !== 'error'"
      :src="src"
      alt=""
      :class="imgClassName"
      :style="{ display: loadResult === 'loaded' ? 'block' : 'none' }"
      @load="loadResult = 'loaded'"
      @error="loadResult = 'error'"
    />
    <div v-if="loadResult === 'error'" :class="fallbackClassName">
      <slot />
    </div>
    <div v-if="loadResult === 'loading'" :class="skeletonClassName" />
  </div>
</template>
