<script setup lang="ts">
import { ref } from 'vue'
import { useTranslate } from '@/i18n'
import type { MessageVersions } from '@/services/chat/branches'
import { IconChevronRightOutline14 } from '@/components/base/icons'
import IconButton from '@/components/base/IconButton.vue'

export type SelectMessageVersion = (messageId: string, anchorTop: number) => void

defineProps<{
  versions: MessageVersions
  disabled: boolean
}>()

const emit = defineEmits<{ select: [messageId: string, anchorTop: number] }>()

const t = useTranslate()
const anchorRef = ref<HTMLDivElement | null>(null)

const select = (messageId: string) => {
  if (anchorRef.value) {
    emit('select', messageId, anchorRef.value.getBoundingClientRect().top)
  }
}
</script>

<template>
  <div
    v-if="versions.ids.length > 1"
    ref="anchorRef"
    class="switcher"
    :aria-label="t('messageVersions')"
    :data-message-version="versions.ids[versions.index]"
  >
    <IconButton
      class="previous"
      :aria-label="t('previousVersion')"
      :disabled="disabled || versions.index <= 0"
      @click="select(versions.ids[versions.index - 1])"
    >
      <IconChevronRightOutline14 />
    </IconButton>
    <span class="count"> {{ versions.index + 1 }} / {{ versions.ids.length }} </span>
    <IconButton
      :aria-label="t('nextVersion')"
      :disabled="disabled || versions.index >= versions.ids.length - 1"
      @click="select(versions.ids[versions.index + 1])"
    >
      <IconChevronRightOutline14 />
    </IconButton>
  </div>
</template>

<style scoped>
.switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 28px;
}

.previous :deep(svg) {
  transform: rotate(180deg);
}

.count {
  color: var(--dsw-alias-label-tertiary);
  font-size: 15px;
  line-height: 18px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  user-select: none;
}
</style>
