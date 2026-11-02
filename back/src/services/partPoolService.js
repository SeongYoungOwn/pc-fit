const goldenBuilds = require('../data/goldenBuilds.json');
const supabase = require('../config/supabase');

function getGoldenBuild(budget, usage) {
  if (!budget) return null;
  // 해당 용도와 예산 범위에 맞는 골든 빌드 검색
  const match = goldenBuilds.find(b => 
    b.usage === usage && 
    budget >= b.budget_range[0] && 
    budget <= b.budget_range[1]
  );
  return match || null;
}

function allocateBudget(totalBudget, usage) {
  if (!totalBudget) return null;
  
  const matrix = {};
  
  // 50만원 이하 사무용은 무조건 내장그래픽
  if (totalBudget <= 500000 || usage === 'Office') {
    matrix.gpu = { min: 0, max: 0 }; // 내장그래픽 강제
    matrix.cpu = { min: totalBudget * 0.3, max: totalBudget * 0.5 };
    matrix.motherboard = { min: 60000, max: 120000 };
    matrix.ram = { min: 30000, max: 70000 };
    matrix.storage = { min: 40000, max: 80000 };
    matrix.psu = { min: 35000, max: 55000 };
    matrix.case = { min: 25000, max: 40000 };
    matrix.cooler = { min: 0, max: 20000 };
    return matrix;
  }

  if (usage === 'Gaming') {
    matrix.gpu = { min: totalBudget * 0.40, max: totalBudget * 0.55 }; // 40~55%
    matrix.cpu = { min: totalBudget * 0.15, max: totalBudget * 0.25 }; // 15~25%
  } else if (usage === 'Professional') {
    matrix.cpu = { min: totalBudget * 0.30, max: totalBudget * 0.40 }; // 30~40%
    matrix.ram = { min: totalBudget * 0.10, max: totalBudget * 0.15 }; // 10~15%
    matrix.gpu = { min: totalBudget * 0.20, max: totalBudget * 0.30 }; // 20~30%
  } else {
    // Default balanced
    matrix.gpu = { min: totalBudget * 0.30, max: totalBudget * 0.40 };
    matrix.cpu = { min: totalBudget * 0.20, max: totalBudget * 0.30 };
  }

  // 나머지 부품 기본 배분 (대략적)
  if (!matrix.motherboard) matrix.motherboard = { min: totalBudget * 0.08, max: totalBudget * 0.15 };
  if (!matrix.ram) matrix.ram = { min: totalBudget * 0.05, max: totalBudget * 0.10 };
  if (!matrix.storage) matrix.storage = { min: totalBudget * 0.05, max: totalBudget * 0.10 };
  if (!matrix.psu) matrix.psu = { min: totalBudget * 0.05, max: totalBudget * 0.10 };
  if (!matrix.case) matrix.case = { min: totalBudget * 0.03, max: totalBudget * 0.08 };
  if (!matrix.cooler) matrix.cooler = { min: totalBudget * 0.02, max: totalBudget * 0.06 };

  return matrix;
}

/**
 * 용도와 예산, 감성(색상)을 기반으로 AI에게 제공할 부품 Pool과 예산 매트릭스를 추출합니다.
 */
async function generateComponentPool(budget, usage, colorPreference = null) {
  const categoryMap = {
    cpu: 'CPU',
    gpu: 'GPU',
    motherboard: 'Motherboard',
    ram: 'RAM',
    storage: 'Storage',
    psu: 'PSU',
    case: 'PCCase',
    cooler: 'CPUCooler'
  };

  const pool = {};
  const budgetMatrix = allocateBudget(budget, usage);

  for (const [key, catName] of Object.entries(categoryMap)) {
    let query = supabase
      .from('parts')
      .select('id, name, manufacturer, specs')
      .eq('category', catName);

    // 감성(화이트) 필터링
    if (colorPreference === 'white' && ['case', 'cooler', 'ram', 'motherboard', 'gpu'].includes(key)) {
      query = query.or("name.ilike.%화이트%,name.ilike.%white%,name.ilike.%snow%,name.ilike.%스노우%");
    }

    // 데이터 초경량화 및 강력한 예산 필터링 (V3++ 안전 모드)
    let { data, error } = await query;
    
    if (!error && data) {
      const catBudget = budgetMatrix ? budgetMatrix[key] : null;
      
      let filteredData = data.filter(item => {
        const nameUpper = item.name.toUpperCase();
        // 서버/워크스테이션용 고가 부품 원천 차단
        if (nameUpper.includes('THREADRIPPER') || nameUpper.includes('XEON') || nameUpper.includes('EPYC')) return false;

        if (catBudget && budget) {
          const price = item.specs?.Price || 0;
          if (price > 0) {
              return price >= catBudget.min * 0.5 && price <= catBudget.max * 1.5;
          }
          // 가격이 0인 경우 아예 제외하여 예상치 못한 고가 부품 선택 방지
          return false;
        }
        return true;
      });

      // 필터링 후 부품이 너무 적으면 예산 상한선만 걸고 재시도
      if (filteredData.length < 3 && catBudget) {
        filteredData = data.filter(item => {
            const nameUpper = item.name.toUpperCase();
            if (nameUpper.includes('THREADRIPPER') || nameUpper.includes('XEON') || nameUpper.includes('EPYC')) return false;
            
            const price = item.specs?.Price || 0;
            // 가격이 없더라도 포함시키되 예산이 1.5배 이상 넘는 경우(가격이 있는 경우) 제외
            if (price > 0 && price > catBudget.max * 2.0) return false;
            return true;
        });
      }

      // 최종적으로 가장 적합한 5개만 AI에게 전달
      pool[key] = filteredData.slice(0, 5).map(item => ({
        id: item.id,
        name: item.name,
        price: item.specs?.Price || 0,
        socket: item.specs?.Socket || null
      }));
    } else {
      pool[key] = [];
    }
  }

  return { pool, budgetMatrix };
}

module.exports = { generateComponentPool, getGoldenBuild };
