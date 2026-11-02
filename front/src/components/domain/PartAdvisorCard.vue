<template>
  <v-card class="advisor-card glass-card-strong overflow-visible mb-8">
    <div class="advisor-glow"></div>

    <v-card-text class="pa-6 pa-md-8 position-relative z-index-1">
      <!-- Header -->
      <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-5 gap-3">
        <div class="d-flex align-center">
          <v-avatar color="rgba(0, 243, 255, 0.14)" size="52" class="mr-4 advisor-avatar">
            <v-icon color="#00f3ff" size="28">mdi-scale-balance</v-icon>
          </v-avatar>
          <div>
            <div class="d-flex align-center flex-wrap gap-2">
              <span class="text-subtitle-1 font-weight-black text-white tracking-wide">
                AI 부품 비교 &amp; 가성비 어드바이저
              </span>
              <v-chip size="x-small" color="primary" variant="flat" class="font-weight-black px-2">
                BENCHMARK AI
              </v-chip>
            </div>
            <div class="text-caption text-secondary font-weight-medium mt-1">
              현재 견적 부품을 기준으로 Supabase DB 스펙과 공인 벤치마크 레퍼런스(3DMark·퀘이사존·Cinebench)를 대조해 게임 프레임(FPS), 기준가 차이, 가성비를 분석합니다.
            </div>
          </div>
        </div>

        <v-btn
          v-if="result"
          variant="text"
          size="small"
          color="secondary"
          prepend-icon="mdi-close-circle-outline"
          @click="clearResult"
        >
          결과 접기
        </v-btn>
      </div>

      <!-- Search Input Bar -->
      <div class="advisor-search-box mb-4">
        <v-text-field
          v-model="questionInput"
          :placeholder="dynamicPlaceholder"
          variant="solo-filled"
          density="comfortable"
          bg-color="rgba(8, 12, 24, 0.75)"
          prepend-inner-icon="mdi-magnify-scan"
          hide-details
          :disabled="loading"
          class="advisor-input"
          @keyup.enter="submitQuestion()"
        >
          <template #append-inner>
            <v-btn
              color="primary"
              size="small"
              class="font-weight-black px-4 advisor-submit-btn"
              :loading="loading"
              :disabled="loading || !questionInput.trim()"
              @click="submitQuestion()"
            >
              비교 분석
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <!-- Dynamic Quick Question Chips -->
      <div class="d-flex align-center flex-wrap gap-2 mb-2">
        <span class="text-caption text-secondary font-weight-bold mr-1 d-flex align-center">
          <v-icon size="15" color="#00f3ff" class="mr-1">mdi-lightning-bolt</v-icon>
          빠른 질문:
        </span>
        <v-chip
          v-for="(chip, idx) in dynamicChips"
          :key="idx"
          size="small"
          variant="outlined"
          class="advisor-chip font-weight-bold"
          :disabled="loading"
          @click="handleChipClick(chip)"
        >
          <v-icon start size="14" :color="chip.color">{{ chip.icon }}</v-icon>
          {{ chip.label }}
        </v-chip>
      </div>

      <!-- Loading Skeleton & Spinner State -->
      <v-expand-transition>
        <div v-if="loading" class="advisor-loading-panel mt-6 pa-6 rounded-lg">
          <div class="d-flex flex-column align-center text-center mb-6">
            <v-progress-circular indeterminate color="#00f3ff" size="44" width="4" class="mb-3"></v-progress-circular>
            <div class="text-subtitle-1 font-weight-black text-cyan mb-1">
              Supabase 부품 DB 스펙과 공인 벤치마크 레퍼런스 DB를 대조 중입니다...
            </div>
            <div class="text-caption text-secondary">
              내장된 3DMark Time Spy·퀘이사존 해상도별 FPS 레퍼런스 및 DB 기준가를 기반으로 AI가 비교 지표를 계산합니다.
            </div>
          </div>
          <v-row>
            <v-col cols="12">
              <div class="skeleton-line skeleton-badge mb-3"></div>
              <div class="skeleton-line w-90 mb-2"></div>
              <div class="skeleton-line w-75 mb-4"></div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="skeleton-box"></div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="skeleton-box"></div>
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>

      <!-- Error State -->
      <v-expand-transition>
        <div v-if="!loading && errorMessage" class="advisor-error-panel mt-6 pa-5 rounded-lg d-flex flex-column flex-sm-row align-center justify-space-between gap-4">
          <div class="d-flex align-center">
            <v-icon color="error" size="28" class="mr-3">mdi-alert-octagon-outline</v-icon>
            <div>
              <div class="text-subtitle-2 font-weight-black text-error">분석 결과를 불러오지 못했습니다</div>
              <div class="text-caption text-secondary">{{ errorMessage }}</div>
            </div>
          </div>
          <v-btn
            color="error"
            variant="outlined"
            size="small"
            prepend-icon="mdi-refresh"
            class="font-weight-bold"
            @click="retryLastQuestion"
          >
            다시 시도
          </v-btn>
        </div>
      </v-expand-transition>

      <!-- 2-Tier Result Output -->
      <v-expand-transition>
        <div v-if="!loading && !errorMessage && result" class="advisor-result-container mt-6 pt-6 border-t-subtle">
          <!-- Tier 1: Verdict Badge & 3-4 Lines Summary -->
          <div class="verdict-section pa-5 rounded-lg mb-6">
            <div class="d-flex flex-wrap align-center justify-space-between gap-2 mb-4">
              <div class="verdict-badge d-inline-flex align-center px-4 py-2 rounded-pill">
                <span class="text-subtitle-2 font-weight-black text-white">
                  {{ result.verdict }}
                </span>
              </div>

              <div class="d-flex align-center gap-2 text-caption font-weight-bold">
                <span class="part-pill part-a-pill">{{ partAName }}</span>
                <span class="text-secondary font-weight-black">VS</span>
                <span class="part-pill part-b-pill">{{ partBName }}</span>
              </div>
            </div>

            <div class="summary-list d-flex flex-column gap-2">
              <div
                v-for="(line, idx) in result.summary"
                :key="idx"
                class="summary-item d-flex align-start"
              >
                <v-icon size="18" color="#00f3ff" class="mr-2 mt-1 flex-shrink-0">
                  mdi-check-circle-outline
                </v-icon>
                <span class="text-body-2 text-high-contrast leading-relaxed font-weight-medium">
                  {{ line }}
                </span>
              </div>
            </div>
          </div>

          <!-- Tier 2: Visual Comparison (Horizontal Bar Chart + Comparison Table) -->
          <v-row>
            <!-- Left: Horizontal Bar Chart -->
            <v-col cols="12" lg="6">
              <div class="comparison-subcard pa-5 rounded-lg h-100">
                <div class="d-flex align-center justify-space-between mb-4">
                  <div class="d-flex align-center">
                    <v-icon color="#00f3ff" size="20" class="mr-2">mdi-chart-bar</v-icon>
                    <span class="text-subtitle-2 font-weight-black text-white">
                      게임 프레임 &amp; 벤치마크 비교
                    </span>
                  </div>
                  <!-- Legend -->
                  <div class="d-flex align-center gap-3 text-caption">
                    <span class="d-flex align-center">
                      <span class="legend-dot dot-a mr-1"></span>
                      <span class="text-white font-weight-bold">{{ partAName }}</span>
                    </span>
                    <span class="d-flex align-center">
                      <span class="legend-dot dot-b mr-1"></span>
                      <span class="text-secondary font-weight-bold">{{ partBName }}</span>
                    </span>
                  </div>
                </div>

                <div v-if="result.chartData && result.chartData.length" class="d-flex flex-column gap-4">
                  <div
                    v-for="(item, i) in result.chartData"
                    :key="i"
                    class="chart-metric-group"
                  >
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-caption font-weight-bold text-white">{{ item.label }}</span>
                      <v-chip
                        size="x-small"
                        color="rgba(0, 243, 255, 0.15)"
                        class="diff-chip font-weight-black px-2"
                      >
                        {{ item.diffText }}
                      </v-chip>
                    </div>

                    <!-- Part A Bar -->
                    <div class="bar-row d-flex align-center mb-2">
                      <div class="bar-part-label text-caption text-truncate mr-2" :title="partAName">
                        {{ partAName }}
                      </div>
                      <div class="bar-track flex-grow-1 mr-3">
                        <div
                          class="bar-fill bar-fill-a"
                          :style="{ width: getBarWidth(item.partA_value, item.partB_value, item.partA_value) + '%' }"
                        ></div>
                      </div>
                      <div class="bar-value font-mono text-caption font-weight-black text-cyan">
                        {{ formatNumber(item.partA_value) }} {{ item.unit }}
                      </div>
                    </div>

                    <!-- Part B Bar -->
                    <div class="bar-row d-flex align-center">
                      <div class="bar-part-label text-caption text-secondary text-truncate mr-2" :title="partBName">
                        {{ partBName }}
                      </div>
                      <div class="bar-track flex-grow-1 mr-3">
                        <div
                          class="bar-fill bar-fill-b"
                          :style="{ width: getBarWidth(item.partA_value, item.partB_value, item.partB_value) + '%' }"
                        ></div>
                      </div>
                      <div class="bar-value font-mono text-caption font-weight-bold text-pink">
                        {{ formatNumber(item.partB_value) }} {{ item.unit }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-col>

            <!-- Right: Spec & Cost-Performance Comparison Table -->
            <v-col cols="12" lg="6">
              <div class="comparison-subcard pa-5 rounded-lg h-100">
                <div class="d-flex align-center mb-4">
                  <v-icon color="#ff0080" size="20" class="mr-2">mdi-table-eye</v-icon>
                  <span class="text-subtitle-2 font-weight-black text-white">
                    핵심 스펙 &amp; 가성비 비교표
                  </span>
                </div>

                <div class="table-wrapper">
                  <table class="advisor-table w-100">
                    <thead>
                      <tr>
                        <th class="text-left">비교 항목</th>
                        <th class="text-left text-cyan">{{ partAName }}</th>
                        <th class="text-left text-pink">{{ partBName }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, rIdx) in result.tableData" :key="rIdx">
                        <td class="category-cell font-weight-bold text-secondary">
                          {{ row.category }}
                        </td>
                        <td class="spec-a-cell font-weight-bold text-white">
                          {{ row.partA_spec }}
                        </td>
                        <td class="spec-b-cell font-weight-medium text-high-contrast">
                          {{ row.partB_spec }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Tier 3: Verified Benchmark & Spec Data Sources -->
          <div v-if="result.sources && result.sources.length" class="sources-section mt-5 pa-4 rounded-lg">
            <div class="d-flex flex-wrap align-center justify-space-between gap-2 mb-3">
              <div class="d-flex align-center">
                <v-icon color="success" size="18" class="mr-2">mdi-shield-check-outline</v-icon>
                <span class="text-caption font-weight-black text-white text-uppercase tracking-wide">
                  분석 데이터 출처 및 실측 검증 근거 (Verified Data Sources)
                </span>
              </div>
              <div class="d-flex align-center flex-wrap gap-2">
                <v-chip
                  v-if="result.verification_meta?.dbMatchedCount > 0"
                  size="x-small"
                  color="success"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  Supabase DB 실측 스펙 {{ result.verification_meta.dbMatchedCount }}건 직접 대조됨
                </v-chip>
                <v-chip
                  size="x-small"
                  color="info"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  공인 벤치마크 레퍼런스 교차 검증
                </v-chip>
              </div>
            </div>

            <div class="sources-grid d-flex flex-column flex-md-row flex-wrap gap-2">
              <div
                v-for="(src, sIdx) in result.sources"
                :key="sIdx"
                class="source-item pa-2 px-3 rounded d-flex align-start"
              >
                <v-icon size="14" color="#00f3ff" class="mr-2 mt-1 flex-shrink-0">mdi-database-check-outline</v-icon>
                <div>
                  <div class="text-caption font-weight-bold text-white">{{ src.name }}</div>
                  <div class="text-caption text-secondary" style="font-size: 0.72rem;">{{ src.detail }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'PartAdvisorCard',
  props: {
    parts: { type: Object, default: () => ({}) },
    totalPrice: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
    usage: { type: String, default: 'gaming' },
    program: { type: String, default: '' },
    advisorQuestions: { type: Array, default: () => [] },
    aiModel: { type: String, default: 'gemini' }
  },
  data() {
    return {
      questionInput: '',
      lastQuestion: '',
      loading: false,
      errorMessage: '',
      result: null
    };
  },
  computed: {
    gpuName() {
      return this.parts?.gpu?.name || '';
    },
    cpuName() {
      return this.parts?.cpu?.name || '';
    },
    usageContextLabel() {
      if (this.program && this.program !== '기타') {
        return this.program;
      }
      const map = {
        gaming: '실제 게임 환경',
        work: '전문 작업·렌더링 환경',
        stream: '실시간 방송·인코딩 환경',
        office: '사무·멀티태스킹 환경'
      };
      return map[this.usage] || '실사용 환경';
    },
    dynamicPlaceholder() {
      const gpuShort = this.shortenPartName(this.gpuName);
      const cpuShort = this.shortenPartName(this.cpuName);
      const cheaperGpu = this.shortenPartName(this.parts?.gpu?.alternatives?.cheaper?.name);
      if (gpuShort && cheaperGpu) {
        return `예) ${this.usageContextLabel} 기준으로 ${gpuShort} 대신 ${cheaperGpu}로 변경하면 성능과 가격이 얼마나 차이 날까?`;
      }
      if (gpuShort && cpuShort) {
        return `예) ${this.usageContextLabel}에서 ${gpuShort}와 ${cpuShort} 조합의 가성비 대안 부품을 비교해줘`;
      }
      return '비교하고 싶은 부품이나 가성비 고민을 자유롭게 입력해 보세요.';
    },
    dynamicChips() {
      const palette = [
        { icon: 'mdi-expansion-card', color: '#00f3ff' },
        { icon: 'mdi-cpu-64-bit', color: '#bc13fe' },
        { icon: 'mdi-scale-balance', color: '#ff0080' },
        { icon: 'mdi-memory', color: '#00e676' }
      ];

      // 1순위: 백엔드 AI 리뷰가 현재 견적 기반으로 생성한 맞춤형 질문이 도착한 경우 우선 활용
      if (Array.isArray(this.advisorQuestions) && this.advisorQuestions.length > 0) {
        const validAiChips = this.advisorQuestions
          .filter(q => q && q.label && q.query)
          .slice(0, 3)
          .map((q, idx) => ({
            label: String(q.label).trim(),
            query: String(q.query).trim(),
            icon: palette[idx % palette.length].icon,
            color: palette[idx % palette.length].color
          }));
        if (validAiChips.length > 0) {
          return validAiChips;
        }
      }

      // 2순위: 현재 견적의 실제 부품(parts) 및 엔진이 계산한 실제 대안 부품(alternatives), 가격, 용도 기반 동적 생성
      const chips = [];
      const gpu = this.parts?.gpu;
      const cpu = this.parts?.cpu;
      const ram = this.parts?.ram;
      const mb = this.parts?.motherboard;

      if (gpu && gpu.name) {
        const gpuShort = this.shortenPartName(gpu.name);
        const gpuPrice = Number(gpu.price || gpu.estimatedPrice || 0);
        const cheaperGpu = gpu.alternatives?.cheaper;
        const betterGpu = gpu.alternatives?.better;

        if (cheaperGpu && cheaperGpu.name) {
          const altShort = this.shortenPartName(cheaperGpu.name);
          const altPrice = Number(cheaperGpu.specs?.estimatedPrice || cheaperGpu.specs?.Price || cheaperGpu.price || 0);
          const diffMan = gpuPrice > altPrice && altPrice > 0 ? Math.max(1, Math.round((gpuPrice - altPrice) / 10000)) : null;
          const diffTag = diffMan ? ` (-${diffMan}만 원)` : '';
          chips.push({
            label: `${gpuShort} vs ${altShort}${diffTag} 비교`,
            query: `${this.usageContextLabel} 기준으로 현재 견적의 그래픽카드(${gpu.name})와 하위 대안 모델(${cheaperGpu.name})의 실제 성능(FPS/벤치마크) 차이와 가격 대비 가성비를 비교해줘.`,
            icon: 'mdi-expansion-card',
            color: '#00f3ff'
          });
        } else if (betterGpu && betterGpu.name) {
          const altShort = this.shortenPartName(betterGpu.name);
          const altPrice = Number(betterGpu.specs?.estimatedPrice || betterGpu.specs?.Price || betterGpu.price || 0);
          const diffMan = altPrice > gpuPrice && gpuPrice > 0 ? Math.max(1, Math.round((altPrice - gpuPrice) / 10000)) : null;
          const diffTag = diffMan ? ` (+${diffMan}만 원)` : '';
          chips.push({
            label: `${gpuShort} vs ${altShort}${diffTag} 업그레이드 비교`,
            query: `${this.usageContextLabel} 기준으로 현재 그래픽카드(${gpu.name})에서 상위 모델(${betterGpu.name})로 업그레이드할 때 추가 비용 대비 성능 향상폭이 가치 있는지 비교해줘.`,
            icon: 'mdi-expansion-card',
            color: '#00f3ff'
          });
        } else {
          chips.push({
            label: `${gpuShort} 동급·인접 등급 가성비 대안 비교`,
            query: `${this.usageContextLabel} 기준으로 현재 선택된 그래픽카드(${gpu.name}, ${Math.round(gpuPrice / 10000)}만 원)와 가장 많이 비교되는 인접 등급 GPU 대안의 실제 성능 및 가성비를 비교해줘.`,
            icon: 'mdi-expansion-card',
            color: '#00f3ff'
          });
        }
      }

      if (cpu && cpu.name) {
        const cpuShort = this.shortenPartName(cpu.name);
        const cpuPrice = Number(cpu.price || cpu.estimatedPrice || 0);
        const cheaperCpu = cpu.alternatives?.cheaper;
        const betterCpu = cpu.alternatives?.better;

        if (cheaperCpu && cheaperCpu.name) {
          const altShort = this.shortenPartName(cheaperCpu.name);
          const altPrice = Number(cheaperCpu.specs?.estimatedPrice || cheaperCpu.specs?.Price || cheaperCpu.price || 0);
          const diffMan = cpuPrice > altPrice && altPrice > 0 ? Math.max(1, Math.round((cpuPrice - altPrice) / 10000)) : null;
          const diffTag = diffMan ? ` (-${diffMan}만 원)` : '';
          chips.push({
            label: `${cpuShort} vs ${altShort}${diffTag} 비교`,
            query: `${this.usageContextLabel} 기준으로 현재 CPU(${cpu.name})를 대안 모델(${cheaperCpu.name})로 낮췄을 때 하위 1% 프레임·작업 속도와 절감 비용을 비교해줘.`,
            icon: 'mdi-cpu-64-bit',
            color: '#bc13fe'
          });
        } else if (betterCpu && betterCpu.name) {
          const altShort = this.shortenPartName(betterCpu.name);
          chips.push({
            label: `${cpuShort} vs ${altShort} 체감 성능 비교`,
            query: `${this.usageContextLabel} 기준으로 현재 CPU(${cpu.name})와 상위 모델(${betterCpu.name}) 간의 체감 성능 및 가격 차이를 비교해줘.`,
            icon: 'mdi-cpu-64-bit',
            color: '#bc13fe'
          });
        } else {
          chips.push({
            label: `${cpuShort} 동급 가성비 CPU 비교`,
            query: `${this.usageContextLabel} 기준으로 현재 CPU(${cpu.name}, ${Math.round(cpuPrice / 10000)}만 원)와 경쟁 등급 CPU 모델의 실제 게임·작업 성능 및 가성비를 비교해줘.`,
            icon: 'mdi-cpu-64-bit',
            color: '#bc13fe'
          });
        }
      }

      // 3번째 칩: 실제 목표 예산(budget)과 현재 총액(totalPrice) 및 실제 구성된 부품 기반 맞춤 질문
      const budgetWon = this.budget >= 10000 ? this.budget : this.budget * 10000;
      const totalWon = Number(this.totalPrice || 0);
      const gpuShort = this.shortenPartName(gpu?.name);
      const cpuShort = this.shortenPartName(cpu?.name);
      const ramShort = this.shortenPartName(ram?.name);
      const mbShort = this.shortenPartName(mb?.name);

      if (budgetWon > 0 && totalWon > budgetWon) {
        const overMan = Math.max(1, Math.round((totalWon - budgetWon) / 10000));
        chips.push({
          label: `예산 +${overMan}만 원 초과분 절감: ${gpuShort || 'GPU'} vs ${cpuShort || 'CPU'} 다이어트 비교`,
          query: `목표 예산(${Math.round(budgetWon / 10000)}만 원)보다 현재 견적(${Math.round(totalWon / 10000)}만 원)이 약 ${overMan}만 원 높은 상태야. ${this.usageContextLabel} 성능 손실을 최소화하려면 ${gpu?.name || 'GPU'}와 ${cpu?.name || 'CPU'}(또는 ${mb?.name || '메인보드'}) 중 어디를 조정하는 게 가장 이득인지 비교해줘.`,
          icon: 'mdi-piggy-bank-outline',
          color: '#ff0080'
        });
      } else if (budgetWon > 0 && budgetWon - totalWon >= 50000) {
        const remainMan = Math.round((budgetWon - totalWon) / 10000);
        chips.push({
          label: `여유 예산 ${remainMan}만 원 투자: ${gpuShort || 'GPU'} vs ${cpuShort || 'CPU'} 업그레이드 비교`,
          query: `목표 예산(${Math.round(budgetWon / 10000)}만 원) 대비 현재 견적(${Math.round(totalWon / 10000)}만 원)에서 약 ${remainMan}만 원 여유가 있어. ${this.usageContextLabel} 체감 성능을 가장 크게 높이려면 ${gpu?.name || 'GPU'}와 ${cpu?.name || 'CPU'} 중 어디에 투자하는 게 좋을지 비교해줘.`,
          icon: 'mdi-trending-up',
          color: '#ff0080'
        });
      } else if (ramShort || mbShort) {
        chips.push({
          label: `${mbShort || '메인보드'}·${ramShort || 'RAM'} 가성비 대안 비교`,
          query: `현재 견적의 ${cpu?.name || ''} + ${gpu?.name || ''} 조합에서 ${mb?.name || '메인보드'}와 ${ram?.name || '메모리'} 구성이 가성비 측면에서 적정한지, 한 단계 가성비 부품으로 바꿨을 때 차이를 비교해줘.`,
          icon: 'mdi-scale-balance',
          color: '#ff0080'
        });
      }

      return chips;
    },
    partAName() {
      if (!this.result) return '';
      return this.result.partA_name || this.result[' partA_name'] || this.shortenPartName(this.gpuName) || '기준 부품';
    },
    partBName() {
      if (!this.result) return '';
      return this.result.partB_name || '비교 대상 부품';
    }
  },
  methods: {
    shortenPartName(rawName) {
      if (!rawName) return '';
      const s = String(rawName).trim();
      const gpuMatch = s.match(/(RTX\s*\d{4}(?:\s*Ti\s*SUPER|\s*Ti|\s*SUPER)?|RX\s*\d{4}(?:\s*XTX|\s*XT|\s*GRE)?|Arc\s*[AB]\d{3})/i);
      if (gpuMatch) return gpuMatch[1].replace(/\s+/g, ' ').toUpperCase();
      const cpuMatch = s.match(/(Core\s*Ultra\s*\d\s*\d{3}[A-Z]*|i[3579][-\s]\d{4,5}[A-Z]*|Ryzen\s*[3579]\s*\d{4}[A-Z0-9]*|라이젠\s*[3579]\s*\d{4}[A-Z0-9]*)/i);
      if (cpuMatch) return cpuMatch[1].replace(/\s+/g, ' ');
      const ramMatch = s.match(/(DDR[45][-\s]?\d{4}[^\s]*\s*\d+GB|\d+GB\s*DDR[45])/i);
      if (ramMatch) return ramMatch[1].replace(/\s+/g, ' ');
      const mbMatch = s.match(/([ABXZ]\d{3}[A-Z]*(?:-[A-Z0-9]+)?)/i);
      if (mbMatch) return mbMatch[1].toUpperCase();
      return s.length > 24 ? `${s.slice(0, 22)}…` : s;
    },
    handleChipClick(chip) {
      this.questionInput = chip.query;
      this.submitQuestion(chip.query);
    },
    async submitQuestion(customQuery) {
      const q = (customQuery || this.questionInput || '').trim();
      if (!q || this.loading) return;

      this.lastQuestion = q;
      this.loading = true;
      this.errorMessage = '';

      try {
        const res = await api.post('recommend/compare-advisor', {
          question: q,
          currentBuild: this.parts,
          totalPrice: this.totalPrice,
          budget: this.budget,
          usage: this.usage,
          program: this.program,
          model: this.aiModel
        });

        if (res.data?.success && res.data?.data) {
          this.result = res.data.data;
        } else {
          throw new Error(res.data?.error || '유효한 분석 결과를 받지 못했습니다.');
        }
      } catch (err) {
        console.error('[PartAdvisorCard] Error:', err);
        this.errorMessage =
          err.response?.data?.error ||
          err.message ||
          '네트워크 또는 AI 서버 응답 지연이 발생했습니다. 다시 시도해 주세요.';
      } finally {
        this.loading = false;
      }
    },
    retryLastQuestion() {
      const q = this.lastQuestion || this.questionInput;
      if (q) {
        this.submitQuestion(q);
      }
    },
    clearResult() {
      this.result = null;
      this.errorMessage = '';
    },
    getBarWidth(valA, valB, targetVal) {
      const a = Number(valA) || 0;
      const b = Number(valB) || 0;
      const t = Number(targetVal) || 0;
      const max = Math.max(a, b, 1);
      return Math.min(Math.max(Math.round((t / max) * 100), 12), 100);
    },
    formatNumber(val) {
      const num = Number(val);
      return Number.isNaN(num) ? val : num.toLocaleString();
    }
  }
};
</script>

<style scoped>
.advisor-card {
  position: relative;
  border: 1px solid rgba(0, 243, 255, 0.35) !important;
  background: linear-gradient(145deg, rgba(12, 16, 32, 0.92), rgba(18, 12, 34, 0.92)) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), 0 0 20px rgba(0, 243, 255, 0.08);
}

.advisor-glow {
  position: absolute;
  top: -30px;
  left: -30px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(0, 243, 255, 0.12), transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.advisor-avatar {
  border: 1px solid rgba(0, 243, 255, 0.4);
  box-shadow: 0 0 15px rgba(0, 243, 255, 0.25);
}

.advisor-input :deep(.v-field) {
  border: 1px solid rgba(0, 243, 255, 0.3) !important;
  border-radius: 10px;
  transition: all 0.25s ease;
}

.advisor-input :deep(.v-field--focused) {
  border-color: #00f3ff !important;
  box-shadow: 0 0 16px rgba(0, 243, 255, 0.25);
}

.advisor-chip {
  border-color: rgba(255, 255, 255, 0.18) !important;
  background: rgba(255, 255, 255, 0.04) !important;
  color: #e2e8f0 !important;
  cursor: pointer;
  transition: all 0.2s ease;
}

.advisor-chip:hover {
  border-color: #00f3ff !important;
  background: rgba(0, 243, 255, 0.12) !important;
  transform: translateY(-1px);
}

.border-t-subtle {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Loading & Error Panels */
.advisor-loading-panel {
  background: rgba(0, 0, 0, 0.35);
  border: 1px dashed rgba(0, 243, 255, 0.3);
}

.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(0,243,255,0.15) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
}

.skeleton-badge {
  width: 260px;
  height: 28px;
  border-radius: 14px;
}

.skeleton-box {
  height: 160px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
}

.w-90 { width: 90%; }
.w-75 { width: 75%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.advisor-error-panel {
  background: rgba(244, 67, 54, 0.08);
  border: 1px solid rgba(244, 67, 54, 0.35);
}

/* Verdict & Summary */
.verdict-section {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 243, 255, 0.22);
}

.verdict-badge {
  background: linear-gradient(90deg, rgba(0, 243, 255, 0.25), rgba(188, 19, 254, 0.25));
  border: 1px solid rgba(0, 243, 255, 0.5);
  box-shadow: 0 0 14px rgba(0, 243, 255, 0.2);
}

.part-pill {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
}

.part-a-pill {
  background: rgba(0, 243, 255, 0.15);
  border: 1px solid rgba(0, 243, 255, 0.45);
  color: #00f3ff;
}

.part-b-pill {
  background: rgba(255, 0, 128, 0.15);
  border: 1px solid rgba(255, 0, 128, 0.45);
  color: #ff66b2;
}

/* Chart & Table Subcards */
.comparison-subcard {
  background: rgba(8, 10, 20, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-a {
  background: #00f3ff;
  box-shadow: 0 0 6px #00f3ff;
}

.dot-b {
  background: #ff0080;
  box-shadow: 0 0 6px #ff0080;
}

.diff-chip {
  color: #00f3ff !important;
  border: 1px solid rgba(0, 243, 255, 0.35);
}

.bar-part-label {
  width: 115px;
  flex-shrink: 0;
}

.bar-track {
  height: 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bar-fill-a {
  background: linear-gradient(90deg, #00c6ff, #00f3ff);
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
}

.bar-fill-b {
  background: linear-gradient(90deg, #bc13fe, #ff0080);
  box-shadow: 0 0 10px rgba(255, 0, 128, 0.4);
}

.bar-value {
  width: 90px;
  text-align: right;
  flex-shrink: 0;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.advisor-table {
  border-collapse: collapse;
  font-size: 0.85rem;
}

.advisor-table th {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  font-weight: 800;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
}

.advisor-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  vertical-align: top;
  line-height: 1.45;
}

.advisor-table tr:last-child td {
  border-bottom: none;
}

.category-cell {
  width: 28%;
  white-space: nowrap;
}

.spec-a-cell {
  width: 36%;
  background: rgba(0, 243, 255, 0.03);
}

.spec-b-cell {
  width: 36%;
  background: rgba(255, 0, 128, 0.03);
}

.sources-section {
  background: rgba(8, 12, 24, 0.72);
  border: 1px solid rgba(0, 230, 118, 0.22);
}

.source-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex: 1 1 280px;
}

.text-cyan { color: #00f3ff !important; }
.text-pink { color: #ff66b2 !important; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.font-mono { font-family: 'JetBrains Mono', monospace; }
</style>
