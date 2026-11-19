<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@/i18n'
import type { Status } from './settingStatus'

const props = withDefaults(
  defineProps<{
    label: string
    description?: string
    status: Status
    className?: string
  }>(),
  { description: undefined, className: undefined }
)

const t = useTranslate()

const statusText = computed(() =>
  props.status
    ? t(
        props.status.key,
        props.status.reason ? { message: t(props.status.reason) } : props.status.params
      )
    : null
)
</script>

<template>
  <div :class="['cell', 'row', className]">
    <div class="text">
      <div class="label">{{ label }}</div>
      <div v-if="status || description" :class="['description', { error: status?.error }]">
        {{ statusText ?? description }}
      </div>
    </div>
    <slot />
  </div>
</template>
