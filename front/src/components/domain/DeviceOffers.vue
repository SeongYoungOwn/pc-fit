<template>
  <section class="offers-panel">
    <h2>판매 가격 찾아보기</h2>
    <p>검색 결과의 용량·구성·가입 조건을 확인하고 판매 페이지로 이동하세요.</p>
    <div v-if="stores.manufacturer || stores.carriers.length" class="official-stores">
      <h3>공식 판매처</h3>
      <p>공식몰에서 {{ product.name }}의 판매 여부와 구매 조건을 확인하세요.</p>
      <div class="store-links">
        <div v-for="store in storeLinks" :key="store.name" class="store-link">
          <v-btn :href="store.url" target="_blank" rel="noopener noreferrer" variant="outlined" :color="store === stores.manufacturer ? 'primary' : undefined" append-icon="mdi-open-in-new">{{ store.name }}</v-btn>
          <span class="text-caption">{{ store.isProductPage ? '제품 구매 페이지' : '제품 페이지 미확인 · 공식몰 홈으로 이동' }}</span>
        </div>
      </div>
      <p class="text-caption">해당 제품의 판매 페이지를 확인하지 못한 판매처는 공식몰 홈으로 연결됩니다. 구매 전 용량·색상·재고와 통신사 요금제·약정 조건을 확인하세요.</p>
    </div>
    <v-btn color="primary" :loading="loading" @click="load">다나와 판매 가격 조회</v-btn>
    <v-alert v-if="error" type="error" variant="tonal" class="mt-4">{{ error }}</v-alert>
    <div v-if="result" aria-live="polite">
      <p class="mt-4">조회 {{ new Date(result.checkedAt).toLocaleString('ko-KR') }}</p>
      <div v-for="provider in result.providers" :key="provider.provider" class="provider">
        <h3>{{ provider.provider === 'naver' ? '네이버 쇼핑' : '다나와' }}</h3>
        <template v-if="provider.status === 'retired'"><p>{{ provider.notice }}</p><v-btn :href="provider.searchUrl" target="_blank" rel="noopener noreferrer" variant="outlined">네이버 쇼핑에서 검색</v-btn></template>
        <p v-else-if="provider.status === 'unconfigured'">서버에 API 인증 정보를 설정해야 합니다.</p>
        <p v-else-if="provider.status === 'unavailable'">현재 가격을 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        <p v-else-if="!provider.items.length">조건에 맞는 판매 상품이 없습니다.</p>
        <article v-for="item in provider.items" :key="item.id">
          <div><strong>{{ item.name }}</strong><p>{{ item.seller }} · {{ item.price.toLocaleString('ko-KR') }}원</p></div>
          <v-btn :href="item.url" target="_blank" rel="noopener noreferrer" variant="tonal" color="primary">판매 조건 확인</v-btn>
        </article>
      </div>
      <p>{{ result.notice }}</p>
    </div>
  </section>
</template>
<script>
import api from '@/services/api';
import { officialStores } from '@/services/officialStores.mjs';
export default {
  props: { product: { type: Object, required: true } },
  data: () => ({ loading: false, error: '', result: null, request: 0 }),
  computed: {
    stores() { return officialStores(this.product); },
    storeLinks() { return [this.stores.manufacturer, ...this.stores.carriers].filter(Boolean); }
  },
  beforeUnmount() { this.request++; },
  methods: {
    async load() {
      const request = ++this.request;
      this.loading = true;
      this.error = '';
      this.result = null;
      try {
        const response = await api.get(`devices/products/${encodeURIComponent(this.product.id)}/offers`, {
          params: { category: this.product.category }
        });
        if (request === this.request) this.result = response.data.data;
      } catch {
        if (request === this.request) this.error = '가격 조회에 실패했습니다.';
      } finally {
        if (request === this.request) this.loading = false;
      }
    }
  }
};
</script>
<style scoped>
.offers-panel { background: white; border: 1px solid #e3e8ef; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
.official-stores { margin: 20px 0; padding-bottom: 12px; border-bottom: 1px solid #e3e8ef; }
.store-links { display: flex; flex-wrap: wrap; gap: 10px; }
.store-link { display: flex; flex-direction: column; gap: 6px; max-width: 100%; }
.store-links .v-btn { max-width: 100%; height: auto; min-height: 44px; padding-block: 10px; }
.store-links :deep(.v-btn__content) { white-space: normal; }
h2 { font-size: 22px; } h3 { font-size: 16px; } p { font-size: 13px; margin: 12px 0; }
.provider { margin: 24px 0; } article { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e3e8ef; padding: 16px 0; } strong { font-size: 14px; }
@media(max-width: 600px) { article { flex-direction: column; align-items: start; } }
</style>
