<template>
  <section class="price-panel" aria-label="가격 변동">
    <div class="price-panel-heading"><div><span class="section-kicker">PRICE HISTORY</span><h2>가격 변동</h2></div><span class="price-state" :class="{ demo }">{{ demo ? '예시 데이터' : summary ? '등록된 가격 이력' : '가격 이력 미연결' }}</span></div>
    <p class="price-context">{{ demo ? '가상 상품의 화면 미리보기입니다. 실제 제품 가격이 아닙니다.' : productName ? `${productName} · 동일 모델과 구매 조건의 가격을 확인하세요.` : '제품을 선택하면 해당 제품의 가격 이력을 확인할 수 있습니다.' }}</p>
    <div class="price-controls"><div class="range-buttons" role="group" aria-label="가격 조회 기간"><button v-for="days in [30, 90, 365]" :key="days" :aria-pressed="range === days" @click="range = days">{{ days === 365 ? '1년' : `${days}일` }}</button></div><span>{{ demo ? '가상 상품 · 원(KRW)' : '국내 판매가 · 원(KRW)' }}</span></div>
    <template v-if="summary">
      <div class="price-metrics"><div><span>최근 기록 가격</span><strong>{{ money(summary.latest) }}<small>원</small></strong></div><div><span>기간 최저가</span><strong>{{ money(summary.low) }}<small>원</small></strong></div><div><span>기간 내 변동</span><strong :class="summary.change < 0 ? 'price-down' : ''">{{ summary.change > 0 ? '+' : '' }}{{ money(summary.change) }}<small>원</small></strong></div></div>
      <div class="chart-layout"><div class="chart-labels"><span>{{ money(summary.high) }}</span><span>{{ money(summary.low) }}</span></div><div class="price-chart"><svg viewBox="-8 -8 656 196" role="img" :aria-label="`${demo ? '예시 ' : ''}가격 추이: ${rows.length}개 기록, 최근 ${money(summary.latest)}원`" preserveAspectRatio="none"><path v-for="line in [0, 60, 120, 180]" :key="line" :d="`M0 ${line} H640`" stroke="#e5eaf2" stroke-dasharray="3 5" fill="none" /><polyline :points="points.map(p => `${p.x},${p.y}`).join(' ')" fill="none" stroke="#2459d3" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle v-for="point in points" :key="point.date" :cx="point.x" :cy="point.y" r="4" fill="#fff" stroke="#2459d3" stroke-width="2"><title>{{ point.date }} · {{ money(point.price) }}원</title></circle></svg><div class="chart-dates"><span>{{ rows[0].date }}</span><span>{{ rows.at(-1).date }}</span></div></div></div>
      <details class="price-records"><summary>날짜별 가격 기록 {{ rows.length }}건</summary><table><caption class="sr-only">{{ demo ? '가상 상품 예시 가격 기록' : `${productName} 가격 기록` }}</caption><thead><tr><th scope="col">기록일</th><th scope="col">가격</th><th scope="col">출처</th></tr></thead><tbody><tr v-for="row in [...rows].reverse()" :key="row.date"><td>{{ row.date }}</td><td>{{ money(row.price) }}원</td><td>{{ row.source || '미제공' }}</td></tr></tbody></table></details>
    </template>
    <div v-else class="price-empty"><v-icon size="36" color="secondary">mdi-chart-timeline-variant</v-icon><h3>{{ records.length ? '선택한 기간에 가격 기록이 없습니다' : '아직 가격 기록이 없어요' }}</h3><p>가격 정보가 연결되면 최저가와 날짜별 변동을 여기서 확인할 수 있어요.</p><button class="demo-button" @click="demo = true">예시 차트 보기 <v-icon size="16">mdi-arrow-right</v-icon></button></div>
    <div v-if="demo" class="demo-footer"><span>예시 가격은 비교·견적 금액에 사용되지 않습니다.</span><button @click="demo = false">실제 데이터 상태로 돌아가기</button></div>
    <p v-else class="price-footnote">배송비·용량·가입 조건에 따라 가격이 달라질 수 있습니다. 기록된 조건과 시점을 함께 확인하세요.</p>
  </section>
