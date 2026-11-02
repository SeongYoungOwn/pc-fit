<template>
  <TiltCard :disabled="readonly">
    <v-card 
      class="glass-card-strong part-card h-100 d-flex flex-column" 
      :class="{ 'neon-blink-red': hasError }"
    >
      <v-card-text class="pa-4 d-flex flex-column flex-grow-1">
        <!-- Part Header with Image -->
        <div class="d-flex align-start mb-4">
          <v-avatar size="80" rounded="lg" color="rgba(255,255,255,0.05)" class="mr-4 part-image-wrapper">
            <v-img 
              :src="effectiveImageSrc" 
              cover 
              class="part-img"
              referrerpolicy="no-referrer"
              @error="handleImageError"
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="primary" size="20"></v-progress-circular>
                </v-row>
              </template>
              <template v-slot:error>
                <v-img :src="defaultPartSvg" cover class="part-img"></v-img>
              </template>
            </v-img>
          </v-avatar>
          <div class="flex-grow-1 overflow-hidden">
            <div class="d-flex align-center justify-space-between mb-1">
              <div class="text-caption text-primary text-uppercase font-weight-black tracking-widest d-flex align-center">
                {{ partTitleMap[partType] }}
                <NewbieTooltip v-if="partTooltipMap[partType]" :text="partTooltipMap[partType]" />
                <v-chip v-if="partData?.is_3d_ready" size="x-small" color="primary" variant="flat" class="ml-1 px-1" style="height: 14px; font-size: 8px;">3D</v-chip>
                <v-chip v-if="isReuse" size="x-small" color="success" variant="flat" class="ml-1 px-1" style="height: 14px; font-size: 8px;">REUSE</v-chip>
              </div>
              <v-icon v-if="hasError" color="error" size="20">mdi-alert-circle</v-icon>
            </div>
            <div class="text-body-1 font-weight-black text-high-contrast leading-tight mb-1" :title="partData?.name">
              {{ partData?.name || '부품을 선택해주세요' }}
            </div>
            <div class="text-h6 font-weight-bold neon-text-cyan font-mono tracking-tighter">
              {{ formatPrice(partData?.price) }}
            </div>
          </div>
        </div>

        <!-- BuildCores Tech Specs (New Phase 2) -->
        <div v-if="hasSpecs && !isNewbie" class="tech-specs-grid mb-3">
          <div v-for="(val, key) in displaySpecs" :key="key" class="spec-item px-2 py-1 rounded-sm">
            <v-icon size="10" class="mr-1 opacity-70">{{ specIcons[key] || 'mdi-circle-small' }}</v-icon>
            <span class="text-tiny font-weight-bold text-uppercase opacity-50 mr-1">{{ key }}:</span>
            <span class="text-tiny font-weight-black text-primary">{{ val }}</span>
          </div>
        </div>

        <!-- AI Expert Insight -->
        <div v-if="partReview || partData?.reason" class="part-reason-box pa-3 rounded-lg glass-dark flex-grow-1 mt-1 position-relative">
           <div class="d-flex justify-space-between align-center mb-2">
             <div class="text-caption font-weight-black text-primary opacity-80 text-uppercase tracking-widest">
               <v-icon size="16" color="primary" class="mr-1 mt-n1">mdi-robot-outline</v-icon>
               AI Expert Insight
             </div>
           </div>
           <div class="text-body-2 text-secondary leading-relaxed pre-wrap">
             {{ partReview || partData.reason }}
           </div>
        </div>


        <!-- Hydration 실패 안내 -->
        <div v-if="partData?._hydrationFailed" class="hydration-fallback-notice d-flex align-center pa-2 rounded mt-3">
          <v-icon size="14" color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
          <span class="text-tiny text-warning opacity-80">DB 기준가가 표시됩니다. 실시간 최저가는 네이버 쇼핑 버튼으로 확인하세요.</span>
        </div>

        <div v-if="!readonly" class="d-flex justify-end gap-2 mt-4">
          <v-btn 
            v-if="partData?.name"
            variant="tonal" 
            color="primary" 
            size="small"
            :href="naverSearchLink"
            target="_blank"
            rel="noopener noreferrer"
            title="네이버 쇼핑 검색 결과 페이지 열기"
            prepend-icon="mdi-cart-outline"
            append-icon="mdi-open-in-new"
            class="text-tiny font-weight-bold"
          >네이버 쇼핑 구매</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </TiltCard>
</template>

<script>
import TiltCard from '@/components/common/TiltCard.vue';
import { formatPrice } from '@/utils/formatPrice';

