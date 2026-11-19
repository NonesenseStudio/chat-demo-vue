import { defineStore } from 'pinia'
import {
  describeUploadError,
  describeUploadQuota,
  getUploadPurpose,
} from '@/services/attachments'
import { isRetryableApiError } from '@/services/api/errors'
import { uploadFile } from '@/services/api/client'
import type { LinkedMessage, TranslationMessage } from '@/i18n'

/**
 * 上传任务按附件的本地 id 登记：输入框选中即开始上传，全部成功后携带 serverId 发送，
 * 不会重复上传；导入的历史附件没有任务，发送前按本地原件补传。
 * 任务只在内存里，历史附件补传未完成时，刷新后会在下次请求前重新上传。
 */
export type UploadTask =
  | { status: 'uploading' }
  | { status: 'done'; serverId: string }
  | { status: 'error'; error: TranslationMessage; retryable: boolean }

type NoticeListener = (notice: LinkedMessage) => void
const noticeListeners = new Set<NoticeListener>()

/** 订阅需要额外提示的上传失败（配额达到上限），由界面层转成 toast */
export const onUploadNotice = (listener: NoticeListener) => {
  noticeListeners.add(listener)
  return () => {
    noticeListeners.delete(listener)
  }
}

/** 同时上传的文件数 */
const MAX_CONCURRENT = 3

type Job = () => Promise<void>
const queue: Job[] = []
let running = 0

const next = () => {
  while (running < MAX_CONCURRENT) {
    const job = queue.shift()
    if (!job) {
      return
    }
    running++
    void job().finally(() => {
      running--
      next()
    })
  }
}

/** 排队上传，最多同时上传 MAX_CONCURRENT 个；排队期间中止的任务不会发出请求 */
const enqueueUpload = (
  apiKey: string,
  file: Blob,
  name: string,
  isImage: boolean,
  signal: AbortSignal
) =>
  new Promise<string>((resolve, reject) => {
    queue.push(async () => {
      if (signal.aborted) {
        reject(signal.reason)
        return
      }
      try {
        const body = file instanceof File ? file : new File([file], name, { type: file.type })
        resolve((await uploadFile(apiKey, body, getUploadPurpose(name, isImage), signal)).id)
      } catch (error) {
        reject(error)
      }
    })
    next()
  })

export const useUploadsStore = defineStore('uploads', {
  state: (): { tasks: Record<string, UploadTask> } => ({ tasks: {} }),
  actions: {
    setTask(id: string, task: UploadTask | null) {
      this.tasks = task
        ? { ...this.tasks, [id]: task }
        : Object.fromEntries(Object.entries(this.tasks).filter(([key]) => key !== id))
    },
    /** 开始（或复用进行中的）上传，返回服务端 file_id；失败时任务记为 error 并抛出原错误 */
    upload(apiKey: string, id: string, blob: Blob, name: string, isImage: boolean): Promise<string> {
      const pending = pendingUploads.get(id)
      if (pending) {
        return pending.promise
      }
      const controller = new AbortController()
      this.setTask(id, { status: 'uploading' })
      const promise = enqueueUpload(apiKey, blob, name, isImage, controller.signal)
        .then((serverId) => {
          this.setTask(id, { status: 'done', serverId })
          return serverId
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            this.setTask(id, null)
          } else {
            this.setTask(id, {
              status: 'error',
              error: describeUploadError(error),
              retryable: isRetryableApiError(error),
            })
            const notice = describeUploadQuota(error)
            if (notice) {
              for (const listener of noticeListeners) {
                listener(notice)
              }
            }
          }
          throw error
        })
        .finally(() => pendingUploads.delete(id))
      pendingUploads.set(id, { promise, controller })
      return promise
    },
    cancel(id: string) {
      pendingUploads.get(id)?.controller.abort()
      this.setTask(id, null)
    },
  },
})

const pendingUploads = new Map<string, { promise: Promise<string>; controller: AbortController }>()
