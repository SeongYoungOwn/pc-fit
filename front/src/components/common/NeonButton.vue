<template>
  <button 
    :class="['neon-btn', `color-${color}`, `size-${size}`]" 
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="spinner"></span>
    <slot v-else></slot>
  </button>
</template>

<script setup>
const props = defineProps({
  color: {
    type: String,
    default: 'cyan'
  },
  size: {
    type: String,
    default: 'md'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const handleClick = (event) => {
  if (props.disabled || props.loading) return;
  emit('click', event);
};
</script>

<style scoped>
.neon-btn {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-family: inherit;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  backdrop-filter: blur(12px);
}

.neon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.size-sm { padding: 4px 8px; font-size: 0.875rem; }
.size-md { padding: 8px 16px; font-size: 1rem; }
.size-lg { padding: 16px 24px; font-size: 1.125rem; }

.color-cyan { border: 1px solid var(--neon-pink); }
.color-cyan:not(:disabled):hover { background: rgba(255, 0, 128, 0.1); }
.color-purple { border: 1px solid var(--neon-blue); }
.color-purple:not(:disabled):hover { background: rgba(0, 217, 255, 0.1); }

.spinner {
  width: 1em;
  height: 1em;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>