<script setup lang="ts">
import { ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useTranslate } from '@/i18n'
import { IconCheckOutline16, IconCopyOutline16 } from '@/components/base/icons'
import IconButton from '@/components/base/IconButton.vue'
import { showToast } from '@/stores/toast'
import { copyText } from '@/utils/clipboard'

const props = defineProps<{ text: string }>()

const t = useTranslate()

/** 复制成功后图标换成对勾 1 秒，期间再次点击不重复复制 */
const copied = ref(false)
const timer = ref<ReturnType<typeof setTimeout> | undefined>(undefined)
watchAfterRender(() => () => clearTimeout(timer.value))

const onCopy = async () => {
  if (copied.value) {
    return
  }
  if (!(await copyText(props.text))) {
    showToast({ key: 'copyFailed' })
    return
  }
  copied.value = true
  timer.value = setTimeout(() => {
    copied.value = false
  }, 1000)
}
</script>

<template>
  <IconButton :tooltip="t('copy')" tooltip-placement="bottom" @click="onCopy">
    <IconCheckOutline16 v-if="copied" />
    <IconCopyOutline16 v-else />
  </IconButton>
</template>
