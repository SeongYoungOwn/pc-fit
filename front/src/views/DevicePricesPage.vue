<template>
  <v-container id="device-content" class="prices-page py-10 py-md-14">
    <header class="device-heading"><div class="device-eyebrow">PC-FIT / PRICE TRACKER</div><h1>가격의 흐름을 확인하세요.</h1><p>관심 있는 기기를 찾고, 가격이 어떻게 달라지는지 살펴보세요.</p></header>
    <div class="price-page-layout">
      <aside class="price-search-panel">
        <h2>어떤 제품을 찾으세요?</h2>
        <v-form @submit.prevent="search(0)">
          <v-select v-model="category" :items="categories" item-title="label" item-value="value" label="기기 종류" variant="outlined" density="comfortable" hide-details class="mb-3" @update:model-value="changeCategory" />
          <v-text-field v-model="query" label="모델명 검색" placeholder="갤럭시, 아이패드, 그램…" maxlength="100" prepend-inner-icon="mdi-magnify" hide-details clearable />
          <v-btn type="submit" block color="primary" class="mt-3" :loading="loading">제품 찾기</v-btn>
        </v-form>
        <div class="search-results-title"><span>등록된 제품</span><span>{{ total.toLocaleString('ko-KR') }}개</span></div>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>
        <div v-if="loading" class="text-center py-8" role="status"><v-progress-circular indeterminate size="24" color="primary" /><span class="d-block text-caption mt-3">제품을 불러오는 중</span></div>
        <div v-else class="price-product-list"><button v-for="product in items" :key="product.id" :class="{ chosen: selected?.id === product.id }" :aria-pressed="selected?.id === product.id" @click="selectProduct(product)"><v-icon :icon="categoryIcon" size="25" /><span><small>{{ product.brand }}</small><strong>{{ product.name }}</strong><small>{{ product.version || product.model }}</small></span><v-icon :icon="selected?.id === product.id ? 'mdi-check-circle' : 'mdi-chevron-right'" size="18" /></button><p v-if="!items.length && !error" class="text-caption py-6 text-center">조건에 맞는 등록 제품이 없습니다.</p></div>
        <div v-if="page || hasMore" class="d-flex align-center justify-space-between mt-3"><v-btn variant="text" :disabled="!page || loading" @click="search(page - 1)">이전</v-btn><span class="text-caption">{{ page + 1 }}</span><v-btn variant="text" :disabled="!hasMore || loading" @click="search(page + 1)">다음</v-btn></div>
      </aside>
      <div class="price-main">
        <div v-if="selected" class="tracked-product"><div class="tracked-icon"><v-icon :icon="categoryIcon" size="34" /></div><div><span class="section-kicker">{{ selected.brand }}</span><h2>{{ selected.name }}</h2><p>{{ selected.version || selected.model }}</p></div><v-btn :to="{ name: 'DeviceCatalog', query: { category: selected.category, query: selected.name, id: selected.id } }" variant="text" color="primary">사양 보기 <v-icon end size="17">mdi-arrow-right</v-icon></v-btn></div>
        <DeviceOffers v-if="selected" :key="selected.id" :product="selected" />
        <PriceHistoryPanel :key="selected?.id || 'empty'" :product-name="selected?.name || ''" />
        <div class="price-purchase-info"><v-icon size="22" color="secondary">mdi-information-outline</v-icon><div><h3>스펙과 판매가는 서로 다른 정보예요.</h3><p>다나와 가격 조회에서 현재 판매 후보를 확인할 수 있습니다. 장기간 가격 이력은 아직 수집하지 않았으며, 예시 차트는 화면 확인용입니다.</p></div></div>
        <router-link v-if="selected && ['Smartphones', 'Tablets', 'Smartwatches', 'Laptops'].includes(selected.category)" :to="{ name: 'DeviceCompare', query: { category: selected.category, left: selected.id } }" class="price-compare-link"><div><strong>가격 다음에는, 사양 비교.</strong><span>이 기기와 다른 제품의 차이를 확인해 보세요.</span></div><v-icon>mdi-arrow-right</v-icon></router-link>
      </div>
    </div>
  </v-container>
