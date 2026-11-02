<template>
  <v-alert
    v-if="warnings && warnings.length > 0"
    :type="hasError ? 'error' : 'warning'"
    variant="outlined"
    border="start"
    class="mb-4"
    :class="hasError ? 'neon-blink-red' : ''"
  >
    <template v-slot:title>
      <div class="font-weight-bold">
        {{ hasError ? '호환성 오류' : '호환성 주의' }}
      </div>
    </template>
    <ul class="mt-2 pl-4">
      <li v-for="(warn, i) in warnings" :key="i" class="text-body-2 mb-1">
        {{ warn.message }}
      </li>
    </ul>
  </v-alert>
</template>

<script>
export default {
  name: 'CompatibilityAlert',
  props: {
    warnings: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    hasError() {
      return this.warnings.some(w => w.severity === 'error');
    }
  }
};
</script>