<script setup lang="ts">
import styles from './Settings.module.css'
import { computed } from 'vue'
import { useTranslate } from '@/i18n'
import Select from '@/components/base/Select.vue'
import SettingCell from './SettingCell.vue'
import { isChineseBrowser, useSettingsStore } from '@/stores/settings'
import { getRegionName, provinces, regionCodes } from '@/services/location'

const t = useTranslate()
const settings = useSettingsStore()
const location = computed(() => settings.location)
const province = computed(() =>
  location.value?.region === 'CN'
    ? provinces.find((item) => item.code === location.value?.province)
    : undefined
)
</script>

<template>
  <SettingCell :label="t('settingsLocation')" :status="null" :class-name="styles.locationCell">
    <div :class="styles.locationSelectors">
      <template v-if="isChineseBrowser()">
        <Select
          :class="styles.provinceSelect"
          :aria-label="t('settingsLocationProvince')"
          :value="province?.code ?? ''"
          :placeholder="t('settingsLocationProvince')"
          :options="provinces.map((item) => ({ value: item.code, label: item.name }))"
          @change="
            (value) => {
              if (value !== province?.code) {
                settings.setLocation({ region: 'CN', province: value })
              }
            }
          "
        />
        <Select
          :class="styles.citySelect"
          :aria-label="t('settingsLocationCity')"
          :value="province ? (location?.city ?? '') : ''"
          :disabled="!province?.cities.length"
          :placeholder="t('settingsLocationCity')"
          :options="province?.cities.map((item) => ({ value: item.code, label: item.name })) ?? []"
          @change="
            (value) => {
              if (province) {
                settings.setLocation({ region: 'CN', province: province.code, city: value })
              }
            }
          "
        />
      </template>
      <Select
        v-else
        :class="styles.regionSelect"
        :aria-label="t('settingsLocationRegion')"
        :value="location?.region ?? ''"
        :placeholder="t('settingsLocationRegion')"
        :options="
          regionCodes
            .map((code) => ({ value: code, label: getRegionName(code, settings.locale) }))
            .sort((a, b) => a.label.localeCompare(b.label, settings.locale))
        "
        @change="(value) => settings.setLocation({ region: value })"
      />
    </div>
  </SettingCell>
</template>
