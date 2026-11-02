<template>
  <div class="performance-dashboard pa-6 glass-card border-neon-cyan">
    <div class="d-flex align-center mb-6">
      <v-icon color="primary" class="mr-2">mdi-chart-bell-curve-cumulative</v-icon>
      <span class="text-subtitle-1 font-weight-bold text-uppercase tracking-widest text-primary">시스템 성능 리포트</span>
    </div>

    <!-- Build Score Circular Gauge -->
    <div class="d-flex justify-center mb-8">
      <div class="score-circle-wrapper">
        <v-progress-circular
          :model-value="score"
          :size="160"
          :width="12"
          color="primary"
          class="score-circle"
        >
          <div class="text-center">
            <div class="text-h3 font-weight-black neon-text-cyan">{{ score }}</div>
            <div class="text-caption text-secondary font-weight-bold">점수</div>
          </div>
        </v-progress-circular>
        <div class="score-glow"></div>
      </div>
    </div>

    <!-- FPS Bar Chart -->
    <div class="fps-section mb-8">
      <div class="text-caption text-secondary font-weight-bold mb-4 text-uppercase">예상 게이밍 FPS (1440p)</div>
      
      <div v-for="(fps, game) in gameFps" :key="game" class="mb-4">
        <div class="d-flex justify-space-between mb-1 px-1">
          <span class="text-body-2 font-weight-bold text-white text-uppercase">{{ gameMap[game] || game }}</span>
          <span class="text-body-2 font-weight-black text-primary">{{ fps }} FPS</span>
        </div>
        <div class="fps-bar-bg">
          <div 
            class="fps-bar-fill" 
            :style="{ width: Math.min((fps / 240) * 100, 100) + '%' }"
          >
            <div class="fps-bar-glow"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottleneck Analysis Section -->
    <div v-if="bottleneck" class="bottleneck-section pt-6 border-t">
      <div class="text-caption text-secondary font-weight-bold mb-4 text-uppercase">병목 현상 분석</div>
      
      <div class="d-flex align-center gap-4 mb-4">
        <v-progress-circular
          :model-value="bottleneck.percentage"
          :size="50"
          :width="5"
          :color="bottleneck.color"
        >
          <span class="text-caption font-weight-black">{{ bottleneck.percentage }}%</span>
        </v-progress-circular>
        <div>
          <div class="text-body-2 font-weight-black" :class="`text-${bottleneck.color}`">
            {{ bottleneckStatusText }}
          </div>
          <div class="text-caption text-secondary leading-tight mb-2">{{ bottleneck.message }}</div>
          
          <!-- Auto Optimization Button -->
          <v-btn
            v-if="bottleneck.status !== 'balanced'"
            size="x-small"
            color="primary"
            variant="flat"
            class="optimize-btn px-4 mt-1"
            prepend-icon="mdi-auto-fix"
            @click="$emit('optimize')"
          >
            AI 밸런스 자동 최적화
          </v-btn>
        </div>
      </div>
    </div>

    <!-- 호환성 검증 결과 (NEW) -->
    <div class="compatibility-section pt-6 border-t mt-4">
      <div class="text-caption text-secondary font-weight-bold mb-4 text-uppercase">
        <v-icon size="16" class="mr-1">mdi-shield-check</v-icon>
        호환성 검증 결과
      </div>
      
      <div v-if="compatChecks.length > 0" class="d-flex flex-column gap-2">
        <div v-for="(check, i) in compatChecks" :key="i" 
          class="compat-item d-flex align-center pa-2 rounded"
          :class="check.ok ? 'compat-ok' : 'compat-error'"
        >
          <v-icon :color="check.ok ? 'success' : 'error'" size="16" class="mr-2">
            {{ check.ok ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          <span class="text-caption font-weight-bold flex-grow-1">{{ check.label }}</span>
          <span class="text-tiny font-weight-black" :class="check.ok ? 'text-success' : 'text-error'">
            {{ check.ok ? '확인됨' : '주의' }}
          </span>
        </div>
      </div>

      <div v-else class="text-center py-4">
        <v-icon size="32" color="grey" class="mb-2 opacity-30">mdi-shield-outline</v-icon>
        <div class="text-caption text-secondary opacity-50">호환성 데이터를 불러오는 중...</div>
      </div>

      <!-- 호환성 경고 상세 -->
      <div v-if="compatWarnings.length > 0" class="mt-4">
        <v-alert
          v-for="(warn, i) in compatWarnings" :key="'w'+i"
          :type="warn.severity === 'error' ? 'error' : 'warning'"
          variant="tonal"
          density="compact"
          class="mb-2 compat-warning-alert"
        >
          <div class="text-caption font-weight-bold">{{ warn.message }}</div>
        </v-alert>
      </div>
    </div>
    
    <div class="text-center mt-6">
      <v-chip size="x-small" color="secondary" variant="tonal" class="px-3">
        <v-icon start size="10">mdi-information</v-icon>
        퀘이사존·TechPowerUp QHD 벤치마크 레퍼런스 및 CPU/GPU 스코어 기반 산출치입니다.
      </v-chip>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PerformanceChart',
  props: {
    score: { type: Number, default: 0 },
    gameFps: { type: Object, default: () => ({}) },
    bottleneck: { type: Object, default: null },
    compatibility: { type: Object, default: () => ({ isCompatible: true, warnings: [] }) },
    parts: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      gameMap: {
        pubg: '배틀그라운드',
        cyberpunk: '사이버펑크 2077',
        valorant: '발로란트',
        league: '리그 오브 레전드',
        palworld: '팰월드',
        diablo4: '디아블로 IV',
        lostark: '로스트아크',
        gta5: 'GTA V'
      }
    };
  },
  computed: {
    bottleneckStatusText() {
      if (!this.bottleneck) return '';
      const map = {
        balanced: '최적의 밸런스',
        cpu_bottleneck: 'CPU 병목 주의',
        gpu_bottleneck: 'GPU 성능 부족'
      };
      return map[this.bottleneck.status] || '분석 중';
    },
    compatWarnings() {
      return this.compatibility?.warnings || [];
    },
    compatChecks() {
      const checks = [];
      const p = this.parts || {};
      
      // CPU ↔ 메인보드 소켓 호환
      if (p.cpu?.socket && p.motherboard?.socket) {
        const cpuSocket = p.cpu.socket;
        const mbSocket = p.motherboard.socket;
        checks.push({
          label: `CPU 소켓 (${cpuSocket}) ↔ 메인보드 소켓 (${mbSocket})`,
          ok: cpuSocket === mbSocket
        });
      } else if (p.cpu || p.motherboard) {
        checks.push({
          label: 'CPU ↔ 메인보드 소켓 호환성',
          ok: false
        });
      }

      // RAM ↔ 메인보드 타입
      if (p.ram?.ramType && p.motherboard?.ramType) {
        checks.push({
          label: `RAM 타입 (${p.ram.ramType}) ↔ 메인보드 지원 (${p.motherboard.ramType})`,
          ok: p.ram.ramType === p.motherboard.ramType
        });
      } else if (p.ram && p.motherboard) {
        checks.push({
          label: 'RAM ↔ 메인보드 메모리 타입',
          ok: !this.compatWarnings.some(w => w.message?.includes('RAM') || w.message?.includes('메모리'))
        });
      }

      // 파워 용량
      if (p.psu?.wattage) {
        const totalTdp = (p.cpu?.tdp || 0) + (p.gpu?.tdp || 0);
        const minPsu = Math.ceil(totalTdp * 1.2);
        const psuOk = p.psu.wattage >= minPsu;
        checks.push({
          label: `파워 용량 (${p.psu.wattage}W) — 최소 필요: ${minPsu}W`,
          ok: psuOk
        });
      }

      // 쿨러 소켓
      if (p.cooler?.socket && p.cpu?.socket) {
        const coolerSockets = Array.isArray(p.cooler.socket) ? p.cooler.socket : [p.cooler.socket];
        const coolerOk = coolerSockets.some(s => s === p.cpu.socket);
        checks.push({
          label: `쿨러 소켓 호환 — CPU (${p.cpu.socket})`,
          ok: coolerOk
        });
      }

      // 호환성 엔진이 결과를 전달한 경우 추가 표시
      if (this.compatibility?.isCompatible !== undefined && checks.length === 0) {
        checks.push({
          label: '전체 시스템 호환성',
          ok: this.compatibility.isCompatible
        });
      }

      return checks;
    }
  }
};
</script>

