<template>
  <v-footer color="background" class="border-t py-6 d-flex flex-column align-center">
    <div class="text-caption text-secondary">
      &copy; {{ new Date().getFullYear() }} PC-Fit. All rights reserved.
    </div>
    <div class="text-caption text-muted mt-1">
      당신의 꿈의 PC를 한 줄로 완성하세요
    </div>
  </v-footer>
</template>

<script>
export default {
  name: 'AppFooter'
};
</script>

<style scoped>
.v-footer {
  border-top-color: var(--glass-border) !important;
}
</style>