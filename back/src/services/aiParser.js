const openai = require('../config/openai');

const SYSTEM_PROMPT = `당신은 IT 기기 전문 리뷰어이자 최고의 PC 빌드 전문가입니다.
내가 제공하는 '완성된 PC 견적 데이터'를 보고, 사용자의 '용도'와 '수준'에 맞춰 이 견적이 왜 훌륭한지 친절하게 설명해 주세요.

## 🎯 역할 및 핵심 제약사항 (반드시 지킬 것)
1. **절대 거짓말(할루시네이션) 금지**: 부품을 언급할 때는 반드시 전달된 JSON 데이터 속 부품의 \`name\` 필드(최종 확정된 실제 제품명)를 그대로 사용하세요. 임의로 부품 이름을 지어내거나 다른 부품명으로 헷갈려 언급하면 절대 안 됩니다.
2. **시스템 호환성 데이터 존중**: 전달된 데이터에 포함된 시스템의 요구 전력량(\`compat.recommendedPsu\`) 및 경고 내역(\`compat.warnings\`)을 100% 존중하여 리뷰하세요. 시스템이 전력이 부족하다고 경고했다면, "파워가 넉넉하고 충분하다"는 식의 거짓말을 절대 하지 마세요.
3. 사용자의 용도(예: 배틀그라운드, 영상편집, 사무용)에 이 부품 조합이 왜 완벽한지 팩트 기반으로 설명하세요.
4. 각 부품별 평가는 딱 1문장으로 간결하고 임팩트 있게 작성하세요.
5. 추가로 'detailed_review' 항목에 3~4문단 분량의 깊이 있는 종합 분석 리포트(병목 현상 밸런스, 전력 여유도, 타겟 게임/작업에서의 예상 퍼포먼스 등)를 작성해 주세요.
6. 'advisor_questions' 항목에는 현재 견적에 실제로 들어간 부품명과 대안 부품(alternatives), 가격, 사용자의 용도/목표 예산을 반영하여 사용자가 가장 궁금해할 만한 맞춤형 비교 질문 3개를 생성하세요. 고정된 문구가 아니라 이 견적만의 실제 부품명과 가격 차이를 반영해야 합니다.
7. 마크다운 코드블록 없이 반드시 아래의 순수 JSON 포맷으로만 응답해야 합니다.

## 📝 출력 JSON 포맷
{
  "title": "견적의 특징을 잘 나타내는 센스있는 제목 (예: 배틀그라운드 QHD 고주사율 방어 세팅)",
  "overall_summary": "이 견적이 전체적으로 어떤 강점을 가지며, 유저의 용도에 왜 부합하는지 2문장 내외로 작성한 요약평",
  "detailed_review": "3~4문단 분량의 상세 분석 리포트 (마크다운 포맷 불가, \\n 으로 줄바꿈 처리). 병목 밸런스, 타겟 게임/앱에서의 체감 성능, 업그레이드 팁 등을 유튜버처럼 전문적이고 친절하게 작성.",
  "reviews": {
    "cpu": "CPU가 이 용도에서 발휘하는 장점 (1문장)",
    "gpu": "그래픽카드의 퍼포먼스와 선택 이유 (1문장)",
    "motherboard": "메인보드의 안정성이나 확장성 (1문장)",
    "ram": "메모리 용량과 속도가 작업/게임에 미치는 영향 (1문장)",
    "storage": "SSD의 속도와 용량의 장점 (1문장)",
    "psu": "파워의 안정성과 전력 여유에 대한 설명 (1문장)",
    "cooler": "쿨링 성능과 온도 유지에 대한 설명 (1문장)",
    "case": "케이스의 디자인이나 통풍 성능 (1문장)"
  },
  "advisor_questions": [
    {
      "label": "버튼에 표시할 짧은 비교 질문 제목 (현재 견적의 실제 부품명과 대안 부품명 포함)",
      "query": "어드바이저에게 전달할 구체적인 비교 분석 질문 문장"
    }
  ]
}
`;

