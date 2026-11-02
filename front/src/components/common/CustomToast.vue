<template>
  <div class="toast-container">
    <TransitionGroup name="toast-list">
      <div 
        v-for="toast in uiStore.toastList" 
        :key="toast.id"
        :class="['toast-item', `toast-${toast.type}`]"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed } from 'vue';

const store = useStore();
const uiStore = computed(() => store.state.ui);
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-item {
  padding: 16px 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  color: #fff;
  font-weight: bold;
  border-left: 4px solid;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.toast-success { border-color: var(--neon-green); }
.toast-error { border-color: var(--neon-red); }
.toast-warning { border-color: var(--neon-yellow); }
.toast-info { border-color: var(--neon-cyan); }

.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s ease;
}
.toast-list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-list-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>