<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  IconDarkOutline16,
  IconFollowsystemOutline16,
  IconLightOutline16,
} from '@/components/base/icons'
import { useTranslate, type TranslationKey } from '@/i18n'
import { useSettingsStore, type ThemePreference } from '@/stores/settings'

const themeOptions: { value: ThemePreference; label: TranslationKey }[] = [
  { value: 'light', label: 'avatarMenuSettingsDialogThemeSelectLightOption' },
  { value: 'dark', label: 'avatarMenuSettingsDialogThemeSelectDarkOption' },
  { value: 'system', label: 'avatarMenuSettingsDialogThemeSelectSystemOption' },
]

const optionIcons: Record<ThemePreference, Component> = {
  light: IconLightOutline16,
  dark: IconDarkOutline16,
  system: IconFollowsystemOutline16,
}

const t = useTranslate()
const settings = useSettingsStore()
const label = computed(() => t('avatarMenuSettingsDialogThemeItemLabel'))

/**
 * 主题项：标题下方浅色 / 深色 / 跟随系统三个选块。
 * 与下方语言选项连续排列。
 */
</script>

<template>
  <div class="theme">
    {{ label }}
    <div role="radiogroup" :aria-label="label" class="themeOptions">
      <button
        v-for="option in themeOptions"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="settings.themePreference === option.value"
        :class="['themeOption', { themeOptionSelected: settings.themePreference === option.value }]"
        @click="settings.setThemePreference(option.value)"
      >
        <component :is="optionIcons[option.value]" />
        {{ t(option.label) }}
      </button>
    </div>
  </div>
</template>
