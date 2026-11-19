<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@/i18n'
import { useReadAloudStore, describeReadAloudError, toggleReadAloud } from '@/stores/readAloud'
import { IconPlayMediaOutline16 } from '@/components/base/icons'
import IconButton from '@/components/base/IconButton.vue'
import { showToast } from '@/stores/toast'
import ReadingBars from './ReadingBars.vue'

const props = defineProps<{ messageId: string; text: string }>()

const t = useTranslate()
const readAloud = useReadAloudStore()

/** 朗读按钮：未朗读时点击开始，加载中或朗读中点击停止；正文原样提交，由服务端过滤 markdown */
const status = computed(() => (readAloud.messageId === props.messageId ? readAloud.status : 'idle'))

const onClick = () =>
  toggleReadAloud(props.messageId, props.text, (error) => showToast(describeReadAloudError(error)))
</script>

<template>
  <IconButton
    :tooltip="status === 'idle' ? t('ttsPlay') : t('ttsStop')"
    tooltip-placement="bottom"
    @click="onClick"
  >
    <IconPlayMediaOutline16 v-if="status === 'idle'" />
    <ReadingBars v-else :mode="status" />
  </IconButton>
</template>
