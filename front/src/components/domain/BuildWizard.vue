<template>
  <v-dialog v-model="internalOpen" max-width="850" persistent>
    <v-card class="wizard-card glass-card overflow-hidden">
      <!-- Wizard Progress Header -->
      <div class="wizard-header pa-6 d-flex align-center">
        <v-btn icon variant="text" color="secondary" @click="prevStep" :disabled="step === 1">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <v-spacer></v-spacer>
        <div class="step-indicator d-flex gap-2">
          <div v-for="i in 3" :key="i" class="indicator-dot" :class="{ active: step >= i }"></div>
        </div>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" color="secondary" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-window v-model="step" class="pa-6 pt-0">
        <!-- Step 1: 목적 선택 -->
        <v-window-item :value="1">
          <div class="text-center mb-8">
            <h2 class="text-h4 font-weight-black mb-2">어떤 용도로 사용하시나요?</h2>
            <p class="text-secondary text-h6">AI가 목적에 맞는 핵심 부품에 예산을 집중 배분합니다.</p>
          </div>
          <v-row>
            <v-col v-for="opt in purposes" :key="opt.id" cols="12" sm="6">
              <v-card 
                variant="outlined" 
                class="option-card pa-6 text-center h-100"
                :class="{ selected: selection.purpose === opt.id }"
                @click="handlePurposeSelect(opt.id)"
              >
                <v-icon size="64" :color="selection.purpose === opt.id ? 'primary' : 'secondary'" class="mb-4">
                  {{ opt.icon }}
                </v-icon>
                <div class="text-h5 font-weight-bold mb-2">{{ opt.title }}</div>
                <div class="text-body-1 text-secondary leading-relaxed">{{ opt.desc }}</div>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Step 2: 세부 타겟 (게임/앱) -->
        <v-window-item :value="2">
          <div class="text-center mb-8">
            <h2 class="text-h4 font-weight-black mb-2">주로 사용하는 프로그램은?</h2>
            <p class="text-secondary text-h6">용도에 최적화된 하드웨어 밸런스를 계산합니다. (다중 선택 가능)</p>
          </div>
          
          <div class="category-tabs d-flex justify-center gap-2 mb-6">
            <v-btn 
              v-for="cat in ['전체', '게이밍', '전문작업', '기타']" 
              :key="cat"
              size="large"
              rounded="pill"
              :variant="activeTab === cat ? 'flat' : 'tonal'"
              :color="activeTab === cat ? 'primary' : 'secondary'"
              class="px-8"
              @click="activeTab = cat"
            >{{ cat }}</v-btn>
          </div>

          <v-row class="max-h-450 overflow-y-auto px-2 py-4 custom-scrollbar">
            <v-col v-for="app in tabFilteredApps" :key="app.name" cols="6" sm="3">
              <v-card 
                variant="outlined" 
                class="app-card text-center pa-4 h-100 d-flex flex-column align-center justify-center"
                :class="{ selected: selection.apps.includes(app.name) }"
                @click="toggleApp(app.name)"
              >
                <div class="selection-check" v-if="selection.apps.includes(app.name)">
                  <v-icon size="14" color="white">mdi-check</v-icon>
                </div>
                <v-avatar size="56" class="mb-3 rounded-lg app-icon-bg">
                   <v-icon size="28" :color="selection.apps.includes(app.name) ? 'primary' : 'secondary'">{{ app.icon }}</v-icon>
                </v-avatar>
                <div class="text-subtitle-2 font-weight-bold mb-1">{{ app.name }}</div>
                <div class="text-tiny opacity-40 uppercase tracking-widest">{{ app.category }}</div>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Step 3: 예산 및 감성 -->
        <v-window-item :value="3">
          <div class="text-center mb-8">
            <h2 class="text-h4 font-weight-black mb-2">마지막으로, 당신의 취향은?</h2>
            <p class="text-secondary text-h6">예산 범위 내에서 최상의 밸런스를 찾습니다.</p>
          </div>
          
          <div class="mb-10 px-4">
            <div class="d-flex justify-space-between mb-4">
              <span class="text-h6 font-weight-bold">목표 예산</span>
              <span class="text-h4 font-weight-black neon-text-cyan">{{ selection.budget }}만원</span>
            </div>
            <v-slider
              v-model="selection.budget"
              min="80"
              max="1000"
              step="10"
              color="primary"
              thumb-label
              class="budget-slider"
            ></v-slider>
          </div>

          <div class="text-h6 font-weight-bold mb-6">스타일 키워드 (분위기)</div>
          <div class="d-flex flex-wrap gap-3 mb-10">
            <v-chip
              v-for="tag in themes"
              :key="tag"
              size="large"
              :color="selection.themes.includes(tag) ? 'primary' : 'white'"
              variant="outlined"
              @click="toggleTheme(tag)"
              class="px-6 theme-chip"
            >
              {{ tag }}
              <NewbieTooltip v-if="themeTooltips[tag]" :text="themeTooltips[tag]" />
            </v-chip>
          </div>

          <v-divider class="my-8 border-opacity-10"></v-divider>

          <!-- AI 모델 선택 -->
          <div class="text-h6 font-weight-bold mb-6">AI 분석 엔진 선택</div>
          <p class="text-caption text-secondary mb-4">견적 리뷰 및 최적화에 사용할 모델을 선택하세요.</p>
          <div class="d-flex flex-wrap gap-4">
            <!-- Claude -->
            <v-card 
              variant="outlined" 
              class="model-card pa-4 flex-1-1-100 flex-sm-1-1-0"
              :class="{ selected: selection.model === 'claude' }"
              @click="selection.model = 'claude'"
            >
              <div class="d-flex align-center">
                  <v-avatar size="40" class="mb-2 claude-bg rounded"><v-icon color="white">mdi-brain</v-icon></v-avatar>
                  <div class="font-weight-bold">Claude</div>
                  <div class="text-tiny text-secondary">정밀 호환성 및 논리 분석</div>
                </div>
              </div>
            </v-card>

            <!-- ChatGPT -->
            <v-card 
              variant="outlined" 
              class="model-card pa-4 flex-1-1-100 flex-sm-1-1-0"
              :class="{ selected: selection.model === 'chatgpt' }"
              @click="selection.model = 'chatgpt'"
            >
              <div class="d-flex align-center">
                <v-avatar size="40" class="mr-3 chatgpt-bg rounded">
                  <v-icon color="white">mdi-chat-processing</v-icon>
                </v-avatar>
                <div>
                  <div class="font-weight-bold">ChatGPT GPT-4o</div>
                  <div class="text-tiny text-secondary">벤치마크 기반 종합 분석</div>
                </div>
              </div>
            </v-card>

            <!-- Gemini -->
            <v-card 
              variant="outlined" 
              class="model-card pa-4 flex-1-1-100 flex-sm-1-1-0"
              :class="{ selected: selection.model === 'gemini' }"
              @click="selection.model = 'gemini'"
            >
              <div class="d-flex align-center">
                <v-avatar size="40" class="mr-3 gemini-bg rounded">
                  <v-icon color="white">mdi-google</v-icon>
                </v-avatar>
                <div>
                  <div class="font-weight-bold">Gemini 1.5 Pro</div>
                  <div class="text-tiny text-secondary">하이브리드 고속 추천 제공</div>
                </div>
              </div>
            </v-card>
          </div>
        </v-window-item>
      </v-window>

      <v-divider class="border-opacity-10"></v-divider>
      
      <v-card-actions class="pa-6">
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          size="x-large" 
          width="220" 
          height="64"
          class="font-weight-black finish-btn"
          :disabled="!canGoNext"
          @click="nextStep"
        >
          {{ step === 3 ? 'AI 설계 요청' : '다음 단계' }}
          <v-icon right class="ml-2">mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'BuildWizard',
  props: {
    isOpen: { type: Boolean, default: false }
  },
  data() {
    return {
      step: 1,
      activeTab: '전체',
      purposes: [
        { id: 'gaming', title: '게이밍', desc: '고사양 게임 플레이 및 안정적인 프레임 확보', icon: 'mdi-controller-classic' },
        { id: 'work', title: '전문 작업', desc: '영상 편집, 3D 렌더링, 고성능 연산 워크스테이션', icon: 'mdi-monitor-dashboard' },
        { id: 'stream', title: '방송용', desc: '유튜브/트위치 원컴 방송 및 원활한 멀티태스킹', icon: 'mdi-microphone-variant' },
        { id: 'office', title: '사무/가정용', desc: '쾌적한 웹서핑, 문서 작업, 인강 및 미디어 감상', icon: 'mdi-coffee-outline' }
      ],
      apps: [
        { name: '배틀그라운드', type: 'gaming', category: 'FPS', icon: 'mdi-crosshairs-gps' },
        { name: '리그 오브 레전드', type: 'gaming', category: 'MOBA', icon: 'mdi-sword-cross' },
        { name: '사이버펑크 2077', type: 'gaming', category: 'AAA', icon: 'mdi-city-variant' },
        { name: '로스트아크', type: 'gaming', category: 'MMORPG', icon: 'mdi-ship-wheel' },
        { name: '발로란트', type: 'gaming', category: 'FPS', icon: 'mdi-pistol' },
        { name: '오버워치 2', type: 'gaming', category: 'FPS', icon: 'mdi-robot-outline' },
        { name: '디아블로 4', type: 'gaming', category: 'RPG', icon: 'mdi-fire' },
        { name: '팰월드', type: 'gaming', category: 'Survival', icon: 'mdi-paw' },
        
        { name: '프리미어 프로', type: 'work', category: 'Edit', icon: 'mdi-video-vintage' },
        { name: '애프터이펙트', type: 'work', category: 'Motion', icon: 'mdi-movie-open-play-outline' },
        { name: '다빈치 리졸브', type: 'work', category: 'Edit', icon: 'mdi-palette-outline' },
        { name: '블렌더', type: 'work', category: '3D', icon: 'mdi-cube-scan' },
        { name: '포토샵', type: 'work', category: 'Design', icon: 'mdi-image-auto-adjust' },
        { name: '일러스트레이터', type: 'work', category: 'Design', icon: 'mdi-vector-curve' },
        { name: '오토캐드', type: 'work', category: 'CAD', icon: 'mdi-ruler-square-compass' },
        { name: '언리얼 엔진', type: 'work', category: 'GameDev', icon: 'mdi-google-circles-extended' },
        
        { name: 'OBS 스튜디오', type: 'stream', category: 'Stream', icon: 'mdi-record-rec' },
        { name: '엑스플릿', type: 'stream', category: 'Stream', icon: 'mdi-video-wireless' },
        
        { name: '엑셀/워드', type: 'office', category: 'Office', icon: 'mdi-file-document-edit-outline' },
        { name: '줌/팀즈', type: 'office', category: 'Meeting', icon: 'mdi-video-account' },
        { name: '크롬/웨일', type: 'office', category: 'Web', icon: 'mdi-google-chrome' }
      ],
      themes: ['화이트 감성', '블랙 앤 시크', '풀 RGB', 'LED 최소화', '저소음 우선', '어항 케이스', '우드 감성', '가성비 위주', '끝판왕 성능', '미니 ITX', '빅타워 튜닝', '수냉 쿨링'],
      selection: {
        purpose: null,
        apps: [],
        budget: 150,
        themes: [],
        model: 'gemini'
      },
      themeTooltips: {
        '풀 RGB': '컴퓨터 부품에서 화려한 빛이 나오는 감성 세팅입니다.',
        '어항 케이스': '유리벽이 많아 컴퓨터 내부가 훤히 들여다보이는 튜닝용 케이스입니다.',
        '미니 ITX': '공간을 적게 차지하는 아주 작은 크기의 컴퓨터 조립 방식입니다.',
        '수냉 쿨링': '물이 흐르는 관을 이용해 컴퓨터의 열을 식히는 방식입니다. 조용하고 쿨링 성능이 뛰어납니다.'
      }
    };
  },
  computed: {
    internalOpen: {
      get() { return this.isOpen; },
      set(val) { if (!val) this.close(); }
    },
    tabFilteredApps() {
      let filtered = this.apps;
      if (this.activeTab === '게이밍') filtered = this.apps.filter(a => a.type === 'gaming');
      else if (this.activeTab === '전문작업') filtered = this.apps.filter(a => a.type === 'work');
      else if (this.activeTab === '기타') filtered = this.apps.filter(a => a.type === 'stream' || a.type === 'office');
      return filtered;
    },
    canGoNext() {
      if (this.step === 1) return !!this.selection.purpose;
      if (this.step === 2) return this.selection.apps.length > 0;
      return true;
    }
  },
  methods: {
    close() { this.$emit('close'); },
    nextStep() {
      if (this.step < 3) {
        this.step++;
      } else {
        this.finish();
      }
    },
    prevStep() { if (this.step > 1) this.step--; },
    handlePurposeSelect(id) {
      this.selection.purpose = id;
      if (id === 'gaming') this.activeTab = '게이밍';
      else if (id === 'work') this.activeTab = '전문작업';
      else this.activeTab = '전체';
    },
    toggleApp(name) {
      const idx = this.selection.apps.indexOf(name);
      if (idx > -1) this.selection.apps.splice(idx, 1);
      else this.selection.apps.push(name);
    },
    toggleTheme(tag) {
      const idx = this.selection.themes.indexOf(tag);
      if (idx > -1) this.selection.themes.splice(idx, 1);
      else this.selection.themes.push(tag);
    },
    finish() {
      const purposeText = this.purposes.find(p => p.id === this.selection.purpose).title;
      const finalPrompt = `[목적: ${purposeText}] [주요 앱: ${this.selection.apps.join(', ')}] [예산: ${this.selection.budget}만원] [스타일: ${this.selection.themes.join(', ')}] 이 조건들을 모두 만족하는 최적의 PC 견적을 조립비와 케이스를 포함해서 상세하게 짜줘.`;
      this.$store.commit('build/SET_MODEL', this.selection.model);
      this.$emit('complete', finalPrompt);
      this.close();
    }
  }
};
</script>

