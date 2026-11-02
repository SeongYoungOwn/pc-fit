const supabase = require('../config/supabase');
const openai = require('../config/openai');

const SYSTEM_PROMPT = `당신은 세계 최고의 PC 빌드 전문가입니다.
사용자가 현재 견적에서 특정 부품을 변경해 달라고 요청했습니다.
제공된 전체 부품 카탈로그를 참고하여, 사용자의 지시에 맞게 부품을 교체한 후, 변경된 부품과 변경 이유(새 리뷰)를 JSON 포맷으로 응답하세요.
변경이 불가능하거나 카탈로그에 없는 경우, 원래 부품을 유지하고 이유를 설명하세요.

## 📝 출력 JSON 포맷
{
  "swapped_parts": {
    "gpu": "카탈로그에 있는 정확한 부품 이름 (없으면 해당 키 생략)"
  },
  "new_review": "왜 이 부품으로 교체했는지 전문가로서 친절하게 설명 (1~2문장)"
}`;

exports.modifyBuild = async (req, res, next) => {
  try {
    const { currentBuild, userMessage, originalPrompt } = req.body;
    
    if (!currentBuild || !userMessage) {
      return res.status(400).json({ success: false, error: '현재 견적과 변경 요청 메시지가 필요합니다.' });
    }

    // 간단한 키워드 매칭으로 변경하려는 카테고리 유추
    const msg = userMessage.toLowerCase();
    const categoriesToFetch = [];
    
    if (msg.includes('cpu') || msg.includes('씨피유') || msg.includes('시피유') || msg.includes('프로세서') || msg.includes('인텔') || msg.includes('라이젠') || msg.includes('intel') || msg.includes('amd')) categoriesToFetch.push('cpu');
    if (msg.includes('gpu') || msg.includes('그래픽') || msg.includes('글카') || msg.includes('지포스') || msg.includes('라데온') || msg.includes('rtx') || msg.includes('rx') || msg.includes('vga')) categoriesToFetch.push('gpu');
    if (msg.includes('ram') || msg.includes('램') || msg.includes('메모리') || msg.includes('memory') || msg.includes('기가')) categoriesToFetch.push('ram');
    if (msg.includes('보드') || msg.includes('마더보드') || msg.includes('메인보드') || msg.includes('motherboard') || msg.includes('mainboard')) categoriesToFetch.push('motherboard');
    if (msg.includes('파워') || msg.includes('psu') || msg.includes('전력') || msg.includes('power')) categoriesToFetch.push('psu');
    if (msg.includes('케이스') || msg.includes('case') || msg.includes('어항')) categoriesToFetch.push('case');
    if (msg.includes('쿨러') || msg.includes('cooler') || msg.includes('수랭') || msg.includes('공랭') || msg.includes('방열')) categoriesToFetch.push('cooler');
    if (msg.includes('ssd') || msg.includes('스토리지') || msg.includes('저장') || msg.includes('storage') || msg.includes('하드') || msg.includes('hdd')) categoriesToFetch.push('storage');

    // 카테고리 유추 실패 시 전체 카탈로그 가져오기
    let partsQuery = supabase.from('parts').select('name, category, specs, manufacturer');
    if (categoriesToFetch.length > 0) {
      partsQuery = partsQuery.in('category', categoriesToFetch);
    }
    // 토큰 폭발 방지를 위해 최대 20개의 가장 관련성 높은 부품만 로드
    const { data: catalog, error: dbError } = await partsQuery.limit(30);
    if (dbError) throw dbError;

    // 카탈로그 텍스트 구성 (최소화)
    const catalogString = catalog.map(p => `[${p.category}] ${p.name} - ${p.specs?.estimatedPrice || p.specs?.Price || '가격미상'}원`).join('\n');

    const promptMessage = `
[사용자 초기 목적]: ${originalPrompt || '알 수 없음'}
[사용자 변경 요청]: "${userMessage}"

[현재 견적(Current Build)]:
${Object.entries(currentBuild).map(([k, v]) => `- ${k}: ${v.name || v}`).join('\n')}

[교체 가능 부품 카탈로그]:
${catalogString}

지시에 따라 부품을 교체하고 JSON 포맷으로 응답하세요. 카탈로그에 없는 부품은 사용하지 마세요.`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: promptMessage }
    ];

    const preferredModel = req.body.model === 'claude' ? 'claude-sonnet-4-6' :
                           req.body.model === 'chatgpt' ? 'gpt-5.1' :
                           req.body.model === 'gemini' ? 'gemini-3.5-flash' : 'gpt-5.1';

    const fallbackModels = [preferredModel, 'gpt-5.1', 'gemini-3.5-flash', 'claude-sonnet-4-6'].filter((v, i, a) => a.indexOf(v) === i);
    let completion = null;
    let lastModelErr = null;
    for (const modelName of fallbackModels) {
      try {
        const reqOptions = {
          model: modelName,
          messages: messages,
          temperature: 0.5
        };
        if (!modelName.startsWith('claude-')) {
          reqOptions.response_format = { type: "json_object" };
        }
        completion = await openai.chat.completions.create(reqOptions);
        break;
      } catch (mErr) {
        console.error(`[ModifyBuild] Model ${modelName} failed:`, mErr.message);
        lastModelErr = mErr;
      }
    }
    if (!completion) throw (lastModelErr || new Error('AI 부품 교체 요청 처리에 실패했습니다.'));

    const resultText = completion.choices[0].message.content || '';
    
    // Usage Tracking
    try {
      const usageTracker = require('../services/usageTracker');
      await usageTracker.log({
        api_type: 'gemini_ai',
        endpoint: '/recommend/modify-build',
        tokens_used: completion.usage ? (completion.usage.prompt_tokens + completion.usage.completion_tokens) : 0,
        status: 'success'
      });
    } catch (trackErr) {
      console.error('[UsageTracker] AI tracking failed:', trackErr.message);
    }

    const codeBlockMatch = resultText.trim().match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : resultText.trim();
    const aiResult = JSON.parse(jsonStr);

    // AI가 제안한 부품에 대해 DB/코어 라이브러리 가격·스펙을 우선 조회하고 네이버 이미지/검색 링크 결합
    const swappedPartsFull = {};
    if (aiResult.swapped_parts) {
      const naverShopping = require('../services/naverShopping');
      for (const [partType, partName] of Object.entries(aiResult.swapped_parts)) {
        try {
          const dbInfo = await naverShopping.lookupDbPartPriceAndSpecs(partName, partType);
          const naverData = await naverShopping.searchPart(partName, partType);
          swappedPartsFull[partType] = {
            ...dbInfo.specs,
            name: partName,
            price: dbInfo.price,
            image: naverData?.image || naverShopping.getDefaultPartImage(partType),
            link: naverData?.link || naverShopping.buildShoppingSearchUrl(partName),
            _originalDbName: partName
          };
        } catch (e) {
          console.error('[ModifyBuild] Hydration failed for', partName, e.message);
          const dbInfo = await naverShopping.lookupDbPartPriceAndSpecs(partName, partType);
          swappedPartsFull[partType] = {
            ...dbInfo.specs,
            name: partName,
            price: dbInfo.price,
            image: naverShopping.getDefaultPartImage(partType),
            link: naverShopping.buildShoppingSearchUrl(partName)
          };
        }
      }
    }

    res.json({
      success: true,
      data: {
        swapped_parts: swappedPartsFull,
        new_review: aiResult.new_review
      }
    });

  } catch (error) {
    next(error);
  }
};
