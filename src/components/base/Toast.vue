<script setup lang="ts">
import { computed } from 'vue'
import { translateForLocale, useTranslate } from '@/i18n'
import { useToastStore } from '@/stores/toast'
import { useSettingsStore } from '@/stores/settings'

const toast = useToastStore()
const t = useTranslate()

const content = computed(() => {
  const { message } = toast
  if (!message || typeof message === 'string') {
    return { text: message, error: false, link: null }
  }
  // 文案在渲染时按当前语言翻译
  const t0 = translateForLocale(useSettingsStore().locale)
  return {
    text: t0(message.key, message.params),
    error: message.type === 'error',
    link: message.link && { href: message.link.href, text: t(message.link.key) },
  }
})
</script>

<template>
  <div
    v-if="content.text"
    :key="toast.id"
    :class="['toast', { error: content.error }]"
    role="status"
  >
    <span v-if="content.error" class="icon">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path
          d="M8 .333a7.667 7.667 0 1 1 0 15.334A7.667 7.667 0 0 1 8 .333zm0 1.334a6.333 6.333 0 1 0 0 12.666A6.333 6.333 0 0 0 8 1.667z"
        />
        <path
          d="M7.383 8.4c.013.406.222.61.624.61.388 0 .587-.204.597-.61l.11-3.373a.603.603 0 0 0-.194-.492.728.728 0 0 0-.527-.202.718.718 0 0 0-.52.195.622.622 0 0 0-.188.5l.098 3.371zM7.424 11.098a.849.849 0 0 0 .583.215.83.83 0 0 0 .569-.215.7.7 0 0 0 .243-.548.7.7 0 0 0-.243-.548.815.815 0 0 0-.569-.215.834.834 0 0 0-.583.222.701.701 0 0 0-.236.54c0 .218.079.4.236.549z"
        />
      </svg>
    </span>
    <span class="content"
      >{{ content.text
      }}<a
        v-if="content.link"
        class="link"
        :href="content.link.href"
        target="_blank"
        rel="noreferrer"
        >{{ content.link.text }}</a
      ></span
    >
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  top: calc(40px + env(safe-area-inset-top));
  right: 0;
  left: 0;
  z-index: 2000;
  box-sizing: border-box;
  width: fit-content;
  max-width: min(calc(100vw - 28px), 480px);
  margin: 0 auto;
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-inverted);
  font-size: 14px;
  line-height: 22px;
  text-align: center;
  word-break: break-word;
  white-space: pre-wrap;
  color: var(--dsw-static-neutral-100);
  background-color: var(--dsw-alias-toast-bg);
  box-shadow:
    0 0 4px 2px rgba(0, 0, 0, 0.04),
    0 4px 16px 0 rgba(0, 0, 0, 0.1);
  animation: enter 0.2s var(--ds-ease-in-out);
  pointer-events: none;
}

/* 带图标时图标在左、文字左对齐，整体仍居中 */
.error {
  display: flex;
  text-align: left;
}

.icon {
  display: flex;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-right: 7px;
  /* 与首行文字居中：(22 - 16) / 2 */
  margin-top: 3px;
  color: var(--dsw-alias-state-error-primary);
}

.content {
  min-width: 0;
}

/* 整条提示不拦截点击，只有链接可点 */
.link {
  color: var(--dsw-static-blue-400);
  text-decoration: none;
  pointer-events: auto;
}

.link:hover {
  text-decoration: underline;
}

@keyframes enter {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
}
</style>
