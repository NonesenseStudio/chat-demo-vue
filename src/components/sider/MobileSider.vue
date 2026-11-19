<script setup lang="ts">
import { computed } from 'vue'
import { useMobileSiderStore } from '@/stores/mobileSider'
import Sider from './Sider.vue'

const sider = useMobileSiderStore()
const open = computed(() => sider.open)
</script>

<template>
  <!-- 移动端抽屉：浮在页面上方，点空白区域关闭。 -->
  <template v-if="open">
    <div class="drawerMask" @click="sider.closeDrawer()" />
    <div class="drawer">
      <Sider mobile />
    </div>
  </template>
</template>

<style scoped>
.drawer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 800;
}

.drawerMask {
  position: absolute;
  inset: 0;
  z-index: 799;
}
</style>
