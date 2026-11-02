<template>
  <div class="w-100">
    <div class="d-flex gap-4 w-100">
      <v-btn
        color="success"
        :variant="userVote === 'approve' ? 'flat' : 'outlined'"
        class="flex-grow-1 font-weight-bold"
        size="x-large"
        :disabled="loading"
        :loading="loading && activeVote === 'approve'"
        @click="handleVote('approve')"
      >
        <v-icon left class="mr-2">{{ userVote === 'approve' ? 'mdi-check-circle' : 'mdi-airplane-takeoff' }}</v-icon>
        이륙 허가
      </v-btn>
      
      <v-btn
        color="error"
        :variant="userVote === 'reject' ? 'flat' : 'outlined'"
        class="flex-grow-1 font-weight-bold"
        size="x-large"
        :disabled="loading"
        :loading="loading && activeVote === 'reject'"
        @click="handleVote('reject')"
      >
        <v-icon left class="mr-2">{{ userVote === 'reject' ? 'mdi-check-circle' : 'mdi-timer-sand' }}</v-icon>
        대기 권고
      </v-btn>
    </div>

    <div v-if="userVote" class="text-caption text-center mt-2 text-secondary">
      현재 <strong :class="userVote === 'approve' ? 'text-success' : 'text-error'">{{ userVote === 'approve' ? '이륙 허가' : '대기 권고' }}</strong>에 투표하셨습니다. (같은 버튼 클릭 시 취소, 반대 버튼 클릭 시 변경)
    </div>
  </div>
</template>

<script>
export default {
  name: 'VoteButtons',
  props: {
    buildId: { type: [Number, String], required: true },
    isOwner: { type: Boolean, default: false },
    hasVoted: { type: Boolean, default: false },
    userVote: { type: String, default: null }
  },
  data() {
    return {
      loading: false,
      activeVote: null
    };
  },
  methods: {
    handleVote(type) {
      this.activeVote = type;
      this.loading = true;
      this.$emit('vote', type, () => {
        this.loading = false;
        this.activeVote = null;
      });
    }
  }
};
</script>

<style scoped>
.gap-4 { gap: 16px; position: relative; }
</style>