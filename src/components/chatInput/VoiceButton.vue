<script setup lang="ts">
import { computed } from 'vue'
import { useTranslate } from '@/i18n'
import { IconMicFill16, IconMicOutline16 } from '@/components/base/icons'
import Tooltip from '@/components/base/Tooltip.vue'
import type { VoiceInputStatus } from './useVoiceInput'

const props = withDefaults(
  defineProps<{
    status: VoiceInputStatus
    /** 非安全上下文中按钮置灰，tooltip 提示录音需要 HTTPS */
    disabled?: boolean
    /** 本次录音已录秒数，录音中显示在按钮左侧 */
    seconds: number
  }>(),
  { disabled: false, seconds: 0 }
)

const emit = defineEmits<{ click: [] }>()

const t = useTranslate()

/**
 * 语音输入按钮。
 * 录音中为两层圆：外层半透明光圈 + 内层实心品牌色；
 * 外层先展开、内层随后放大，之后外层按固定节奏呼吸，与音量无关。
 * 按钮左侧显示「录音中 Ns」，窄屏不展示读秒。
 */
const recording = computed(() => props.status === 'recording')
const label = computed(() =>
  props.disabled
    ? t('voiceInputRequiresHttps')
    : recording.value
      ? t('voiceInputStop')
      : props.status === 'transcribing'
        ? t('voiceInputCancel')
        : t('voiceInput')
)
</script>

<template>
  <span v-if="recording" class="timer">
    {{ t('voiceInputTimer', { seconds: props.seconds }) }}
  </span>
  <Tooltip :content="label">
    <button
      type="button"
      :class="['button', { recording, disabled: props.disabled }]"
      :aria-label="label"
      :aria-pressed="recording"
      :aria-disabled="props.disabled"
      @click="() => (!props.disabled ? emit('click') : null)"
    >
      <span v-if="recording" class="active">
        <span class="halo" />
        <span class="core" />
        <span class="outline">
          <IconMicOutline16 />
        </span>
        <span class="glyph">
          <IconMicFill16 />
        </span>
      </span>
      <span v-else-if="props.status === 'transcribing'" class="loading" />
      <IconMicOutline16 v-else />
    </button>
  </Tooltip>
</template>

<style scoped>
.timer {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-caption);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 窄屏空间不足，读秒整体不展示 */
@media not all and (min-width: 768px) {
  .timer {
    display: none;
  }
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: transparent;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
  outline: none;
  transition: background-color var(--ds-transition-duration) var(--ds-ease-in-out);
}

.button:active:not(.recording):not(.disabled) {
  background-color: var(--dsw-alias-interactive-bg-hover);
}

@media (hover: hover) {
  .button:hover:not(.recording):not(.disabled) {
    background-color: var(--dsw-alias-interactive-bg-hover);
  }
}

.button:focus-visible {
  box-shadow: 0 0 0 2px var(--dsw-alias-button-primary-fill);
}

.disabled {
  color: var(--dsw-alias-label-caption);
  cursor: not-allowed;
}

.active {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
}

.halo {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-color: var(--dsw-alias-brand-primary);
  opacity: 0.2;
  animation:
    haloEnter 0.15s ease-out both,
    haloBreath 1.8s ease-in-out 0.15s infinite;
}

.core {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background-color: var(--dsw-alias-brand-primary);
  opacity: 0.75;
  animation: coreEnter 0.2s ease-out 0.14s both;
}

.outline {
  position: absolute;
  display: flex;
  color: var(--dsw-alias-brand-primary);
  animation: fadeOut 0.12s ease-out 0.14s both;
}

.glyph {
  position: relative;
  display: flex;
  color: var(--dsw-static-neutral-bluish-00);
  animation: fadeIn 0.1s ease-out 0.26s both;
}

@keyframes haloEnter {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 0.2;
  }
}

@keyframes haloBreath {
  0%,
  100% {
    scale: 1;
  }

  50% {
    scale: 1.1;
  }
}

@keyframes coreEnter {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 0.75;
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .halo,
  .core,
  .glyph {
    animation: none;
  }

  .outline {
    display: none;
  }

  .halo {
    scale: none;
  }
}

.loading {
  width: 14px;
  height: 14px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 1.5px solid var(--dsw-alias-border-l2);
  border-top-color: var(--dsw-alias-label-tertiary);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
