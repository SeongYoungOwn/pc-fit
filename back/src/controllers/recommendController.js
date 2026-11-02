const { generateAIReview } = require('../services/aiParser');
const { searchPart, getDefaultPartImage, buildShoppingSearchUrl } = require('../services/naverShopping');
const { checkCompatibility } = require('../services/compatibilityEngine');
const { calculateBottleneck } = require('../services/bottleneckService');
const { generateDeterministicBuild } = require('../services/recommendationEngine');
const supabase = require('../config/supabase');

const TYPES = ['cpu','gpu','motherboard','ram','storage','psu','cooler','case'];

function extractBudget(prompt) {
  const match = prompt.match(/예산:\s*(\d+)\s*만\s*원/);
  if (match) return parseInt(match[1]) * 10000;
  // Fallback for general prompts
  const match2 = prompt.match(/(\d+)\s*만\s*원/);
  return match2 ? parseInt(match2[1]) * 10000 : null;
}

function extractThemes(prompt) {
  const match = prompt.match(/스타일:\s*([^\]]+)/);
  if (match) {
    return match[1].split(',').map(t => t.trim());
  }
  return [];
}

function getRealisticFPS(gpuName, cpuScore = 150, gpuScore = 150) {
    const name = (gpuName || '').toUpperCase();
    // CPU 성능 가중치 (X3D/i7/i9 등 상위 CPU일수록 배그/발로란트 등 온라인 게임 프레임 상승 반영, 0.90 ~ 1.12)
    const cpuFactor = Math.min(Math.max(0.88 + ((cpuScore - 100) / 1500), 0.88), 1.12);
    const scale = (basePubg, baseCyber, baseValo, baseLostark) => ({
        pubg: Math.round(basePubg * cpuFactor),
        cyberpunk: Math.round(baseCyber * (0.96 + (cpuFactor - 1) * 0.4)),
        valorant: Math.round(baseValo * cpuFactor),
        lostark: Math.round(baseLostark * cpuFactor)
    });

    if (name.includes('5090')) return scale(390, 195, 620, 260);
    if (name.includes('5080')) return scale(315, 138, 540, 225);
    if (name.includes('5070 TI') || name.includes('5070TI')) return scale(272, 116, 480, 205);
    if (name.includes('5070')) return scale(232, 94, 430, 185);
    if (name.includes('4090')) return scale(330, 148, 550, 235);
    if (name.includes('4080 SUPER') || name.includes('4080SUPER')) return scale(278, 118, 480, 205);
    if (name.includes('4080')) return scale(270, 114, 470, 200);
    if (name.includes('4070 TI SUPER') || name.includes('4070TISUPER')) return scale(245, 101, 440, 190);
    if (name.includes('4070 TI') || name.includes('4070TI')) return scale(228, 92, 420, 180);
    if (name.includes('4070 SUPER') || name.includes('4070SUPER')) return scale(214, 86, 400, 172);
    if (name.includes('4070')) return scale(186, 73, 370, 155);
    if (name.includes('4060 TI') || name.includes('4060TI')) return scale(152, 58, 330, 135);
    if (name.includes('4060')) return scale(124, 46, 290, 115);
    if (name.includes('3080')) return scale(182, 70, 350, 150);
    if (name.includes('3070')) return scale(150, 56, 310, 130);
    if (name.includes('3060 TI') || name.includes('3060TI')) return scale(134, 49, 290, 118);
    if (name.includes('3060')) return scale(102, 37, 250, 98);
    if (name.includes('7900 XTX')) return scale(275, 112, 470, 198);
    if (name.includes('7900 XT')) return scale(248, 98, 440, 182);
    if (name.includes('7900 GRE')) return scale(215, 84, 400, 168);
    if (name.includes('7800 XT')) return scale(198, 78, 380, 160);
    if (name.includes('7700 XT')) return scale(172, 66, 345, 142);
    if (name.includes('7600')) return scale(120, 45, 280, 110);
    if (name.includes('6600')) return scale(96, 35, 240, 92);
    if (name.includes('내장그래픽') || name.includes('INTEGRATED')) return scale(52, 15, 135, 55);

    // DB gpuScore 기반 동적 계산 폴백 (하드코딩된 100/30 방지)
    const estPubg = Math.round(Math.max(70, gpuScore * 1.15));
    const estCyber = Math.round(Math.max(25, gpuScore * 0.45));
    const estValo = Math.round(Math.max(160, gpuScore * 2.2));
    const estLost = Math.round(Math.max(65, gpuScore * 0.95));
    return scale(estPubg, estCyber, estValo, estLost);
}

