<script setup lang="ts">
import { type CSSProperties } from 'vue'
import FallbackImage from './FallbackImage.vue'
import { IconLinkOutline14 } from '@/components/base/icons'

withDefaults(
  defineProps<{
    url: string | null
    className?: string
    style?: CSSProperties
  }>(),
  { className: undefined, style: undefined }
)

/** 站点图标：加载中显示骨架，没有图标或加载失败时显示链接图标 */
</script>

<template>
  <FallbackImage
    :key="url ?? ''"
    :src="url ?? ''"
    :class="['logo', className]"
    img-class-name="site-logo-img"
    skeleton-class-name="site-logo-placeholder"
    fallback-class-name="site-logo-placeholder site-logo-fallback"
    :style="style"
  >
    <IconLinkOutline14 />
  </FallbackImage>
</template>

<style scoped>
.logo {
  display: inline-flex;
  overflow: hidden;
  border-radius: 50%;
  background-color: var(--dsw-alias-markdown-citation);
}

.group {
  display: inline-flex;
  margin-left: 6px;
  user-select: none;
}

.thumbnail {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-left: -4px;
  transition: box-shadow 0.2s;
  box-shadow:
    0 0 0 1px var(--search-row-site-logo-color, var(--dsw-alias-bg-base)),
    0 0 0 1px var(--dsw-alias-bg-base);
}

.thumbnail:first-of-type {
  margin-left: 0;
}
</style>

<!-- FallbackImage 内部元素的样式：经类名透传，需全局作用域 -->
<style>
.site-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.site-logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: var(--dsw-alias-markdown-citation);
}

.site-logo-fallback {
  color: var(--dsw-alias-label-tertiary);
}

.site-logo-fallback svg {
  width: 70%;
  height: 70%;
}
</style>

