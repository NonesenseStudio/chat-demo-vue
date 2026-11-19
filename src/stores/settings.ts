import { defineStore } from 'pinia'
import type { TtsVoice } from '@/services/api/speech'
import { normalizeLocation, type UserLocation } from '@/services/location'

export type Locale = 'zh-CN' | 'en-US'

/** 主题偏好；默认跟随系统 */
export type ThemePreference = 'light' | 'dark' | 'system'

/** 本机设置，存 localStorage：API Key、语言、主题、位置、朗读音色、深度思考与智能搜索开关、侧边栏收起状态 */
type Settings = {
  apiKey: string | null
  locale: Locale
  themePreference: ThemePreference
  location: UserLocation | null
  ttsVoice: TtsVoice
  thinking: boolean
  search: boolean
  siderCollapsed: boolean
}

const KEYS = {
  apiKey: 'chat-demo:api-key',
  locale: 'chat-demo:locale',
  location: 'chat-demo:location',
  themePreference: 'chat-demo:theme-preference',
  ttsVoice: 'chat-demo:tts-voice',
  thinking: 'chat-demo:thinking',
  search: 'chat-demo:search',
  siderCollapsed: 'chat-demo:sider-collapsed',
} as const

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string | null) => {
  try {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  } catch {
    // 存储不可用时只在内存中生效
  }
}

/** 位置选择模式跟随浏览器语言，与应用内选择的界面语言无关。 */
export const isChineseBrowser = (): boolean =>
  (typeof navigator === 'undefined' ? 'zh' : navigator.language).toLowerCase().startsWith('zh')

const initialLocale = (): Locale => {
  const saved = read(KEYS.locale)
  if (saved === 'zh-CN' || saved === 'en-US') {
    return saved
  }
  return isChineseBrowser() ? 'zh-CN' : 'en-US'
}

const initialLocation = (): UserLocation | null => {
  try {
    const location = normalizeLocation(JSON.parse(read(KEYS.location) ?? 'null'))
    if (!location) {
      return null
    }
    return isChineseBrowser()
      ? location.region === 'CN' && location.province
        ? location
        : null
      : { region: location.region }
  } catch {
    return null
  }
}

/** 未保存过时跟随系统 */
const initialThemePreference = (): ThemePreference => {
  const saved = read(KEYS.themePreference)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

/** 未保存过时使用服务端默认音色 stella（海星） */
const initialTtsVoice = (): TtsVoice => (read(KEYS.ttsVoice) === 'tide' ? 'tide' : 'stella')

export const useSettingsStore = defineStore('settings', {
  state: (): Settings => ({
    apiKey: read(KEYS.apiKey),
    locale: initialLocale(),
    location: initialLocation(),
    themePreference: initialThemePreference(),
    ttsVoice: initialTtsVoice(),
    thinking: read(KEYS.thinking) === 'true',
    search: read(KEYS.search) === 'true',
    siderCollapsed: read(KEYS.siderCollapsed) === 'true',
  }),
  actions: {
    setLocale(locale: Locale) {
      write(KEYS.locale, locale)
      this.locale = locale
    },
    setLocation(value: UserLocation | null) {
      const location = normalizeLocation(value)
      write(KEYS.location, location ? JSON.stringify(location) : null)
      this.location = location
    },
    setThemePreference(themePreference: ThemePreference) {
      write(KEYS.themePreference, themePreference)
      this.themePreference = themePreference
    },
    setTtsVoice(ttsVoice: TtsVoice) {
      write(KEYS.ttsVoice, ttsVoice)
      this.ttsVoice = ttsVoice
    },
    setApiKey(apiKey: string | null) {
      write(KEYS.apiKey, apiKey)
      this.apiKey = apiKey
    },
    setThinking(thinking: boolean) {
      write(KEYS.thinking, String(thinking))
      this.thinking = thinking
    },
    setSearch(search: boolean) {
      write(KEYS.search, String(search))
      this.search = search
    },
    setSiderCollapsed(siderCollapsed: boolean) {
      write(KEYS.siderCollapsed, String(siderCollapsed))
      this.siderCollapsed = siderCollapsed
    },
  },
})
