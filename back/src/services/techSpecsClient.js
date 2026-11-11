const axios = require('axios');
const { getCatalogConfig } = require('../config/deviceCatalog');
const { catalogError } = require('./deviceCatalogPolicy');

function createTechSpecsClient({ transport = axios, config = getCatalogConfig } = {}) {
  async function request(path, params) {
    const { apiId, apiKey } = config();
    if (!apiId || !apiKey) throw catalogError(503, 'TECHSPECS_NOT_CONFIGURED', '제품 정보 서비스가 아직 준비되지 않았습니다.');
    try {
      const response = await transport.get(`https://api.techspecs.io/v5${path}`, {
        params, timeout: 20000, maxRedirects: 0, maxContentLength: 5 * 1024 * 1024,
        headers: { accept: 'application/json', 'x-api-id': apiId, 'x-api-key': apiKey }
      });
      if (response.data?.Success === 0 || response.data?.success === false || response.data?.status === 'fail') {
        throw catalogError(502, 'TECHSPECS_REJECTED', '제품 정보 제공 서비스가 요청을 처리하지 못했습니다.');
      }
      return response.data;
    } catch (error) {
      // Never pass an Axios error/config or provider message (which may contain credentials) to the logger.
      if (error.code?.startsWith('TECHSPECS_')) throw error;
      const status = error.response?.status;
      if (status === 400) throw catalogError(502, 'TECHSPECS_PARAMETERS', '제품 정보 서비스의 요청 조건을 확인해야 합니다.');
      if (status === 429) throw catalogError(429, 'TECHSPECS_RATE_LIMIT', '제품 조회 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.');
      if (status === 401 || status === 403) throw catalogError(503, 'TECHSPECS_AUTH', '제품 정보 서비스의 인증 또는 이용 권한을 확인해야 합니다.');
      if (status === 404) throw catalogError(404, 'DEVICE_NOT_FOUND', '해당 제품을 찾을 수 없습니다.');
      if (error.code === 'ECONNABORTED') throw catalogError(504, 'TECHSPECS_TIMEOUT', '제품 조회 시간이 초과됐습니다. 다시 시도해 주세요.');
      throw catalogError(502, 'TECHSPECS_UNAVAILABLE', '제품 정보 서비스에 연결할 수 없습니다.');
    }
  }
  return {
    search: filters => request('/products/search/', {
      category: filters.category, ...(filters.brand ? { brand: filters.brand } : {}),
      ...(filters.from ? { from: filters.from } : {}), to: filters.to,
      page: filters.page, size: filters.size, keepCasing: true,
      ...(filters.query ? { query: filters.query } : {})
    }),
    detail: id => request(`/products/${encodeURIComponent(id)}`, { lang: 'en', keepCasing: true })
  };
}
module.exports = { createTechSpecsClient };
