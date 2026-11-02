<template>
  <v-container class="pa-4 pa-md-8">
    <div v-if="loading && !build" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    
    <template v-else-if="build">
      <div class="d-flex align-center mb-6 fade-in-up">
        <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" class="mr-4"></v-btn>
        <h2 class="text-h4 font-weight-bold neon-text-cyan">{{ build.title }}</h2>
        <v-spacer></v-spacer>
        <v-btn v-if="isAdmin || isOwner" color="error" variant="outlined" @click="deletePost" class="font-weight-bold ml-4">
          <v-icon left class="mr-1">mdi-delete</v-icon> 게시글 삭제
        </v-btn>
      </div>

      <v-row>
        <!-- 좌측: 부품 정보 (Readonly) -->
        <v-col cols="12" lg="8" class="stagger-item">
          <div class="parts-grid mb-6">
            <PartCard 
              v-for="type in partTypes" 
              :key="type"
              :part-type="type"
              :part-data="build.parts[type]"
              :readonly="false"
            />
          </div>
        </v-col>

        <!-- 우측: 작성자 정보 및 투표 패널 -->
        <v-col cols="12" lg="4" class="stagger-item">
          <v-card class="glass-card mb-6">
            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-avatar size="48" color="rgba(255,255,255,0.1)" class="mr-4">
                  <v-img v-if="build.users?.profile_image" :src="build.users.profile_image"></v-img>
                  <v-icon v-else size="24">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ build.users?.nickname || '익명' }}</div>
                  <div class="text-caption text-secondary">{{ formatDate(build.created_at) }} 작성</div>
                </div>
                <v-spacer></v-spacer>
                <div class="text-caption text-secondary">
                  <v-icon size="small" class="mr-1">mdi-eye</v-icon>{{ build.hits }}
                </div>
              </div>
              
              <v-divider class="my-4 border-opacity-25"></v-divider>
              
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-1">총 가격</span>
                <span class="text-h5 font-weight-bold neon-text-cyan font-mono">
                  {{ formatPrice(build.build_snapshot?.totalPrice || 0) }}
                </span>
              </div>
              <div class="d-flex justify-space-between align-center">
                <span class="text-body-1">예상 전력</span>
                <span class="text-body-1 font-weight-bold font-mono">
                  {{ build.build_snapshot?.totalWattage || 0 }}W
                </span>
              </div>
            </v-card-text>
          </v-card>

          <!-- 투표 패널 -->
          <v-card class="glass-gradient-border">
            <h3 class="text-h6 font-weight-bold mb-4 text-center d-flex align-center justify-center">
              심사 결과
              <NewbieTooltip text="커뮤니티의 전문가들이 내 견적이 완벽하면 '이륙 허가🚀', 문제가 있으면 '이륙 대기🚧'를 줍니다." />
            </h3>
            
            <div class="d-flex justify-space-between text-caption font-weight-bold mb-1">
              <span class="text-success"><v-icon size="small" class="mr-1">mdi-thumb-up</v-icon>{{ build.votes_good }}</span>
              <span class="text-error">{{ build.votes_bad }}<v-icon size="small" class="ml-1">mdi-thumb-down</v-icon></span>
            </div>
            
            <v-progress-linear
              :model-value="approvePercentage"
              color="success"
              bg-color="error"
              height="12"
              rounded
              class="mb-6"
            ></v-progress-linear>

            <VoteButtons 
              :build-id="build.id"
              :is-owner="isOwner"
              :has-voted="!!userVote"
              :user-vote="userVote"
              @vote="submitVote"
            />
          </v-card>
        </v-col>
      </v-row>

      <!-- 댓글 섹션 (훈수) -->
      <v-row class="mt-8">
        <v-col cols="12">
          <div class="section-label mb-6 d-flex align-center">
            <v-icon color="secondary" class="mr-2">mdi-comment-text-multiple-outline</v-icon>
            <span class="text-h6 font-weight-bold text-uppercase tracking-widest text-secondary d-flex align-center">
              전문가 훈수 ({{ comments.length }})
              <NewbieTooltip text="컴퓨터 고인물(전문가) 유저들이 내 견적에 대해 조언이나 피드백을 남겨주는 공간입니다." />
            </span>
            <v-divider class="ml-4 border-opacity-15"></v-divider>
          </div>

          <v-card class="glass-card mb-8">
            <v-card-text class="pa-6">
              <v-form v-if="isAuthenticated" @submit.prevent="submitComment">
                <v-textarea
                  v-model="newComment"
                  placeholder="이 견적에 대해 전문가로서 한마디 남겨주세요!"
                  variant="outlined"
                  rows="3"
                  hide-details
                  class="neon-input-field mb-4"
                ></v-textarea>
                <div class="d-flex justify-end">
                  <v-btn 
                    color="secondary" 
                    variant="flat" 
                    class="font-weight-bold px-8" 
                    :loading="submittingComment"
                    :disabled="!newComment.trim()"
                    @click="submitComment"
                  >
                    훈수 두기
                  </v-btn>
                </div>
              </v-form>
              <div v-else class="text-center py-6">
                <p class="text-secondary mb-4">로그인한 유저만 댓글을 달 수 있습니다.</p>
                <v-btn color="primary" variant="tonal" :to="{ name: 'Login', query: { redirect: $route.fullPath } }">로그인하러 가기</v-btn>
              </div>
            </v-card-text>
          </v-card>

          <div v-if="comments.length > 0" class="d-flex flex-column gap-4">
            <v-card v-for="comment in comments" :key="comment.id" class="glass-card-strong pa-4">
              <div class="d-flex align-start">
                <v-avatar size="40" color="rgba(255,255,255,0.05)" class="mr-4">
                  <v-img v-if="comment.users?.profile_image" :src="comment.users.profile_image"></v-img>
                  <v-icon v-else size="20">mdi-account</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <div class="d-flex align-center">
                      <span class="font-weight-bold mr-2">{{ comment.users?.nickname || '익명' }}</span>
                      <v-chip size="x-small" :color="comment.users?.user_level === 'expert' ? 'secondary' : 'grey'" class="font-weight-bold px-2">
                        {{ comment.users?.user_level === 'expert' ? 'EXPERT' : 'NEWBIE' }}
                      </v-chip>
                    </div>
                    <div>
                      <span class="text-caption text-secondary">{{ formatDate(comment.created_at) }}</span>
                      <v-btn v-if="isAdmin || (user && comment.user_id === user.id)" color="error" variant="text" size="small" class="ml-2" @click="deleteComment(comment.id)">삭제</v-btn>
                    </div>
                  </div>
                  <p class="text-body-1 text-high-contrast mb-0">{{ comment.content }}</p>
                </div>
              </div>
            </v-card>
          </div>
          <div v-else class="text-center py-12 text-secondary">
             <v-icon size="48" class="mb-2 opacity-20">mdi-comment-off-outline</v-icon>
             <p>아직 등록된 훈수가 없습니다. 첫 번째 훈수를 남겨보세요!</p>
          </div>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import api from '@/services/api';
