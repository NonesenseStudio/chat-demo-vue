import { shallowRef } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'

import type { TranslationMessage } from '@/i18n'
import { transcribe } from '@/services/api/speech'
import { startRecording, type Recording } from '@/services/speech/recorder'
import { useSettingsStore } from '@/stores/settings'
import { showToast } from '@/stores/toast'

export type VoiceInputStatus = 'idle' | 'recording' | 'transcribing'

/**
 * 录音依赖 getUserMedia，只在安全上下文可用（HTTPS、localhost、file://）。
 * 普通 HTTP 页面上直接禁用入口，避免点击后必然失败。
 */
const AVAILABLE = typeof window === 'undefined' || window.isSecureContext

const describeRecordingError = (error: unknown): TranslationMessage => {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return { key: 'voiceInputPermissionDenied' }
    }
    if (error.name === 'NotFoundError') {
      return { key: 'voiceInputNoDevice' }
    }
  }
  return { key: 'voiceInputFailed' }
}

/**
 * 语音输入（oneshot）：点击开始录音，再次点击结束并转写，结果交给 onText 填入输入框。
 * 转写中再次点击取消。录满 120 秒自动结束。
 */
export const useVoiceInput = (onText: (text: string) => void) => {
  const status = shallowRef<VoiceInputStatus>('idle')
  const setStatus = (next: typeof status.value) => {
    status.value = next
  }
  const seconds = shallowRef(0)
  const setSeconds = (next: typeof seconds.value) => {
    seconds.value = next
  }
  const recordingRef = shallowRef<Recording | null>(null)
  const controllerRef = shallowRef<AbortController | null>(null)
  const operationRef = shallowRef(0)
  const onTextRef = shallowRef(onText)
  onTextRef.value = onText
  const cancelOperation = () => {
    operationRef.value++
    recordingRef.value?.cancel()
    recordingRef.value = null
    controllerRef.value?.abort()
    controllerRef.value = null
  }
  const cancel = () => {
    cancelOperation()
    setStatus('idle')
  }
  const finish = async () => {
    const recording = recordingRef.value
    if (!recording) {
      // 仍在等待麦克风授权时也允许取消；迟到的录音对象会立即释放。
      cancel()
      return
    }
    const operation = operationRef.value
    recordingRef.value = null
    let controller: AbortController | null = null
    try {
      let audio: Blob | null
      try {
        audio = await recording.stop()
      } finally {
        recording.cancel()
      }
      if (operationRef.value !== operation || !audio) {
        return
      }
      controller = new AbortController()
      controllerRef.value = controller
      setStatus('transcribing')
      const text = await transcribe(useSettingsStore().apiKey ?? '', audio, controller.signal)
      if (controller.signal.aborted || operationRef.value !== operation) {
        return
      }
      if (text.trim()) {
        onTextRef.value(text.trim())
      } else {
        showToast({ key: 'voiceInputEmpty' })
      }
    } catch {
      if (operationRef.value === operation && !controller?.signal.aborted) {
        showToast({ key: 'voiceInputFailed' })
      }
    } finally {
      if (operationRef.value === operation) {
        controllerRef.value = null
        setStatus('idle')
      }
    }
  }
  const toggle = async () => {
    if (!AVAILABLE) {
      return
    }
    if (status.value === 'recording') {
      await finish()
      return
    }
    if (status.value === 'transcribing') {
      cancel()
      return
    }
    const operation = ++operationRef.value
    setStatus('recording')
    try {
      const recording = await startRecording(() => {
        if (operationRef.value === operation) {
          showToast({ key: 'voiceInputLimitReached' })
          void finish()
        }
      })
      if (operationRef.value !== operation) {
        recording.cancel()
        return
      }
      recordingRef.value = recording
    } catch (error) {
      if (operationRef.value === operation) {
        setStatus('idle')
        showToast(describeRecordingError(error))
      }
    }
  }
  watchAfterRender(
    () => {
      if (status.value !== 'recording') {
        return
      }
      const startedAt = Date.now()
      setSeconds(0)
      // 半秒刷新一次，让显示的秒数与实际录音时长保持一致
      const timer = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAt) / 1000))
      }, 500)
      return () => clearInterval(timer)
    },
    () => [status.value]
  )
  watchAfterRender(
    () => cancelOperation,
    () => [cancelOperation]
  )
  const getAnalyser = () => recordingRef.value?.analyser ?? null
  return {
    get status() {
      return status.value
    },
    get seconds() {
      return seconds.value
    },
    getAnalyser,
    toggle,
    cancel,
    available: AVAILABLE,
  }
}
