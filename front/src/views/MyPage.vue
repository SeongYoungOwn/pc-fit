<template>
  <v-container class="pa-4 pa-md-8">
    <div class="d-flex justify-space-between align-center mb-8 fade-in-up">
      <h2 class="text-h4 font-weight-bold neon-text-cyan mb-0">마이페이지</h2>
      <v-btn v-if="isAdmin" color="#ff0080" variant="elevated" to="/admin" class="font-weight-bold px-6 admin-glow">
        <v-icon left class="mr-2">mdi-shield-crown</v-icon>
        관리자 대시보드
      </v-btn>
    </div>

    <v-row>
      <!-- 회원 정보 관리 -->
      <v-col cols="12" md="4" class="stagger-item">
        <v-card class="glass-card mb-6">
          <v-card-title class="text-h6 font-weight-bold">내 정보</v-card-title>
          <v-card-text>
            <div class="d-flex flex-column align-center mb-6">
              <v-avatar size="100" color="rgba(255,255,255,0.1)" class="mb-4">
                <v-img v-if="user?.profile_image" :src="user.profile_image"></v-img>
                <v-icon v-else size="48">mdi-account</v-icon>
              </v-avatar>
              <div class="text-body-1 text-secondary mb-2">{{ user?.username }}</div>
              <v-chip
                v-if="user?.user_level"
                size="small"
                :color="user.user_level === 'expert' ? 'purple' : 'success'"
                variant="tonal"
                class="font-weight-black"
              >
                {{ user.user_level === 'expert' ? 'HARDWARE EXPERT' : 'COMPUTER NEWBIE' }}
              </v-chip>
            </div>

            <v-text-field
              v-model="nickname"
              label="닉네임"
              variant="outlined"
              append-inner-icon="mdi-pencil"
              disabled
              class="neon-input-field"
            ></v-text-field>
            <!-- Note: Nickname update logic omitted for MVP as per spec, just showing it -->
          </v-card-text>
        </v-card>

        <!-- 내 컴퓨터 정보 -->
        <v-card class="glass-card stagger-item">
          <v-card-title class="text-h6 font-weight-bold d-flex justify-space-between align-center">
            내 컴퓨터 정보
            <div>
              <v-btn size="small" variant="text" icon="mdi-pencil" color="primary" @click="openEditPcDialog"></v-btn>
              <v-icon color="primary">mdi-desktop-classic</v-icon>
            </div>
          </v-card-title>
          <v-card-text>
            <div v-if="user?.my_pc" class="pc-specs-grid">
              <div v-for="(val, key) in user.my_pc" :key="key" class="spec-item d-flex align-center mb-2">
                <v-icon size="small" :color="getSpecColor(key)" class="mr-2">{{ getSpecIcon(key) }}</v-icon>
                <span class="text-caption text-secondary mr-2" style="width: 70px;">{{ getSpecLabel(key) }}</span>
                <span class="text-body-2 font-weight-bold">{{ val || '정보 없음' }}</span>
              </div>
            </div>
            <div v-else class="text-center py-4 text-secondary">
              <p class="text-caption">등록된 컴퓨터 정보가 없습니다.</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 우측 패널 (탭 적용) -->
      <v-col cols="12" md="8" class="stagger-item">
        <v-card class="glass-card h-100 d-flex flex-column">
          <v-tabs v-model="activeTab" bg-color="transparent" color="primary" class="border-b border-opacity-25 px-4 pt-2">
            <v-tab value="builds" class="font-weight-bold text-body-1"><v-icon start class="mr-2">mdi-package-variant</v-icon>내 견적 관리</v-tab>
            <v-tab value="community" class="font-weight-bold text-body-1"><v-icon start class="mr-2">mdi-forum</v-icon>커뮤니티 활동</v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="flex-grow-1">
            <!-- 탭 1: 내 견적 목록 -->
            <v-window-item value="builds">
              <v-card-title class="px-6 pt-6 text-h6 font-weight-bold d-flex justify-space-between align-center">
                저장된 견적
                <v-btn size="small" variant="outlined" color="primary" to="/builder">새 견적 만들기</v-btn>
              </v-card-title>
              <v-card-text class="px-6 pb-6">
                <div v-if="loading" class="text-center py-8">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
                <div v-else-if="myBuilds.length === 0" class="text-center py-12 text-secondary">
                  <v-icon size="48" class="mb-4 opacity-50">mdi-package-variant</v-icon>
                  <p>저장된 견적이 없습니다.</p>
                </div>
                <v-list v-else bg-color="transparent" class="pa-0">
                  <v-list-item
                    v-for="build in myBuilds"
                    :key="build.id"
                    class="mb-3 rounded-lg border border-opacity-25 build-item"
                  >
                    <template v-slot:title>
                      <div class="font-weight-bold text-h6 mb-1">{{ build.title }}</div>
                    </template>
                    <template v-slot:subtitle>
                      <div class="text-primary font-mono mb-1">{{ formatPrice(build.total_price) }}</div>
                      <div class="text-caption text-secondary">{{ formatDate(build.created_at) }}</div>
                    </template>
                    <template v-slot:append>
                      <div class="d-flex flex-column align-end">
                        <v-chip size="small" :color="getStatusColor(build.status)" class="mb-2 font-weight-bold" variant="flat">
                          {{ getStatusText(build.status) }}
                        </v-chip>
                        <div class="d-flex gap-2">
                          <v-btn size="small" variant="text" icon="mdi-eye" @click="loadAndGoToBuilder(build.id)"></v-btn>
                          <v-btn size="small" variant="text" icon="mdi-delete" color="error" @click="deleteBuild(build.id)"></v-btn>
                        </div>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-window-item>

            <!-- 탭 2: 커뮤니티 활동 -->
            <v-window-item value="community">
              <v-card-text class="pa-6">
                <div v-if="loadingComm" class="text-center py-8">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
                <div v-else>
                  <!-- 작성한 글 -->
                  <div class="mb-8">
                    <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
                      <v-icon color="cyan" class="mr-2">mdi-post-outline</v-icon> 내가 쓴 심사글 ({{ myPosts.length }})
                    </div>
                    <div v-if="myPosts.length === 0" class="text-center py-4 text-secondary text-caption bg-surface-variant rounded">
                      작성한 심사글이 없습니다.
                    </div>
                    <v-list v-else bg-color="transparent" class="pa-0">
                      <v-list-item 
                        v-for="post in myPosts" :key="post.id"
                        class="mb-2 rounded border border-opacity-10 build-item cursor-pointer"
                        @click="goToDetail(post.id)"
                      >
                        <template v-slot:title>
                          <div class="font-weight-bold text-body-1">{{ post.title }}</div>
                        </template>
                        <template v-slot:subtitle>
                          <div class="text-caption text-secondary mt-1">
                            {{ formatDate(post.created_at) }} · 추천 {{ post.votes_good || 0 }}
                          </div>
                        </template>
                        <template v-slot:append>
                          <v-icon color="primary" size="small">mdi-chevron-right</v-icon>
                        </template>
                      </v-list-item>
                    </v-list>
                  </div>

                  <!-- 작성한 댓글 -->
                  <div>
                    <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
                      <v-icon color="pink" class="mr-2">mdi-comment-outline</v-icon> 내가 쓴 댓글 ({{ myComments.length }})
                    </div>
                    <div v-if="myComments.length === 0" class="text-center py-4 text-secondary text-caption bg-surface-variant rounded">
                      작성한 댓글이 없습니다.
                    </div>
                    <v-list v-else bg-color="transparent" class="pa-0">
                      <v-list-item 
                        v-for="comment in myComments" :key="comment.id"
                        class="mb-2 rounded border border-opacity-10 build-item cursor-pointer"
                        @click="goToDetail(comment.build_id)"
                      >
                        <template v-slot:title>
                          <div class="text-body-2 text-truncate" style="max-width: 100%;">{{ comment.content }}</div>
                        </template>
                        <template v-slot:subtitle>
                          <div class="text-caption text-secondary mt-1 text-truncate">
                            <v-icon size="12" class="mr-1">mdi-file-document-outline</v-icon>{{ comment.takeoff_posts?.title || '원문 삭제됨' }} · {{ formatDate(comment.created_at) }}
                          </div>
                        </template>
                        <template v-slot:append>
                          <v-icon color="primary" size="small">mdi-chevron-right</v-icon>
                        </template>
                      </v-list-item>
                    </v-list>
                  </div>
                </div>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- 내 PC 수정 다이얼로그 -->
    <v-dialog v-model="editPcDialog" max-width="600">
      <v-card class="glass-card">
        <v-card-title class="text-h5 font-weight-bold pa-6 border-b border-opacity-10 d-flex justify-space-between align-center">
          내 PC 사양 수정
          <v-btn icon="mdi-close" variant="text" @click="closeEditPcDialog"></v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <p class="text-secondary mb-6">현재 사용 중인 PC 부품 정보를 정확하게 입력할수록 AI 추천의 정확도가 올라갑니다.</p>
          <v-form @submit.prevent="saveMyPc">
            <v-row>
              <v-col cols="12" sm="6">
                <v-combobox
                  v-model="editPcForm.cpu"
                  v-model:search="pcSearchInputs.cpu"
                  label="CPU"
                  :items="suggestions.cpu"
                  variant="outlined"
                  class="neon-input-field mb-2"
                  prepend-inner-icon="mdi-cpu-64-bit"
                ></v-combobox>
              </v-col>
              <v-col cols="12" sm="6">
                <v-combobox
                  v-model="editPcForm.gpu"
                  v-model:search="pcSearchInputs.gpu"
                  label="GPU (그래픽카드)"
                  :items="suggestions.gpu"
                  variant="outlined"
                  class="neon-input-field mb-2"
                  prepend-inner-icon="mdi-video-input-component"
                ></v-combobox>
              </v-col>
              <v-col cols="12" sm="6">
                <v-combobox
                  v-model="editPcForm.ram"
                  v-model:search="pcSearchInputs.ram"
                  label="RAM (메모리)"
                  :items="suggestions.ram"
                  variant="outlined"
                  class="neon-input-field mb-2"
                  prepend-inner-icon="mdi-memory"
                ></v-combobox>
              </v-col>
              <v-col cols="12" sm="6">
                <v-combobox
                  v-model="editPcForm.psu"
                  v-model:search="pcSearchInputs.psu"
                  label="파워서플라이"
                  :items="suggestions.psu"
                  variant="outlined"
                  class="neon-input-field mb-2"
                  prepend-inner-icon="mdi-power-plug"
                ></v-combobox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 border-t border-opacity-10">
          <v-spacer></v-spacer>
          <v-btn color="secondary" variant="text" class="font-weight-bold px-6" @click="closeEditPcDialog">취소</v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-6" :loading="savingPc" @click="saveMyPc">저장하기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import api from '@/services/api';
