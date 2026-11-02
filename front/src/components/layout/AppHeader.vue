<template>
  <v-app-bar 
    color="transparent" 
    elevation="0" 
    class="app-header px-md-10"
    :class="{ 'header-scrolled': isScrolled }"
  >
    <v-container class="d-flex align-center py-0">
      <router-link to="/" class="logo-link d-flex align-center text-decoration-none">
        <v-icon color="primary" icon="mdi-cpu-64-bit" size="large" class="mr-2"></v-icon>
        <h2 class="neon-text-gradient mb-0 font-weight-black tracking-tighter">PC-FIT</h2>
      </router-link>

      <v-spacer></v-spacer>

      <div class="nav-links d-none d-md-flex align-center">
        <v-btn variant="text" to="/builder" class="nav-item mx-1" :active-class="'active-nav'">AI 견적</v-btn>
        <v-btn variant="text" to="/takeoff" class="nav-item mx-1" :active-class="'active-nav'">이륙 심사</v-btn>
      </div>

      <v-spacer class="d-none d-md-flex"></v-spacer>

      <template v-if="isAuthenticated">
        <v-menu location="bottom end" :close-on-content-click="false">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon variant="text" class="mr-2">
              <v-badge
                :content="unreadCount"
                :model-value="unreadCount > 0"
                color="error"
                floating
                offset-x="-5"
                offset-y="-5"
              >
                <v-icon>mdi-bell-outline</v-icon>
              </v-badge>
            </v-btn>
          </template>
          <v-card width="350" class="glass-card mt-2" max-height="400">
            <v-card-title class="text-subtitle-1 font-weight-bold d-flex justify-space-between align-center border-b border-opacity-10 px-4 py-3">
              알림
              <v-btn v-if="unreadCount > 0" size="small" variant="text" color="primary" @click="markAllAsRead">모두 읽음</v-btn>
            </v-card-title>
            <v-card-text class="pa-0" style="overflow-y: auto; max-height: 340px;">
              <div v-if="notifications.length === 0" class="text-center py-6 text-caption text-secondary">
                새로운 알림이 없습니다.
              </div>
              <v-list v-else bg-color="transparent" class="pa-0">
                <v-list-item
                  v-for="notif in notifications"
                  :key="notif.id"
                  @click="handleNotifClick(notif)"
                  class="border-b border-opacity-10 py-3 cursor-pointer"
                  :class="{ 'bg-primary-opacity-10': !notif.is_read }"
                >
                  <template v-slot:prepend>
                    <v-avatar size="36" :color="notif.type === 'approve' ? 'success' : (notif.type === 'reject' ? 'error' : 'primary')" variant="tonal" class="mr-3">
                      <v-icon size="small" :icon="notif.type === 'approve' ? 'mdi-check' : (notif.type === 'reject' ? 'mdi-close' : 'mdi-comment-outline')"></v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-bold mb-1" style="white-space: normal; line-height: 1.4;">
                    {{ notif.message }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption text-secondary">
                    {{ formatDate(notif.created_at) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-menu>

        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="text" class="profile-btn px-2">
              <v-avatar size="32" color="surface-variant" class="mr-2">
                <v-img v-if="user?.profile_image" :src="user.profile_image"></v-img>
                <v-icon v-else icon="mdi-account"></v-icon>
              </v-avatar>
              <span class="d-none d-sm-inline">{{ user?.nickname }}</span>
              <v-icon icon="mdi-chevron-down" size="small"></v-icon>
            </v-btn>
          </template>
          <v-list class="glass-card mt-2 py-2" width="180">
            <v-list-item to="/mypage" prepend-icon="mdi-account-circle-outline">내 정보</v-list-item>
            <v-list-item to="/mypage#mybuilds" prepend-icon="mdi-desktop-classic">내 견적</v-list-item>
            <v-divider class="my-1"></v-divider>
            <v-list-item @click="handleLogout" prepend-icon="mdi-logout" color="error">로그아웃</v-list-item>
          </v-list>
        </v-menu>
      </template>
      <template v-else>
        <v-btn variant="text" to="/auth/login" class="text-none font-weight-bold">로그인</v-btn>
        <v-btn
          variant="flat"
          color="primary"
          to="/auth/login"
          class="signup-btn ml-4 font-weight-bold"
        >
          시작하기
        </v-btn>

      </template>
    </v-container>
  </v-app-bar>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import moment from 'moment';

export default {
  name: 'AppHeader',
  data() {
    return {
      isScrolled: false
    };
  },
  computed: {
    ...mapState('auth', ['isAuthenticated', 'user']),
    ...mapState('notifications', {
      notifications: state => state.items,
      unreadCount: state => state.unreadCount
    })
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    ...mapActions('auth', ['logout']),
    ...mapActions('notifications', ['markAsRead']),
    handleScroll() {
      const next = window.scrollY > 20;
      if (this.isScrolled !== next) {
        this.isScrolled = next;
      }
    },
    async handleLogout() {
      await this.logout();
      this.$router.push('/');
      this.$store.dispatch('ui/showInfo', '로그아웃 되었습니다.');
    },
    formatDate(date) {
      return moment(date).fromNow();
    },
    async handleNotifClick(notif) {
      if (!notif.is_read) {
        await this.markAsRead(notif.id);
      }
      if (notif.build_id) {
        this.$router.push(`/takeoff/${notif.build_id}`);
      }
    },
    async markAllAsRead() {
      await this.markAsRead('all');
    }
  }
};
</script>

<style scoped>
.app-header {
  transition: background-color 0.25s ease, border-color 0.25s ease;
  top: 0;
  z-index: 1000;
}

.header-scrolled {
  background-color: rgba(11, 15, 25, 0.92) !important;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--glass-border) !important;
  height: 64px !important;
}

.logo-link h2 {
  font-size: 1.5rem;
  letter-spacing: -1px;
}

.nav-item {
  font-weight: 600;
  opacity: 0.7;
  transition: all 0.3s ease;
}

.nav-item:hover, .active-nav {
  opacity: 1;
  color: var(--neon-pink) !important;
}

.signup-btn {
  box-shadow: var(--shadow-neon-pink);
  transition: all 0.3s ease;
}

.signup-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(255, 0, 128, 0.6);
}

.profile-btn {
  font-weight: 600;
  border-radius: 12px;
}

.profile-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.tracking-tighter {
  letter-spacing: -0.05em;
}
</style>