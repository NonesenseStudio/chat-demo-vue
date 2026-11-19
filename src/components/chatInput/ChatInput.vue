<script setup lang="ts">
import ChatInputField from './ChatInputField.vue'

const props = defineProps<{
  sessionId: string | null
}>()

/** 输入框：自适应高度的文本框 + 文件 + 深度思考与智能搜索开关 + 语音输入 + 发送 / 停止 */
</script>

<template>
  <ChatInputField
    :key="props.sessionId === null ? 'new' : `session:${props.sessionId}`"
    :session-id="props.sessionId"
  />
</template>
