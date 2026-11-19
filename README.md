# chat-demo-vue

English | [简体中文](README.zh-CN.md)

A static chat demo built with Vue 3, TypeScript, and Vite. The browser connects directly to the configured DeepSeek API service.

GitHub Pages is currently unconfigured. Run the project locally using the steps below. Enter your DeepSeek API key in Settings before your first chat.

## Getting started

Use Node.js 24 and pnpm 12, as in the repository workflow.

```sh
git clone https://github.com/NonesenseStudio/chat-demo-vue.git
cd chat-demo-vue
pnpm install
pnpm dev
```

Open http://localhost:8090.

To build the static site:

```sh
pnpm build
```

Deploy `dist/` to a static web server or run `pnpm preview` to check it locally. To build a release archive, run `pnpm build:standalone` and package `dist-standalone/`. Extract the archive and open `index.html`. This requires browser support for storage on `file://` pages and an API service that permits their cross-origin requests.

## Features

- Multiple conversations with automatic titles, renaming, and deletion; edit prompts, regenerate replies, and switch between message branches.
- Streaming replies, deep thinking, smart search, link reading, and source citations; stop generation or continue eligible replies.
- Upload, paste, or drag and drop attachments; use voice input and read replies aloud. A live audio spectrum appears in the first row of the input area while recording on mobile.
- Markdown, syntax highlighting, KaTeX math, and Mermaid diagrams.
- Simplified Chinese and English, light and dark themes, mobile layouts, location settings, and chat history import and export.

## Data and storage

Your API key and settings are stored in the browser's localStorage. Conversations and original attachments are stored in IndexedDB. Local data is isolated by browser profile and site origin. Sending messages, uploading attachments, and using speech features sends the relevant content to the configured API service.

History import and export in Settings use ZIP archives. After confirmation and successful validation, importing replaces all local conversations and attachments. Exports include conversations and locally available original images, but exclude API keys, settings, and original non-image attachments. See the [history import/export documentation (Chinese)](src/services/chat/history/README.md) for the archive format and preservation details.

Settings → Data → Delete all chats clears all local conversations, original attachments, and unsent drafts after confirmation. It stops ongoing replies and returns to a new chat. Your API key and settings are preserved; files already uploaded to the API service are not deleted.

## Development

| Command                 | Description                   |
| ----------------------- | ----------------------------- |
| `pnpm dev`              | Start the development server  |
| `pnpm build`            | Build into `dist/`            |
| `pnpm build:standalone` | Build into `dist-standalone/` |
| `pnpm preview`          | Preview the production build  |
| `pnpm type`             | Run TypeScript type checks    |
| `pnpm lint`             | Lint with oxlint              |
| `pnpm format`           | Format with oxfmt             |

[vite.config.ts](vite.config.ts) uses `https://api.deepseek.com` by default. Set `VITE_API_ORIGIN` to override it. Set `VITE_API_ORIGIN=/api` and `VITE_PROXY_TARGET` to the upstream URL to use the development proxy. Deployments can set `VITE_BASE_PATH` to the site subpath.

Chat uses `deepseek-flash` by default through Anthropic-compatible Messages / Files APIs. Speech features use ASR / TTS endpoints. Requests include extensions for search, link reading, titles, and `latest_reminder`, so the configured service must support the corresponding capabilities. Supported attachment formats are determined by server-side validation.

```text
src/
  App.vue              Root component
  main.ts              Application entry point
  assets/styles/       Shared styles and theme variables
  layouts/             Chat layout
  composables/         Shared Vue logic
  stores/              Pinia state
  components/          Chat, settings, Markdown, and other UI components
  i18n/                English and Chinese translations
  services/
    api/               API requests, SSE, and protocol types
    chat/              Conversations, message branches, storage, and history import/export
    markdown/          Markdown parsing, syntax highlighting, and diagrams
    speech/            Audio recording
  utils/               Shared utilities
```

## License

[MIT](LICENSE). The build copies the license to `dist/LICENSE`; include it when distributing the app. Third-party dependencies are subject to their own licenses.
