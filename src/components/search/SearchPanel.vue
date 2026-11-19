<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@/i18n'
import { IconCloseOutline16 } from '@/components/base/icons'
import IconButton from '@/components/base/IconButton.vue'
import { useSearchPanelStore } from '@/stores/searchPanel'
import SourceCard from './SourceCard.vue'

const t = useTranslate()
const panel = useSearchPanelStore()
const entry = computed(() => panel.entry)
const sources = computed(() => panel.sources)
</script>

<template>
  <!-- 右侧「搜索结果」面板 -->
  <aside v-if="entry" class="panel">
    <div class="header">
      <div role="heading" class="title">
        {{ t('searchResult') }}
      </div>
      <IconButton :aria-label="t('close')" @click="panel.close()">
        <IconCloseOutline16 />
      </IconButton>
    </div>
    <div class="content">
      <SourceCard v-for="source in sources" :key="source.url" :source="source" class="search-panel-item" />
    </div>
  </aside>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-sizing: border-box;
  width: calc(50vw - 4rem);
  max-width: 390px;
  height: 100%;
  border-left: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base);
}

.header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  box-sizing: border-box;
  height: 60px;
  padding: 0 14px 0 20px;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
}

.title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
}

.content {
  --search-view-card-meta-font: var(--dsw-font-xs-13);
  --search-view-card-meta-padding-top: 2px;
  --search-view-card-secondary-color: var(--dsw-alias-label-tertiary);
  --search-view-card-title-font: 500 14px/22px var(--dsw-font-family);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
  scrollbar-color: var(--scroll-color) transparent;
}

@media not all and (min-width: 768px) {
  .panel {
    position: fixed;
    inset: 0;
    z-index: 700;
    width: auto;
    max-width: none;
    border-left: none;
  }
}
</style>

<!-- SourceCard 卡片在本组件内的间距：类名传入子组件内部，需全局作用域 -->
<style>
.search-panel-item {
  margin-bottom: 6px;
  padding: 12px;
  border-radius: 12px;
  transition: background-color var(--ds-transition-duration) var(--ds-ease-in-out);
}

.search-panel-item:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
</style>
