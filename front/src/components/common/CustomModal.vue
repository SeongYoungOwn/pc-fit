<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
        <div :class="['modal-content', 'glass-card', `size-${size}`]">
          <header class="modal-header">
            <h3 class="text-h6 text-primary">{{ title }}</h3>
            <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
          </header>
          <div class="modal-body">
            <slot></slot>
          </div>
          <footer class="modal-footer" v-if="$slots.footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  title: String,
  size: { type: String, default: 'md' }
});

const emit = defineEmits(['close']);

const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
};

onMounted(() => window.addEventListener('keydown', handleEscape));
onUnmounted(() => window.removeEventListener('keydown', handleEscape));
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.modal-content {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  background: var(--bg-surface, #111827);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
}

.size-sm { width: 400px; }
.size-md { width: 600px; }
.size-lg { width: 900px; }

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-content { animation: slideInFromTop 0.3s ease-out; }

@keyframes slideInFromTop {
  from { opacity: 0; transform: translateY(-20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>