<template>
  <div :class="['glass-card', { 'hoverable': hoverable }]" :style="{ padding }">
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  padding: {
    type: String,
    default: '24px'
  },
  hoverable: {
    type: Boolean,
    default: true
  }
});
</script>

<style scoped>
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  transition: background 0.3s, border-color 0.3s;
}
.glass-card.hoverable:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 0, 128, 0.2);
}
</style>