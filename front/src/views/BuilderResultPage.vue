<template>
  <div class="result-wrapper">
    <v-container fluid class="pa-4 pa-md-8 px-lg-16 position-relative z-index-1">
      <!-- Dashboard Header -->
      <div class="dashboard-header d-flex flex-column flex-md-row justify-space-between align-end mb-8 fade-in-up">
        <div class="title-group flex-grow-1">
          <v-chip color="primary" variant="tonal" size="small" class="mb-2 font-weight-black px-4">
            HYBRID ENGINE BUILD COMPLETE
          </v-chip>
          <h2 class="responsive-title font-weight-black text-white tracking-tighter" :title="title">
            {{ title || 'PC-FIT 추천 견적' }}
          </h2>
        </div>
        
        <div class="action-group d-flex gap-4 mt-6 mt-md-0">
          <v-btn variant="outlined" color="secondary" to="/builder" prepend-icon="mdi-refresh" class="font-weight-black">새 견적</v-btn>
          <v-btn 
            color="primary" 
            size="large"
            @click="handleSaveBuild"
            :loading="saving"
            :disabled="!isComplete || saved"
            class="save-btn font-weight-black"
          >
            <v-icon left class="mr-2">{{ saved ? 'mdi-check-circle' : 'mdi-content-save' }}</v-icon>
            {{ saved ? '저장 완료' : '시스템 저장' }}
          </v-btn>
        </div>
      </div>

      <!-- AI Overall Summary Panel -->
      <v-row class="mb-8 fade-in-up delay-1">
        <v-col cols="12">
          <v-card class="glass-card-strong summary-panel overflow-visible">
            <v-card-text class="pa-6 pa-md-10">
              <div class="d-flex align-center justify-space-between mb-6">
                <div class="d-flex align-center">
                  <v-avatar color="primary" size="64" class="mr-6 glow-avatar">
                    <v-icon color="white" size="32">mdi-robot-outline</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-black text-primary text-uppercase tracking-widest">Expert System Analysis</div>
                    <div class="text-caption text-secondary font-weight-bold">본 견적에 대한 하드웨어 전문가의 최종 분석 리포트입니다.</div>
                  </div>
                </div>
                <v-btn 
                  v-if="overall_summary && detailed_review"
                  variant="outlined" 
                  color="primary" 
                  @click="showDetailedReview = !showDetailedReview"
                >
                  {{ showDetailedReview ? '요약 보기' : '상세 리포트 보기' }}
                  <v-icon right>{{ showDetailedReview ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </v-btn>
              </div>

              <!-- AI Loading State -->
              <div v-if="reviewLoading || (!overall_summary && !reviewError)" class="ai-loading-container text-center py-8">
                 <v-progress-circular indeterminate color="primary" size="40" class="mb-4"></v-progress-circular>
                 <div class="text-h6 text-cyan mb-2">AI 전문가가 견적을 꼼꼼히 분석하고 있습니다...</div>
                 <div class="text-caption text-secondary">병목 현상 및 가성비를 체크하는 중입니다. (약 3~5초 소요)</div>
              </div>

              <!-- AI Error State (무한로딩 방지) -->
              <div v-else-if="!overall_summary && reviewError" class="ai-error-container d-flex flex-column flex-sm-row align-center justify-space-between pa-5 mb-4 rounded bg-dark-soft border-opacity-25 border-error">
                <div class="d-flex align-center mb-3 mb-sm-0">
                  <v-icon color="error" size="28" class="mr-3">mdi-alert-circle-outline</v-icon>
                  <div>
                    <div class="text-subtitle-2 font-weight-black text-error">AI 전문가 분석 리포트를 불러오지 못했습니다</div>
                    <div class="text-caption text-secondary">{{ reviewError }}</div>
                  </div>
                </div>
                <v-btn color="primary" variant="outlined" size="small" prepend-icon="mdi-refresh" @click="retryAiReview">
                  리포트 다시 생성
                </v-btn>
              </div>
              
              <template v-else>
                <v-expand-transition>
                  <div v-if="showDetailedReview && detailed_review" class="text-body-1 text-secondary leading-relaxed font-weight-regular pre-wrap mb-4 pa-4 rounded bg-dark-soft border-opacity-10 border-primary">
                    {{ detailed_review }}
                  </div>
                </v-expand-transition>
                
                <p class="text-h6 text-high-contrast leading-relaxed font-weight-medium pre-wrap italic mb-6">
                  "{{ overall_summary }}"
                </p>
              </template>

              <!-- 채팅 UI 추가 -->
              <template v-if="overall_summary || reviewError">
                <v-divider class="mb-4 border-opacity-15"></v-divider>
                <div class="chat-swap-section">
                  <div class="d-flex align-center mb-2">
                    <v-icon color="#ff0080" size="20" class="mr-2">mdi-magic-staff</v-icon>
                    <span class="text-caption font-weight-bold text-pink d-flex align-center">
                      AI 부품 교체 지시 (BETA)
                      <NewbieTooltip text="마음에 안 드는 부품이 있다면 채팅으로 쳐보세요! AI가 알아서 바꿔줍니다." />
                    </span>
                  </div>
                  <v-text-field
                    v-model="chatInput"
                    placeholder="예) 그래픽카드를 더 싼 걸로 바꿔줘, 인텔 CPU로 바꿔줘"
                    variant="solo-filled"
                    density="comfortable"
                    bg-color="rgba(0,0,0,0.4)"
                    append-inner-icon="mdi-send"
                    @click:append-inner="sendSwapRequest"
                    @keyup.enter="sendSwapRequest"
                    :loading="isSwapping"
                    :disabled="isSwapping"
                    hide-details
                    class="chat-input"
                  ></v-text-field>
                  <div v-if="isSwapping" class="text-caption text-cyan mt-2">
                    <v-icon size="small" class="mdi-spin mr-1">mdi-loading</v-icon>
                    AI가 부품 DB를 스캔하여 견적을 재구성 중입니다...
                  </div>
                </div>
              </template>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- AI 부품 비교 & 가성비 어드바이저 섹션 -->
      <v-row class="mb-2 fade-in-up delay-1">
        <v-col cols="12">
          <PartAdvisorCard
            :parts="parts"
            :total-price="totalPrice"
            :budget="budget"
            :usage="usage"
            :program="program"
            :advisor-questions="advisor_questions"
            :ai-model="selectedModel || aiModel"
          />
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <!-- 좌측: 부품 그리드 및 3D 빌더 (Main Visual Area) -->
        <v-col cols="12" lg="8">


          <div class="section-label mb-4 mt-8 d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-engine-outline</v-icon>
            <span class="text-subtitle-2 font-weight-bold text-uppercase tracking-widest text-secondary">System Components</span>
            <v-divider class="ml-4 border-opacity-15"></v-divider>
          </div>

          <div class="parts-grid stagger-item mb-8">
            <PartCard 
              v-for="type in partTypes" 
              :key="type"
              :part-type="type"
              :part-data="parts[type]"
              :part-review="part_reviews?.[type]"
              :has-error="errorParts.includes(type)"
              @replace-part="handleReplacePart"
            />
          </div>
          
          <CompatibilityAlert 
            class="stagger-item" 
            :warnings="compatibility.warnings" 
          />
        </v-col>

        <!-- 우측: 분석 패널 (Analytics) -->
        <v-col cols="12" lg="4">
          <div class="analytics-sidebar d-flex flex-column gap-6">
            <!-- Performance Section (New) -->
            <div class="stagger-item">
               <PerformanceChart 
                 :score="performance_metrics?.build_score || 0"
                 :game-fps="performance_metrics?.game_fps || {}"
                 :bottleneck="performance_metrics?.bottleneck"
                 :compatibility="compatibility"
                 :parts="parts"
                 @optimize="handleAutoOptimizeBottleneck"
               />
            </div>

            <!-- Synergy & Insights Section (New) -->
            <div v-if="performance_metrics?.synergy?.length" class="stagger-item">
              <div class="section-label mb-4 d-flex align-center">
                <v-icon color="info" class="mr-2">mdi-lightbulb-variant-outline</v-icon>
                <span class="text-subtitle-2 font-weight-bold text-uppercase tracking-widest text-secondary">Expert Insights</span>
              </div>
              <div class="d-flex flex-column gap-3">
                <v-alert
                  v-for="(point, i) in performance_metrics.synergy"
                  :key="i"
                  :color="point.color"
                  variant="tonal"
                  density="compact"
                  class="synergy-alert border-opacity-25"
                  :icon="point.icon"
                >
                  <div class="text-caption font-weight-bold">{{ point.text }}</div>
                </v-alert>
              </div>
            </div>

            <!-- AI Engine Selection Reasoning -->
            <div class="stagger-item" v-if="combo_metrics && combo_metrics.reasoning && combo_metrics.reasoning.length > 0">
              <div class="section-label mb-4 d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon color="warning" class="mr-2">mdi-brain</v-icon>
                  <span class="text-subtitle-2 font-weight-bold text-uppercase tracking-widest text-secondary">AI 엔진 선정 사유</span>
                </div>
                <v-chip
                  :color="combo_metrics.grade === 'S' ? 'primary' : (combo_metrics.grade === 'A' ? 'success' : 'warning')"
                  text-color="white"
                  size="small"
                  class="font-weight-black px-4 glow-chip"
                  elevation="2"
                >
                  {{ combo_metrics.grade }}등급 매칭
                </v-chip>
              </div>
              <v-card class="glass-card mb-8 border-warning-thin">
                <v-card-text class="pa-6">
                  <div class="d-flex flex-column" style="gap: 12px;">
                    <div v-for="(reason, index) in combo_metrics.reasoning" :key="index" class="d-flex align-center">
                      <v-icon color="success" size="small" class="mr-3">mdi-check-decagram</v-icon>
                      <span class="text-body-1 font-weight-bold text-white">{{ reason }}</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- Youtube Performance Check -->
            <div class="stagger-item">
              <div class="section-label mb-4 d-flex align-center">
                <v-icon color="secondary" class="mr-2">mdi-chart-timeline-variant</v-icon>
                <span class="text-subtitle-2 font-weight-bold text-uppercase tracking-widest text-secondary">Real-world Benchmarks</span>
              </div>
              <YoutubePanel 
                :cpu="parts.cpu?.keyword || parts.cpu?.name" 
                :gpu="parts.gpu?.keyword || parts.gpu?.name" 
              />
            </div>

            <!-- Summary Section -->
            <div class="stagger-item">
              <div class="section-label mb-4 d-flex align-center">
                <v-icon color="success" class="mr-2">mdi-invoice-list-outline</v-icon>
                <span class="text-subtitle-2 font-weight-bold text-uppercase tracking-widest text-secondary">Build Summary</span>
              </div>
              <v-card class="glass-card summary-card overflow-visible">
                <!-- Decorative Glow -->
                <div class="summary-glow"></div>
                
                <v-card-text class="pa-8">
                  <div class="d-flex justify-space-between align-center mb-8">
                    <div>
                      <div class="text-caption text-secondary font-weight-bold mb-1">TOTAL ESTIMATED PRICE</div>
                      <div class="text-h3 font-weight-black neon-text-cyan font-mono tracking-tighter">
                        {{ formatPrice(totalPrice) }}
                      </div>
                    </div>
                    <v-icon color="rgba(255,255,255,0.05)" size="80" style="position: absolute; right: 20px; top: 20px;">mdi-currency-krw</v-icon>
                  </div>

                  <div class="mb-8">
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-caption text-secondary font-weight-bold d-flex align-center">
                        POWER CONSUMPTION <span class="ml-1 opacity-70" style="letter-spacing: 0;">(예상 전력)</span>
                        <NewbieTooltip text="컴퓨터가 먹는 전기량입니다. 파워 서플라이(심장)는 이 숫자보다 100~200W 여유 있게 골라야 안전합니다." />
                      </span>
                      <span class="text-caption font-weight-black text-white">{{ totalWattage }}W / {{ recommendedPsu || parts.psu?.wattage || 0 }}W</span>
                    </div>
                    <WattageGauge 
                      :current="totalWattage" 
                      :max="recommendedPsu || parts.psu?.wattage || 0" 
                    />
                  </div>
                  
                  <v-btn 
                    color="secondary" 
                    block 
                    height="64"
                    class="takeoff-btn font-weight-black text-h6"
                    :disabled="!isReadyToTakeoff"
                    @click="handleTakeoff"
                  >
                    <v-icon left class="mr-3">mdi-airplane-takeoff</v-icon>
                    이륙 심사 요청
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import api from '@/services/api';
import PartCard from '@/components/domain/PartCard.vue';
import PartAdvisorCard from '@/components/domain/PartAdvisorCard.vue';
import CompatibilityAlert from '@/components/domain/CompatibilityAlert.vue';
import WattageGauge from '@/components/domain/WattageGauge.vue';
import YoutubePanel from '@/components/domain/YoutubePanel.vue';
import PerformanceChart from '@/components/domain/PerformanceChart.vue';

import { formatPrice } from '@/utils/formatPrice';

export default {
  name: 'BuilderResultPage',
  components: { PartCard, PartAdvisorCard, CompatibilityAlert, WattageGauge, YoutubePanel, PerformanceChart },
  data() {
    return {
      partTypes: ['cpu', 'gpu', 'ram', 'motherboard', 'storage', 'psu', 'cooler', 'case'],
      saving: false,
      showDetailedReview: false,
      chatInput: '',
      isSwapping: false
    };
  },
  computed: {
    ...mapState('build', [
      'title', 'overall_summary', 'detailed_review', 'advisor_questions',
      'reviewLoading', 'reviewError', 'parts', 'part_reviews',
      'totalPrice', 'totalWattage', 'budget', 'usage', 'program',
      'recommendedPsu', 'compatibility', 'saved', 'performance_metrics',
      'combo_metrics', 'aiModel', 'selectedModel', 'prompt'
    ]),
    ...mapState('auth', ['isAuthenticated', 'user']),
    ...mapGetters('build', ['isComplete', 'isReadyToTakeoff', 'errorParts']),
    currentAiModelName() {
      if (this.aiModel === 'chatgpt') return 'ChatGPT';
      if (this.aiModel === 'gemini') return 'Gemini';
      return 'Claude';
    },
    is3DReady() {
      return Object.values(this.parts).every(p => p && p.is_3d_ready);
    }
  },
  created() {
    if (!this.parts || !this.parts.cpu) {
      this.$store.commit('build/RESTORE_LAST_BUILD');
      if (!this.parts || !this.parts.cpu) {
        this.$router.push('/builder');
      }
    }
  },
  mounted() {
    // If we have parts but no summary, trigger AI review fetch
    if (this.parts && this.parts.cpu && !this.overall_summary && !this.reviewLoading) {
       this.$store.dispatch('build/fetchAiReview');
    }
  },
  methods: {
    formatPrice,
    ...mapActions('build', ['saveBuild', 'updatePart', 'generateBuild']),
    retryAiReview() {
      this.$store.dispatch('build/fetchAiReview');
    },
    async changeAiModel(newModel) {
      if (newModel === this.aiModel) return;
      try {
        await this.generateBuild({ prompt: this.prompt, model: newModel });
        this.$store.dispatch('ui/showSuccess', '새로운 AI 모델로 리뷰가 업데이트되었습니다.');
      } catch (err) {
        console.error(err);
      }
    },
    async handleReplacePart({ type, newPart }) {
        const payload = { 
            ...newPart, 
            reason: '사용자가 대안 부품으로 교체했습니다.' 
        };
        await this.updatePart({ partType: type, partData: payload });
        this.$store.dispatch('ui/showSuccess', '부품이 교체되었습니다.');
    },
    handleAutoOptimizeBottleneck() {
      const status = this.performance_metrics?.bottleneck?.status;
      if (status === 'cpu_bottleneck') {
        this.chatInput = '현재 그래픽카드 대비 CPU 병목을 줄일 수 있도록 호환되는 상위 등급 CPU로 밸런스를 맞춰줘';
      } else if (status === 'gpu_bottleneck') {
        this.chatInput = '현재 CPU 성능에 걸맞게 그래픽카드를 한 단계 높은 등급으로 업그레이드해줘';
      } else {
        this.chatInput = 'CPU와 그래픽카드 간의 병목 현상이 없도록 최적의 밸런스로 부품을 조정해줘';
      }
      this.sendSwapRequest();
    },
    async sendSwapRequest() {
      if (!this.chatInput.trim()) return;
      this.isSwapping = true;
      try {
        const payload = {
          currentBuild: this.parts,
          userMessage: this.chatInput,
          originalPrompt: this.prompt,
          model: this.selectedModel || this.aiModel
        };
        const res = await api.post('recommend/modify-build', payload);
        const { swapped_parts, new_review } = res.data.data;
        
        if (swapped_parts && Object.keys(swapped_parts).length > 0) {
          for (const [type, partData] of Object.entries(swapped_parts)) {
            await this.updatePart({ 
              partType: type, 
              partData: { ...partData, reason: new_review || 'AI가 사용자의 지시에 따라 부품을 교체했습니다.' } 
            });
          }
          this.$store.dispatch('ui/showSuccess', '견적이 성공적으로 재구성되었습니다!');
          this.chatInput = '';
          
          if (new_review) {
             this.$store.dispatch('ui/showInfo', `[AI 코멘트] ${new_review}`);
          }
        } else {
          this.$store.dispatch('ui/showInfo', new_review || '변경할 부품이 없거나 적합한 대안을 찾지 못했습니다.');
        }
      } catch (err) {
        this.$store.dispatch('ui/showError', err.response?.data?.error || '견적 재구성에 실패했습니다.');
      } finally {
        this.isSwapping = false;
      }
    },
    async handleSaveBuild() {
      if (!this.isAuthenticated) {
        this.$store.dispatch('ui/showInfo', '견적을 저장하려면 로그인이 필요합니다.');
        this.$router.push({ path: '/auth/login', query: { redirect: this.$route.fullPath } });
        return;
      }
      this.saving = true;
      await this.saveBuild();
      this.saving = false;
    },
    async handleTakeoff() {
      if (!this.isAuthenticated) {
        this.$store.dispatch('ui/showInfo', '이륙 심사를 등록하려면 로그인이 필요합니다.');
        this.$router.push({ path: '/auth/login', query: { redirect: this.$route.fullPath } });
        return;
      }
      
      let buildIdToUse = this.$store.state.build.savedBuildId;

      if (!this.saved || !buildIdToUse) {
        buildIdToUse = await this.$store.dispatch('build/saveBuild');
        if (!buildIdToUse) return; // 저장 실패 시 중단
      }
      
      try {
        const res = await api.post('takeoffs', {
          buildId: buildIdToUse, // 저장된 견적 ID
          title: this.title,
          content: '견적 이륙 심사 부탁드립니다.',
          buildData: {
             parts: this.parts,
             totalPrice: this.totalPrice,
             totalWattage: this.totalWattage
          }
        });
        this.$store.dispatch('ui/showSuccess', '이륙 심사가 등록되었습니다!');
        this.$router.push(`/takeoff/${res.data.data.id}`);
      } catch (err) {
        this.$store.dispatch('ui/showError', '이륙 심사 등록에 실패했습니다.');
      }
    }
  }
};
</script>

<style scoped>
.result-wrapper {
  position: relative;
  min-height: calc(100vh - 64px);
}

.z-index-1 { position: relative; z-index: 1; }

.dashboard-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 24px;
}

.responsive-title {
  font-size: clamp(1.8rem, 5vw, 3.5rem);
  line-height: 1.2;
  word-break: keep-all;
  overflow-wrap: break-word;
}

.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }

.upgrade-tabs {
  background: rgba(20, 26, 44, 0.85);
}

.bg-dark-soft {
  background: rgba(0, 0, 0, 0.4) !important;
}

.parts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 960px) {
  .parts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1440px) {
  .parts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.summary-card {
  position: sticky;
  top: 100px;
}

.summary-glow {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(0, 217, 255, 0.1), transparent 70%);
  pointer-events: none;
}

.save-btn {
  box-shadow: var(--shadow-neon-pink);
}

.takeoff-btn {
  box-shadow: var(--shadow-neon-blue);
  transition: all 0.3s ease;
}

.takeoff-btn:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.5);
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}

.chat-input :deep(.v-field) {
  border: 1px solid rgba(255, 0, 128, 0.3) !important;
  border-radius: 8px;
  transition: all 0.3s;
}

.chat-input :deep(.v-field--focused) {
  border-color: #ff0080 !important;
  box-shadow: 0 0 15px rgba(255, 0, 128, 0.2);
}

.tracking-widest { letter-spacing: 0.2em; }
.tracking-tighter { letter-spacing: -0.05em; }
.leading-tight { line-height: 1.4; }
</style>
