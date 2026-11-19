<script setup lang="ts">
import styles from './Settings.module.css'
import { useTranslate } from '@/i18n'
import type { ApiKeyEditor } from './useApiKeyForm'

defineProps<{
  editor: ApiKeyEditor
}>()

const t = useTranslate()
</script>

<template>
  <!-- 移动端：输入 API Key 时在选项下方显示整行「确定」 -->
  <button
    v-if="editor.showInput && editor.form.value.trim()"
    type="button"
    :class="styles.mobileConfirm"
    :disabled="editor.form.verifying"
    @mousedown.prevent
    @click="() => void editor.form.submit()"
  >
    {{ editor.form.verifying ? t('apiKeyVerifying') : t('confirm') }}
  </button>
</template>
