<script setup lang="ts">
import { computed } from 'vue'
import type { Source } from '@/services/chat/view'
import { formatDate } from '@/utils/format'
import SiteLogo from './SiteLogo.vue'

const props = withDefaults(
  defineProps<{
    source: Source
    className?: string
  }>(),
  { className: undefined }
)

/** 显示为 YYYY/MM/DD；无法解析的日期原样显示 */
const formatPublishedAt = (value: string | null) => (value ? (formatDate(value, '/') ?? value) : '')

/**
 * 搜索结果卡片：站点图标与名称、日期、标题、摘要。
 * 元数据缺失时省略摘要，图标使用链接图标兜底。
 */
const date = computed(() => formatPublishedAt(props.source.publishedAt))
</script>

<template>
  <a class="anchor" :href="source.url" target="_blank" rel="noreferrer">
    <div :class="['card', className]">
      <div class="meta">
        <SiteLogo :url="source.siteIcon" class="site-icon" />
        <span v-if="source.siteName" class="site-name">{{ source.siteName }}</span>
        <span v-if="source.siteName && date" class="divider" />
        <span v-if="date" class="date">{{ date }}</span>
      </div>
      <div class="title">{{ source.title }}</div>
      <div v-if="source.snippet" class="snippet">{{ source.snippet }}</div>
    </div>
  </a>
</template>

<style scoped>
.anchor {
  text-decoration: none;
}

.card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: var(--search-view-card-meta-padding-top, 0);
  font: var(--search-view-card-meta-font, 500 12px/17px var(--dsw-font-family));
}

.site-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--search-view-card-secondary-color, var(--dsw-alias-label-secondary));
}

.divider {
  width: 1px;
  height: 12px;
  margin: 0 3px;
  background-color: var(--dsw-alias-border-l3);
}

.date {
  flex-shrink: 0;
  font-weight: 400;
  color: var(--search-view-card-secondary-color, var(--dsw-alias-label-secondary));
}

.title {
  display: -webkit-box;
  margin-top: 6px;
  overflow: hidden;
  font: var(--search-view-card-title-font, 500 16px/25px var(--dsw-font-family));
  color: var(--dsw-alias-label-primary);
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.snippet {
  display: -webkit-box;
  margin-top: 6px;
  overflow: hidden;
  font-size: 13px;
  line-height: 20px;
  color: var(--search-view-card-secondary-color, var(--dsw-alias-label-secondary));
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>

<!-- SiteLogo 根元素的尺寸：类名经组件链透传，用全局作用域保证命中 -->
<style>
.site-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}
</style>
