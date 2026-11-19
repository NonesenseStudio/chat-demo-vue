import { computed, reactive, ref } from 'vue'
import { ApiError, verifyApiKey } from '@/services/api/client'
import { classifyApiError } from '@/services/api/errors'
import { useSettingsStore } from '@/stores/settings'
import { useTranslate } from '@/i18n'

/** 输入 API Key 后先用 GET /models 校验，通过才保存 */
export const useApiKeyForm = (onSaved?: () => void) => {
  const t = useTranslate()
  const settings = useSettingsStore()
  const value = ref('')
  const verifying = ref(false)
  const failure = ref<{ cause: unknown } | null>(null)
  const cause = computed(() => failure.value?.cause)
  const error = computed(() =>
    failure.value === null
      ? null
      : classifyApiError(cause.value) === 'unauthorized'
        ? t('apiKeyInvalid')
        : classifyApiError(cause.value) === 'network'
          ? t('commonNetworkErrorToast')
          : t('apiKeyVerificationFailed', {
              message:
                cause.value instanceof ApiError && cause.value.localMessage
                  ? t(cause.value.localMessage.key, cause.value.localMessage.params)
                  : cause.value instanceof Error
                    ? cause.value.message
                    : String(cause.value),
            })
  )
  const submit = async () => {
    const apiKey = value.value.trim()
    if (!apiKey || verifying.value) {
      return
    }
    verifying.value = true
    failure.value = null
    try {
      await verifyApiKey(apiKey)
      settings.setApiKey(apiKey)
      value.value = ''
      onSaved?.()
    } catch (e) {
      failure.value = { cause: e }
    } finally {
      verifying.value = false
    }
  }
  return { value, verifying, error, submit }
}

/** API Key 的编辑状态：输入框与移动端底部的「确定」按钮共用 */
export const useApiKeyEditor = () => {
  const settings = useSettingsStore()
  const editing = ref(false)
  const form = useApiKeyForm(() => {
    editing.value = false
  })
  return reactive({
    settings,
    editing,
    form,
    showInput: computed(() => !settings.apiKey || editing.value),
  })
}

export type ApiKeyEditor = ReturnType<typeof useApiKeyEditor>
