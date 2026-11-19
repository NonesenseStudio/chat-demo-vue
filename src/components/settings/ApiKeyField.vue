<script setup lang="ts">
import { IconEditOutline16 } from '@/components/base/icons'
import { useIsMobile } from '@/composables/useViewport'
import IconButton from '@/components/base/IconButton.vue'
import { useTranslate } from '@/i18n'
import type { ApiKeyEditor } from './useApiKeyForm'

defineProps<{
  editor: ApiKeyEditor
}>()

const t = useTranslate()
const isMobile = useIsMobile()

const submit = (editor: ApiKeyEditor) => void editor.form.submit()

/** 修改时没输入就离开，回到已保存的状态 */
const onBlur = (editor: ApiKeyEditor) => {
  if (editor.settings.apiKey && !editor.form.value.trim()) {
    editor.editing = false
  }
}
</script>

<template>
  <!-- API Key：保存后只显示掩码，点编辑按钮才能重新输入 -->
  <div class="cell">
    <div class="apiKey">
      <div class="label">{{ t('apiKeyStart') }}</div>
      <div v-if="editor.settings.apiKey && !editor.editing" class="apiKeySaved">
        <span class="apiKeyMask">{{ '*'.repeat(editor.settings.apiKey.length) }}</span>
        <IconButton
          tone="primary"
          :aria-label="t('apiKeyEdit')"
          :tooltip="t('apiKeyEdit')"
          @click="editor.editing = true"
        >
          <IconEditOutline16 />
        </IconButton>
      </div>
      <div v-else class="apiKeyInput">
        <input
          type="password"
          :placeholder="t('apiKeyPlaceholder')"
          autocomplete="off"
          spellcheck="false"
          :autofocus="!isMobile || editor.editing"
          :value="editor.form.value"
          @input="editor.form.value = ($event.currentTarget as HTMLInputElement).value"
          @keydown="($event) => {
            if ($event.key === 'Enter' && !$event.isComposing) {
              submit(editor)
            }
          }"
          @blur="onBlur(editor)"
        />
        <template v-if="!isMobile && editor.form.value.trim()">
          <span class="divider" />
          <!-- 保持输入框焦点 -->
          <button
            type="button"
            class="confirm"
            :disabled="editor.form.verifying"
            @mousedown.prevent
            @click="submit(editor)"
          >
            {{ editor.form.verifying ? t('apiKeyVerifying') : t('confirm') }}
          </button>
        </template>
      </div>
      <div v-if="editor.showInput && editor.form.error" class="error">
        {{ editor.form.error }}
      </div>
    </div>
  </div>
</template>
