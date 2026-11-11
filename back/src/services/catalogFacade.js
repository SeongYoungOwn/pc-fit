const { PART_CATEGORIES } = require('../config/partsCatalog');
const { CATEGORIES } = require('../config/deviceCatalog');
const { catalogError } = require('./deviceCatalogPolicy');

// Public browsing uses saved provider records only. It never makes a paid API request.
function createCatalogFacade({ devices, parts }) {
  const categories = [...PART_CATEGORIES.map(c => CATEGORIES.find(d=>d.value===c.value) || c), ...CATEGORIES.filter(c => !PART_CATEGORIES.some(p => p.value === c.value))];
  const isPartCategory = category => category !== 'Laptops' && PART_CATEGORIES.some(c => c.value === (category || 'CPUs'));
  return {
    async search(input = {}) {
      if (!isPartCategory(input.category)) return devices.search(input);
      const result = parts.list(input);
      return { ...result, items: result.items.map(({ specs, searchText, ...product }) => product) };
    },
    async meta(input = {}) {
      const inventory = parts.status();
      let brands = [], policy = {};
      if (isPartCategory(input.category)) brands = parts.brands(input);
      else { const meta = await devices.meta(input); brands = meta.brands; policy = meta.policy; }
      return { categories: categories.map(c => ({ ...c, count: inventory.categories.find(r => r.category === c.value)?.count })), brands, policy, inventory };
    },
    async detail(id, input = {}) {
      if (!id.startsWith('opendb_')) return devices.detail(id,input);
      const product = parts.detail(id);
      if (input.category && product.category !== input.category) throw catalogError(404,'PART_NOT_FOUND','선택한 종류의 제품이 아닙니다.');
      return { ...product, specRows: require('./partsCatalogNormalizer').formatPartSpecs(product.specs,product.sourceCategory) };
    },
    compare: input => devices.compare(input),
    importPage: input => devices.importPage(input),
    reviewDomestic: (id,input) => devices.reviewDomestic(id,input)
  };
}
module.exports = { createCatalogFacade };
