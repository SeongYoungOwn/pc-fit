<template>
  <div class="wattage-gauge-wrapper">
    <AnimatedGauge 
      :value="current" 
      :max="max" 
      :color="gaugeColor" 
      label="예상 전력 소비량" 
    />
  </div>
</template>

<script>
import AnimatedGauge from '@/components/common/AnimatedGauge.vue';

export default {
  name: 'WattageGauge',
  components: { AnimatedGauge },
  props: {
    current: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  computed: {
    gaugeColor() {
      if (this.max === 0) return 'cyan';
      const ratio = this.current / this.max;
      if (ratio > 0.8) return 'red';
      if (ratio > 0.6) return 'yellow';
      return 'cyan';
    }
  }
};
</script>