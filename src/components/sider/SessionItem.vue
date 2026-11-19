<script setup lang="ts">
import { computed, ref } from 'vue'
import { watchAfterRender } from '@/composables/watchAfterRender'
import { useTranslate } from '@/i18n'
import {
  IconEditOutline16,
  IconEllipsisOutline16,
  IconTrashOutline16,
} from '@/components/base/icons'
import { useChatStore } from '@/stores/chat'
import type { SessionSummary } from '@/services/chat/types'
import IconButton from '@/components/base/IconButton.vue'
import Menu from '@/components/base/Menu.vue'
import { useMobileSiderStore } from '@/stores/mobileSider'

const props = defineProps<{
  session: SessionSummary
  active: boolean
}>()

const emit = defineEmits<{ delete: [] }>()

const t = useTranslate()
const chat = useChatStore()
const mobileSider = useMobileSiderStore()

const editing = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)
watchAfterRender(
  () => titleInput.value?.focus(),
  () => [editing.value]
)

const displayTitle = computed(() => props.session.title || t('untitledChat'))

const finishRename = (title: string) => {
  editing.value = false
  if (title.trim() && title.trim() !== displayTitle.value) {
    chat.renameSession(props.session.id, title.trim())
  }
}

const selectOnFocus = (event: FocusEvent) => (event.currentTarget as HTMLInputElement).select()

const renameKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.isComposing) {
    finishRename((event.currentTarget as HTMLInputElement).value)
  } else if (event.key === 'Escape') {
    editing.value = false
  }
}

const options = computed(() => [
  {
    key: 'rename',
    label: t('sessionItemMenuRenameOption'),
    icon: IconEditOutline16,
    onSelect: () => {
      editing.value = true
    },
  },
  {
    key: 'delete',
    label: t('delete'),
    icon: IconTrashOutline16,
    danger: true,
    onSelect: () => emit('delete'),
  },
])

const select = () => {
  chat.selectSession(props.session.id)
  mobileSider.closeDrawer()
}
</script>

<template>
  <input
    v-if="editing"
    ref="titleInput"
    class="renameInput"
    :value="displayTitle"
    @focus="selectOnFocus"
    @blur="finishRename(($event.currentTarget as HTMLInputElement).value)"
    @keydown="renameKeydown"
  />
  <div v-else :class="['item', { active }]" @click="select">
    <div class="title">{{ displayTitle }}</div>
    <div class="action" @click.stop>
      <Menu :options="options">
        <template #default="{ toggle }">
          <IconButton :aria-label="t('more')" @click="toggle">
            <IconEllipsisOutline16 />
          </IconButton>
        </template>
      </Menu>
    </div>
  </div>
</template>

<style scoped>
.item {
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: 40px;
  padding: 9px 6px 9px 10px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
}

.item.active {
  background-color: var(--dsw-specific-sidebar-nav-item-active-accent);
  color: var(--dsw-alias-brand-primary-invert);
}

@media (hover: hover) {
  .item:not(.active):hover {
    background-color: var(--dsw-specific-sidebar-nav-item-hover);
  }

  .item:hover .action,
  .item.active .action {
    display: flex;
  }
}

.title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 18px;
}

.action {
  display: none;
  flex-shrink: 0;
  margin-left: 4px;
}

.renameInput {
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-brand-primary);
  background-color: var(--dsw-specific-input-major);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 14px;
  outline: none;
}

@media (hover: none) {
  .action {
    display: flex;
  }
}

@media not all and (min-width: 768px) {
  .item {
    height: 44px;
    padding: 11px 6px 11px 12px;
    border-radius: 16px;
    font-size: 16px;
  }

  .title {
    line-height: 22px;
  }

  .renameInput {
    height: 44px;
    padding: 0 12px;
    border-radius: 16px;
    font-size: 16px;
  }
}
</style>