</template>
<script>
import api from '@/services/api';
import DeviceOffers from '@/components/domain/DeviceOffers.vue';
import PriceHistoryPanel from '@/components/domain/PriceHistoryPanel.vue';
export default {
  name: 'DevicePricesPage', components: { PriceHistoryPanel, DeviceOffers },
  data: () => ({ categories: [{ value: 'Smartphones', label: '스마트폰', icon: 'mdi-cellphone' }], category: 'Smartphones', query: '', items: [], selected: null, total: 0, loading: false, error: '', page: 0, hasMore: false, request: 0 }),
  computed: { categoryIcon() { return this.categories.find(item => item.value === this.category)?.icon || 'mdi-devices'; } },
  async mounted() {
    this.loading = true;
    try {
      const meta = (await api.get('devices/meta', { params: { category: 'Smartphones' } })).data.data;
      this.categories = meta.categories.filter(c=>['Smartphones','Tablets','Smartwatches','Laptops'].includes(c.value));
      if (this.categories.some(item => item.value === this.$route.query.category)) this.category = this.$route.query.category;
      const id = typeof this.$route.query.id === 'string' ? this.$route.query.id : '';
      await this.search(0);
      if (id) { const product = (await api.get(`devices/products/${encodeURIComponent(id)}`, { params: { category: this.category } })).data.data; this.selected = product; }
    } catch (error) { this.error = error.response?.data?.error || '제품을 불러오지 못했습니다. 잠시 후 다시 검색해 주세요.'; }
    finally { this.loading = false; }
  },
  beforeUnmount() { this.request++; },
  methods: {
    async changeCategory() { this.selected = null; this.query = ''; this.$router.replace({ name: 'DevicePrices', query: { category: this.category } }); await this.search(0); },
    async search(page) {
      const request = ++this.request; this.loading = true; this.error = '';
      try { const result = (await api.get('devices/products', { params: { category: this.category, query: this.query || '', page, size: 10 } })).data.data; if (request !== this.request) return; this.items = result.items; this.total = result.total; this.page = page; this.hasMore = result.hasMore; }
      catch (error) { if (request === this.request) this.error = error.response?.data?.error || '제품 검색에 실패했습니다.'; }
      finally { if (request === this.request) this.loading = false; }
    },
    selectProduct(product) { this.selected = product; this.$router.replace({ name: 'DevicePrices', query: { category: product.category, id: product.id } }); }
  }
};
</script>
<style scoped>
.price-page-layout { display: grid; grid-template-columns: 310px minmax(0,1fr); gap: 28px; align-items: start; }
.price-search-panel { padding: 24px; border: 1px solid #e3e8ef; background: white; border-radius: 16px; }.price-search-panel h2 { font-size: 17px; margin-bottom: 22px; }.search-results-title { display: flex; justify-content: space-between; padding: 24px 0 12px; font-size: 11px; color: #7b889b; }
.price-product-list { max-height: 640px; overflow-y: auto; }.price-product-list button { display: flex; gap: 12px; align-items: center; width: 100%; text-align: left; padding: 16px 8px; border-bottom: 1px solid #edf0f4; border-radius: 6px; color: #65738a; }.price-product-list button.chosen { background: #edf3ff; color: #2459d3; }.price-product-list button:hover { background: #f2f5fb; }.price-product-list button > span { flex: 1; min-width: 0; }.price-product-list small { display: block; font-size: 10px; margin: 3px 0; overflow-wrap: anywhere; }.price-product-list strong { display: block; font-size: 13px; color: #182334; overflow-wrap: anywhere; }
.tracked-product { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }.tracked-icon { width: 66px; height: 66px; display: grid; place-items: center; background: #e8eef9; border-radius: 14px; color: #526b97; flex-shrink: 0; }.tracked-product h2 { font-size: 22px; overflow-wrap: anywhere; }.tracked-product p { font-size: 12px; margin-top: 5px; }.tracked-product .v-btn { margin-left: auto; flex-shrink: 0; }
.price-purchase-info { display: flex; gap: 14px; padding: 24px 4px; }.price-purchase-info h3 { font-size: 13px; }.price-purchase-info p { font-size: 12px; margin-top: 6px; }
.price-compare-link { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 24px; border-radius: 12px; background: #eaf0fb; color: #2459d3; text-decoration: none; }.price-compare-link strong { font-size: 16px; }.price-compare-link span { display: block; font-size: 12px; color: #65738a; margin-top: 6px; }
@media(max-width: 960px) { .price-page-layout { grid-template-columns: 260px minmax(0,1fr); gap: 18px; }.price-search-panel { padding: 18px; }.tracked-product { flex-wrap: wrap; }.tracked-product .v-btn { margin-left: 0; } }
@media(max-width: 700px) { .price-page-layout { grid-template-columns: 1fr; }.price-product-list { max-height: 260px; }.tracked-product h2 { font-size: 19px; }.tracked-product { margin-top: 12px; } }
</style>
