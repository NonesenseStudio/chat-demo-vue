import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { setupTheme } from '@/composables/useTheme'
import { ensureKatex } from '@/services/markdown/katex'
import '@/assets/styles/theme.css'
import '@/assets/styles/global.css'

ensureKatex()

const app = createApp(App)
app.use(createPinia())
// 主题依赖设置 store，需在 pinia 激活后同步；首屏渲染前应用
setupTheme()
app.mount('#root')