function sanitizeBuildDataForPrompt(buildData) {
  if (!buildData || !buildData.parts) return buildData;
  const cleanParts = {};
  for (const [type, part] of Object.entries(buildData.parts)) {
    if (!part) continue;
    const alt = {};
    if (part.alternatives?.cheaper) {
      alt.cheaper = {
        name: part.alternatives.cheaper.name,
        price: part.alternatives.cheaper.specs?.estimatedPrice || part.alternatives.cheaper.specs?.Price || part.alternatives.cheaper.price || 0
      };
    }
    if (part.alternatives?.better) {
      alt.better = {
        name: part.alternatives.better.name,
        price: part.alternatives.better.specs?.estimatedPrice || part.alternatives.better.specs?.Price || part.alternatives.better.price || 0
      };
    }
    cleanParts[type] = {
      name: part.name,
      price: part.price || 0,
      socket: part.socket || part.Socket || undefined,
      tdp: part.tdp || undefined,
      wattage: part.wattage || part.total_wattage || undefined,
      ramType: part.ramType || part.memory_type || undefined,
      performance_score: part.performance_score || undefined,
      alternatives: Object.keys(alt).length > 0 ? alt : undefined
    };
  }
  return {
    totalPrice: buildData.totalPrice,
    budget: buildData.budget,
    compat: buildData.compat,
    parts: cleanParts
  };
}

function extractJsonObject(text) {
  if (!text) throw new Error('빈 AI 응답입니다.');
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('AI 응답 JSON 파싱에 실패했습니다.');
  }
}

async function generateAIReview(userPrompt, buildData, usage, userLevel = 'newbie', selectedModel = 'claude') {
  const cleanBuildData = sanitizeBuildDataForPrompt(buildData);

  const userMessage = `
[사용자 요청 사항]: ${userPrompt}
[주 용도]: ${usage}
[사용자 PC 지식 수준]: ${userLevel === 'expert' ? '전문가' : '초보자'}

[완성된 견적 데이터]:
${JSON.stringify(cleanBuildData, null, 2)}

위 견적 데이터를 바탕으로 지정된 JSON 포맷 리뷰를 작성해 주세요.
`.trim();

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage }
  ];

  let targetModel;
  switch (selectedModel) {
    case 'claude': targetModel = 'claude-sonnet-4-6'; break;
    case 'chatgpt': targetModel = 'gpt-5.1'; break;
    case 'gemini': targetModel = 'gemini-3.5-flash'; break;
    default: targetModel = 'gpt-5.1';
  }

  const modelsToTry = [
    targetModel,
    'gpt-5.1',
    'gemini-3.5-flash',
    'claude-sonnet-4-6',
    'gemini-3.1-pro-preview'
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI Evaluator] Trying model: ${modelName}`);
      const reqOptions = {
        model: modelName,
        messages: messages,
        temperature: 0.6
      };
      // Claude models on the gateway return HTTP 400 if response_format is set
      if (!modelName.startsWith('claude-')) {
        reqOptions.response_format = { type: "json_object" };
      }

      const completion = await openai.chat.completions.create(reqOptions);
      const resultText = completion.choices?.[0]?.message?.content || '';
      const parsed = extractJsonObject(resultText);

      // Track token usage
      try {
        const usageTracker = require('./usageTracker');
        await usageTracker.log({
          api_type: 'gemini_ai',
          endpoint: '/recommend/ai-review',
          tokens_used: completion.usage ? (completion.usage.prompt_tokens + completion.usage.completion_tokens) : 0,
          status: 'success'
        });
      } catch (trackErr) {
        console.error('[UsageTracker] AI tracking failed:', trackErr.message);
      }

      return parsed;

    } catch (error) {
      console.error(`[AI Evaluator] Failed with ${modelName}:`, error.message);
      lastError = error;
    }
  }

  throw new Error('모든 AI 모델에서 리뷰를 생성하는 데 실패했습니다: ' + (lastError?.message || 'Unknown error'));
}

module.exports = { generateAIReview };

