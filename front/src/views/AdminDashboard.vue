<template>
  <div class="admin-dashboard">
    <div class="glow-bg"></div>
    <v-container>
      <div class="header-section text-center mb-10">
        <h1 class="neon-text-title d-flex align-center justify-center">
          <v-icon size="40" class="mr-3" color="#ff0080">mdi-shield-crown</v-icon>
          PC-FIT 관리자 대시보드
        </h1>
        <p class="subtitle">시스템 현황 및 API 사용량을 실시간으로 모니터링합니다.</p>
      </div>

      <!-- 상단 통계 카드 (4개) -->
      <v-row class="mb-8">
        <v-col cols="12" md="3">
          <v-card class="stat-card">
            <div class="stat-icon cyan-glow"><v-icon size="36" color="#00f3ff">mdi-account-group</v-icon></div>
            <div class="stat-content">
              <div class="stat-label">총 가입자 수</div>
              <div class="stat-value">{{ stats.totalUsers }}<span class="unit">명</span></div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="stat-card">
            <div class="stat-icon pink-glow"><v-icon size="36" color="#ff0080">mdi-wrench</v-icon></div>
            <div class="stat-content">
              <div class="stat-label">총 생성된 빌드</div>
              <div class="stat-value">{{ stats.totalBuilds }}<span class="unit">개</span></div>
              <div class="stat-sub">+오늘 {{ stats.todayBuilds }}개</div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="stat-card">
            <div class="stat-icon purple-glow"><v-icon size="36" color="#a200ff">mdi-brain</v-icon></div>
            <div class="stat-content">
              <div class="stat-label">총 AI 토큰 사용량</div>
              <div class="stat-value">{{ formatNumber(stats.totalAiTokens) }}</div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="stat-card">
            <div class="stat-icon green-glow"><v-icon size="36" color="#00ff88">mdi-api</v-icon></div>
            <div class="stat-content">
              <div class="stat-label">API 호출 총 횟수</div>
              <div class="stat-value">{{ formatNumber(stats.totalApiCalls) }}<span class="unit">회</span></div>
              <div class="stat-sub">+오늘 {{ stats.todayApiCalls }}회</div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- API 키 현황 섹션 -->
      <h2 class="section-title mb-4"><v-icon color="#00f3ff" class="mr-2">mdi-key-chain</v-icon>API 연동 현황</h2>
      <v-row class="mb-10">
        <v-col cols="12" md="4" v-for="api in apiKeys" :key="api.type">
          <v-card class="api-card">
            <div class="d-flex justify-space-between align-center mb-3">
              <div class="api-name">{{ api.name }}</div>
              <v-chip size="small" :color="api.status === '정상' ? 'success' : 'error'" variant="flat">
                {{ api.status }}
              </v-chip>
            </div>
            <div class="api-key-box mb-3">
              <span class="key-text">{{ api.key }}</span>
            </div>
            <div class="api-stats d-flex justify-space-between">
              <div class="text-center">
                <div class="stat-mini-label">총 호출</div>
                <div class="stat-mini-value">{{ formatNumber(api.stats.total_calls) }}</div>
              </div>
              <div class="text-center">
                <div class="stat-mini-label">오늘 호출</div>
                <div class="stat-mini-value">{{ formatNumber(api.stats.today_calls) }}</div>
              </div>
              <div class="text-center">
                <div class="stat-mini-label">누적 토큰</div>
                <div class="stat-mini-value">{{ formatNumber(api.stats.total_tokens) }}</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- 사용자 관리 테이블 -->
      <h2 class="section-title mb-4"><v-icon color="#ff0080" class="mr-2">mdi-account-details</v-icon>사용자 관리</h2>
      <v-card class="table-card">
        <v-table theme="dark" class="neon-table">
          <thead>
            <tr>
              <th class="text-left"># (ID)</th>
              <th class="text-left">닉네임</th>
              <th class="text-left">아이디</th>
              <th class="text-center">권한/숙련도</th>
              <th class="text-right">AI 토큰 사용량</th>
              <th class="text-center">빌드 수</th>
              <th class="text-right">가입일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td class="font-weight-bold" :class="user.role === 'admin' ? 'text-pink' : ''">
                {{ user.nickname }} <v-icon v-if="user.role === 'admin'" size="small" color="pink">mdi-shield-crown</v-icon>
              </td>
              <td class="text-grey-lighten-1">{{ user.username }}</td>
              <td class="text-center">
                <v-chip size="x-small" :color="user.user_level === 'expert' ? 'purple' : 'cyan'" variant="outlined">
                  {{ user.user_level === 'expert' ? '전문가' : '뉴비' }}
                </v-chip>
              </td>
              <td class="text-right text-cyan font-weight-bold">{{ formatNumber(user.total_tokens) }}</td>
              <td class="text-center">{{ user.total_builds }}</td>
              <td class="text-right text-grey-lighten-1">{{ formatDate(user.created_at) }}</td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="7" class="text-center pa-5 text-grey">사용자 데이터가 없습니다.</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

    </v-container>
  </div>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'AdminDashboard',
  data() {
    return {
      stats: {
        totalUsers: 0,
        totalBuilds: 0,
        totalAiTokens: 0,
        totalApiCalls: 0,
        todayBuilds: 0,
        todayApiCalls: 0
      },
      apiKeys: [],
      users: []
    };
  },
  async created() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const [dashRes, apiRes, userRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/api-usage'),
          api.get('/admin/users')
        ]);
        
        this.stats = dashRes.data.data;
        this.apiKeys = apiRes.data.data;
        this.users = userRes.data.data;
      } catch (err) {
        this.$store.dispatch('ui/showError', '대시보드 데이터를 불러오는 데 실패했습니다.');
        console.error(err);
      }
    },
    formatNumber(num) {
      if (!num) return '0';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    formatDate(dateStr) {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  min-height: calc(100vh - 64px);
  background-color: #050b14;
  position: relative;
  padding: 40px 0;
  color: white;
  z-index: 1;
}

.glow-bg {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: radial-gradient(circle at 20% 30%, rgba(255, 0, 128, 0.05) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(0, 243, 255, 0.05) 0%, transparent 40%);
  pointer-events: none;
  z-index: -1;
}

.neon-text-title {
  color: #fff;
  font-size: 2.5rem;
  font-weight: 900;
  text-shadow: 0 0 20px rgba(255, 0, 128, 0.5);
  letter-spacing: 2px;
}

.subtitle {
  color: #a0aec0;
  font-size: 1.1rem;
  margin-top: 10px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e2e8f0;
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.3);
  display: flex;
  align-items: center;
}

