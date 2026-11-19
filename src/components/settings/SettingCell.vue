<script setup lang="ts">
import styles from './Settings.module.css'
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
  <div :class="[styles.cell, styles.row, className]">
    <div :class="styles.text">
      <div :class="styles.label">{{ label }}</div>
      <div
        v-if="status || description"
        :class="[styles.description, { [styles.error]: status?.error }]"
      >
        {{ statusText ?? description }}
      </div>
    </div>
    <slot />
  </div>
</template>