function analyzeSynergy(parts) {
  const points = [];
  const cpuScore = parts.cpu?.performance_score || 50;
  const gpuScore = parts.gpu?.performance_score || 50;
  const bottleneck = calculateBottleneck(cpuScore, gpuScore);
  
  points.push({ 
    icon: bottleneck.color === 'success' ? 'mdi-check-decagram' : 'mdi-alert-decagram', 
    text: bottleneck.message, 
    color: bottleneck.color,
    percentage: bottleneck.percentage
  });

  if (parts.cpu?.name?.toUpperCase().includes('AMD') && parts.gpu?.name?.toUpperCase().includes('AMD')) {
    points.push({ icon: 'mdi-flash', text: '라라랜드 시너지 (SAM 기술 활성화 가능)', color: 'primary' });
  }
  
  const cpuTdp = parts.cpu?.tdp || 65;
  const gpuTdp = parts.gpu?.tdp || 200;
  const totalTdp = cpuTdp + gpuTdp;
  const psuWattage = parts.psu?.wattage || parts.psu?.total_wattage || 0;
  
  if (psuWattage >= totalTdp * 1.8) {
    points.push({ icon: 'mdi-shield-check', text: '전력 공급 여유 (시스템 안정성 최상)', color: 'success' });
  }

  return points;
}

// Budget Guard removed to preserve V3.0 V-Combo Engine's socket compatibility.

