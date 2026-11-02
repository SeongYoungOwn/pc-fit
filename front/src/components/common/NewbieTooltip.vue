<template>
  <v-tooltip location="top" max-width="350" content-class="newbie-tooltip-content" v-if="isNewbie">
    <template v-slot:activator="{ props }">
      <v-avatar
        v-bind="props"
        size="24"
        class="newbie-tooltip-avatar ml-2 cursor-help"
      >
        <v-icon size="16" color="black">mdi-help</v-icon>
      </v-avatar>
    </template>
    <div class="pa-3 text-white">
      <div class="d-flex align-center mb-2 pb-2 border-b border-opacity-25">
        <v-icon color="#ffd700" size="20" class="mr-2">mdi-lightbulb-on</v-icon>
        <span class="font-weight-black text-subtitle-2" style="color: #ffd700; letter-spacing: 1px;">뉴비 가이드</span>
      </div>
      <div class="text-body-1 font-weight-medium" style="line-height: 1.7; word-break: keep-all;">
        {{ text }}
      </div>
    </div>
  </v-tooltip>
</template>

<script>
export default {
  name: 'NewbieTooltip',
  props: {
    text: {
      type: String,
      required: true
    }
  },
  computed: {
    isNewbie() {
      return this.$store.getters['auth/isNewbie'];
    }
  }
};
</script>

<style>
.newbie-tooltip-avatar {
  background-color: #00f3ff !important;
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.8), 0 0 20px rgba(0, 243, 255, 0.4) !important;
  animation: pulse-glow-avatar 2s infinite ease-in-out;
  transition: transform 0.25s ease, background-color 0.25s ease;
}

.newbie-tooltip-avatar:hover {
  animation: none;
  transform: scale(1.2);
  background-color: #ff0080 !important;
  box-shadow: 0 0 15px rgba(255, 0, 128, 1), 0 0 30px rgba(255, 0, 128, 0.6) !important;
}

.newbie-tooltip-avatar:hover i {
  color: white !important;
}

/* transform 전용 애니메이션 (box-shadow 매 프레임 리페인트 제거) */
@keyframes pulse-glow-avatar {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

.newbie-tooltip-content {
  background: rgba(10, 14, 23, 0.98) !important;
  border: 2px solid #00f3ff !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 243, 255, 0.3) !important;
  border-radius: 12px !important;
  padding: 0 !important; /* v-tooltip default padding override */
}

/* 툴팁 내부 텍스트 선명도 향상 */
.newbie-tooltip-content .text-white {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
</style>
