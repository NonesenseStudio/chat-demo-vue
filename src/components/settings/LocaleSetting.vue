<script setup lang="ts">
import { useTranslate } from '@/i18n'
import Select from '@/components/base/Select.vue'
import SettingCell from './SettingCell.vue'
import { useSettingsStore } from '@/stores/settings'

const t = useTranslate()
const settings = useSettingsStore()
</script>

<template>
  <SettingCell :label="t('settingsLocalePreference')" :status="null">
    <Select
      :aria-label="t('settingsLocalePreference')"
      :value="settings.locale"
      :options="[
        { value: 'zh-CN', label: t('settingsLocaleZhCN'), lang: 'zh-CN' },
        { value: 'en-US', label: t('settingsLocaleEnUS'), lang: 'en' },
      ]"
      @change="(value) => settings.setLocale(value)"
    />
  </SettingCell>
</template>
