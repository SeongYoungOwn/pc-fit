<template>
  <v-container class="pa-4 pa-md-8">
    <div class="d-flex justify-space-between align-center mb-8 fade-in-up">
      <h1 class="text-h3 font-weight-bold neon-text-cyan d-flex align-center">
        이륙 심사소
        <NewbieTooltip text="컴퓨터 커뮤니티 은어로, '이륙 = PC 구매'를 뜻합니다. 결제하기 전 마지막으로 고인물들에게 '이대로 사도 문제없을지' 검사받는 곳입니다." class="ml-4" />
      </h1>
      <v-select
        v-model="sortBy"
        :items="sortOptions"
        variant="outlined"
        density="compact"
        hide-details
        class="sort-select"
        @update:model-value="fetchBuilds(true)"
      ></v-select>
    </div>

    <v-row v-if="builds.length > 0">
      <v-col 
        v-for="build in builds" 
        :key="build.id" 
        cols="12" sm="6" md="4" lg="3"
        class="stagger-item"
      >
        <TakeoffCard :build="build" @click="goToDetail(build.id)" />
      </v-col>
    </v-row>
    
    <div v-else-if="!loading" class="text-center py-12 text-secondary">
      <v-icon size="64" class="mb-4 text-muted">mdi-airplane-off</v-icon>
      <p class="text-h6">현재 대기 중인 이륙 심사가 없습니다.</p>
    </div>

    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    
    <!-- Intersection Observer Target for Infinite Scroll -->
    <div ref="loadMoreTrigger" class="py-4"></div>
  </v-container>
</template>

<script>
import api from '@/services/api';
import TakeoffCard from '@/components/domain/TakeoffCard.vue';
import { mapState, mapActions } from 'vuex';

export default {
  name: 'TakeoffBoardPage',
  components: { TakeoffCard },
  data() {
    return {
      builds: [],
      page: 1,
      totalPages: 1,
      loading: false,
      sortBy: 'latest',
      sortOptions: [
        { title: '최신순', value: 'latest' },
        { title: '인기순', value: 'popular' }
      ],
      observer: null
    };
  },
  computed: {
    ...mapState('socket', ['socket'])
  },
  mounted() {
    this.setupSocket();
    this.fetchBuilds(true);
    this.setupIntersectionObserver();
  },
  beforeUnmount() {
    if (this.observer) this.observer.disconnect();
    if (this.socket) {
      this.socket.off('vote_updated', this.handleVoteUpdate);
      this.socket.off('takeoff_post_added', this.handleNewPost);
    }
  },
  methods: {
    ...mapActions('socket', ['connect', 'joinTakeoffBoard']),
    setupSocket() {
      this.connect();
      this.joinTakeoffBoard();
      
      if (this.socket) {
        this.socket.on('vote_updated', this.handleVoteUpdate);
        this.socket.on('takeoff_post_added', this.handleNewPost);
      }
    },
    handleVoteUpdate({ buildId, voteApprove, voteReject }) {
      const idx = this.builds.findIndex(b => b.id === buildId);
      if (idx !== -1) {
        this.builds[idx].votes_good = voteApprove;
        this.builds[idx].votes_bad = voteReject;
        // In a real app, trigger a pulse animation class here
      }
    },
    handleNewPost(build) {
      if (this.sortBy === 'latest') {
        this.builds.unshift(build);
      }
    },
    async fetchBuilds(reset = false) {
      if (this.loading || (!reset && this.page >= this.totalPages)) return;
      
      this.loading = true;
      if (reset) {
        this.page = 1;
        this.builds = [];
      } else {
        this.page++;
      }

      try {
        const res = await api.get('takeoffs', {
          params: { page: this.page, limit: 12, sort: this.sortBy }
        });
        
        const data = res.data.data;
        this.builds = reset ? data.items : [...this.builds, ...data.items];
        this.totalPages = data.totalPages;
      } catch (err) {
        this.$store.dispatch('ui/showError', '목록을 불러오지 못했습니다.');
      } finally {
        this.loading = false;
      }
    },
    setupIntersectionObserver() {
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.fetchBuilds();
        }
      }, { rootMargin: '100px' });
      
      if (this.$refs.loadMoreTrigger) {
        this.observer.observe(this.$refs.loadMoreTrigger);
      }
    },
    goToDetail(id) {
      this.$router.push(`/takeoff/${id}`);
    }
  }
};
</script>

<style scoped>
.sort-select {
  max-width: 150px;
}
</style>