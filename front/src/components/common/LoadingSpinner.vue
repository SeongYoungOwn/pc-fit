<script setup>
defineProps({
  size: { type: String, default: 'md' },
  color: { type: String, default: 'cyan' }
});
</script>

<template>
  <div :class="['loading-spinner', `size-${size}`]" :style="{ borderTopColor: `var(--neon-${color})` }"></div>
</template>

<style scoped>
.loading-spinner {
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

.size-sm { width: 16px; height: 16px; border-width: 2px; }
.size-md { width: 32px; height: 32px; border-width: 3px; }
.size-lg { width: 48px; height: 48px; border-width: 4px; }
</style>