import PartCard from '@/components/domain/PartCard.vue';
import VoteButtons from '@/components/domain/VoteButtons.vue';
import { formatPrice } from '@/utils/formatPrice';
import moment from 'moment';
import { mapState, mapActions } from 'vuex';

export default {
  name: 'TakeoffDetailPage',
  components: { PartCard, VoteButtons },
  props: {
    id: { type: [String, Number], required: true }
  },
  data() {
    return {
      build: null,
      loading: true,
      partTypes: ['cpu', 'gpu', 'ram', 'motherboard', 'storage', 'psu', 'cooler', 'case'],
      userVote: null,
      comments: [],
      newComment: '',
      submittingComment: false
    };
  },
  computed: {
    ...mapState('auth', ['user', 'isAuthenticated']),
    ...mapState('socket', ['socket']),
    isAdmin() {
      return this.$store.getters['auth/isAdmin'];
    },
    isOwner() {
      return this.user && this.build && this.user.id === this.build.user_id;
    },
    totalVotes() {
      if (!this.build) return 0;
      return (this.build.votes_good || 0) + (this.build.votes_bad || 0);
    },
    approvePercentage() {
      if (this.totalVotes === 0) return 50;
      return ((this.build.votes_good || 0) / this.totalVotes) * 100;
    }
  },
  async mounted() {
    await this.fetchBuildDetail();
    await this.fetchComments();
    this.setupSocket();
  },
  beforeUnmount() {
    this.$store.dispatch('socket/leaveBuildDetail', this.id);
    if (this.socket) {
      this.socket.off('vote_updated', this.handleVoteUpdate);
    }
  },
  methods: {
    ...mapActions('socket', ['connect', 'joinBuildDetail']),
    formatPrice,
    formatDate(date) { return moment(date).format('YYYY-MM-DD HH:mm'); },
    
    async fetchBuildDetail() {
      try {
        const res = await api.get(`takeoffs/${this.id}`);
        this.build = res.data.data;
        if (!this.build) throw new Error('Not found');
        if (!this.build.parts && this.build.build_snapshot && this.build.build_snapshot.parts) {
          this.build.parts = this.build.build_snapshot.parts;
        }
        this.userVote = this.build.userVote || null;
      } catch (err) {
        this.$store.dispatch('ui/showError', '견적 정보를 불러올 수 없습니다.');
        this.$router.push('/takeoff');
      } finally {
        this.loading = false;
      }
    },

    async fetchComments() {
      try {
        const res = await api.get(`takeoffs/${this.id}/comments`);
        this.comments = res.data.data || [];
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    },

    async submitComment() {
      if (!this.newComment.trim()) return;
      this.submittingComment = true;
      try {
        const res = await api.post(`takeoffs/${this.id}/comments`, { content: this.newComment });
        this.comments.push(res.data.data);
        this.newComment = '';
        this.$store.dispatch('ui/showSuccess', '댓글이 등록되었습니다.');
      } catch (err) {
        this.$store.dispatch('ui/showError', err.response?.data?.error || '댓글 등록에 실패했습니다.');
      } finally {
        this.submittingComment = false;
      }
    },
    
    async deletePost() {
      if (!confirm('이 게시글을 완전히 삭제하시겠습니까?')) return;
      try {
        await api.delete(`takeoffs/${this.id}`);
        this.$store.dispatch('ui/showSuccess', '게시글이 삭제되었습니다.');
        this.$router.push('/takeoff');
      } catch (err) {
        this.$store.dispatch('ui/showError', '게시글 삭제에 실패했습니다.');
      }
    },

    async deleteComment(commentId) {
      if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
      try {
        await api.delete(`takeoffs/${this.id}/comments/${commentId}`);
        this.comments = this.comments.filter(c => c.id !== commentId);
        this.$store.dispatch('ui/showSuccess', '댓글이 삭제되었습니다.');
      } catch (err) {
        this.$store.dispatch('ui/showError', '댓글 삭제에 실패했습니다.');
      }
    },
    
    setupSocket() {
      this.connect();
      this.joinBuildDetail(this.id);
      
      if (this.socket) {
        this.socket.on('vote_updated', this.handleVoteUpdate);
      }
    },
    
    handleVoteUpdate({ buildId, voteApprove, voteReject }) {
      if (this.build && Number(this.build.id) === Number(buildId)) {
        this.build.votes_good = voteApprove;
        this.build.votes_bad = voteReject;
      }
    },
    
    async submitVote(type, done) {
      if (!this.isAuthenticated) {
        this.$store.dispatch('ui/showInfo', '투표하려면 로그인이 필요합니다.');
        this.$router.push({ name: 'Login', query: { redirect: this.$route.fullPath } });
        done();
        return;
      }

      try {
        const res = await api.post(`takeoffs/${this.id}/vote`, { voteType: type });
        const { voteApprove, voteReject, userVote, action } = res.data.data;
        this.build.votes_good = voteApprove;
        this.build.votes_bad = voteReject;
        this.userVote = userVote !== undefined ? userVote : type;

        if (action === 'cancelled') {
          this.$store.dispatch('ui/showInfo', '투표가 취소되었습니다.');
        } else if (action === 'switched') {
          this.$store.dispatch('ui/showSuccess', `${type === 'approve' ? '이륙 허가' : '대기 권고'}로 투표가 변경되었습니다.`);
        } else {
          this.$store.dispatch('ui/showSuccess', '투표가 완료되었습니다.');
        }
      } catch (err) {
        this.$store.dispatch('ui/showError', err.response?.data?.error || '투표 처리 중 오류가 발생했습니다.');
      } finally {
        done();
      }
    }
  }
};
</script>

<style scoped>
.parts-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
}
@media (min-width: 600px) {
  .parts-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 960px) {
  .parts-grid { grid-template-columns: repeat(3, 1fr); }
}
.font-mono { font-family: var(--font-mono); }
</style>