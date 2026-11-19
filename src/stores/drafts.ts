import { defineStore } from 'pinia'
import type { TranslationMessage } from '@/i18n'
import { createId } from '@/utils/id'
import { isImage, resolveMimeType, validateFiles } from '@/services/attachments'
import { useUploadsStore, type UploadTask } from './uploads'
import type { FileAttachment } from '@/services/chat/types'

export type DraftAttachment = {
  /** 本地标识，也是 IndexedDB 原件与上传任务的 key */
  id: string
  file: File
  isImage: boolean
  previewUrl: string | null
}

export type Draft = { text: string; attachments: DraftAttachment[] }

export const EMPTY_DRAFT: Draft = { text: '', attachments: [] }

export const useDraftsStore = defineStore('drafts', {
  /** 草稿只保存在本次页面的内存中，独立于会话详情缓存；null 是新对话的草稿。 */
  state: () => ({ drafts: new Map<string | null, Draft>() }),
  actions: {
    getDraft(sessionId: string | null): Draft {
      return this.drafts.get(sessionId) ?? EMPTY_DRAFT
    },
    setText(sessionId: string | null, text: string) {
      this.update(sessionId, (draft) => ({ ...draft, text }))
    },
    update(sessionId: string | null, update: (draft: Draft) => Draft) {
      const draft = update(this.drafts.get(sessionId) ?? EMPTY_DRAFT)
      if (draft.text || draft.attachments.length > 0) {
        this.drafts.set(sessionId, draft)
      } else {
        this.drafts.delete(sessionId)
      }
    },
    /** 整批校验通过后才创建预览和开始上传。 */
    addFiles(sessionId: string | null, files: File[], apiKey: string): TranslationMessage | null {
      if (files.length === 0) {
        return null
      }
      const error = validateFiles(files, this.getDraft(sessionId).attachments.length)
      if (error) {
        return error
      }
      const added = files.map((file): DraftAttachment => {
        const image = isImage(resolveMimeType(file))
        return {
          id: createId(),
          file,
          isImage: image,
          previewUrl: image ? URL.createObjectURL(file) : null,
        }
      })
      this.update(sessionId, (draft) => ({
        ...draft,
        attachments: [...draft.attachments, ...added],
      }))
      const uploads = useUploadsStore()
      added.forEach((attachment) => {
        // 上传任务负责记录错误，输入框的附件卡片展示失败及重试入口。
        uploads
          .upload(apiKey, attachment.id, attachment.file, attachment.file.name, attachment.isImage)
          .catch(() => {})
      })
      return null
    },
    retryAttachment(sessionId: string | null, attachmentId: string, apiKey: string) {
      const attachment = this.getDraft(sessionId).attachments.find(
        (item) => item.id === attachmentId
      )
      if (attachment) {
        useUploadsStore()
          .upload(apiKey, attachment.id, attachment.file, attachment.file.name, attachment.isImage)
          .catch(() => {})
      }
    },
    /** 发送按钮和实际提交共用规则：有内容，且全部附件已上传成功。 */
    prepareMessage(
      draft: Draft,
      tasks: Record<string, UploadTask>
    ): {
      text: string
      files: (FileAttachment & { serverId: string; blob: Blob })[]
    } | null {
      const text = draft.text.trim()
      if (!text && draft.attachments.length === 0) {
        return null
      }
      const files: (FileAttachment & { serverId: string; blob: Blob })[] = []
      for (const attachment of draft.attachments) {
        const task = tasks[attachment.id]
        if (task?.status !== 'done' || !task.serverId) {
          return null
        }
        files.push({
          id: attachment.id,
          serverId: task.serverId,
          name: attachment.file.name,
          size: attachment.file.size,
          isImage: attachment.isImage,
          mimeType: resolveMimeType(attachment.file),
          blob: attachment.file,
        })
      }
      return { text, files }
    },
    removeAttachment(sessionId: string | null, attachmentId: string) {
      const attachment = this.getDraft(sessionId).attachments.find(
        (item) => item.id === attachmentId
      )
      if (!attachment) {
        return
      }
      releaseAttachment(attachment, true)
      this.update(sessionId, (draft) => ({
        ...draft,
        attachments: draft.attachments.filter((item) => item.id !== attachmentId),
      }))
    },
    /** 发送成功后原件与 serverId 已交给会话，释放预览但保留上传完成态。 */
    clearSent(sessionId: string | null) {
      this.getDraft(sessionId).attachments.forEach((attachment) =>
        releaseAttachment(attachment, false)
      )
      this.update(sessionId, () => EMPTY_DRAFT)
    },
    /** 删除会话或替换历史成功后，释放尚未发送的草稿及上传任务。 */
    clear(sessionId: string | null) {
      this.getDraft(sessionId).attachments.forEach((attachment) =>
        releaseAttachment(attachment, true)
      )
      this.update(sessionId, () => EMPTY_DRAFT)
    },
    clearAll() {
      for (const draft of this.drafts.values()) {
        draft.attachments.forEach((attachment) => releaseAttachment(attachment, true))
      }
      this.drafts = new Map()
    },
  },
})

const releaseAttachment = (attachment: DraftAttachment, cancel: boolean) => {
  if (cancel) {
    useUploadsStore().cancel(attachment.id)
  }
  if (attachment.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl)
  }
}

/** 便捷读取（非响应式场景） */
export const getDraft = (sessionId: string | null): Draft => useDraftsStore().getDraft(sessionId)
