<template>
  <v-card class="glass-card takeoff-card h-100 cursor-pointer" @click="$emit('click')">
    <v-card-title class="text-h6 font-weight-bold text-truncate mb-2">
      {{ build.title }}
    </v-card-title>
    
    <v-card-text>
      <div class="d-flex align-center mb-2">
        <v-icon size="small" color="secondary" class="mr-2">mdi-cpu-64-bit</v-icon>
        <span class="text-body-2 text-truncate">{{ cpuName || 'CPU 정보 없음' }}</span>
      </div>
      <div class="d-flex align-center mb-4">
        <v-icon size="small" color="secondary" class="mr-2">mdi-expansion-card-variant</v-icon>
        <span class="text-body-2 text-truncate">{{ gpuName || 'GPU 정보 없음' }}</span>
      </div>
      
      <div class="d-flex justify-space-between align-end mt-4">
        <div class="text-h6 font-weight-bold neon-text-cyan font-mono">
          {{ formatPrice(totalPrice) }}
        </div>
        
        <div class="d-flex align-center gap-3">
          <div class="d-flex align-center text-success">
            <v-icon size="small" class="mr-1">mdi-thumb-up</v-icon>
            <span class="font-weight-bold">{{ build.votes_good || 0 }}</span>
          </div>
          <div class="d-flex align-center text-error">
            <v-icon size="small" class="mr-1">mdi-thumb-down</v-icon>
            <span class="font-weight-bold">{{ build.votes_bad || 0 }}</span>
          </div>
        </div>
      </div>
      
      <v-divider class="my-3 border-opacity-25"></v-divider>
      
      <div class="d-flex justify-space-between align-center text-caption text-secondary">
        <div class="d-flex align-center">
          <v-avatar size="24" color="rgba(255,255,255,0.1)" class="mr-2">
            <v-img v-if="build.users?.profile_image" :src="build.users.profile_image"></v-img>
            <v-icon v-else size="14">mdi-account</v-icon>
          </v-avatar>
          <span>{{ build.users?.nickname || '익명' }}</span>
        </div>
        <span>{{ formatDate(build.created_at) }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { formatPrice } from '@/utils/formatPrice';
import moment from 'moment';

export default {
  name: 'TakeoffCard',
  props: {
    build: { type: Object, required: true }
  },
  computed: {
    cpuName() {
      return this.build.build_snapshot?.parts?.cpu?.name || this.build.parts?.cpu?.name;
    },
    gpuName() {
      return this.build.build_snapshot?.parts?.gpu?.name || this.build.parts?.gpu?.name;
    },
    totalPrice() {
      return this.build.build_snapshot?.totalPrice || this.build.total_price || 0;
    }
  },
  methods: {
    formatPrice,
    formatDate(date) {
      return moment(date).fromNow();
    }
  }
};
</script>

<style scoped>
.takeoff-card {
  transition: transform 0.2s, border-color 0.2s;
}
.takeoff-card:hover {
  transform: translateY(-4px);
  border-color: var(--neon-cyan);
}
.gap-3 { gap: 12px; }
.font-mono { font-family: var(--font-mono); }
</style>