<style scoped>
.performance-dashboard {
  background: rgba(10, 10, 20, 0.6) !important;
  position: relative;
  overflow: hidden;
}

.score-circle-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.score-circle {
  filter: drop-shadow(0 0 10px rgba(0, 243, 255, 0.3));
}

.score-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(0, 243, 255, 0.15) 0%, transparent 70%);
  z-index: -1;
}

.fps-bar-bg {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.fps-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--neon-cyan), #bc13fe);
  border-radius: 4px;
  position: relative;
  transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fps-bar-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: white;
  filter: blur(4px);
  opacity: 0.5;
}

.border-t {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
.leading-tight { line-height: 1.3; }
.tracking-widest { letter-spacing: 0.2em; }

.optimize-btn {
  font-weight: 800;
  letter-spacing: 0;
  animation: pulse-neon 2s infinite;
}

@keyframes pulse-neon {
  0% { box-shadow: 0 0 5px var(--neon-cyan); }
  50% { box-shadow: 0 0 15px var(--neon-cyan); }
  100% { box-shadow: 0 0 5px var(--neon-cyan); }
}

/* 호환성 검증 스타일 */
.compat-item {
  transition: all 0.2s ease;
}

.compat-ok {
  background: rgba(76, 175, 80, 0.06);
  border: 1px solid rgba(76, 175, 80, 0.15);
}

.compat-error {
  background: rgba(244, 67, 54, 0.06);
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.compat-item:hover {
  filter: brightness(1.3);
}

.compat-warning-alert {
  font-size: 0.75rem;
}

.text-tiny { font-size: 0.65rem; }
</style>
