<template>
  <v-dialog :model-value="isOpen" @update:model-value="$emit('close')" max-width="800" scrollable>
    <v-card class="glass-card selector-modal">
      <v-card-title class="d-flex justify-space-between align-center px-8 py-6 border-b border-opacity-10">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-3">mdi-database-search</v-icon>
          <span class="text-h5 font-weight-black neon-text-cyan">{{ partTitleMap[partType] }} 시스템 탐색</span>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
      </v-card-title>

      <v-card-text class="px-8 py-6">
        
        <!-- AI 추천 옵션 (3지망) -->
        <div v-if="tiers && Object.keys(tiers).length > 0" class="mb-8">
          <div class="d-flex align-center mb-4">
            <v-icon color="primary" class="mr-2">mdi-robot-outline</v-icon>
            <span class="text-subtitle-1 font-weight-black text-white">AI 추천 지망</span>
          </div>
          <v-list bg-color="transparent" class="pa-0">
            <v-list-item
              v-for="(tierData, tierKey) in tiers"
              :key="tierKey"
              class="mb-3 pa-4 rounded-xl glass border border-opacity-20 item-row"
              :class="{'border-primary': tierKey === 'tier1'}"
            >
              <template v-slot:prepend>
                <div class="image-wrapper mr-4 pa-1 rounded-lg">
                  <v-img :src="tierData.image || ''" width="60" height="60" cover class="rounded-lg">
                    <template v-slot:error><v-icon size="30" color="secondary">mdi-memory</v-icon></template>
                  </v-img>
                </div>
              </template>
              
              <v-list-item-title class="font-weight-bold text-subtitle-1 mb-1 text-white leading-tight">
                <v-chip size="x-small" :color="tierKey === 'tier1' ? 'primary' : (tierKey === 'tier2' ? 'success' : 'warning')" class="mr-2 font-weight-bold">
                  {{ tierKey === 'tier1' ? '1지망 (최적)' : (tierKey === 'tier2' ? '2지망 (가성비)' : '3지망 (최저가)') }}
                </v-chip>
                {{ tierData.name || tierData.keyword }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="d-flex flex-column gap-1">
                <span class="text-subtitle-2 font-weight-black neon-text-cyan font-mono">{{ formatPrice(tierData.price) }}</span>
                <span class="text-caption text-secondary text-truncate">{{ tierData.reason }}</span>
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-btn 
                  color="primary" 
                  variant="tonal" 
                  class="font-weight-bold px-4 ml-4"
                  @click="selectPart(tierData)"
                  :disabled="!tierData.price"
                >
                  선택
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <div class="d-flex align-center mb-4 mt-4">
          <v-icon color="secondary" class="mr-2">mdi-magnify</v-icon>
          <span class="text-subtitle-1 font-weight-black text-secondary">직접 검색</span>
        </div>
        <v-form @submit.prevent="search" class="mb-8">
          <v-text-field
            v-model="keyword"
            placeholder="제조사 또는 모델명을 입력하세요 (예: i7-14700K)"
            variant="outlined"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            class="neon-input-field search-input"
            @click:prepend-inner="search"
          >
            <template v-slot:append>
              <v-btn color="primary" @click="search" height="56" class="px-6 font-weight-bold ml-2">검색</v-btn>
            </template>
          </v-text-field>
        </v-form>

        <div v-if="loading" class="text-center py-16">
          <v-progress-circular indeterminate color="primary" size="64" width="4"></v-progress-circular>
          <div class="mt-4 text-caption text-secondary font-weight-bold tracking-widest">CONNECTING TO DATABASE...</div>
        </div>

        <div v-else-if="results.length === 0 && searched" class="text-center py-16">
          <v-icon size="64" color="rgba(255,255,255,0.1)" class="mb-4">mdi-alert-circle-outline</v-icon>
          <div class="text-h6 text-secondary">검색 결과가 없습니다.</div>
          <p class="text-caption text-muted mt-2">다른 키워드로 다시 검색해 보세요.</p>
        </div>

        <div v-else class="results-container">
          <v-list bg-color="transparent" class="pa-0">
            <v-list-item
              v-for="(item, i) in results"
              :key="i"
              class="mb-4 pa-4 rounded-xl glass border border-opacity-10 item-row"
            >
              <template v-slot:prepend>
                <div class="image-wrapper mr-6 pa-1 rounded-lg">
                  <v-img :src="item.image" width="80" height="80" cover class="rounded-lg"></v-img>
                </div>
              </template>
              
              <v-list-item-title class="font-weight-bold text-h6 mb-2 text-white leading-tight">
                {{ item.name }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="d-flex align-center">
                <v-chip size="x-small" color="primary" variant="tonal" class="mr-2 font-weight-bold">{{ partTitleMap[partType] }}</v-chip>
                <span class="text-h6 font-weight-black neon-text-cyan font-mono">{{ formatPrice(item.price) }}</span>
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-btn 
                  color="primary" 
                  variant="flat" 
                  class="font-weight-bold px-6"
                  @click="selectPart(item)"
                >
                  선택
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import api from '@/services/api';
import { formatPrice } from '@/utils/formatPrice';

export default {
  name: 'PartSelector',
  props: {
    isOpen: { type: Boolean, required: true },
    partType: { type: String, required: true },
    tiers: { type: Object, default: () => null }
  },
  data() {
    return {
      keyword: '',
      results: [],
      loading: false,
      searched: false,
      partTitleMap: {
        cpu: 'CPU', gpu: 'GPU', ram: 'RAM', motherboard: '메인보드',
        storage: 'SSD', psu: '파워', cooler: '쿨러', case: '케이스'
      }
    };
  },
  watch: {
    isOpen(newVal) {
      if (newVal) {
        this.keyword = '';
        this.results = [];
        this.searched = false;
      }
    }
  },
  methods: {
    formatPrice,
    async search() {
      if (!this.keyword?.trim()) return;
      this.loading = true;
      this.searched = true;
      try {
        const res = await api.get('search/parts', {
          params: { keyword: this.keyword, type: this.partType, page: 1 }
        });
        this.results = res.data.data.items || res.data.data;
      } catch (err) {
        this.results = [];
      } finally {
        this.loading = false;
      }
    },
    selectPart(item) {
      this.$emit('select', { ...item, type: this.partType, keyword: item.keyword || this.keyword });
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.selector-modal {
  max-height: 90vh;
}

.search-input {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.item-row {
  transition: all 0.3s ease;
}
.item-row:hover {
  background: rgba(255, 255, 255, 0.05);
}
</style>