</template>
<script>
import { priceWindow, summarizeHistory, chartPoints, exampleHistory } from '@/services/priceHistory.mjs';
export default {
  name: 'PriceHistoryPanel', props: { productName: { type: String, default: '' }, records: { type: Array, default: () => [] } },
  data: () => ({ range: 90, demo: false, today: new Date() }),
  computed: { rows() { return priceWindow(this.demo ? exampleHistory(this.today) : this.records, this.range, this.today); }, summary() { return summarizeHistory(this.rows); }, points() { return chartPoints(this.rows); } },
  watch: { productName() { this.demo = false; } }, methods: { money(value) { return value.toLocaleString('ko-KR'); } }
};
</script>
<style scoped>
.price-panel { padding: 28px; border: 1px solid #e3e8ef; border-radius: 16px; background: #fff; color: #182334; }
.price-panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; }.price-panel h2 { font-size: 23px; margin-top: 6px; }.section-kicker { color: #7b889b; font-size: 10px; letter-spacing: .12em; font-weight: 700; }
.price-state { font-size: 11px; background: #f0f3f7; color: #647085; padding: 6px 10px; border-radius: 6px; white-space: nowrap; }.price-state.demo { background: #fff4df; color: #895918; }
.price-context { font-size: 13px; margin: 12px 0 22px; }.price-controls { display: flex; justify-content: space-between; align-items: center; gap: 12px; }.price-controls > span { font-size: 11px; color: #7b889b; }
.range-buttons { display: flex; background: #f3f5f8; padding: 3px; border-radius: 8px; }.range-buttons button { min-width: 58px; min-height: 40px; font-size: 12px; border-radius: 6px; color: #65738a; }.range-buttons button[aria-pressed=true] { color: #2459d3; background: #fff; box-shadow: 0 1px 4px #18233415; font-weight: 700; }
.price-metrics { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; margin: 30px 0; }.price-metrics span { display: block; font-size: 12px; color: #647085; margin-bottom: 8px; }.price-metrics strong { font-size: clamp(18px,2.4vw,29px); letter-spacing: -.04em; font-variant-numeric: tabular-nums; }.price-metrics small { font-size: 12px; margin-left: 4px; font-weight: 400; }.price-down { color: #2459d3; }
.chart-layout { display: flex; gap: 12px; padding: 10px 0 24px; }.chart-labels { font-size: 10px; color: #77869a; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 24px; }.price-chart { flex: 1; min-width: 0; }.price-chart svg { display: block; width: 100%; height: 180px; overflow: visible; }.chart-dates { display: flex; justify-content: space-between; font-size: 10px; color: #77869a; margin-top: 10px; }
.price-empty { min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 12px; }.price-empty h3 { font-size: 17px; }.price-empty p { max-width: 360px; font-size: 13px; }.demo-button { padding: 10px 16px; min-height: 44px; color: #2459d3; font-size: 13px; font-weight: 700; }
.demo-footer, .price-footnote { padding-top: 16px; border-top: 1px solid #edf0f4; font-size: 11px; color: #6b7b91; }.demo-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }.demo-footer button { color: #2459d3; min-height: 44px; text-decoration: underline; }
.price-records { border-top: 1px solid #edf0f4; font-size: 12px; margin-bottom: 16px; }.price-records summary { cursor: pointer; padding: 16px 0; }.price-records table { width: 100%; border-collapse: collapse; }.price-records td,.price-records th { padding: 10px 4px; text-align: left; border-bottom: 1px solid #edf0f4; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media(max-width: 600px) { .price-panel { padding: 20px 16px; }.price-metrics { gap: 8px; }.price-metrics span { font-size: 10px; }.price-controls { align-items: flex-start; flex-direction: column; }.price-panel h2 { font-size: 21px; }.price-chart svg { height: 150px; }.price-metrics small { display: none; } }
</style>
