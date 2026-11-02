<template>
  <v-app>
    <ParticleBackground />
    <AppHeader />
    <v-main>
      <router-view />
    </v-main>
    <AppFooter />
    <CustomToast />
  </v-app>
</template>

<script>
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import CustomToast from '@/components/common/CustomToast.vue';
import ParticleBackground from '@/components/common/ParticleBackground.vue';

export default {
  components: { AppHeader, AppFooter, CustomToast, ParticleBackground },
  computed: {
    isAuthenticated() { return this.$store.state.auth.isAuthenticated; },
    user() { return this.$store.state.auth.user; }
  },
  watch: {
    isAuthenticated(val) {
      if (val && this.user) {
        this.$store.dispatch('socket/connect');
        setTimeout(() => {
          this.$store.dispatch('socket/joinUser', this.user.id);
        }, 500); // Give socket time to connect
        this.$store.dispatch('notifications/fetchNotifications');
      }
    }
  },
  async created() {
    // Render 무료 서버 절전 모드 방지용 10분 주기 헬스체크 핑
    this._keepAliveTimer = setInterval(() => {
      fetch('https://pc-fit.onrender.com/api/health', { mode: 'no-cors' }).catch(() => {});
    }, 10 * 60 * 1000);

    await this.$store.dispatch('auth/checkSession');
    if (this.isAuthenticated && this.user) {
      this.$store.dispatch('socket/connect');
      setTimeout(() => {
        this.$store.dispatch('socket/joinUser', this.user.id);
      }, 500);
      this.$store.dispatch('notifications/fetchNotifications');
    }
  },
  beforeUnmount() {
    if (this._keepAliveTimer) clearInterval(this._keepAliveTimer);
  }
};
</script>

<style>
/* 1. Global Typography: Pretendard */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');

:root {
  --neon-pink: #ff0080;
  --neon-blue: #00d9ff;
  --neon-green: #00ff9d;
  --text-primary: #F8FAFC;   /* Crisp White/Blue-grey */
  --text-secondary: #94A3B8; /* Readable Grey */
  --shadow-neon-pink: 0 0 15px rgba(255, 0, 128, 0.4);
  /* Backward-compatible aliases */
  --neon-cyan: var(--neon-pink);
  --neon-purple: var(--neon-blue);
  --shadow-neon-cyan: var(--shadow-neon-pink);
}

.v-application {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif !important;
  background-color: #0a0e27 !important;
  color: var(--text-primary) !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 2. Text Contrast & Spacing */
h1, h2, h3, h4, h5, h6 {
  color: #FFFFFF !important;
  font-weight: 700 !important;
  letter-spacing: -0.02em !important;
  line-height: 1.3 !important;
}

p {
  color: var(--text-secondary) !important;
  line-height: 1.7 !important;
  font-weight: 400;
}

/* 3. Global Glassmorphism Refinement (GPU Optimized) */
.glass-card {
  background: linear-gradient(145deg, rgba(17, 24, 39, 0.9), rgba(11, 16, 30, 0.94)) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
}

.neon-text-cyan,
.neon-text-pink {
  color: var(--neon-pink) !important;
  text-shadow: 0 0 12px rgba(255, 0, 128, 0.6);
  font-weight: 800;
}

.neon-text-purple,
.neon-text-blue {
  color: var(--neon-blue) !important;
  text-shadow: 0 0 12px rgba(0, 217, 255, 0.6);
  font-weight: 800;
}

/* Scrollbar - Neon Tokyo */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #0a0e27; }
::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #ff0080, #00d9ff); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--neon-pink); }
</style>
