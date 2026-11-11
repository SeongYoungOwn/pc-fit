<template>
  <v-container id="device-content" class="compare-page py-10 py-md-14">
    <header class="device-heading"><div class="device-eyebrow">PC-FIT / DEVICE COMPARE</div><h1>나란히 보면, 선택이 쉬워져요.</h1><p>스마트폰부터 스마트워치까지. 내게 중요한 사양을 같은 기준으로 비교하세요.</p></header>
    <v-btn-toggle v-model="category" mandatory color="primary" class="category-tabs mb-7" @update:model-value="changeCategory">
      <v-btn v-for="item in categories" :key="item.value" :value="item.value" :disabled="loading"><v-icon start :icon="item.icon" />{{ item.label }}</v-btn>
    </v-btn-toggle>
    <div class="d-flex flex-wrap ga-2 mb-6"><v-chip size="small" variant="tonal" color="secondary">최근 5년 출시 제품</v-chip><v-chip  size="small" variant="tonal" color="success">국내 정식 출시 확인</v-chip></div>
    <div class="compare-section-title"><div><span class="section-kicker">01 / SELECT</span><h2>어떤 기기가 고민되세요?</h2></div><span>최대 3개 기기 비교</span></div>
    <v-row class="mb-4 selection-grid">
      <v-col v-for="(product, index) in selection" :key="index" cols="12" :sm="selection.length === 3 ? 4 : 6">
        <v-card class="glass-card select-card h-100 pa-5 pa-md-7" elevation="0">
          <div class="d-flex align-center justify-space-between mb-5"><span class="slot-label">{{ ['A', 'B', 'C'][index] }} 기기</span><v-btn v-if="product || selection.length > 2" icon="mdi-close" size="small" variant="text" :aria-label="`${index + 1}번째 기기 제외`" @click="removeProduct(index)" /></div>
          <template v-if="product">
            <div class="selected-device-body d-flex align-center ga-5"><v-avatar size="72" rounded="lg" color="surface-variant"><v-img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" contain /><v-icon v-else :icon="currentCategory.icon" color="secondary" size="40" /></v-avatar><div><v-chip size="x-small" variant="tonal" color="secondary" class="mb-2">{{ product.brand }}</v-chip><h2 class="text-h6 font-weight-bold">{{ product.name }}</h2><div class="text-caption text-secondary mt-1">{{ product.version }}</div></div></div>
            <p v-if="product.imageCaption" class="text-caption">{{ product.imageCaption }}</p><v-btn block variant="outlined" class="mt-6" @click="openPicker(index)">기기 바꾸기</v-btn>
          </template>
          <v-btn v-else block class="empty-slot" variant="text" :aria-label="`${['A', 'B', 'C'][index]} 비교할 기기 선택`" @click="openPicker(index)"><span><v-icon size="38" class="mb-3">mdi-plus-circle-outline</v-icon><span class="d-block">비교할 기기 선택</span><span class="d-block text-caption text-secondary mt-2">모델명으로 검색하세요</span></span></v-btn>
        </v-card>
      </v-col>
    </v-row>
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-8"><v-btn v-if="selection.length < 3" variant="text" prepend-icon="mdi-plus" @click="selection.push(null)">기기 하나 더 추가</v-btn><v-spacer /><v-btn color="primary" size="large" :loading="loading" :disabled="selectedProducts.length < 2" @click="compare">사양 비교하기</v-btn></div>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-6" role="alert">{{ error }}</v-alert>
    <div v-if="loading" class="text-center py-10" aria-live="polite"><v-progress-circular indeterminate color="primary" /><p class="mt-4">같은 기준으로 사양을 정리하고 있습니다.</p></div>
    <template v-else-if="result">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6"><div><span class="section-kicker">02 / COMPARE</span><h2 class="text-h5 font-weight-bold mt-2">차이를 한눈에.</h2></div><v-btn variant="text" prepend-icon="mdi-link-variant" @click="copyLink">{{ linkCopied ? '링크 복사됨' : '비교 링크 복사' }}</v-btn></div>
      <v-row class="mb-7"><v-col v-for="(product, index) in result.products" :key="product.id" cols="12" :md="result.products.length === 3 ? 4 : 6"><v-card class="glass-card pa-5 h-100" elevation="0"><h3 class="text-subtitle-1 font-weight-bold mb-4">{{ product.name }}</h3><div v-for="highlight in result.highlights[index]" :key="highlight.key" class="highlight-line"><v-icon color="secondary" size="18" class="mr-2">mdi-check-circle-outline</v-icon><span>{{ highlight.text }}</span><strong>{{ highlight.value }}</strong></div><p v-if="!result.highlights[index].length" class="text-body-2">우열을 단정할 수 없는 항목은 아래 표에서 직접 확인하세요.</p></v-card></v-col></v-row>
      <div class="d-flex justify-space-between align-center flex-wrap ga-3 mb-3"><h2 class="text-h5 font-weight-bold">핵심 사양 비교</h2><v-switch v-model="differencesOnly" color="secondary" label="다른 항목만 보기" hide-details density="compact" /></div>
      <p class="device-note mb-3">공식 자료에서 확인한 항목을 표시합니다. 모든 제품에서 미확인인 항목은 생략하며, 옵션별 차이는 함께 표기합니다.</p><div class="comparison-scroll glass-card mb-7" tabindex="0" aria-label="핵심 사양 비교표, 가로 스크롤 가능">
        <table class="comparison-table"><thead><tr><th scope="col">비교 항목</th><th v-for="product in result.products" :key="product.id" scope="col">{{ product.name }}<small>{{ product.version }}</small></th></tr></thead><tbody><template v-for="group in groupedRows" :key="group.name"><tr class="group-heading"><th :colspan="result.products.length + 1" scope="colgroup">{{ group.name }}</th></tr><tr v-for="row in group.rows" :key="row.key" :class="{ 'different-row': row.different }"><th scope="row">{{ row.label }}<small v-if="!row.different">동일</small></th><td v-for="(cell, index) in row.cells" :key="index" :class="{ 'missing-value': !cell.available }">{{ cell.display }}<template v-if="cell.sourceUrl"><a :href="cell.sourceUrl" target="_blank" rel="noopener noreferrer" class="d-block text-caption mt-2">공식 확인</a><small v-if="cell.originalDisplay && cell.originalDisplay !== cell.display">TechSpecs 원본: {{ cell.originalDisplay }}</small></template></td></tr></template></tbody></table>
      </div>
      <v-expansion-panels class="mb-7"><v-expansion-panel><v-expansion-panel-title>전체 제공 사양 · 출처 기준 {{ visibleDetailedRows.length }}개 항목</v-expansion-panel-title><v-expansion-panel-text><div class="comparison-scroll"><table class="comparison-table detail-table"><thead><tr><th scope="col">항목</th><th v-for="product in result.products" :key="product.id" scope="col">{{ product.name }}</th></tr></thead><tbody><tr v-for="row in visibleDetailedRows" :key="row.key" :class="{ 'different-row': row.different }"><th scope="row">{{ row.label }}</th><td v-for="(cell, index) in row.cells" :key="index" :class="{ 'missing-value': !cell.available }">{{ cell.display }}</td></tr></tbody></table></div></v-expansion-panel-text></v-expansion-panel></v-expansion-panels>
      <v-alert type="info" variant="tonal" class="mb-6"><div v-for="notice in result.notices" :key="notice" class="text-body-2 mb-1">{{ notice }}</div></v-alert>
      <div class="text-caption text-secondary">스펙 출처: {{ [...new Set(result.products.map(p => p.source))].join(' · ') }}</div>
      <div class="comparison-price-links"><div><v-icon color="primary" class="mr-2">mdi-chart-line</v-icon><strong>가격 흐름도 함께 확인하세요.</strong><p>실판매가 이력은 연결 준비 중입니다.</p></div><v-btn v-for="product in result.products" :key="product.id" :to="{ name: 'DevicePrices', query: { category: product.category, id: product.id } }" variant="outlined" color="primary">{{ product.name }} 가격</v-btn></div>
    </template>
    <template v-else-if="!loading">
      <h2 class="text-h6 font-weight-bold mb-4">바로 비교해 보기</h2>
      <v-row v-if="suggestions.length"><v-col v-for="(pair, index) in suggestions" :key="index" cols="12" md="4"><v-card class="glass-card pa-5 h-100" elevation="0"><div class="text-body-2 font-weight-bold mb-2">{{ pair[0].name }}</div><div class="text-caption text-secondary mb-2">VS</div><div class="text-body-2 font-weight-bold mb-5">{{ pair[1].name }}</div><v-btn block variant="tonal" color="secondary" @click="usePair(pair)">비교하기</v-btn></v-card></v-col></v-row>
      <v-card v-else class="glass-card pa-8 text-center"><v-icon :icon="currentCategory.icon" size="46" color="secondary" class="mb-3" /><p>현재 비교 가능한 제품을 등록하고 있습니다.</p><v-btn to="/devices" variant="text">제품 목록 확인</v-btn></v-card>
    </template>
    <v-dialog v-model="pickerOpen" max-width="760" scrollable><v-card><v-card-title class="d-flex align-center py-4"><span>{{ ['A', 'B', 'C'][pickerSlot] }} 기기 선택</span><v-spacer /><v-btn icon="mdi-close" variant="text" aria-label="기기 선택 닫기" @click="pickerOpen = false" /></v-card-title><v-card-text><v-form @submit.prevent="searchPicker(0)"><v-row><v-col cols="12" sm="4"><v-select v-model="pickerBrand" label="브랜드" @update:model-value="searchPicker(0)" :items="[{ title: '전체', value: '' }, ...brands.map(brand => ({ title: brand, value: brand }))]" hide-details /></v-col><v-col cols="12" sm="8"><v-text-field v-model="pickerQuery" label="모델명 검색" prepend-inner-icon="mdi-magnify" maxlength="100" hide-details clearable append-inner-icon="mdi-arrow-right" @click:append-inner="searchPicker(0)" /></v-col></v-row><v-btn type="submit" color="primary" variant="tonal" class="mt-4" :loading="pickerLoading">검색</v-btn></v-form><v-progress-linear v-if="pickerLoading" indeterminate color="primary" class="mt-5" /><v-alert v-if="pickerError" type="error" variant="tonal" class="mt-5">{{ pickerError }}</v-alert><v-list class="mt-4" bg-color="transparent"><v-list-item v-for="product in pickerItems" :key="product.id" :title="product.name" :subtitle="`${product.brand} · ${product.version || product.model}`" :disabled="isSelectedElsewhere(product.id)" class="picker-row py-3" @click="pickProduct(product)"><template #prepend><v-icon :icon="currentCategory.icon" color="secondary" class="mr-3" /></template><template #append><v-icon>{{ isSelectedElsewhere(product.id) ? 'mdi-check-circle' : 'mdi-plus' }}</v-icon></template></v-list-item></v-list><p v-if="!pickerLoading && !pickerItems.length" class="text-center py-6">검색 조건에 맞는 등록 제품이 없습니다.</p><div class="d-flex justify-space-between mt-4"><v-btn variant="text" :disabled="!pickerPage || pickerLoading" @click="searchPicker(pickerPage - 1)">이전</v-btn><v-btn variant="text" :disabled="!pickerMore || pickerLoading" @click="searchPicker(pickerPage + 1)">다음</v-btn></div></v-card-text></v-card></v-dialog>
  </v-container>
