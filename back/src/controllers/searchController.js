const { searchPartList, searchPart } = require('../services/naverShopping');
const supabase = require('../config/supabase');

exports.searchParts = async (req, res, next) => {
  try { res.json({ success: true, data: await searchPartList(req.query.keyword, req.query.type, parseInt(req.query.page)||1) }); }
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
    const { keyword, type } = req.query;
    
    // DB 카테고리 매핑 (corePartsLibrary의 소문자 키와 일치시킴)
    const CATEGORY_MAP = {
      cpu: 'cpu',
      gpu: 'gpu',
      ram: 'ram',
      psu: 'psu',
      motherboard: 'motherboard',
      storage: 'storage',
      cooler: 'cooler'
    };

    const category = CATEGORY_MAP[type];
    if (!category) return res.status(400).json({ success: false, error: '잘못된 카테고리입니다.' });

    // 1. corePartsLibrary.json 검색 (1000개 DB)
    const fs = require('fs');
    const path = require('path');
    const coreLib = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/corePartsLibrary.json'), 'utf8'));
    
    let dbData = coreLib[category] || [];
    const words = keyword.trim().toUpperCase().split(/\s+/).filter(w => w.length > 0);
    
    let filtered = dbData.filter(item => {
      const name = item.search_keyword.toUpperCase();
      return words.every(w => name.includes(w));
    });

    let finalResults = filtered.map(item => ({ name: item.search_keyword, source: 'coreDB' }));

    // 2. 검색 결과가 너무 적으면 네이버 쇼핑에서 보충 (하이브리드)
    if (finalResults.length < 5) {
      try {
        const { searchPartList } = require('../services/naverShopping');
        const naverResults = await searchPartList(keyword, type, 1);
        const itemsToMap = Array.isArray(naverResults) ? naverResults : (naverResults.items || []);
        
        const naverFormatted = itemsToMap.map(item => ({ 
          name: item.name.replace(/<[^>]*>?/gm, ''), // HTML 태그 제거
          source: 'naver' 
        }));
        
        // 중복 제거 (이름 기준) 후 합치기
        const existingNames = new Set(finalResults.map(r => r.name.toUpperCase()));
        naverFormatted.forEach(item => {
          if (!existingNames.has(item.name.toUpperCase())) {
            finalResults.push(item);
          }
        });
      } catch (err) {
        console.error('[Hybrid Search] Naver API fallback failed:', err.message);
      }
    }

    res.json({ success: true, data: finalResults.slice(0, 50) });
  } catch (e) { next(e); }
};