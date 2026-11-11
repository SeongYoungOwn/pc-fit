const express = require('express');
const { searchLimiter } = require('../config/rateLimiter');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { getCatalogConfig } = require('../config/deviceCatalog');
const { createTechSpecsClient } = require('../services/techSpecsClient');
const { getConfiguredRepository } = require('../services/deviceCatalogRepository');
const { createDeviceCatalogService } = require('../services/deviceCatalogService');
const { formatDeviceSpecGroups } = require('../services/deviceSpecPresentation');

function createDeviceRouter({ service, admin = requireAdmin } = {}) {
  const router = express.Router();
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const handle = operation => async (req, res) => {
    try { res.json({ success: true, data: await operation(req) }); }
    catch (error) {
      const known = typeof error.code === 'string' && error.status >= 400 && error.status <= 504;
      res.status(known ? error.status : 500).json({ success: false, code: known ? error.code : 'CATALOG_ERROR',
        error: known ? error.message : '제품 정보를 처리하지 못했습니다.', ...(error.progress ? { progress: error.progress } : {}) });
    }
  };
  router.get('/meta', handle(req => service.meta(req.query)));
  router.get('/compare', searchLimiter, handle(req => service.compare(req.query)));
  router.get('/products', searchLimiter, handle(req => service.search(req.query)));
  router.get('/products/:id/offers', searchLimiter, handle(async req => {
    const product = await service.detail(req.params.id, req.query);
    return require('../services/deviceOffers').getDeviceOffers(product);
  }));
  router.get('/products/:id', searchLimiter, handle(async req => {
    const product = await service.detail(req.params.id, req.query);
    if (!['Smartphones', 'Laptops', 'Tablets', 'Smartwatches'].includes(product.category)) return product;
    return { ...product, specGroups: formatDeviceSpecGroups(product) };
  }));
  router.post('/import', admin, searchLimiter, handle(req => service.importPage(req.body)));
  router.patch('/products/:id/domestic-availability', admin, handle(req => service.reviewDomestic(req.params.id, req.body)));
  return router;
}
function defaultRouter() {
  const { createOfficialCatalogRepository } = require('../services/officialCatalogRepository');
  const devices = createDeviceCatalogService({ client: createTechSpecsClient(), repository: createOfficialCatalogRepository(getConfiguredRepository(),getCatalogConfig), config: getCatalogConfig, publicCatalog: true });
  const { createCatalogFacade } = require('../services/catalogFacade');
  const { getPartsRepository } = require('../services/partsCatalogRepository');
  return createDeviceRouter({ service: createCatalogFacade({ devices, parts: getPartsRepository() }) });
}
module.exports = { createDeviceRouter, defaultRouter };
