<script setup lang="ts">
import { useTranslate } from '@/i18n'
import Select from '@/components/base/Select.vue'
import SettingCell from './SettingCell.vue'
import { useSettingsStore } from '@/stores/settings'

const t = useTranslate()
const settings = useSettingsStore()

/** 朗读音色：stella（海星，女声）/ tide（暗潮，男声） */
</script>

<template>
  <SettingCell :label="t('settingsTtsVoice')" :status="null">
    <Select
      :aria-label="t('settingsTtsVoice')"
      :value="settings.ttsVoice"
      :options="[
        { value: 'stella', label: t('settingsTtsVoiceStella') },
        { value: 'tide', label: t('settingsTtsVoiceTide') },
      ]"
      @change="(value) => settings.setTtsVoice(value)"
    />
  </SettingCell>
</template>