import { formatPrice } from '@/utils/formatPrice';
import moment from 'moment';

export default {
  name: 'MyPage',
  data() {
    return {
      activeTab: 'builds',
      nickname: '',
      myBuilds: [],
      myPosts: [],
      myComments: [],
      loading: true,
      loadingComm: false,
      editPcDialog: false,
      savingPc: false,
      editPcForm: {
        cpu: '',
        gpu: '',
        ram: '',
        psu: ''
      },
      pcSearchInputs: { cpu: '', gpu: '', ram: '', psu: '' },
      pcSearchTimers: { cpu: null, gpu: null, ram: null, psu: null },
      suggestions: {
        cpu: ['AMD Ryzen 7 9800X3D', 'AMD Ryzen 7 7800X3D', 'AMD Ryzen 5 9600X', 'AMD Ryzen 5 7500F', 'Intel Core i5-14600K', 'Intel Core i5-14400F'],
        gpu: ['NVIDIA RTX 5080', 'NVIDIA RTX 5070 Ti', 'NVIDIA RTX 5070', 'NVIDIA RTX 4070 SUPER', 'NVIDIA RTX 4060 Ti', 'NVIDIA RTX 4060', 'AMD RX 7800 XT', '내장그래픽'],
        ram: ['DDR5 32GB (16GBx2)', 'DDR5 64GB (32GBx2)', 'DDR4 16GB (8GBx2)', 'DDR4 32GB (16GBx2)'],
        psu: ['600W', '700W', '750W', '850W', '1000W']
      }
    };
  },
  computed: {
    ...mapState('auth', ['user']),
    isAdmin() {
      return this.$store.getters['auth/isAdmin'];
    }
  },
  watch: {
    activeTab(newTab) {
      if (newTab === 'community' && this.myPosts.length === 0 && this.myComments.length === 0) {
        this.fetchCommunityData();
      }
    },
    'pcSearchInputs.cpu'(val) { this.fetchPartSuggestions('cpu', val); },
    'pcSearchInputs.gpu'(val) { this.fetchPartSuggestions('gpu', val); },
    'pcSearchInputs.ram'(val) { this.fetchPartSuggestions('ram', val); },
    'pcSearchInputs.psu'(val) { this.fetchPartSuggestions('psu', val); }
  },
  mounted() {
    if (this.user) {
      this.nickname = this.user.nickname;
      this.fetchMyBuilds();
    }
  },
  methods: {
    ...mapActions('auth', ['updateMyPc']),
    formatPrice,
    formatDate(date) { return moment(date).format('YYYY-MM-DD HH:mm'); },
    getStatusColor(status) {
      const map = {
        'private': 'grey-darken-2',
        'takeoff_pending': 'warning',
        'approved': 'success',
        'rejected': 'error'
      };
      return map[status] || 'grey';
    },
    getStatusText(status) {
      const map = {
        'private': '비공개',
        'takeoff_pending': '심사중',
        'approved': '이륙허가',
        'rejected': '대기권고'
      };
      return map[status] || status;
    },
    async fetchMyBuilds() {
      this.loading = true;
      try {
        const res = await api.get('builds');
        this.myBuilds = res.data.data;
      } catch (err) {
        this.$store.dispatch('ui/showError', '견적 목록을 불러오지 못했습니다.');
      } finally {
        this.loading = false;
      }
    },
    async fetchCommunityData() {
      this.loadingComm = true;
      try {
        const [postsRes, commentsRes] = await Promise.all([
          api.get('takeoffs/me/posts'),
          api.get('takeoffs/me/comments')
        ]);
        this.myPosts = postsRes.data.data || [];
        this.myComments = commentsRes.data.data || [];
      } catch (err) {
        this.$store.dispatch('ui/showError', '커뮤니티 활동 내역을 불러오지 못했습니다.');
      } finally {
        this.loadingComm = false;
      }
    },
    goToDetail(id) {
      this.$router.push(`/takeoff/${id}`);
    },
    async loadAndGoToBuilder(id) {
      try {
        const res = await api.get(`builds/${id}`);
        this.$store.commit('build/SET_BUILD_FROM_SAVED', res.data.data);
        this.$router.push('/builder/result');
      } catch (err) {
        this.$store.dispatch('ui/showError', '견적을 불러오지 못했습니다.');
      }
    },
    async deleteBuild(id) {
      if (confirm('정말로 이 견적을 삭제하시겠습니까?')) {
        try {
          await api.delete(`builds/${id}`);
          this.myBuilds = this.myBuilds.filter(b => b.id !== id);
          this.$store.dispatch('ui/showSuccess', '삭제되었습니다.');
        } catch (err) {
          this.$store.dispatch('ui/showError', '삭제 실패');
        }
      }
    },
    getSpecIcon(key) {
      const icons = {
        cpu: 'mdi-cpu-64-bit',
        gpu: 'mdi-video-input-component',
        ram: 'mdi-memory',
        motherboard: 'mdi-circuit-board',
        storage: 'mdi-harddisk',
        psu: 'mdi-power-plug'
      };
      return icons[key] || 'mdi-help-circle';
    },
    getSpecLabel(key) {
      const labels = {
        cpu: 'CPU',
        gpu: 'GPU',
        ram: 'RAM',
        motherboard: '메인보드',
        storage: '저장장치',
        psu: '파워'
      };
      return labels[key] || key;
    },
    getSpecColor(key) {
      const colors = {
        cpu: 'blue',
        gpu: 'green',
        ram: 'purple',
        motherboard: 'orange',
        storage: 'red',
        psu: 'yellow'
      };
      return colors[key] || 'grey';
    },
    openEditPcDialog() {
      if (this.user?.my_pc) {
        this.editPcForm = { ...this.user.my_pc };
      }
      this.editPcDialog = true;
    },
    fetchPartSuggestions(type, keyword) {
      if (!keyword || keyword.trim().length < 2) return;
      if (this.pcSearchTimers[type]) clearTimeout(this.pcSearchTimers[type]);
      this.pcSearchTimers[type] = setTimeout(async () => {
        try {
          const res = await api.get('search/parts-db', { params: { type, keyword: keyword.trim() } });
          if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
            this.suggestions[type] = res.data.data.map(item => item.name);
          }
        } catch (err) {
          console.error(`MyPage autocomplete error for ${type}:`, err);
        }
      }, 300);
    },
    closeEditPcDialog() {
      this.editPcDialog = false;
    },
    async saveMyPc() {
      this.savingPc = true;
      try {
        await this.updateMyPc(this.editPcForm);
        this.closeEditPcDialog();
      } catch (error) {
        // 에러 처리는 action에서 함
      } finally {
        this.savingPc = false;
      }
    }
  }
};
</script>

<style scoped>
.pc-specs-grid {
  display: flex;
  flex-direction: column;
}
.spec-item {
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}
.build-item {
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.2s;
}
.build-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
.font-mono {
  font-family: var(--font-mono);
}
.gap-2 { gap: 8px; }
.admin-glow {
  box-shadow: 0 0 15px rgba(255, 0, 128, 0.4);
  animation: pulse-pink 2s infinite;
}
@keyframes pulse-pink {
  0% { box-shadow: 0 0 15px rgba(255, 0, 128, 0.4); }
  50% { box-shadow: 0 0 25px rgba(255, 0, 128, 0.8); }
  100% { box-shadow: 0 0 15px rgba(255, 0, 128, 0.4); }
}
</style>