exports.recommend = async (req, res, next) => {
  const { budget = 1500000, usage = 'gaming', brand = '상관없음' } = req.body;
  const userBudget = parseInt(budget);

  let userLevel = 'newbie';
  if (req.session.userId) {
    const { data: user } = await supabase.from('users').select('user_level').eq('id', req.session.userId).single();
    if (user) {
      userLevel = user.user_level || 'newbie';
    }
  }

  try {
    // 1. 알고리즘 기반 무결점 견적 1세트 생성 (호환성 100% 보장)
    console.log(`[Engine] Generating deterministic build for budget: ${userBudget}, usage: ${usage}, brand: ${brand}`);
    const rawBuild = await generateDeterministicBuild(userBudget, usage, brand);
    
    let finalParts = {};
    let totalPrice = 0;

    // 2. 가격 및 스펙은 Supabase DB 및 코어 라이브러리 데이터를 우선 사용하며,
    //    네이버 이미지 검색 API로 부품 썸네일과 쇼핑 검색 링크만 보강
    const naverPromises = TYPES.map(async (t) => {
        const part = rawBuild[t];
        if (!part) return null;

        const searchKeyword = part.name;
        const dbPrice = Number(part.specs?.estimatedPrice || part.specs?.Price || part.price || 0);
        let naverData = null;

        if (!String(part.id || '').startsWith('dummy_')) {
            naverData = await searchPart(searchKeyword, t);
        }

        const socketVal = part.specs?.Socket || part.specs?.socket || undefined;
        const ramTypeVal = part.specs?.memory_type || part.specs?.type || (part.name?.toUpperCase().includes('DDR5') ? 'DDR5' : (part.name?.toUpperCase().includes('DDR4') ? 'DDR4' : undefined));
        const wattageVal = part.specs?.total_wattage || part.specs?.wattage || (t === 'psu' ? parseInt(part.name?.match(/(\d+)\s*W/i)?.[1], 10) || undefined : undefined);

        return {
            type: t,
            part: {
                db_id: part.id,
                name: part.name,
                keyword: searchKeyword,
                price: dbPrice,
                image: naverData?.image || getDefaultPartImage(t),
                link: naverData?.link || buildShoppingSearchUrl(part.name),
                ...part.specs,
                ...(socketVal ? { socket: socketVal } : {}),
                ...(ramTypeVal ? { ramType: ramTypeVal } : {}),
                ...(wattageVal ? { wattage: wattageVal } : {}),
                is_3d_ready: !String(part.id || '').startsWith('dummy_'),
                alternatives: part.alternatives || null
            }
        };
    });

    const naverResults = await Promise.all(naverPromises);
    for (const result of naverResults) {
        if (result) {
            finalParts[result.type] = result.part;
            totalPrice += result.part.price;
        }
    }

    // 2.5. 네이버 API 가격 기반 예산 재검증 및 다운그레이드 (Budget Guard) 제거됨 (V3.0 Combo 엔진 신뢰)
    // const budgetGuardResult = await downgradePartsIfOverBudget(finalParts, userBudget, totalPrice);
    // finalParts = budgetGuardResult.parts;
    // totalPrice = budgetGuardResult.newTotal;

    const compat = checkCompatibility(finalParts);
    const bottleneck = calculateBottleneck(finalParts.cpu?.performance_score || 50, finalParts.gpu?.performance_score || 50);

    return res.json({
      success: true,
      data: {
        parts: finalParts,
        totalPrice: totalPrice,
        totalWattage: compat.totalWattage,
        recommendedPsu: compat.recommendedPsu,
        compatibility: { isCompatible: compat.isCompatible, warnings: compat.warnings },
        combo_metrics: {
          grade: rawBuild.grade || 'B',
          reasoning: rawBuild.reasoning || [],
          finalScore: Math.round((rawBuild.finalScore || 0) * 10) / 10
        },
        performance_metrics: {
          game_fps: getRealisticFPS(finalParts.gpu?.name, finalParts.cpu?.performance_score || 150, finalParts.gpu?.performance_score || 150),
          build_score: Math.min(100, Math.round(rawBuild.finalScore || (((finalParts.cpu?.performance_score || 50) + (finalParts.gpu?.performance_score || 50)) / 2))),
          synergy: analyzeSynergy(finalParts),
          bottleneck: bottleneck
        }
      }
    });

  } catch (e) { 
      console.error('[Recommend Error]', e);
      next(e); 
  }
};

exports.aiReview = async (req, res, next) => {
    try {
        const { parts, usage = 'gaming', program = '', budget = 0, model = 'claude' } = req.body;
        
        let userLevel = 'newbie';
        if (req.session?.userId) {
            const { data: user } = await supabase.from('users').select('user_level').eq('id', req.session.userId).single();
            if (user) userLevel = user.user_level || 'newbie';
        }

        const compat = checkCompatibility(parts);

        const buildDataForAI = {
            parts,
            totalPrice: Object.values(parts || {}).reduce((sum, p) => sum + (p?.price || 0), 0),
            budget,
            compat
        };

        const budgetDesc = budget ? `${Math.round(Number(budget) / 10000)}만 원(${Number(budget).toLocaleString()}원)` : '미지정';
        const promptContext = `목표 예산 ${budgetDesc}, 용도 ${usage}${program ? ` (주 사용 프로그램/게임: ${program})` : ''}를 위해 맞춘 견적입니다.`;
        const aiReview = await generateAIReview(promptContext, buildDataForAI, usage, userLevel, model);

        return res.json({
            success: true,
            data: {
                title: aiReview.title || "맞춤형 AI 추천 견적",
                overall_summary: aiReview.overall_summary,
                detailed_review: aiReview.detailed_review,
                part_reviews: aiReview.reviews, // { cpu: '...', gpu: '...' }
                advisor_questions: Array.isArray(aiReview.advisor_questions) ? aiReview.advisor_questions : []
            }
        });
    } catch (e) {
        console.error('[AI Review Error]', e);
        next(e);
    }
};