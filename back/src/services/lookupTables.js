const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), 'back/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

module.exports = {
  chipsetSocketMap: require('../data/chipsetSocketMap.json'),
  gpuTdpMap: require('../data/gpuTdpMap.json'),
  cpuTdpMap: require('../data/cpuTdpMap.json'),
  naverCategoryMap: require('../data/naverCategoryMap.json'),

  /**
   * DB에서 가장 유사한 부품 검색
   */
  async findPartInDB(category, keyword) {
    try {
      // 1. 단순 텍스트 검색 (ilike 사용)
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('category', category)
        .ilike('name', `%${keyword}%`)
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) return data[0];

      // 2. 검색 실패 시 단어별로 쪼개서 시도 (예: "RTX 4060 Ti" -> "4060", "Ti")
      const words = keyword.split(' ').filter(w => w.length > 1);
      if (words.length > 0) {
        let query = supabase.from('parts').select('*').eq('category', category);
        words.forEach(word => {
          query = query.ilike('name', `%${word}%`);
        });
        const { data: data2 } = await query.limit(1);
        if (data2 && data2.length > 0) return data2[0];
      }

      return null;
    } catch (err) {
      console.error(`[DB Lookup] Error finding ${category} with keyword ${keyword}:`, err);
      return null;
    }
  }
};