/* Glassmorphism Cards */
.stat-card, .api-card, .table-card {
  background: rgba(15, 23, 42, 0.6) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover, .api-card:hover {
  transform: translateY(-5px);
  border-color: rgba(0, 243, 255, 0.3);
  box-shadow: 0 12px 40px rgba(0, 243, 255, 0.15);
}

/* Stat Cards */
.stat-card {
  display: flex;
  align-items: center;
  padding: 24px;
  height: 100%;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  background: rgba(255,255,255,0.05);
}

.cyan-glow { box-shadow: inset 0 0 20px rgba(0, 243, 255, 0.2), 0 0 15px rgba(0, 243, 255, 0.2); border: 1px solid rgba(0,243,255,0.3); }
.pink-glow { box-shadow: inset 0 0 20px rgba(255, 0, 128, 0.2), 0 0 15px rgba(255, 0, 128, 0.2); border: 1px solid rgba(255,0,128,0.3); }
.purple-glow { box-shadow: inset 0 0 20px rgba(162, 0, 255, 0.2), 0 0 15px rgba(162, 0, 255, 0.2); border: 1px solid rgba(162,0,255,0.3); }
.green-glow { box-shadow: inset 0 0 20px rgba(0, 255, 136, 0.2), 0 0 15px rgba(0, 255, 136, 0.2); border: 1px solid rgba(0,255,136,0.3); }

.stat-label {
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-value {
  color: white;
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1.2;
}

.stat-value .unit {
  font-size: 1rem;
  font-weight: 500;
  color: #64748b;
  margin-left: 4px;
}

.stat-sub {
  color: #10b981;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 4px;
}

/* API Cards */
.api-card {
  padding: 20px;
}

.api-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
}

.api-key-box {
  background: rgba(0,0,0,0.4);
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px dashed rgba(255,255,255,0.2);
  text-align: center;
}

.key-text {
  font-family: monospace;
  color: #00f3ff;
  letter-spacing: 2px;
}

.stat-mini-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 4px;
}

.stat-mini-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e2e8f0;
}

/* Table */
.neon-table {
  background: transparent !important;
}

.neon-table th {
  color: #00f3ff !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(0, 243, 255, 0.2) !important;
}

.neon-table td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  padding: 12px 16px !important;
}

.neon-table tbody tr:hover {
  background: rgba(0, 243, 255, 0.05) !important;
}
</style>
