const { searchPart } = require('../services/naverShopping');

exports.searchParts = async (req, res, next) => {
  try {
    const { getPartsRepository } = require('../services/partsCatalogRepository');
    const data = getPartsRepository().builderList({ type: req.query.type, query: req.query.keyword || '',
      page: Number(req.query.page || 1) - 1, size: 20, brand: req.query.brand });
    const { getDefaultPartImage, buildShoppingSearchUrl } = require('../services/naverShopping');
    data.items = data.items.map(item => ({ ...item, image: getDefaultPartImage(req.query.type), link: buildShoppingSearchUrl(item.name,req.query.type) }));
    res.json({ success: true, data });
  }
  catch (e) { next(e); }
};

exports.getPartDetail = async (req, res, next) => {
  try {
    const { name, type } = req.query;
    const data = await searchPart(name, type);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

exports.searchPartsInDB = async (req, res, next) => {
  try {
    const { getPartsRepository } = require('../services/partsCatalogRepository');
    const result = getPartsRepository().builderList({ type: req.query.type, query: req.query.keyword || '', size: 50 });
    res.json({ success: true, data: result.items.map(p => ({ id:p.id, name:p.name, source:p.source, sourceUrl:p.sourceUrl })) });
  } catch (e) { next(e); }
};
