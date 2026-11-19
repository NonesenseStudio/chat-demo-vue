import type { TranslationKey, TranslationMessage } from '@/i18n'
import { BackupError } from '@/services/chat/backup'

/** `reason` 为失败原因的文案 key，展示时按当前语言翻译后填入 `message` 参数。 */
export type Status = (TranslationMessage & { error?: boolean; reason?: TranslationKey }) | null

/** 导出失败附带原因：预期的错误用对应文案作原因，其他错误用错误信息。 */
export const errorStatus = (key: TranslationKey, error: unknown): Status => ({
  key,
  ...(error instanceof BackupError
    ? { reason: error.key }
    : { params: { message: error instanceof Error ? error.message : String(error) } }),
  error: true,
})
