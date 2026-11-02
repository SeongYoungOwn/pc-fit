<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, required: true },
  max: { type: Number, required: true },
  color: { type: String, default: 'cyan' },
  label: { type: String, default: '' },
  unit: { type: String, default: 'W' },
  showText: { type: Boolean, default: true }
});

const percentage = computed(() => {
  if (props.max === 0) return 0;
  return Math.min(100, Math.max(0, (props.value / props.max) * 100));
});

const colorVar = computed(() => `var(--neon-${props.color})`);
</script>

<template>
  <div class="animated-gauge-container">
    <div v-if="showText && label" class="gauge-label">{{ label }}</div>
    <div class="gauge-track">
      <div 
        class="gauge-fill-bar gauge-fill" 
        :style="{ width: percentage + '%', backgroundColor: colorVar }"
      ></div>
    </div>
    <div v-if="showText" class="gauge-value count-up">
      {{ value }}{{ unit }} / {{ max }}{{ unit }}
    </div>
  </div>
</template>

<style scoped>
.animated-gauge-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs, 4px);
}
.gauge-label {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #94a3b8);
}
.gauge-track {
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
}
.gauge-fill-bar {
  height: 100%;
  border-radius: 4px;
}
.gauge-value {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-primary, #ffffff);
  text-align: right;
  font-family: var(--font-mono, monospace);
}
</style>