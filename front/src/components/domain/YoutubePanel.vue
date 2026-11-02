<template>
  <v-card class="glass-card h-100 d-flex flex-column">
    <v-card-title class="text-h6 font-weight-bold neon-text-purple px-4 pt-4 pb-2">
      <v-icon color="secondary" class="mr-2">mdi-youtube</v-icon>
      벤치마크 영상
    </v-card-title>
    
    <v-card-text class="flex-grow-1 px-4 pb-4">
      <div v-if="loading" class="d-flex justify-center align-center h-100 min-h-200">
        <v-progress-circular indeterminate color="secondary"></v-progress-circular>
      </div>
      
      <div v-else-if="videos.length > 0" class="d-flex flex-column gap-3 h-100">
        <v-card 
          v-for="video in videos" 
          :key="video.videoId"
          class="video-card cursor-pointer bg-transparent border border-opacity-25"
          elevation="0"
          :href="`https://www.youtube.com/watch?v=${video.videoId}`"
          target="_blank"
        >
          <div class="d-flex pa-2">
            <v-img 
              :src="video.thumbnail" 
              width="120" 
              height="68" 
              cover 
              class="rounded mr-3 flex-shrink-0"
            ></v-img>
            <div class="d-flex flex-column justify-center overflow-hidden">
              <div class="text-body-2 font-weight-bold text-truncate-2 mb-1" :title="video.title">
                {{ video.title }}
              </div>
              <div class="text-caption text-secondary">
                {{ video.channelTitle }}
              </div>
            </div>
          </div>
        </v-card>
      </div>

      <div v-else class="d-flex flex-column justify-center align-center h-100 min-h-200 text-center">
        <v-icon size="48" color="muted" class="mb-2">mdi-video-off-outline</v-icon>
        <p class="text-body-2 text-secondary mb-4">{{ message }}</p>
        <v-btn 
          v-if="fallbackUrl"
          color="secondary" 
          variant="outlined" 
          :href="fallbackUrl" 
          target="_blank"
        >
          직접 검색하기
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'YoutubePanel',
  props: {
    cpu: { type: String, default: '' },
    gpu: { type: String, default: '' }
  },
  data() {
    return {
      videos: [],
      fallbackUrl: '',
      message: '벤치마크 영상을 불러오는 중입니다.',
      loading: false
    };
  },
  watch: {
    cpu: 'fetchVideos',
    gpu: 'fetchVideos'
  },
  mounted() {
    this.fetchVideos();
  },
  methods: {
    async fetchVideos() {
      if (!this.cpu || !this.gpu) return;
      
      this.loading = true;
      try {
        // Use keyword instead of full name for better search results
        const cpuQuery = this.cpu.split(' ').slice(0, 2).join(' ');
        const gpuQuery = this.gpu.split(' ').slice(0, 3).join(' ');
        
        const res = await api.get('youtube/benchmark', {
          params: { cpu: cpuQuery, gpu: gpuQuery }
        });
        
        this.videos = res.data.data.videos;
        this.fallbackUrl = res.data.data.fallbackUrl;
        this.message = res.data.data.message || '검색 결과가 없습니다.';
      } catch (err) {
        this.videos = [];
        this.message = '영상을 불러오지 못했습니다.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.gap-3 { gap: 12px; }
.min-h-200 { min-height: 200px; }
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
  line-height: 1.3;
}
.video-card {
  transition: background-color 0.2s, border-color 0.2s;
}
.video-card:hover {
  background-color: rgba(255,255,255,0.05) !important;
  border-color: var(--neon-purple) !important;
}
</style>