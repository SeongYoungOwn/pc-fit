<script setup>
defineProps({
  maxTilt: { type: Number, default: 4 },
  glare: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
});
</script>

<template>
  <div class="tilt-card-wrapper h-100" :class="{ 'tilt-enabled': !disabled }">
    <slot></slot>
  </div>
</template>

<style scoped>
.tilt-card-wrapper {
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.tilt-card-wrapper.tilt-enabled:hover {
  transform: translateY(-4px);
}
</style>