export default {
  name: 'PartCard',
  components: { TiltCard },
  props: {
    partType: { type: String, required: true },
    partData: { type: Object, default: null },
    partReview: { type: String, default: '' },
    hasError: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false }
  },
  data() {
    return {
      imageLoadFailed: false,
      partTitleMap: {
        cpu: 'CPU',
        gpu: 'Graphics Card',
        ram: 'Memory (RAM)',
        motherboard: 'Motherboard',
        storage: 'Storage (SSD)',
        psu: 'Power Supply',
        cooler: 'Cooler',
        case: 'PC Case'
      }
    };
  },
  watch: {
    'partData.image'() {
      this.imageLoadFailed = false;
    }
  },
  computed: {
    defaultPartSvg() {
      const label = this.partTitleMap[this.partType] || 'PC PART';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <rect width="160" height="160" rx="16" fill="#0d1220" stroke="#00f3ff" stroke-opacity="0.35" stroke-width="2"/>
        <text x="80" y="84" text-anchor="middle" fill="#00f3ff" font-family="monospace, sans-serif" font-size="13" font-weight="bold">${label}</text>
      </svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    },
    effectiveImageSrc() {
      if (this.imageLoadFailed || !this.partData?.image) {
        return this.defaultPartSvg;
      }
      return this.partData.image;
    },
    isReuse() {
      return this.partData?.reuse_recommendation || this.partReview?.includes('기존 부품') || this.partData?.reason?.includes('기존 부품');
    },
    isNewbie() {
      return this.$store.getters['auth/isNewbie'];
    },
    partTooltipMap() {
      return {
        cpu: '컴퓨터의 두뇌입니다. 두뇌가 똑똑할수록 게임과 작업 속도가 빨라집니다.',
        gpu: '게임 화면을 부드럽게 그려주는 핵심 부품입니다. 게임 성능의 70%를 차지합니다.',
        ram: '작업용 책상입니다. 넓을수록 여러 창을 띄워도 버벅거리지 않습니다.',
        motherboard: '모든 부품을 하나로 연결해 주는 뼈대(몸통)입니다.',
        storage: '자료 보관용 서랍장입니다. 게임을 많이 깔려면 용량이 커야 합니다.',
        psu: '컴퓨터의 심장입니다. 각 부품에 필요한 전기를 안전하게 공급해 줍니다.',
        cooler: '에어컨입니다. 뜨거워진 두뇌(CPU)의 열을 식혀주어 컴퓨터가 다운되지 않게 보호합니다.',
        case: '부품을 담는 상자입니다.'
      };
    },
    naverSearchLink() {
      if (!this.partData?.name) return '#';
      if (this.partData.link && this.partData.link.startsWith('https://search.naver.com/')) {
        return this.partData.link;
      }
      let raw = String(this.partData.name)
        .replace(/\(.+?\)/g, '')
        .replace(/\[.+?\]/g, '')
        .split(',')[0]
        .replace(/\s*\/\s*/g, ' ')
        .trim();

      if (/^(CPU COOLER|STANDARD .* CASE|GENERIC |DUMMY_)/i.test(raw)) {
        const fallbackMap = {
          cooler: 'CPU 공랭 쿨러',
          case: 'PC 미들타워 ATX 케이스',
          cpu: '데스크탑 CPU',
          gpu: '그래픽카드',
          ram: '데스크탑 DDR5 RAM',
          motherboard: '메인보드',
          storage: 'NVMe SSD',
          psu: '컴퓨터 파워서플라이'
        };
        raw = fallbackMap[this.partType] || raw;
      } else {
        const tokens = raw.split(/\s+/).filter(Boolean);
        if (tokens.length > 5) {
          raw = tokens.slice(0, 5).join(' ');
        }
      }
      return `https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=${encodeURIComponent(`${raw} 가격비교`)}`;
    },
    hasSpecs() {
      return this.displaySpecs && Object.keys(this.displaySpecs).length > 0;
    },
    displaySpecs() {
      if (!this.partData) return null;
      const specs = {};
      if (this.partData.socket) specs.socket = this.partData.socket;
      if (this.partData.tdp) specs.tdp = `${this.partData.tdp}W`;
      if (this.partData.length) specs.length = `${this.partData.length}mm`;
      if (this.partData.wattage) specs.psu = `${this.partData.wattage}W`;
      if (this.partData.ramType) specs.ram = this.partData.ramType;
      return Object.keys(specs).length > 0 ? specs : null;
    },
    specIcons() {
      return {
        socket: 'mdi-cpu-64-bit',
        tdp: 'mdi-lightning-bolt-outline',
        length: 'mdi-ruler',
        psu: 'mdi-power-plug',
        ram: 'mdi-memory'
      };
    }
  },
  methods: {
    formatPrice,
    handleImageError() {
      this.imageLoadFailed = true;
    }
  }
};
</script>

<style scoped>
.part-card {
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.part-image-wrapper {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: black !important;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.hover-glow:hover {
  filter: brightness(1.2);
  text-decoration: underline;
}

.part-reason-box {
  border-left: 2px solid var(--neon-pink);
  background: rgba(0, 0, 0, 0.3) !important;
  min-height: 80px;
  transition: all 0.3s ease;
}

/* Tech Specs Grid (Phase 2) */
.tech-specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 6px;
}

.spec-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.spec-item:hover {
  background: rgba(255, 0, 128, 0.05);
  border-color: rgba(255, 0, 128, 0.2);
}

.summary-toggle-btn {
  font-weight: 800;
  opacity: 0.6;
}
.summary-toggle-btn:hover { opacity: 1; }

.text-tiny { font-size: 0.65rem; }

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pre-wrap { white-space: pre-wrap; }
.leading-tight { line-height: 1.25; }
.leading-relaxed { line-height: 1.6; }
.tracking-widest { letter-spacing: 0.15em; }

.font-mono {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

.gap-2 { gap: 8px; }

.hydration-fallback-notice {
  background: rgba(255, 152, 0, 0.08);
  border: 1px solid rgba(255, 152, 0, 0.2);
}
</style>
