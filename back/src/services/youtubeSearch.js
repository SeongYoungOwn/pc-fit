const axios = require('axios');
const cache = new Map();
const TTL = 24 * 60 * 60 * 1000;

async function searchBenchmark(cpu, gpu) {
  const key = `${cpu}+${gpu}`;
  if (cache.has(key) && cache.get(key).exp > Date.now()) return { videos: cache.get(key).data, cached: true };

  if (!process.env.YOUTUBE_API_KEY) return {
    videos: [], fallbackUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${cpu} ${gpu} benchmark`)}`,
    message: '[API 키 필요] YOUTUBE_API_KEY 설정 필요'
  };

  try {
    // 따옴표("")를 사용한 Exact Match 쿼리 및 게임 테스트 핵심 키워드 조합
    const query = `"${cpu}" "${gpu}" benchmark test gaming`;
    const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { 
        part: 'snippet', 
        q: query, 
        type: 'video', 
        maxResults: 10, 
        order: 'relevance', 
        key: process.env.YOUTUBE_API_KEY 
      }
    });

    try {
      const usageTracker = require('./usageTracker');
      usageTracker.log({ api_type: 'youtube', endpoint: '/search' });
    } catch (e) {}

    // 백엔드 2차 필터링: 제목에 CPU와 GPU 모델명이 동시에 포함된 영상만 높은 우선순위로 유지
    const filteredVideos = res.data.items
      .map(i => ({ 
        videoId: i.id.videoId, 
        title: i.snippet.title, 
        thumbnail: i.snippet.thumbnails.medium.url 
      }))
      .filter(v => {
        const title = v.title.toLowerCase();
        // 핵심 모델명 추출 (예: 14600K, 4070 SUPER 등)
        const cpuCore = cpu.toLowerCase().split(' ').pop();
        const gpuCore = gpu.toLowerCase().split(' ').pop();
        return title.includes(cpuCore) && title.includes(gpuCore);
      })
      .slice(0, 3);

    // 필터링된 결과가 적을 경우 차선책으로 전체 결과 중 상위 3개 반환
    const finalVideos = filteredVideos.length > 0 ? filteredVideos : res.data.items
      .slice(0, 3)
      .map(i => ({ 
        videoId: i.id.videoId, 
        title: i.snippet.title, 
        thumbnail: i.snippet.thumbnails.medium.url 
      }));

    cache.set(key, { data: finalVideos, exp: Date.now() + TTL });
    return { videos: finalVideos, cached: false };
  } catch (error) {
    console.error('[YouTube Search Error]', error.message);
    return { 
      videos: [], 
      fallbackUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${cpu} ${gpu} benchmark`)}`, 
      message: '유튜브에서 직접 검색해보세요' 
    };
  }
}

module.exports = { searchBenchmark };