<style scoped>
.wizard-card {
  min-height: 600px;
  background: rgba(10, 15, 30, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* 모달 전체(배경 도형) 호버 시 색상 변하는 전역 효과 차단 */
.wizard-card:hover {
  transform: none !important;
  background: rgba(10, 15, 30, 0.98) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.indicator-dot {
  width: 40px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  transition: all 0.3s;
}
.indicator-dot.active {
  background: var(--neon-pink);
  box-shadow: 0 0 15px var(--neon-pink);
}

.option-card {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-color: rgba(255, 255, 255, 0.1) !important;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02) !important;
}
.option-card:hover {
  background: rgba(255, 0, 128, 0.05) !important;
  border-color: rgba(255, 0, 128, 0.4) !important;
}
.option-card.selected {
  background: rgba(255, 0, 128, 0.1) !important;
  border-color: var(--neon-pink) !important;
  transform: translateY(-8px);
  box-shadow: 0 10px 30px rgba(255, 0, 128, 0.2);
}

.app-card {
  border-color: rgba(255, 255, 255, 0.08) !important;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.02) !important;
  position: relative;
}
.app-card:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}
.app-card.selected {
  border-color: var(--neon-pink) !important;
  background: rgba(255, 0, 128, 0.1) !important;
  box-shadow: 0 0 20px rgba(255, 0, 128, 0.2);
}

.selection-check {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: var(--neon-pink);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 0 10px var(--neon-pink);
}

.app-icon-bg {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.category-tabs {
  background: rgba(255, 255, 255, 0.05);
  padding: 6px;
  border-radius: 50px;
}

.max-h-450 { max-height: 400px; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }

.text-tiny { font-size: 0.65rem; font-weight: 800; }
.leading-relaxed { line-height: 1.6; }

.finish-btn {
  box-shadow: var(--shadow-neon-pink);
}

.theme-chip {
  transition: all 0.3s;
}
.theme-chip:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.model-card {
  border-color: rgba(255, 255, 255, 0.1) !important;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.02) !important;
}
.model-card:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-3px);
}
.model-card.selected {
  border-color: var(--neon-cyan) !important;
  background: rgba(0, 243, 255, 0.1) !important;
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.2);
}

.claude-bg { background: linear-gradient(135deg, #FF6B35, #FF4500); }
.chatgpt-bg { background: linear-gradient(135deg, #10A37F, #0D8C6D); }
.gemini-bg { background: linear-gradient(135deg, #8E44AD, #6C3483); }
</style>
