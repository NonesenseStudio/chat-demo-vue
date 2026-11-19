<script setup lang="ts">
defineProps<{
  active: boolean
  isLast: boolean
}>()
</script>

<template>
  <!-- 思考或过程性文字：左侧圆点 + 竖线，小号 markdown -->
  <div :class="['content', 'ds-think-content', { lastItem: isLast }]">
    <span class="dot">
      <span :class="['dotInner', { inactive: !active }]" />
    </span>
    <slot />
  </div>
</template>

<style scoped>
.content {
  position: relative;
  padding: 5px 0 5px 22px;
}

.withLine::after,
.content::after {
  content: '';
  position: absolute;
  left: 7.5px;
  top: 31px;
  width: 1px;
  height: calc(100% - 24px);
  background-color: var(--dsw-alias-label-dimmed);
}

.content.lastItem {
  padding-bottom: 0;
}

.content.lastItem::after {
  height: calc(100% - 32px);
}

.dot {
  position: absolute;
  top: 9px;
  left: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.dotInner {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--dsw-alias-brand-primary);
  animation: pulse 1.5s linear infinite;
}

.dotInner.inactive {
  animation: none;
  background-color: var(--dsw-alias-label-tertiary);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    animation-timing-function: ease-out;
  }
  40% {
    transform: scale(1.3);
    animation-timing-function: linear;
  }
  60% {
    transform: scale(1.3);
    animation-timing-function: ease-out;
  }
  100% {
    transform: scale(1);
  }
}
</style>
