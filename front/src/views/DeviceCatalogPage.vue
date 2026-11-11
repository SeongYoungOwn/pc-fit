<template>
  <v-container id="device-content" class="device-catalog py-10 py-md-14">
    <div class="catalog-intro mb-8">
      <div class="device-eyebrow">PC-FIT / EXPLORE</div>
      <h1 class="text-h4 text-md-h3 font-weight-black mb-3">{{ isParts ? '내 PC에 맞는 부품 찾기.' : '다음 기기를 만나는 곳.' }}</h1>
      <p>{{ isParts ? 'CPU부터 주변기기까지, PC 구성에 필요한 부품을 탐색하세요.' : '국내 정식 출시된 최근 5년의 스마트폰·노트북·태블릿·스마트워치를 비교하세요.' }}</p>
    </div>
    <nav class="quick-categories" aria-label="빠른 품목 선택"><button v-for="item in quickCategories" :key="item.value" :class="{ active: filters.category === item.value }" :aria-pressed="filters.category === item.value" @click="selectCategory(item.value)"><v-icon :icon="item.icon" size="23" /><span>{{ item.label }}</span></button></nav>
    <div v-if="isParts && inventory" class="inventory-summary mb-6 pa-5 rounded-xl">
      <div class="d-flex flex-wrap align-center ga-3"><v-icon color="primary" size="22">mdi-database-outline</v-icon><strong>{{ inventory.total.toLocaleString('ko-KR') }}개</strong><span class="text-body-2">PC 부품·주변기기</span><v-chip size="small" color="primary" variant="tonal">{{ inventory.categories.length }}개 품목</v-chip></div>
      <p class="text-caption text-secondary mt-2 mb-0">글로벌 제품 사양 기준 · 국내 판매 여부 및 실판매가는 별도 확인이 필요합니다.</p>
    </div>
    <v-card class="glass-card pa-5 pa-md-7 mb-6" elevation="0">
      <v-form @submit.prevent="search(0)">
        <v-row>
          <v-col cols="12" sm="6" md="3"><v-select v-model="filters.category" :label="isParts ? '부품 종류' : '기기 종류'" :items="categories" item-title="label" item-value="value" hide-details @update:model-value="changeCategory" /></v-col>
          <v-col cols="12" sm="6" md="3"><v-select v-model="filters.brand" label="브랜드" :items="[{ title: '전체 브랜드', value: '' }, ...brands.map(brand => ({ title: brand, value: brand }))]" hide-details /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="filters.query" label="제품명 검색" placeholder="제품명 또는 시리즈" prepend-inner-icon="mdi-magnify" maxlength="100" clearable hide-details /></v-col>
          <v-col cols="12" md="2" class="d-flex"><v-btn type="submit" color="primary" block size="large" :loading="loading">검색</v-btn></v-col>
        </v-row>
      </v-form>
      <div class="d-flex flex-wrap ga-2 mt-5">
        <v-chip v-if="categoryPolicy.recentYears" color="secondary" variant="tonal" size="small">최근 {{ categoryPolicy.recentYears }}년 출시 제품</v-chip>
        <v-chip v-if="categoryPolicy.domesticOnly" color="success" variant="tonal" size="small">국내 정식 출시 확인 제품</v-chip>
      </div>
    </v-card>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-5" role="alert">{{ error }}</v-alert>
    <div v-if="loading" class="text-center py-12" aria-live="polite"><v-progress-circular indeterminate color="primary" /><p class="mt-4">제품 정보를 불러오고 있습니다.</p></div>
    <template v-else-if="searched">
      <div class="d-flex justify-space-between align-center mb-5"><h2 class="text-h6 font-weight-bold">{{ categoryLabel(loadedFilters.category) }}</h2><span class="text-caption text-secondary">{{ total }}개 제품</span></div>
      <v-card v-if="!items.length && !error" class="glass-card pa-10 text-center">
        <v-icon size="48" color="secondary" class="mb-4">mdi-magnify-close</v-icon>
        <h2 class="text-h6 mb-2">조건에 맞는 제품이 아직 없습니다.</h2>
        <p>{{ categoryPolicy.domesticOnly ? '국내 정식 출시 여부를 확인한 제품부터 등록하고 있습니다.' : '제품 정보를 등록하고 있습니다. 다른 종류나 검색어로 확인해 보세요.' }}</p>
      </v-card>
      <v-row v-else>
        <v-col v-for="product in items" :key="product.id" cols="12" sm="6" lg="4">
          <v-card class="glass-card product-card h-100 d-flex flex-column pa-5" elevation="0">
            <p v-if="product.imageCaption" class="text-caption">{{ product.imageCaption }}</p><div class="product-visual mb-5"><v-img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" height="175" contain referrerpolicy="no-referrer" /><v-icon v-else :icon="categoryIcon(product.category)" size="66" color="secondary" /></div>
            <div class="d-flex justify-space-between align-center mb-3 ga-2"><v-chip size="small" variant="tonal" color="secondary">{{ product.brand }}</v-chip><span class="text-caption text-secondary">{{ product.releaseDate || '출시일 미제공' }}</span></div>
            <h3 class="text-h6 font-weight-bold mb-2 product-name">{{ product.name }}</h3>
            <div v-if="product.version" class="text-body-2 text-secondary mb-2">{{ product.version }}</div>
            <div v-if="product.highlights?.length" class="text-body-2 mb-3 spec-preview"><div v-for="line in product.highlights" :key="line">{{ line }}</div></div>
            <router-link v-if="!isParts" :to="{ name: 'DevicePrices', query: { category: product.category, id: product.id } }" class="product-price-link">판매 가격·이력 확인 <v-icon size="15">mdi-arrow-top-right</v-icon></router-link>
            <v-chip v-if="product.availability === 'verified'" size="small" color="success" variant="tonal" class="align-self-start">국내 정식 출시 확인</v-chip>
            <v-btn v-if="['Smartphones', 'Tablets', 'Smartwatches', 'Laptops'].includes(product.category)" :to="{ name: 'DeviceCompare', query: { category: product.category, left: product.id } }" variant="text" color="secondary" prepend-icon="mdi-compare" class="mt-3 align-self-start">이 기기로 비교 시작</v-btn>
            <v-spacer /><div class="d-flex justify-space-between align-center mt-5 pt-4 card-bottom"><span class="text-caption text-secondary">스펙 · {{ product.source }}</span><v-btn variant="tonal" color="primary" @click="openDetail(product)">상세 사양<v-icon end>mdi-arrow-right</v-icon></v-btn></div>
          </v-card>
        </v-col>
      </v-row>
      <div v-if="page || hasMore" class="d-flex justify-center align-center ga-4 mt-8"><v-btn variant="outlined" :disabled="!page" @click="search(page - 1, loadedFilters)">이전</v-btn><span>{{ page + 1 }} 페이지</span><v-btn variant="outlined" :disabled="!hasMore" @click="search(page + 1, loadedFilters)">다음</v-btn></div>
    </template>
    <v-dialog v-model="detailOpen" max-width="900" scrollable>
      <v-card class="pa-2">
        <v-card-title class="d-flex align-center ga-3"><span class="text-h6 text-wrap">{{ detail?.name || '상세 사양' }}</span><v-spacer /><v-btn icon="mdi-close" variant="text" aria-label="상세 사양 닫기" @click="detailOpen = false" /></v-card-title>
        <v-card-text>
          <div v-if="detailLoading" class="text-center py-10"><v-progress-circular indeterminate color="primary" /></div>
          <v-alert v-else-if="detailError" type="error" variant="tonal">{{ detailError }}</v-alert>
          <template v-else-if="detail">
            <div class="mb-5"><v-chip size="small" class="mr-2">{{ detail.brand }}</v-chip><v-chip size="small" variant="tonal">{{ detail.version || detail.model }}</v-chip></div>
            <p class="text-caption mb-5">제품 옵션에 따라 사양이 달라질 수 있습니다. 제공되지 않은 값은 추정하지 않습니다.</p>
            <p v-if="!isParts && detail.sourceUrl" class="mb-4"><a :href="detail.sourceUrl" target="_blank" rel="noopener noreferrer">제조사 공식 사양 확인 ↗</a></p>
            <DeviceOffers v-if="['Smartphones','Tablets','Smartwatches','Laptops'].includes(detail.category)" :key="detail.id" :product="detail" />
            <template v-if="detail.specGroups">
              <v-alert v-if="!detail.specGroups.length" type="info" variant="tonal" class="mb-4">등록된 상세 사양이 없습니다.</v-alert>
              <section v-for="group in detail.specGroups" :key="group.title" class="spec-section">
                <h3>{{ group.title }}</h3>
                <v-table density="comfortable" class="spec-table" :aria-label="group.title">
                  <tbody>
                    <tr v-for="row in group.rows" :key="row.key">
                      <th scope="row">{{ row.label }}</th>
                      <td>{{ row.value }}
                        <a v-if="row.sourceUrl" :href="row.sourceUrl" target="_blank" rel="noopener noreferrer" class="d-inline-block text-caption ml-2">공식 근거 ↗</a>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </section>
            </template>
            <template v-else>
              <v-alert v-if="detail.specRows && !detail.specRows.length" type="info" variant="tonal" class="mb-4">이 제품은 원본 DB에 제품명·모델 정보만 등록되어 있습니다. 상세 사양은 아직 제공되지 않습니다.</v-alert>
              <v-table density="comfortable" class="spec-table"><thead><tr><th scope="col">항목</th><th scope="col">제공된 사양</th></tr></thead><tbody><tr v-for="(row, index) in specRows" :key="index"><th scope="row">{{ row.label }}</th><td>{{ row.value }}</td></tr></tbody></v-table>
            </template>
            <PriceHistoryPanel v-if="!isParts" class="mt-6" :key="detail.id" :product-name="detail.name" />
            <div class="text-caption text-secondary mt-5">출처: {{ detail.source }} · 갱신 {{ formatDate(detail.syncedAt) }}</div>
            <div v-if="detail.sourceUrl" class="text-caption mt-3"><a :href="detail.sourceUrl" target="_blank" rel="noopener noreferrer">원본 데이터</a><span v-if="detail.license"> · <a :href="detail.licenseUrl" target="_blank" rel="noopener noreferrer">{{ detail.license }}</a> · PC-FIT 검색 형식으로 변환</span></div>
            <a v-if="detail.manufacturerUrl" :href="detail.manufacturerUrl" target="_blank" rel="noopener noreferrer" class="d-inline-block text-caption mt-3">제조사 제품 페이지</a>
            <a v-if="detail.domesticSourceUrl" :href="detail.domesticSourceUrl" target="_blank" rel="noopener noreferrer" class="d-inline-block text-caption mt-3">국내 정식 출시 확인 근거</a>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>
    <p v-if="isParts && inventory" class="text-caption text-secondary mt-8">Data from <a :href="inventory.sourceUrl" target="_blank" rel="noopener noreferrer">BuildCores OpenDB</a>, <a :href="inventory.licenseUrl" target="_blank" rel="noopener noreferrer">{{ inventory.license }}</a>. 검색·분류·표시 형식 변환. 비상업 졸업프로젝트 용도.</p>
  </v-container>
