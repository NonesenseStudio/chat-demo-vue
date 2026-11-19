# chat-demo-vue

[English](README.md) | 简体中文

基于 Vue 3、TypeScript 和 Vite 的静态聊天示例。浏览器直接请求配置的 DeepSeek API 服务。

此仓库暂未配置 GitHub Pages。可按下方步骤在本地运行，首次使用时请在设置中填写 DeepSeek API Key。

## 运行

请使用与仓库工作流一致的 Node.js 24 和 pnpm 12。

```sh
git clone https://github.com/NonesenseStudio/chat-demo-vue.git
cd chat-demo-vue
pnpm install
pnpm dev
```

打开 http://localhost:8090 。

生成静态产物：

```sh
pnpm build
```

将 `dist/` 部署到静态服务器，或运行 `pnpm preview` 在本地预览。制作解压包时，运行 `pnpm build:standalone` 并打包 `dist-standalone/`。解压后双击 `index.html`，浏览器和 API 服务需允许 `file://` 页面的存储与跨域请求。

## 功能

- 多会话、自动标题、重命名与删除；编辑提问、重新生成和切换消息分支。
- 流式回答、深度思考、智能搜索、链接阅读与来源引用；支持停止和符合条件的继续生成。
- 附件上传、粘贴与拖拽，语音输入和回复朗读；移动端录音时输入框首行显示实时频谱。
- Markdown、代码高亮、KaTeX 公式和 Mermaid 图表。
- 简体中文与英文、浅色与深色主题、移动端布局、位置设置、历史导入导出。

## 数据

API Key 和设置保存在浏览器 localStorage，会话及附件原件保存在 IndexedDB，本地数据按浏览器用户配置和站点源（origin）隔离。发送对话、上传附件和使用语音功能时，相应内容会提交给配置的 API 服务。

设置中的历史导入导出使用 ZIP 格式。导入会在确认并校验成功后替换全部本地会话和附件；导出包含会话与本地可用的图片原件，不包含 API Key、设置或非图片附件原件。格式与保留范围见[历史导入导出](src/services/chat/history/README.md)。

设置 → 数据管理 → 删除所有对话，会在确认后清空全部本地会话、附件原件和未发送的草稿，停止正在生成的回复并回到新对话。API Key 和其他设置保留，已上传到 API 服务的文件不受影响。

## 开发

| 命令                    | 用途                      |
| ----------------------- | ------------------------- |
| `pnpm dev`              | 启动开发服务器            |
| `pnpm build`            | 构建到 `dist/`            |
| `pnpm build:standalone` | 构建到 `dist-standalone/` |
| `pnpm preview`          | 预览生产构建              |
| `pnpm type`             | TypeScript 类型检查       |
| `pnpm lint`             | oxlint 检查               |
| `pnpm format`           | oxfmt 格式化              |

[vite.config.ts](vite.config.ts) 默认连接 `https://api.deepseek.com`，可用 `VITE_API_ORIGIN` 指定其他地址。使用开发代理时，将 `VITE_API_ORIGIN` 设为 `/api`，将 `VITE_PROXY_TARGET` 设为上游地址。部署到站点子路径时，可设置 `VITE_BASE_PATH`。

聊天默认使用 `deepseek-flash`，通过 Anthropic 兼容的 Messages / Files API 通信；语音使用 ASR / TTS 接口。请求使用搜索、链接阅读、标题和 `latest_reminder` 等扩展，接入服务需支持相应能力。附件实际支持的格式以服务端校验为准。

```text
src/
  App.vue              根组件
  main.ts              应用入口
  assets/styles/       全局样式与主题变量
  layouts/             聊天布局
  composables/         Vue 组合式函数
  stores/              Pinia 状态
  components/          聊天、设置、Markdown 等界面组件
  i18n/                中英文文案
  services/
    api/               API 请求、SSE 与协议类型
    chat/              会话、消息分支、本地存储与历史导入导出
    markdown/          Markdown 解析、代码高亮与图表
    speech/            录音
  utils/               通用工具
```

## 许可证

[MIT](LICENSE)。构建会将许可证复制到 `dist/LICENSE`，分发时请一并保留；第三方依赖遵循各自的许可证。
