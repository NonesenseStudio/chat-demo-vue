import { useSettingsStore, type Locale } from '@/stores/settings'
import { en } from './en'
import { zh } from './zh'

export type TranslationKey = keyof typeof zh
export type TranslationParams = Record<string, string | number>
export type TranslationMessage = { key: TranslationKey; params?: TranslationParams }
/** 带文字链接的提示：link 跟在正文后，在新窗口打开；type 为 error 时前面带错误图标 */
export type LinkedMessage = TranslationMessage & {
  type?: 'error'
  link?: { key: TranslationKey; href: string }
}

export const isTranslationKey = (key: unknown): key is TranslationKey =>
  typeof key === 'string' && Object.hasOwn(zh, key)

const createTranslate =
  (messages: Record<TranslationKey, string>) =>
  (key: TranslationKey, params?: TranslationParams): string =>
    messages[key].replace(/\{(\w+)\}/g, (placeholder, name: string) => {
      const value = params?.[name]
      return typeof value === 'string' || typeof value === 'number' ? String(value) : placeholder
    })

const translators = {
  'zh-CN': createTranslate(zh),
  'en-US': createTranslate(en),
}

export const translateForLocale = (locale: Locale) => translators[locale]

/**
 * 返回跟随当前语言的翻译函数；在渲染与 computed 中调用时自动跟踪语言变化，
 * 普通函数在调用时读取当前语言。
 */
export const useTranslate = (): typeof translate => {
  const settings = useSettingsStore()
  return (key, params) => translators[settings.locale](key, params)
}

export const translate = (key: TranslationKey, params?: TranslationParams): string =>
  translators[useSettingsStore().locale](key, params)