</template>
<script>
import api from '@/services/api';
import PriceHistoryPanel from '@/components/domain/PriceHistoryPanel.vue';
import DeviceOffers from '@/components/domain/DeviceOffers.vue';
export default {
  name: 'DeviceCatalogPage',
  components: { PriceHistoryPanel, DeviceOffers },
  data: () => ({ categories: [{ value: 'CPUs', label: 'CPU', icon: 'mdi-cpu-64-bit' }], brands: [], inventory: null,
    filters: { category: 'Smartphones', brand: '', query: '' }, loadedFilters: {}, items: [], total: 0, page: 0, hasMore: false,
    loading: false, searched: false, error: '', detailOpen: false, detailLoading: false, detailError: '', detail: null, detailRequest: 0, searchRequest: 0, metaRequest: 0 }),
  computed: {
    isParts() { return Boolean(this.$route.meta.partsCatalog); },
    quickCategories() { const values = this.isParts ? ['CPUs','GPUs','Motherboards','Memory','Storage','PowerSupplies','CPUCoolers','PCCases','Displays'] : ['Smartphones','Laptops','Tablets','Smartwatches']; return values.map(value => this.categories.find(item => item.value === value)).filter(Boolean); },
    categoryPolicy() { return this.categories.find(c => c.value === this.filters.category) || {}; },
    specRows() {
      if (this.detail?.specRows) return this.detail.specRows;
      const rows = [];
      const walk = (value, path = [], depth = 0) => {
        if (rows.length >= 500 || depth > 8 || value === null || value === undefined || value === '') return;
        if (typeof value === 'object') Object.entries(value).filter(([key]) => !['_provenance', 'identifiers', 'opendb_id', 'general_product_information'].includes(key)).forEach(([key, child]) => walk(child, [...path, key], depth + 1));
        else if (['string', 'number', 'boolean'].includes(typeof value)) rows.push({ label: path.join(' / '), value: typeof value === 'boolean' ? (value ? '지원' : '미지원') : String(value) });
      };
      walk(this.detail?.specs); return rows;
    }
  },
  async mounted() { this.filters.category = this.isParts ? 'CPUs' : 'Smartphones'; await this.loadMeta(); if (this.categories.some(item => item.value === this.$route.query.category)) { this.filters.category = this.$route.query.category; await this.loadMeta(); } if (typeof this.$route.query.query === 'string') this.filters.query = this.$route.query.query.slice(0,100); await this.search(); if (!this.error && typeof this.$route.query.id === 'string') await this.openDetail({ id: this.$route.query.id }); },
  methods: {
    async selectCategory(value) { this.filters.category = value; await this.changeCategory(); },
    categoryLabel(value) { return this.categories.find(c => c.value === value)?.label || value; },
    categoryIcon(value) { return this.categories.find(c => c.value === value)?.icon || 'mdi-devices'; },
    formatDate(value) { return value ? new Date(value).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }) : '미제공'; },
    async loadMeta() {
      const request = ++this.metaRequest;
      try { const meta = (await api.get('devices/meta', { params: { category: this.filters.category } })).data.data; if (request !== this.metaRequest) return; this.categories = meta.categories.filter(c => this.isParts !== ['Smartphones','Laptops','Tablets','Smartwatches'].includes(c.value)); this.brands = meta.brands; this.inventory = meta.inventory ? { ...meta.inventory, categories: meta.inventory.categories.filter(c=>c.category!=='Laptops'), total: meta.inventory.categories.filter(c=>c.category!=='Laptops').reduce((n,c)=>n+c.count,0) } : null; }
      catch { if (request === this.metaRequest) this.error = '제품 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'; }
    },
    async changeCategory() { const category = this.filters.category; this.filters.brand = ''; this.filters.query = ''; await this.loadMeta(); if (category === this.filters.category) await this.search(); },
    async search(page = 0, selected = this.filters) {
      const request = ++this.searchRequest;
      this.loading = true; this.error = ''; this.detailOpen = false;
      const params = { ...selected, query: selected.query || '', page, size: 12 };
      try {
        const result = (await api.get('devices/products', { params })).data.data;
        if (request !== this.searchRequest) return;
        this.items = result.items; this.total = result.total; this.hasMore = result.hasMore;
        this.page = page; this.loadedFilters = params; this.searched = true;
      } catch (error) { if (request === this.searchRequest) this.error = error.response?.data?.error || '제품을 불러오지 못했습니다.'; }
      finally { if (request === this.searchRequest) this.loading = false; }
    },
    async openDetail(product) {
      const request = ++this.detailRequest;
      this.detailOpen = true; this.detailLoading = true; this.detail = null; this.detailError = '';
      try { const response = await api.get(`devices/products/${encodeURIComponent(product.id)}`, { params: this.loadedFilters }); if (request === this.detailRequest) this.detail = response.data.data; }
      catch (error) { if (request === this.detailRequest) this.detailError = error.response?.data?.error || '상세 정보를 불러오지 못했습니다.'; }
      finally { if (request === this.detailRequest) this.detailLoading = false; }
    }
  }
};
</script>
<style scoped>
.device-catalog { max-width: 1240px; }
.inventory-summary { background: rgba(0,243,255,.045); border: 1px solid rgba(0,243,255,.18); }
.spec-preview { line-height: 1.75; }
.catalog-intro { max-width: 920px; }
.catalog-intro h1 { line-height: 1.25 !important; word-break: keep-all; }
.product-card { border: 1px solid rgba(255,255,255,.1); }
.product-visual { height: 185px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.035); border-radius: 16px; }
.product-name { overflow-wrap: anywhere; }
.card-bottom { border-top: 1px solid rgba(255,255,255,.1); }
.spec-table th, .spec-table td { white-space: normal; overflow-wrap: anywhere; padding-top: 12px !important; padding-bottom: 12px !important; }
.spec-table th { width: 38%; min-width: 120px; color: #b9c7da !important; }
.spec-section { margin-block: 18px; border: 1px solid #e3e8ef; border-radius: 12px; overflow: hidden; }
.spec-section h3 { padding: 12px 16px; background: #eef3ff; color: #243f76; font-size: 15px; }
.spec-section .spec-table th { color: #4a5a71 !important; }
.catalog-intro { margin-bottom: 28px !important; }.catalog-intro p { font-size: 15px; }.inventory-summary { background: #edf2fa; border: none; padding: 18px 22px !important; border-radius: 12px !important; }.quick-categories { display: flex; gap: 10px; overflow-x: auto; padding: 2px 2px 18px; margin-bottom: 8px; }.quick-categories button { flex: 1 0 92px; padding: 18px 12px; display: flex; flex-direction: column; align-items: center; gap: 10px; background: #fff; border: 1px solid #e3e8ef; border-radius: 12px; color: #718199; font-size: 12px; transition: background .18s, border-color .18s; }.quick-categories button.active { color: #2459d3; border-color: #2459d3; background: #eef3ff; }.quick-categories button:hover { background: #eef3ff; }.product-visual { height: 155px; background: #f4f6f9; border-radius: 10px; }.product-visual .v-icon { opacity: .6; }.product-name { font-size: 17px !important; line-height: 1.45 !important; }.spec-preview { font-size: 12px !important; color: #647085; }.card-bottom { border-top-color: #e8edf4; }.spec-table th { color: #647085 !important; }.product-price-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #2459d3; min-height: 44px; text-decoration: none; align-self: flex-start; }.product-card { transition: border-color .18s !important; }.product-card:hover { border-color: #b2c5ed !important; }
@media(max-width: 600px) { .quick-categories button { flex-basis: 78px; padding: 14px 8px; }.catalog-intro p { font-size: 13px; }.product-visual { height: 130px; } }
</style>
