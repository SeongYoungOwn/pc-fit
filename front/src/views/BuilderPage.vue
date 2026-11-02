<template>
  <div class="builder-wrapper">
    <!-- Background Blur -->
    <div class="background-blur"></div>
    <div class="glow-circle"></div>

    <v-container class="fill-height d-flex flex-column justify-center align-center position-relative z-index-1 pa-6">
      <v-card class="glass-popup w-100 pa-6 pa-md-12 text-center fade-in-up" max-width="900" elevation="0">
        
        <!-- Progress Bar -->
        <div class="mb-10 px-4">
          <div class="d-flex justify-space-between text-caption font-weight-bold text-secondary mb-2">
            <span>진행 상황</span>
            <span class="neon-text-cyan">{{ step }} / 5 단계</span>
          </div>
          <v-progress-linear :model-value="(step / 5) * 100" color="primary" height="8" class="rounded-pill" rounded></v-progress-linear>
        </div>

        <v-window v-model="step" class="overflow-visible" touchless>
          <!-- Step 1: Usage -->
          <v-window-item :value="1">
            <h2 class="text-h4 font-weight-black mb-2 text-white">1. 어떤 용도로 사용하시나요?</h2>
            <p class="text-subtitle-1 text-secondary mb-8">PC의 주된 목적을 선택해 주세요.</p>
            <v-row>
              <v-col v-for="opt in purposes" :key="opt.id" cols="12" sm="6" md="3">
                <v-card 
                  variant="outlined" 
                  class="option-card pa-6 h-100" 
                  :class="{ selected: selection.purpose === opt.id }" 
                  @click="selectPurpose(opt.id)"
                >
                  <v-icon size="56" :color="selection.purpose === opt.id ? 'primary' : 'secondary'" class="mb-4">{{ opt.icon }}</v-icon>
                  <div class="text-h6 font-weight-bold">{{ opt.title }}</div>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- Step 2: Programs -->
          <v-window-item :value="2">
            <h2 class="text-h4 font-weight-black mb-2 text-white">2. 주로 사용하는 프로그램은?</h2>
            <p class="text-subtitle-1 text-secondary mb-8">선택하신 용도에 맞는 대표 프로그램을 골라주세요.</p>
            <div class="d-flex flex-wrap justify-center gap-4 mb-8">
              <v-btn 
                v-for="prog in availablePrograms" 
                :key="prog" 
                size="x-large" 
                :variant="selection.program === prog ? 'flat' : 'outlined'" 
                :color="selection.program === prog ? 'primary' : 'white'" 
                class="px-8 py-2"
                @click="selection.program = prog; nextStep()"
              >
                {{ prog }}
              </v-btn>
            </div>
            <v-btn variant="text" color="secondary" @click="selection.program = '기타'; nextStep()">목록에 없음 (건너뛰기)</v-btn>
          </v-window-item>

          <!-- Step 3: Budget -->
          <v-window-item :value="3">
            <h2 class="text-h4 font-weight-black mb-2 text-white">3. 목표 예산을 설정해 주세요</h2>
            <p class="text-subtitle-1 text-secondary mb-8">대략적인 예산 범위를 지정해 주세요.</p>
            <div class="text-h2 font-weight-black neon-text-cyan mb-8">{{ selection.budget }}만원</div>
            <div class="px-md-10 mb-8">
              <v-slider 
                v-model="selection.budget" 
                min="30" 
                max="500" 
                step="10" 
                color="primary" 
                thumb-label="always"
                class="budget-slider"
              ></v-slider>
            </div>
            <div class="d-flex flex-wrap justify-center gap-4">
              <v-btn variant="outlined" @click="selection.budget = 80; nextStep()">가성비 (80만)</v-btn>
              <v-btn variant="outlined" @click="selection.budget = 150; nextStep()">표준 (150만)</v-btn>
              <v-btn variant="outlined" @click="selection.budget = 250; nextStep()">고급형 (250만)</v-btn>
              <v-btn color="primary" class="ml-sm-4" @click="nextStep()">이 예산으로 결정</v-btn>
            </div>
          </v-window-item>

          <!-- Step 4: Brand & Keyword -->
          <v-window-item :value="4">
            <h2 class="text-h4 font-weight-black mb-2 text-white">4. 선호하는 브랜드가 있나요?</h2>
            <p class="text-subtitle-1 text-secondary mb-8">원하시는 CPU 제조사를 선택해 주세요.</p>
            <div class="d-flex flex-wrap justify-center gap-4 mb-8">
              <v-btn size="x-large" :variant="selection.brand === '상관없음' ? 'flat' : 'outlined'" :color="selection.brand === '상관없음' ? 'primary' : 'white'" @click="selection.brand = '상관없음'; nextStep()" class="px-8">잘 모름 (알아서 추천)</v-btn>
              <v-btn size="x-large" :variant="selection.brand === '인텔 (Intel)' ? 'flat' : 'outlined'" :color="selection.brand === '인텔 (Intel)' ? '#0068B5' : 'white'" @click="selection.brand = '인텔 (Intel)'; nextStep()" class="px-8">인텔 (Intel)</v-btn>
              <v-btn size="x-large" :variant="selection.brand === 'AMD' ? 'flat' : 'outlined'" :color="selection.brand === 'AMD' ? '#ED1C24' : 'white'" @click="selection.brand = 'AMD'; nextStep()" class="px-8">AMD (Ryzen)</v-btn>
            </div>
          </v-window-item>

          <!-- Step 5: AI Engine -->
          <v-window-item :value="5">
            <h2 class="text-h4 font-weight-black mb-2 text-white">5. 최종 리뷰 AI 선택</h2>
            <p class="text-subtitle-1 text-secondary mb-8">견적 조립은 시스템이 수행합니다. 완성된 견적을 검수할 AI 전문가를 고르세요.</p>
            <v-row class="mb-10 justify-center">
              <v-col cols="12" sm="4">
                <v-card variant="outlined" class="model-card pa-6 h-100" :class="{ 'selected-claude': selection.model === 'claude' }" @click="selection.model = 'claude'">
                  <v-avatar size="56" class="mb-4 claude-bg rounded"><v-icon color="white">mdi-brain</v-icon></v-avatar>
                  <div class="font-weight-bold text-h6 mb-1">Claude</div>
                  <div class="text-body-2 text-secondary">정밀 호환성 분석</div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="outlined" class="model-card pa-6 h-100" :class="{ 'selected-chatgpt': selection.model === 'chatgpt' }" @click="selection.model = 'chatgpt'">
                  <v-avatar size="56" class="mb-4 chatgpt-bg rounded"><v-icon color="white">mdi-chat-processing</v-icon></v-avatar>
                  <div class="font-weight-bold text-h6 mb-1">GPT</div>
                  <div class="text-body-2 text-secondary">종합 성능 리뷰</div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="outlined" class="model-card pa-6 h-100" :class="{ 'selected-gemini': selection.model === 'gemini' }" @click="selection.model = 'gemini'">
                  <v-avatar size="56" class="mb-4 gemini-bg rounded"><v-icon color="white">mdi-google</v-icon></v-avatar>
                  <div class="font-weight-bold text-h6 mb-1">Gemini</div>
                  <div class="text-body-2 text-secondary">하이브리드 밸런스</div>
                </v-card>
              </v-col>
            </v-row>
            <v-btn 
              color="primary" 
              size="x-large" 
              height="72" 
              class="generate-btn text-h5 font-weight-black px-12 w-100 w-sm-auto" 
              @click="submitBuildRequest"
            >
              <v-icon left size="32" class="mr-3">mdi-rocket-launch</v-icon>
              견적 이륙하기
            </v-btn>
          </v-window-item>
        </v-window>

        <!-- Bottom Navigation -->
        <div class="d-flex justify-space-between mt-8" v-if="step > 1">
          <v-btn variant="text" color="secondary" @click="step--">
            <v-icon left>mdi-arrow-left</v-icon> 이전 단계
          </v-btn>
        </div>
      </v-card>

      <!-- Loading Dialog -->
      <v-dialog v-model="loading" persistent max-width="450">
        <v-card class="glass-card text-center pa-10 overflow-hidden">
          <div class="loading-scanner"></div>
          <v-card-text>
            <div class="spinner-container mb-8">
              <v-progress-circular indeterminate color="primary" size="80" width="4"></v-progress-circular>
              <v-icon color="primary" class="center-icon" size="32">mdi-robot-outline</v-icon>
            </div>
            <h3 class="text-h5 text-white font-weight-black mb-4">PC-Fit 엔진 가동 중...</h3>
            <div class="loading-steps text-left px-4">
              <div class="d-flex align-center mb-2 opacity-80">
                <v-icon size="small" :color="loadingStep >= 1 ? 'success' : 'grey'" class="mr-2">
                  {{ loadingStep >= 1 ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                </v-icon>
                <span class="text-caption font-weight-bold" :class="{'text-success': loadingStep >= 1}">[1/3] Supabase DB &amp; V-Combo 부품 매칭</span>
              </div>
              <div class="d-flex align-center mb-2 opacity-80">
                <v-icon size="small" :color="loadingStep >= 2 ? 'success' : (loadingStep === 1 ? 'primary' : 'grey')" class="mr-2" :class="{ spinner: loadingStep === 1 }">
                  {{ loadingStep >= 2 ? 'mdi-check-circle' : (loadingStep === 1 ? 'mdi-loading' : 'mdi-circle-outline') }}
                </v-icon>
                <span class="text-caption font-weight-bold" :class="{'text-primary': loadingStep === 1, 'text-success': loadingStep >= 2}">[2/3] 네이버 이미지 &amp; 가격비교 링크 연동 중...</span>
              </div>
              <div class="d-flex align-center opacity-80">
                <v-icon size="small" :color="loadingStep >= 3 ? 'success' : (loadingStep === 2 ? 'primary' : 'grey')" class="mr-2" :class="{ spinner: loadingStep === 2 }">
                  {{ loadingStep >= 3 ? 'mdi-check-circle' : (loadingStep === 2 ? 'mdi-loading' : 'mdi-circle-outline') }}
                </v-icon>
                <span class="text-caption font-weight-bold" :class="{'text-primary': loadingStep === 2, 'text-success': loadingStep >= 3}">[3/3] 소켓·전력 호환성 및 예상 성능 산출 완료</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'BuilderPage',
  data() {
    return {
      step: 1,
      purposes: [
        { id: 'gaming', title: '게이밍', icon: 'mdi-controller-classic', programs: ['배틀그라운드', '발로란트', '오버워치2', '로스트아크', '스팀 패키지 게임'] },
        { id: 'work', title: '전문 작업', icon: 'mdi-monitor-dashboard', programs: ['프리미어 프로', '애프터 이펙트', '블렌더 (3D)', '포토샵/일러스트', '오토캐드'] },
        { id: 'stream', title: '방송용', icon: 'mdi-microphone-variant', programs: ['OBS Studio', '프릭샷', '투컴 방송 캡처보드용', '버튜버 (VTube Studio)'] },
        { id: 'office', title: '사무/가정용', icon: 'mdi-coffee-outline', programs: ['엑셀/워드', '웹서핑/유튜브', '넷플릭스 4K', '간단한 캐주얼 게임'] }
      ],
      selection: {
        purpose: 'gaming',
        program: '',
        budget: 150,
        brand: '상관없음',
        model: 'claude'
      },
      loadingStep: 0
    };
  },
  computed: {
    ...mapState('build', ['loading']),
    availablePrograms() {
      const p = this.purposes.find(p => p.id === this.selection.purpose);
      return p ? p.programs : [];
    }
  },
  watch: {
    loading(val) {
      if (val) {
        this.loadingStep = 0;
        setTimeout(() => this.loadingStep = 1, 300); // 매칭 완료
        setTimeout(() => this.loadingStep = 2, 2500); // 연동 완료
        setTimeout(() => this.loadingStep = 3, 3000); // 최종 완료
      }
    }
  },
  methods: {
    ...mapActions('build', ['generateBuild']),
    selectPurpose(id) {
      this.selection.purpose = id;
      this.selection.program = ''; // 초기화
      this.nextStep();
    },
    nextStep() {
      if (this.step < 5) this.step++;
    },
    async submitBuildRequest() {
      const payload = {
        budget: this.selection.budget * 10000,
        usage: this.selection.purpose,
        program: this.selection.program || '',
        brand: this.selection.brand,
        model: this.selection.model
      };
      
      try {
        await this.generateBuild(payload);
        this.$router.push('/builder/result');
      } catch (err) {
        console.error('Build generation failed:', err);
        // 에러가 났더라도 계속 로딩 다이얼로그가 떠있는 것을 방지하기 위해 처리가 필요할 수 있음.
        alert('견적 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  }
};
</script>

<style scoped>
.builder-wrapper {
  position: relative;
  min-height: calc(100vh - 64px);
  overflow: hidden;
}

.background-blur {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: url('https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=50&w=600&auto=format&fit=crop') no-repeat center center / cover;
  filter: blur(10px) brightness(0.28);
  transform: scale(1.04);
  z-index: 0;
}

.glow-circle {
  position: absolute;
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 800px; height: 800px;
  background: radial-gradient(circle, rgba(255, 0, 128, 0.15), transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.z-index-1 { position: relative; z-index: 1; }

.glass-popup {
  background: linear-gradient(145deg, rgba(16, 22, 38, 0.94), rgba(10, 14, 26, 0.96)) !important;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06);
  border-radius: 24px;
}

.option-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: rgba(255, 255, 255, 0.02);
  border: 2px solid transparent !important;
}
.option-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.05);
}
.option-card.selected {
  border-color: var(--neon-pink) !important;
  background: rgba(255, 0, 128, 0.1);
  box-shadow: 0 0 30px rgba(255, 0, 128, 0.3);
}

.gap-4 { gap: 16px; }

.budget-slider :deep(.v-slider-thumb__label) {
  background: var(--neon-pink) !important;
  font-weight: bold;
}

.model-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(0,0,0,0.3);
}
.model-card:hover { transform: translateY(-5px); border-color: rgba(255, 255, 255, 0.3); }

.selected-claude { border-color: #FF6B35 !important; background: rgba(255, 107, 53, 0.1) !important; box-shadow: 0 0 20px rgba(255, 107, 53, 0.3); }
.selected-chatgpt { border-color: #10A37F !important; background: rgba(16, 163, 127, 0.1) !important; box-shadow: 0 0 20px rgba(16, 163, 127, 0.3); }
.selected-gemini { border-color: #8E44AD !important; background: rgba(142, 68, 173, 0.1) !important; box-shadow: 0 0 20px rgba(142, 68, 173, 0.3); }

.claude-bg { background: linear-gradient(135deg, #FF6B35, #F9A03F); }
.chatgpt-bg { background: linear-gradient(135deg, #10A37F, #0E8C6D); }
.gemini-bg { background: linear-gradient(135deg, #8E44AD, #3498DB); }

.generate-btn {
  box-shadow: 0 10px 30px rgba(255, 0, 128, 0.4);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.generate-btn:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 40px rgba(255, 0, 128, 0.6);
}

.spinner-container { position: relative; display: inline-block; }
.center-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

.loading-scanner {
  position: absolute; top: 0; left: 0; width: 100%; height: 2px;
  background: linear-gradient(90deg, transparent, var(--neon-pink), transparent);
  animation: scan 2s linear infinite;
}
@keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
</style>