</template>

<script>
import api from '@/services/api';
const MOBILE_CATEGORIES = [{ value: 'Laptops', label: '노트북', icon: 'mdi-laptop' }, { value: 'Smartphones', label: '스마트폰', icon: 'mdi-cellphone' }, { value: 'Tablets', label: '태블릿', icon: 'mdi-tablet' }, { value: 'Smartwatches', label: '스마트워치', icon: 'mdi-watch' }];
export default {
  name: 'DeviceComparePage',
  data: () => ({ categories: MOBILE_CATEGORIES, category: 'Smartphones', brands: [], selection: [null, null],
    loading: false, result: null, error: '', differencesOnly: false, linkCopied: false, suggestions: [],
    pickerOpen: false, pickerSlot: 0, pickerQuery: '', pickerBrand: '', pickerItems: [], pickerLoading: false,
    pickerPage: 0, pickerMore: false, pickerError: '', pickerRequest: 0, compareRequest: 0, categoryRequest: 0 }),
  computed: {
    currentCategory() { return this.categories.find(c => c.value === this.category) || this.categories[0]; },
    selectedProducts() { return this.selection.filter(Boolean); },
    groupedRows() {
      const groups = [];
      for (const row of this.result?.rows || []) {
        if (!row.cells.some(cell => cell.available)) continue;
        if (this.differencesOnly && !row.different) continue;
        let group = groups.find(g => g.name === row.group);
        if (!group) { group = { name: row.group, rows: [] }; groups.push(group); }
        group.rows.push(row);
      }
      return groups;
    },
    visibleDetailedRows() { return (this.result?.detailedRows || []).filter(row => !this.differencesOnly || row.different); }
  },
  async mounted() {
    if (this.categories.some(c => c.value === this.$route.query.category)) this.category = this.$route.query.category;
    await this.loadCategory();
    const ids = typeof this.$route.query.ids === 'string' ? this.$route.query.ids.split(',') : typeof this.$route.query.left === 'string' ? [this.$route.query.left] : [];
    if (ids.length && ids.length <= 3) {
      try {
        const products = await Promise.all(ids.map(id => api.get(`devices/products/${encodeURIComponent(id)}`, { params: { category: this.category } })));
        this.selection = products.map(response => response.data.data);
        if (this.selection.length === 1) this.selection.push(null);
        if (this.selectedProducts.length >= 2) await this.compare();
      } catch (error) { this.error = error.response?.data?.error || '공유된 제품을 찾을 수 없습니다.'; }
    }
  },
  methods: {
    formatDate(value) { return value ? new Date(value).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }) : '미제공'; },
    async loadCategory() {
      const request = ++this.categoryRequest, category = this.category;
      try {
        const meta = (await api.get('devices/meta', { params: { category } })).data.data;
        const data = (await api.get('devices/products', { params: { category, size: 12 } })).data.data;
        if (request !== this.categoryRequest) return;
        this.brands = meta.brands;
        const items = data.items.slice(0, 3);
        this.suggestions = items.length >= 2 ? [[items[0], items[1]], ...(items.length === 3 ? [[items[0], items[2]], [items[1], items[2]]] : [])] : [];
      } catch (error) { if (request === this.categoryRequest) this.error = error.response?.data?.error || '제품 목록을 불러오지 못했습니다.'; }
    },
    async changeCategory() {
      this.compareRequest++; this.pickerRequest++; this.selection = [null, null]; this.result = null; this.error = '';
      this.pickerOpen = false; this.suggestions = []; this.brands = []; this.syncRoute(); await this.loadCategory();
    },
    syncRoute() {
      const ids = this.selectedProducts.map(p => p.id).join(',');
      this.$router.replace({ name: 'DeviceCompare', query: { category: this.category, ...(ids ? { ids } : {}) } });
    },
    async openPicker(index) { this.pickerSlot = index; this.pickerQuery = ''; this.pickerBrand = ''; this.pickerOpen = true; await this.searchPicker(0); },
    isSelectedElsewhere(id) { return this.selection.some((p, index) => index !== this.pickerSlot && p?.id === id); },
    async searchPicker(page) {
      const request = ++this.pickerRequest; this.pickerLoading = true; this.pickerError = ''; this.pickerItems = []; this.pickerMore = false;
      try {
        const data = (await api.get('devices/products', { params: { category: this.category, brand: this.pickerBrand, query: this.pickerQuery || '', page, size: 12 } })).data.data;
        if (request === this.pickerRequest) { this.pickerItems = data.items; this.pickerMore = data.hasMore; this.pickerPage = page; }
      } catch (error) { if (request === this.pickerRequest) this.pickerError = error.response?.data?.error || '검색에 실패했습니다.'; }
      finally { if (request === this.pickerRequest) this.pickerLoading = false; }
    },
    async pickProduct(product) { this.compareRequest++; this.loading = false; this.selection.splice(this.pickerSlot, 1, product); this.pickerOpen = false; this.result = null; this.syncRoute(); if (this.selectedProducts.length >= 2) await this.compare(); },
    removeProduct(index) { this.compareRequest++; this.loading = false; if (this.selection.length > 2) this.selection.splice(index, 1); else this.selection.splice(index, 1, null); this.result = null; this.syncRoute(); },
    async usePair(pair) { this.selection = pair; this.syncRoute(); await this.compare(); },
    async compare() {
      if (this.selectedProducts.length < 2) return;
      const request = ++this.compareRequest; this.loading = true; this.error = ''; this.linkCopied = false;
      try {
        const response = await api.get('devices/compare', { params: { category: this.category, ids: this.selectedProducts.map(p => p.id).join(',') } });
        if (request === this.compareRequest) this.result = response.data.data;
      } catch (error) { if (request === this.compareRequest) { this.result = null; this.error = error.response?.data?.error || '비교 정보를 불러오지 못했습니다.'; } }
      finally { if (request === this.compareRequest) this.loading = false; }
    },
    async copyLink() { try { await navigator.clipboard.writeText(window.location.href); this.linkCopied = true; } catch { this.error = '주소창의 비교 링크를 복사해 주세요.'; } }
  }
};
</script>
<style scoped>
.compare-page { max-width: 1240px; }
.category-tabs { height: auto !important; display: flex; flex-wrap: wrap; }
.category-tabs .v-btn { min-height: 46px; }
.select-card { border: 1px solid rgba(0,217,255,.18); }
.slot-label { color: #00d9ff; font-size: 12px; font-weight: 800; letter-spacing: .12em; }
.empty-slot { height: 174px !important; border: 1px dashed rgba(255,255,255,.2); }
.highlight-line { display: flex; align-items: center; gap: 5px; font-size: 14px; margin-bottom: 12px; }
.highlight-line strong { margin-left: auto; color: #67e8f9; }
.comparison-scroll { overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,.1); }
.comparison-table { width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 650px; }
.comparison-table th, .comparison-table td { padding: 17px 20px; border-bottom: 1px solid rgba(255,255,255,.075); text-align: left; vertical-align: top; white-space: normal; overflow-wrap: anywhere; font-size: 14px; }
.comparison-table th:first-child { width: 165px; color: #b9c7da; }
.comparison-table thead th { color: #fff; font-size: 15px; background: #17223a; }
.comparison-table small { display: block; font-size: 11px; color: #94a3b8; margin-top: 5px; }
.comparison-table .group-heading th { background: rgba(0,217,255,.06); color: #67e8f9; font-size: 12px; }
.different-row td { background: rgba(255,0,128,.035); }
.missing-value { color: #94a3b8; }
.detail-table { min-width: 750px; }
.detail-table th:first-child { width: 230px; }
.picker-row { border-bottom: 1px solid rgba(255,255,255,.08); }
@media (max-width: 600px) { .comparison-table th, .comparison-table td { padding: 14px 12px; } }
.compare-section-title { display: flex; justify-content: space-between; align-items: end; margin: 16px 0 22px; gap: 16px; }.compare-section-title h2 { font-size: 23px; margin-top: 8px; }.compare-section-title > span { color: #7b889b; font-size: 12px; }
.category-tabs { padding: 5px; background: #e9edf3; border-radius: 12px; gap: 4px; width: fit-content; }.category-tabs .v-btn { border-radius: 8px !important; background: transparent; color: #65738a; font-size: 13px; min-width: 130px; }.category-tabs .v-btn--active { background: #fff; color: #2459d3; }
.select-card { min-height: 248px; display: flex; flex-direction: column; }.select-card > .v-btn { margin-top: auto !important; flex: 0 0 44px; height: 44px; }.select-card .selected-device-body { padding-bottom: 24px; }.slot-label { color: #2459d3; letter-spacing: .03em; background: #eef3ff; padding: 6px 10px; border-radius: 6px; }.empty-slot { border: 1px dashed #d6dfed; height: 155px !important; color: #2459d3; background: #fafbfd; }.highlight-line strong { color: #2459d3; }.highlight-line { gap: 8px; flex-wrap: wrap; }
@media(min-width: 600px) and (max-width: 960px) { .select-card .selected-device-body { flex-direction: column; align-items: flex-start !important; gap: 14px !important; }.select-card h2 { font-size: 16px !important; } }
.comparison-table th, .comparison-table td { border-bottom: 1px solid #e8edf4; color: #334155; padding: 20px; }.comparison-table thead th { color: #182334; background: #eef2f8; }.comparison-table th:first-child { color: #647085; width: 175px; }.comparison-table small { color: #7b889b; }.comparison-table .group-heading th { background: #f4f6fa; color: #2459d3; font-size: 12px; letter-spacing: .03em; }.different-row td { background: #f3f7ff; }.comparison-table td.missing-value { color: #8793a5; }.comparison-scroll { border-color: #e3e8ef; }.comparison-table tbody tr:not(.group-heading) th { position: sticky; left: 0; background: white; z-index: 1; }.picker-row { border-bottom-color: #e3e8ef; }
.comparison-price-links { margin-top: 32px; padding: 24px; background: #eaf0fb; border-radius: 14px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }.comparison-price-links > div { flex: 1 0 100%; }.comparison-price-links strong { font-size: 15px; }.comparison-price-links p { font-size: 12px; margin: 8px 0; }
@media(max-width: 600px) { .category-tabs { width: 100%; flex-wrap: nowrap; }.category-tabs .v-btn { min-width: 0; flex: 1; padding: 0 9px; font-size: 12px; }.compare-section-title { align-items: start; flex-direction: column; gap: 8px; }.compare-section-title h2 { font-size: 21px; }.comparison-table { min-width: 560px; }.comparison-table th:first-child { width: 110px; }.comparison-table th,.comparison-table td { padding: 14px 12px; font-size: 12px; }.select-card { min-height: 190px; }.empty-slot { height: 120px !important; } }
</style>
