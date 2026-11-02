<template>
  <div class="not-found d-flex flex-column align-center justify-center text-center">
    <h1 class="neon-text-cyan font-weight-bold" style="font-size: 8rem;">404</h1>
    <p class="text-h5 text-secondary mb-8">페이지를 찾을 수 없습니다.</p>
    <v-btn color="primary" size="x-large" to="/" variant="outlined">
      홈으로 돌아가기
    </v-btn>
  </div>
</template>

<script>
export default {
  name: 'NotFoundPage'
};
</script>

<style scoped>
.not-found {
  min-height: 60vh;
}
</style>