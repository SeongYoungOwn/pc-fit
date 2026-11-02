
<template>
  <div class="home-wrapper">
    <v-container class="px-4 py-12 px-md-10 py-md-16 position-relative z-index-1">
      <!-- Hero Section -->
      <div class="hero-section text-center mb-16 fade-in-up">
        <v-btn
          variant="tonal"
          color="primary"
          rounded="pill"
          class="mb-8 font-weight-bold px-6"
          size="small"
          prepend-icon="mdi-creation"
        >
          2026 AI-POWERED RECOMMENDATION
        </v-btn>
        
        <h1 class="text-hero font-weight-black mb-6 tracking-tighter font-display">
          당신의 <span class="neon-text-cyan">꿈의 PC</span>를<br />
          <span class="typewriter-text">한 줄로 완성하세요</span>
        </h1>
        
        <p class="text-h6 text-secondary mb-12 mx-auto hero-subtitle" style="max-width: 700px;">
          복잡한 부품 사양 고민은 이제 그만. <span class="text-white font-weight-bold">PC-FIT</span>의 지능형 하이브리드 엔진이 
          검증된 945종 부품 DB와 공인 벤치마크 레퍼런스를 분석하여 당신에게 최적화된 견적을 제안합니다.
        </p>

        <!-- 하이브리드 맞춤 견적 시작 버튼 -->
        <v-btn
          color="primary"
          size="x-large"
          class="hero-cta-btn px-12 mb-6"
          height="80"
          @click="$router.push('/builder')"
        >
          <v-icon left size="32" class="mr-4">mdi-wizard-hat</v-icon>
          <div class="text-left">
            <div class="text-h6 font-weight-black">하이브리드 맞춤 견적 시작</div>
            <div class="text-caption opacity-70">AI + 전문가 알고리즘으로 완벽한 견적을 설계합니다</div>
          </div>
        </v-btn>
      </div>

      <!-- AI Engines Section -->
      <div class="ai-engines-container mb-16 fade-in-up">
        <h4 class="text-h5 font-weight-bold text-secondary text-center mb-10 opacity-80 neon-text-purple">차세대 AI 엔진 탑재</h4>
        <div class="engine-cards-wrapper d-flex justify-center gap-x-8 flex-wrap" style="gap:40px;">
          <!-- Claude -->
  <div class="tooltip-container claude">
    <div class="tooltip">
      <div class="profile">
        <div class="user">
          <div class="img">Cl</div>
          <div class="details">
            <div class="name">Claude</div>
            <div class="username">@anthropic</div>
          </div>
        </div>
        <div class="about">정밀한 호환성 분석 및 논리 엔진</div>
      </div>
    </div>
    <div class="text">
      <a class="icon" href="#">
        <div class="layer">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span class="fab">
            <svg viewBox="0 0 24 24" height="1em" fill="currentColor">
              <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"></path>
            </svg>
          </span>
        </div>
        <div class="text">Claude</div>
      </a>
    </div>
  </div>
<!-- ChatGPT -->
  <div class="tooltip-container chatgpt">
    <div class="tooltip">
      <div class="profile">
        <div class="user">
          <div class="img">GP</div>
          <div class="details">
            <div class="name">ChatGPT</div>
            <div class="username">@openai</div>
          </div>
        </div>
        <div class="about">방대한 하드웨어 벤치마크 기반</div>
      </div>
    </div>
    <div class="text">
      <a class="icon" href="#">
        <div class="layer">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span class="fab">
            <svg viewBox="0 0 24 24" height="1em" fill="currentColor">
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path>
            </svg>
          </span>
        </div>
        <div class="text">ChatGPT</div>
      </a>
    </div>
  </div>
<!-- Gemini -->
  <div class="tooltip-container gemini">
    <div class="tooltip">
      <div class="profile">
        <div class="user">
          <div class="img">Ge</div>
          <div class="details">
            <div class="name">Gemini</div>
            <div class="username">@google</div>
          </div>
        </div>
        <div class="about">멀티모달 고속 하이브리드 추천</div>
      </div>
    </div>
    <div class="text">
      <a class="icon" href="#">
        <div class="layer">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span class="fab">
            <svg viewBox="0 0 24 24" height="1em" fill="currentColor">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"></path>
            </svg>
          </span>
        </div>
        <div class="text">Gemini</div>
      </a>
    </div>
  </div>

        </div>
      </div>

      <v-divider class="my-16 border-opacity-15"></v-divider>

      <!-- Steps Section -->
      <div class="mb-16">
        <div class="text-center mb-12">
          <h2 class="text-h2 font-weight-bold mb-4 tracking-tight neon-text-cyan">스마트한 견적 여정</h2>
          <p class="text-h6 text-secondary">복잡한 조립 PC 구성, 단 세 단계면 충분합니다.</p>
        </div>
        <v-row>
          <v-col cols="12" md="4" class="d-flex justify-center">
            <div class="parent">
              <div class="card card-pink">
                <div class="logo">
                  <span class="circle circle1"></span><span class="circle circle2"></span><span class="circle circle3"></span><span class="circle circle4"></span>
                  <span class="circle circle5"><v-icon color="white">mdi-lightning-bolt</v-icon></span>
                </div>
                <div class="glass"></div>
                <div class="content">
                  <span class="title d-flex align-center">
                    하이브리드 알고리즘 설계
                    <NewbieTooltip text="단순 AI 추측에 의존하지 않고, 945종 부품 DB의 실제 스펙과 국내 기준가 데이터를 기반으로 가장 완벽한 조합을 계산하는 시스템입니다." />
                  </span>
                  <span class="text">엄선된 945개 부품 DB와 코어 라이브러리 내에서, V-Combo 알고리즘이 사용자의 예산과 용도에 맞춰 최적의 조합을 즉시 계산해 냅니다.</span>
                </div>

              </div>
            </div>
          </v-col>
          <v-col cols="12" md="4" class="d-flex justify-center">
            <div class="parent">
              <div class="card card-cyan">
                <div class="logo">
                  <span class="circle circle1"></span><span class="circle circle2"></span><span class="circle circle3"></span><span class="circle circle4"></span>
                  <span class="circle circle5"><v-icon color="white">mdi-shield-refresh</v-icon></span>
                </div>
                <div class="glass"></div>
                <div class="content">
                  <span class="title">정밀 호환성 &amp; 쇼핑 연동</span>
                  <span class="text">선택된 부품의 소켓·메모리 규격과 전력량(TDP) 호환성을 검증하며, 네이버 API를 통해 실제 제품 이미지와 가격비교 구매 링크를 연동합니다.</span>
                </div>

              </div>
            </div>
          </v-col>
          <v-col cols="12" md="4" class="d-flex justify-center">
            <div class="parent">
              <div class="card card-purple">
                <div class="logo">
                  <span class="circle circle1"></span><span class="circle circle2"></span><span class="circle circle3"></span><span class="circle circle4"></span>
                  <span class="circle circle5"><v-icon color="white">mdi-rocket-launch</v-icon></span>
                </div>
                <div class="glass"></div>
                <div class="content">
                  <span class="title">AI 전문가 1:1 맞춤 리뷰</span>
                  <span class="text">완성된 견적을 바탕으로 AI가 사용자의 최초 요구사항을 심층 분석하여 맞춤형 리뷰를 제공하고, 채팅을 통해 실시간으로 견적을 스왑 및 수정합니다.</span>
                </div>

              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Site Introduction Section (Glow Card) -->
      <div class="my-16 d-flex justify-center intro-section px-4">
        <div class="glow-card-wrapper w-100">
          <div class="glow-card-content text-center py-16 px-6 px-md-16">
            <h2 class="text-h3 font-weight-black mb-6 tracking-tight"><span class="text-white">가장 완벽한 조립 PC,</span><br/><span class="neon-text-purple">PC-FIT 하이브리드 시스템</span></h2>
            <p class="text-h5 text-white mb-12 leading-relaxed mx-auto font-weight-regular" style="max-width: 800px; line-height: 1.6; word-break: keep-all;">
              단순한 추천을 넘어 <strong class="neon-text-cyan d-inline-flex align-center">병목현상 방지 알고리즘 <NewbieTooltip text="두뇌(CPU)는 빠른데 그래픽카드가 너무 느려서, 결과적으로 컴퓨터 전체 속도가 하향 평준화되는 현상을 완벽히 차단합니다." /></strong>과 <strong class="neon-text-purple">고인물들의 집단지성</strong>을 융합하여 단 하나의 결점도 없는 최적의 조립 PC를 완성합니다.
            </p>
            
            <button class="frutiger-button mt-2" @click="$router.push('/takeoff')">
              <div class="inner">
                <div class="top-white"></div>
                <span class="text">이륙 심사소 구경하기</span>
              </div>
            </button>
          </div>
          <div class="glow-points_wrapper">
            <i class="glow-point"></i><i class="glow-point"></i><i class="glow-point"></i><i class="glow-point"></i><i class="glow-point"></i>
            <i class="glow-point"></i><i class="glow-point"></i><i class="glow-point"></i><i class="glow-point"></i><i class="glow-point"></i>
          </div>
        </div>
      </div>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
  data() {
    return {
      features: [
        { title: '지능형 병목 현상 분석', desc: '공인 벤치마크 레퍼런스 데이터를 활용하여 CPU와 GPU 간의 병목 현상을 예측하고 최적의 밸런스를 찾습니다.', icon: 'mdi-brain', color: 'primary' },
        { title: 'DB 기준가 & 네이버 가격비교 연동', desc: '검증된 부품 DB 기준가로 예산을 설계하고 네이버 쇼핑 가격비교 링크를 즉시 매칭하여 합리적인 구매를 돕습니다.', icon: 'mdi-currency-krw', color: 'success' },
        { title: '커뮤니티 집단지성 검증', desc: '견적을 커뮤니티에 올려 하드웨어 고인물들의 이륙 허가를 받아보세요. 숨겨진 결함까지 찾아냅니다.', icon: 'mdi-account-group', color: 'purple' }
      ]
    };
  },
};
</script>

<style scoped>
.home-wrapper {
  position: relative;
  min-height: calc(100vh - 64px);
}
.z-index-1 { position: relative; z-index: 1; }
.text-hero { font-size: clamp(2.5rem, 6vw, 5.5rem); line-height: 1.1; letter-spacing: -0.04em; }
.hero-subtitle { font-size: 1.25rem; line-height: 1.6; opacity: 0.8; }
.hero-cta-btn {
  font-size: 1rem;
  font-weight: 800;
  border-radius: 16px;
  box-shadow: var(--shadow-neon-pink);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.hero-cta-btn:hover {
  transform: translateY(-5px) scale(1.03);
  box-shadow: 0 0 50px rgba(255, 0, 128, 0.6);
}
.neon-text-purple { color: var(--neon-blue); text-shadow: 0 0 15px rgba(0, 217, 255, 0.6); }

.parent {
  width: 100%;
  max-width: 320px;
  height: 350px;
  perspective: 1000px;
  margin: 0 auto;
}
.card {
  height: 100%;
  border-radius: 50px;
  transition: all 0.5s ease-in-out;
  transform-style: preserve-3d;
  position: relative;
  display: flex;
  flex-direction: column;
}
.card-pink { background: linear-gradient(135deg, var(--neon-pink) 0%, #cc0066 100%); box-shadow: rgba(255, 0, 128, 0) 40px 50px 25px -40px, rgba(255, 0, 128, 0.4) 0px 25px 25px -5px; }
.card-cyan { background: linear-gradient(135deg, var(--neon-cyan) 0%, #0099cc 100%); box-shadow: rgba(0, 217, 255, 0) 40px 50px 25px -40px, rgba(0, 217, 255, 0.4) 0px 25px 25px -5px; }
.card-purple { background: linear-gradient(135deg, var(--neon-blue) 0%, #6600cc 100%); box-shadow: rgba(138, 43, 226, 0) 40px 50px 25px -40px, rgba(138, 43, 226, 0.4) 0px 25px 25px -5px; }
.glass {
  transform-style: preserve-3d;
  position: absolute;
  inset: 8px;
  border-radius: 55px;
  border-top-right-radius: 100%;
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.18) 100%);
  transform: translate3d(0px, 0px, 25px);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  transition: transform 0.4s ease-in-out;
}
.content {
  padding: 170px 30px 0px 30px;
  transform: translate3d(0, 0, 26px);
  position: relative;
  z-index: 2;
}
.content .title {
  display: block;
  color: white;
  font-weight: 900;
  font-size: 22px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
.content .text {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-top: 25px;
  line-height: 1.6;
}
.bottom {
  padding: 20px;
  transform-style: preserve-3d;
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  transform: translate3d(0, 0, 26px);
}
.step-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 5px 20px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 900;
  color: white;
  border: 1px solid rgba(255,255,255,0.2);
  letter-spacing: 2px;
}
.logo {
  position: absolute;
  right: 0;
  top: 0;
  transform-style: preserve-3d;
}
.logo .circle {
  display: block;
  position: absolute;
  aspect-ratio: 1;
  border-radius: 50%;
  top: 0;
  right: 0;
  box-shadow: rgba(0, 0, 0, 0.2) -10px 10px 20px 0px;
  background: rgba(255, 255, 255, 0.12);
  transition: transform 0.4s ease-in-out;
}
.logo .circle1 { width: 170px; transform: translate3d(0, 0, 20px); top: 8px; right: 8px; }
.logo .circle2 { width: 140px; transform: translate3d(0, 0, 40px); top: 10px; right: 10px; transition-delay: 0.1s; }
.logo .circle3 { width: 110px; transform: translate3d(0, 0, 60px); top: 17px; right: 17px; transition-delay: 0.2s; }
.logo .circle4 { width: 80px; transform: translate3d(0, 0, 80px); top: 23px; right: 23px; transition-delay: 0.3s; }
.logo .circle5 { 
  width: 50px; transform: translate3d(0, 0, 100px); top: 30px; right: 30px; 
  display: grid; place-content: center; transition-delay: 0.4s; 
  background: rgba(255, 255, 255, 0.2);
}
.parent:hover .card { transform: rotate3d(1, 1, 0, 15deg); }
.parent:hover .card .logo .circle2 { transform: translate3d(0, 0, 60px); }
.parent:hover .card .logo .circle3 { transform: translate3d(0, 0, 80px); }
.parent:hover .card .logo .circle4 { transform: translate3d(0, 0, 100px); }
.parent:hover .card .logo .circle5 { transform: translate3d(0, 0, 120px); }

.leading-relaxed { line-height: 1.8; }
.tracking-tight { letter-spacing: -0.03em; }
.neon-text-cyan { color: var(--neon-pink); text-shadow: 0 0 20px rgba(255, 0, 128, 0.6); }


    /* 전체 페이지 스타일링 */
    

    /* 툴팁 컨테이너 */
    .tooltip-container {
      position: relative;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 17px;
      border-radius: 10px;
    }

    /* 툴팁 박스 */
    .tooltip {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s;
      border-radius: 15px;
      box-shadow: inset 5px 5px 5px rgba(0, 0, 0, 0.2),
        inset -5px -5px 15px rgba(255, 255, 255, 0.1),
        5px 5px 15px rgba(0, 0, 0, 0.3), -5px -5px 15px rgba(255, 255, 255, 0.1);
      visibility: hidden;
    }

    /* 프로필 카드 */
    .profile {
      background: #2a2b2f;
      border-radius: 10px 15px;
      padding: 10px;
      width: 200px;
    }

    /* 컨테이너에 호버 시 툴팁 표시 */
    .tooltip-container:hover .tooltip {
      top: -150px;
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    /* 아이콘 링크 */
    .icon {
      text-decoration: none;
      color: #fff;
      display: block;
      position: relative;
    }

    /* 아이콘 레이어 */
    .layer {
      width: 55px;
      height: 55px;
      transition: transform 0.3s;
    }

    .icon:hover .layer {
      transform: rotate(-35deg) skew(20deg);
    }

    .layer span {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      border: 1px solid #fff;
      border-radius: 5px;
      transition: all 0.3s;
    }

    /* 아이콘 아래 텍스트 */
    .icon .text {
      position: absolute;
      left: 50%;
      bottom: -5px;
      opacity: 0;
      font-weight: 500;
      transform: translateX(-50%);
      transition: bottom 0.3s ease, opacity 0.3s ease;
    }

    .icon:hover .text {
      bottom: -35px;
      opacity: 1;
    }

    /* 호버 시 레이어 애니메이션 */
    .icon:hover .layer span:nth-child(1) {
      opacity: 0.2;
    }

    .icon:hover .layer span:nth-child(2) {
      opacity: 0.4;
      transform: translate(5px, -5px);
    }

    .icon:hover .layer span:nth-child(3) {
      opacity: 0.6;
      transform: translate(10px, -10px);
    }

    .icon:hover .layer span:nth-child(4) {
      opacity: 0.8;
      transform: translate(15px, -15px);
    }

    .icon:hover .layer span:nth-child(5) {
      opacity: 1;
      transform: translate(20px, -20px);
    }

    /* SVG 아이콘 스타일 */
    .layer span.fab {
      font-size: 30px;
      line-height: 55px;
      text-align: center;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* 툴팁 내부 사용자 정보 */
    .user {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .img {
      width: 50px;
      height: 50px;
      font-size: 25px;
      font-weight: 700;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      color: #2a2b2f;
    }

    .name {
      font-size: 17px;
      font-weight: 700;
    }

    .details {
      display: flex;
      flex-direction: column;
      gap: 0;
      color: #fff;
    }
    
    .username {
      font-size: 14px;
    }

    .about {
      color: #ccc;
      padding-top: 5px;
      font-size: 14px;
    }

    /* LinkedIn - 파란색 */
    .linkedin .layer span,
    .linkedin .text {
      color: #0077b5;
      border-color: #0077b5;
    }

    .linkedin .icon:hover .layer span {
      box-shadow: -1px 1px 3px #0077b5;
    }

    .linkedin .layer span.fab svg {
      fill: #0077b5;
    }

    .linkedin .profile {
      border: 1px solid #0077b5;
    }

    .linkedin .img {
      border: 1px solid #0077b5;
    }

    .linkedin .name {
      color: #0077b5;
    }

    /* Claude - 주황색 */
    .claude .layer span,
    .claude .text {
      color: #FF6B35;
      border-color: #FF6B35;
    }

    .claude .icon:hover .layer span {
      box-shadow: -1px 1px 3px #FF6B35;
    }

    .claude .layer span.fab svg {
      fill: #FF6B35;
    }

    .claude .profile {
      border: 1px solid #FF6B35;
    }

    .claude .img {
      border: 1px solid #FF6B35;
    }

    .claude .name {
      color: #FF6B35;
    }

    /* ChatGPT - 초록색 */
    .chatgpt .layer span,
    .chatgpt .text {
      color: #10A37F;
      border-color: #10A37F;
    }

    .chatgpt .icon:hover .layer span {
      box-shadow: -1px 1px 3px #10A37F;
    }

    .chatgpt .layer span.fab svg {
      fill: #10A37F;
    }

    .chatgpt .profile {
      border: 1px solid #10A37F;
    }

    .chatgpt .img {
      border: 1px solid #10A37F;
    }

    .chatgpt .name {
      color: #10A37F;
    }

    /* Gemini - 보라색 */
    .gemini .layer span,
    .gemini .text {
      color: #8E44AD;
      border-color: #8E44AD;
    }

    .gemini .icon:hover .layer span {
      box-shadow: -1px 1px 3px #8E44AD;
    }

    .gemini .layer span.fab svg {
      fill: #8E44AD;
    }

    .gemini .profile {
      border: 1px solid #8E44AD;
    }

    .gemini .img {
      border: 1px solid #8E44AD;
    }

    .gemini .name {
      color: #8E44AD;
    }

    /* Grok - 분홍색 */
    .grok .layer span,
    .grok .text {
      color: #E91E63;
      border-color: #E91E63;
    }

    .grok .icon:hover .layer span {
      box-shadow: -1px 1px 3px #E91E63;
    }

    .grok .layer span.fab svg {
      fill: #E91E63;
    }

    .grok .profile {
      border: 1px solid #E91E63;
    }
    .icon:hover .layer span:nth-child(3) {
      opacity: 0.6;
      transform: translate(10px, -10px);
    }

    .icon:hover .layer span:nth-child(4) {
      opacity: 0.8;
      transform: translate(15px, -15px);
    }

    .icon:hover .layer span:nth-child(5) {
      opacity: 1;
      transform: translate(20px, -20px);
    }

    /* SVG 아이콘 스타일 */
    .layer span.fab {
      font-size: 30px;
      line-height: 55px;
      text-align: center;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* 툴팁 내부 사용자 정보 */
    .user {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .img {
      width: 50px;
      height: 50px;
      font-size: 25px;
      font-weight: 700;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      color: #2a2b2f;
    }

    .name {
      font-size: 17px;
      font-weight: 700;
    }

    .details {
      display: flex;
      flex-direction: column;
      gap: 0;
      color: #fff;
    }
    
    .username {
      font-size: 14px;
    }

    .about {
      color: #ccc;
      padding-top: 5px;
      font-size: 14px;
    }

    /* LinkedIn - 파란색 */
    .linkedin .layer span,
    .linkedin .text {
      color: #0077b5;
      border-color: #0077b5;
    }

    .linkedin .icon:hover .layer span {
      box-shadow: -1px 1px 3px #0077b5;
    }

    .linkedin .layer span.fab svg {
      fill: #0077b5;
    }

    .linkedin .profile {
      border: 1px solid #0077b5;
    }

    .linkedin .img {
      border: 1px solid #0077b5;
    }

    .linkedin .name {
      color: #0077b5;
    }

    /* Claude - 주황색 */
    .claude .layer span,
    .claude .text {
      color: #FF6B35;
      border-color: #FF6B35;
    }

    .claude .icon:hover .layer span {
      box-shadow: -1px 1px 3px #FF6B35;
    }

    .claude .layer span.fab svg {
      fill: #FF6B35;
    }

    .claude .profile {
      border: 1px solid #FF6B35;
    }

    .claude .img {
      border: 1px solid #FF6B35;
    }

    .claude .name {
      color: #FF6B35;
    }

    /* ChatGPT - 초록색 */
    .chatgpt .layer span,
    .chatgpt .text {
      color: #10A37F;
      border-color: #10A37F;
    }

    .chatgpt .icon:hover .layer span {
      box-shadow: -1px 1px 3px #10A37F;
    }

    .chatgpt .layer span.fab svg {
      fill: #10A37F;
    }

    .chatgpt .profile {
      border: 1px solid #10A37F;
    }

    .chatgpt .img {
      border: 1px solid #10A37F;
    }

    .chatgpt .name {
      color: #10A37F;
    }

    /* Gemini - 보라색 */
    .gemini .layer span,
    .gemini .text {
      color: #8E44AD;
      border-color: #8E44AD;
    }

    .gemini .icon:hover .layer span {
      box-shadow: -1px 1px 3px #8E44AD;
    }

    .gemini .layer span.fab svg {
      fill: #8E44AD;
    }

    .gemini .profile {
      border: 1px solid #8E44AD;
    }

    .gemini .img {
      border: 1px solid #8E44AD;
    }

    .gemini .name {
      color: #8E44AD;
    }

    /* Grok - 분홍색 */
    .grok .layer span,
    .grok .text {
      color: #E91E63;
      border-color: #E91E63;
    }

    .grok .icon:hover .layer span {
      box-shadow: -1px 1px 3px #E91E63;
    }

    .grok .layer span.fab svg {
      fill: #E91E63;
    }

    .grok .profile {
      border: 1px solid #E91E63;
    }

    .grok .img {
      border: 1px solid #E91E63;
    }

    .grok .name {
      color: #E91E63;
    }

    /* 반응형 */
    
    
  
.output {
            align-self: center;
            background: inherit;
            border-radius: 100px;
            padding: 0 12px 0 10px;
            height: 36px;
            min-width: 350px;
            position: relative;
            top: -140px;
        }

        .output .cover {
            position: absolute;
            top: 2px;
            right: 2px;
            bottom: 2px;
            left: 2px;
            border-radius: 100px;
            clip-path: inset(0 0 0 0 round 100px);
            background: #101216;
            transition: filter 1000ms cubic-bezier(0, 0, 0, 1);
            filter: blur(5px);
        }

        .output .cover::after {
            content: "";
            top: -10px;
            right: -10px;
            bottom: -10px;
            left: -10px;
            border-radius: 100px;
            position: absolute;
            background: inherit;
            opacity: 0.5;
        }

        .output .wrap-colors-1,
        .output .wrap-colors-2 {
            overflow: hidden;
            border-radius: 100px;
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            pointer-events: none;
        }

        .output .wrap-colors-1 {
            opacity: 0.35;
            filter: blur(3px);
        }

        .output .bg-colors {
            background: conic-gradient(transparent 0deg,
                    #8400ff 65deg,
                    #00ccff 144deg,
                    #1356b4 180deg,
                    transparent 324deg,
                    transparent 360deg);
            position: absolute;
            width: 400px;
            height: 400px;
            margin: auto;
            inset: 0;
            left: 50%;
            transform: translateX(-50%) rotate(220deg);
            border-radius: 50%;
            animation: cycle-rotate 3s ease-in-out infinite;
        }

        .output::before {
            content: "";
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            border-radius: inherit;
            position: absolute;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: #ffffff14;
            opacity: 0.4;
            transition:
                opacity 400ms linear,
                background-color 400ms linear;
        }

        .output::after {
            content: "";
            position: absolute;
            left: 12px;
            right: 12px;
            top: 14px;
            background: linear-gradient(0deg, transparent, black);
            height: 9px;
            mix-blend-mode: soft-light;
            border-radius: 100px;
        }

        @keyframes cycle-opacity {
            0% {
                opacity: 0;
            }

            30% {
                opacity: 1;
            }

            50% {
                opacity: 1;
            }

            100% {
                opacity: 0;
            }
        }

        @keyframes cycle-rotate {
            from {
                transform: translateX(-50%) rotate(0deg);
            }

            to {
                transform: translateX(-50%) rotate(360deg);
            }
        }

        .area {
            --ease-elastic: cubic-bezier(0.5, 2, 0.3, 0.8);

            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            inset: 0;
        }

        .area .area-wrapper:hover .wrapper {
            transform: translateY(0) scale(1);
            box-shadow: 0 20px 50px -5px black;
        }

        .area::after {
            pointer-events: none;
            content: "";
            position: absolute;
            top: 66%;
            left: 0;
            right: 0;
            height: 100px;
            width: 30%;
            margin: auto;
            background-color: #648cc630;
            filter: blur(2em);
            opacity: 0.7;
            transform: perspective(10px) rotateX(5deg) scale(1, 0.5);
            z-index: 0;
        }

        .ticket-mask {
            position: absolute;
            overflow: hidden;
            display: flex;
            justify-content: center;
            mask-image: linear-gradient(rgba(0, 0, 0, 0.1) 0%, white 20px);
            perspective: 1000px;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            min-height: 1500px;
        }

        .ticket {
            float: left;
            animation: ticket-move 11s ease-in-out infinite;
            transform: translateY(50px);
            perspective: 3000px;
        }

        @keyframes ticket-move {
            0% {
                transform: translateY(-300px);
            }

            7% {
                transform: translateY(-250px);
            }

            12% {
                transform: translateY(-200px);
            }

            16% {
                transform: translateY(-170px);
            }

            22% {
                transform: translateY(-100px);
            }

            27% {
                transform: translateY(-40px);
            }

            34%,
            88% {
                transform: translateY(45px);
            }

            100% {
                transform: translateY(100%) rotateX(160deg) scale(5);
            }
        }

        .ticket:nth-child(2) .ticket-body {
            transition-delay: 0.7s;
        }

        .ticket:hover .ticket-flip-container {
            transform: rotateY(180deg);
        }

        .ticket-flip-container {
            transition: 0.6s;
            transform-style: preserve-3d;
            position: relative;
        }

        .float {
            transform-style: preserve-3d;
            pointer-events: none;
            animation: float 3s ease-in-out infinite;
        }

        .front,
        .back {
            display: inline-block;
            backface-visibility: hidden;
            transform-style: preserve-3d;
        }

        .front {
            z-index: 1;
        }

        .back {
            position: absolute;
            top: 0;
            left: 0;
            transform: rotateY(-180deg);
        }

        @keyframes float {
            0% {
                transform: translateY(0);
            }

            50% {
                transform: translateY(-15px);
            }

            100% {
                transform: translateY(0);
            }
        }

        .icon-cube {
            position: absolute;
            height: 110%;
            z-index: 1;
            top: -3px;
            left: 0;
            right: 0;
            margin: auto;
            mix-blend-mode: soft-light;
            opacity: 0.6;
        }

        .icon-cube path {
            animation-delay: calc(var(--i) * 100ms) !important;
            transform-origin: center;
        }

        .icon-cube .path-center {
            animation: path-center 3s ease-in-out infinite;
        }

        @keyframes path-center {
            50% {
                transform: scale(1.3);
            }
        }

        .icon-cube .path-t {
            animation: path-t 1.6s ease-in-out infinite;
        }

        @keyframes path-t {
            50% {
                transform: translateY(1px);
            }
        }

        .icon-cube .path-tl {
            animation: path-tl 1.6s ease-in-out infinite;
        }

        @keyframes path-tl {
            50% {
                transform: translateX(1px) translateY(1px);
            }
        }

        .icon-cube .path-tr {
            animation: path-tr 1.6s ease-in-out infinite;
        }

        @keyframes path-tr {
            50% {
                transform: translateX(-1px) translateY(1px);
            }
        }

        .icon-cube .path-br {
            animation: path-br 1.6s ease-in-out infinite;
        }

        @keyframes path-br {
            50% {
                transform: translateX(-1px) translateY(-1px);
            }
        }

        .icon-cube .path-bl {
            animation: path-bl 1.6s ease-in-out infinite;
        }

        @keyframes path-bl {
            50% {
                transform: translateX(1px) translateY(-1px);
            }
        }

        .icon-cube .path-b {
            animation: path-b 1.6s ease-in-out infinite;
        }

        @keyframes path-b {
            50% {
                transform: translateY(-1px);
            }
        }

        .ticket-body {
            display: block;
            position: relative;
            width: 320px;
            margin-bottom: 20px;
            padding: 0;
            border-radius: 7px 7px 0px 0px;
            background-color: white;
            text-align: center;
            background: linear-gradient(to bottom, white, #dcfffd);
            color: black;
        }

        .ticket-body svg,
        .ticket-body img {
            pointer-events: none;
        }

        .ticket-body .bold {
            font-weight: 800;
        }

        .ticket-body header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            padding: 15px;
            border-bottom: 1px dashed rgba(0, 0, 0, 0.4);
            text-align: left;
            height: 54px;
        }

        .ticket-body header .ticket-name {
            font-weight: 300;
            font-size: 1.05em;
            line-height: normal;
            align-items: center;
            display: flex;
            gap: 4px;
            letter-spacing: -2px;
        }

        .ticket-body header span {
            display: inline-block;
        }

        .ticket-body header time {
            display: flex;
        }

        .ticket-body header .slash {
            padding: 0 1px;
            color: rgba(0, 0, 0, 0.4);
        }

        .ticket-body header::after,
        .ticket-body header::before {
            content: "";
            display: block;
            width: 13px;
            height: 13px;
            background-color: #0f1114;
            position: absolute;
            right: -8px;
            border-radius: 50%;
            z-index: 11;
            bottom: -7px;
        }

        .ticket-body header:after {
            left: -8px;
        }

        .ticket-body .contents {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            min-height: 180px;
            position: relative;
            pointer-events: all;
        }

        .ticket-body .contents .event {
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 1;
            margin-top: -30px;
            font-weight: 600;
        }

        .ticket-body .contents .event span {
            display: inline-block;
            height: 15px;
            font-size: 3rem;
            font-weight: 400;
            line-height: 1;
        }

        .ticket-body .contents .event span.bold {
            font-size: 2.18rem;
            font-weight: 800;
            margin-right: -3px;
        }

        .ticket-body .contents .event div:nth-child(2) {
            font-size: 13px;
            letter-spacing: 0.45em;
            margin-left: 6px;
            color: #2f4c8b62;
        }

        .ticket-body .contents .number {
            position: absolute;
            left: 15px;
            bottom: -6px;
            font-size: 2em;
            color: #b5ddff;
            font-weight: bolder;
        }

        .ticket-body:after {
            content: "";
            display: block;
            position: absolute;
            bottom: -16px;
            left: 0;
            background:
                -webkit-linear-gradient(-135deg, #dcfffd 50%, transparent 50%) 0 50%,
                -webkit-linear-gradient(-45deg, #dcfffd 50%, transparent 50%) 0 50%,
                transparent;
            background-repeat: repeat-x;
            background-size:
                16px 16px,
                16px 16px,
                cover,
                cover;
            height: 16px;
            width: 100%;
            pointer-events: none;
        }

        .barcode {
            box-shadow:
                1px 0 0 1px,
                5px 0 0 1px,
                10px 0 0 1px,
                11px 0 0 1px,
                15px 0 0 1px,
                18px 0 0 1px,
                22px 0 0 1px,
                23px 0 0 1px,
                26px 0 0 1px,
                30px 0 0 1px,
                35px 0 0 1px,
                37px 0 0 1px,
                41px 0 0 1px,
                44px 0 0 1px,
                47px 0 0 1px,
                51px 0 0 1px,
                56px 0 0 1px,
                59px 0 0 1px,
                64px 0 0 1px,
                68px 0 0 1px,
                72px 0 0 1px,
                74px 0 0 1px,
                77px 0 0 1px,
                81px 0 0 1px,
                85px 0 0 1px,
                88px 0 0 1px,
                92px 0 0 1px,
                95px 0 0 1px,
                96px 0 0 1px,
                97px 0 0 1px;
            display: inline-block;
            height: 30px;
            width: 0;
            left: 65%;
            position: absolute;
            top: 12px;
        }

        @keyframes appear {
            0% {
                opacity: 0;
                transform: translateX(100%);
            }

            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes appear2 {
            0% {
                opacity: 1;
                transform: translateY(0);
            }

            100% {
                opacity: 0;
                transform: translateX(100%);
            }
        }

        .back header span {
            animation: none;
        }

        .ticket:hover .back header span {
            opacity: 0;
            animation: appear 0.5s var(--ease-elastic) forwards calc(var(--i) * 20ms + 400ms);
        }

        .ticket:hover .front header span {
            opacity: 1;
            animation: appear2;
        }

        .front header span {
            opacity: 0;
            animation: appear 0.5s var(--ease-elastic) forwards calc(var(--i) * 20ms + 400ms);
        }

        .qrcode {
            position: absolute;
            z-index: 1;
            color: #a5b7eb;
        }

        .qrcode img {
            display: block;
            height: 140px;
        }

        .back .qrcode {
            margin-top: 8px;
        }

        .back .qrcode::after {
            --stroke-width: 0.2rem;
            --corner-size: 1rem;

            position: absolute;
            content: "";
            background:
                linear-gradient(to right,
                    currentColor var(--stroke-width),
                    transparent var(--stroke-width)) 0 0,
                linear-gradient(to right,
                    currentColor var(--stroke-width),
                    transparent var(--stroke-width)) 0 100%,
                linear-gradient(to left,
                    currentColor var(--stroke-width),
                    transparent var(--stroke-width)) 100% 0,
                linear-gradient(to left,
                    currentColor var(--stroke-width),
                    transparent var(--stroke-width)) 100% 100%,
                linear-gradient(to bottom,
                    currentColor var(--stroke-width),
                    transparent var(--stroke-width)) 0 0,
                linear-gradient(to bottom,
                    currentColor var(--stroke-width),
                    transparent var(--stroke-width)) 100% 0,
                linear-gradient(to top,
                    currentColor var(--stroke-width),
                    transparent var(--stroke-width)) 0 100%,
                linear-gradient(to top,
                    currentColor var(--stroke-width),
                    transparent var(--stroke-width)) 100% 100%;
            background-size: var(--corner-size) var(--corner-size);
            inset: 0;
            background-repeat: no-repeat;
        }

        .back .qrcode::after {
            animation: breath 3s var(--ease-elastic) infinite;
        }

        @keyframes breath {
            0% {
                transform: scale(1.05);
                opacity: 0.3;
            }

            50% {
                transform: scale(1.15);
                opacity: 1;
            }

            100% {
                transform: scale(1.05);
                opacity: 0.3;
            }
        }

        .front .qrcode {
            right: 5px;
            bottom: -5px;
        }

        .front .qrcode img {
            height: 70px;
        }

        .reflex {
            pointer-events: none;
            position: absolute;
            inset: 0;
            bottom: -5px;
            z-index: 10;
            overflow: hidden;
        }

        .reflex::before {
            content: "";
            position: absolute;
            width: 300px;
            background-color: rgba(255, 255, 255, 0.4);
            background: linear-gradient(to right,
                    rgba(221, 249, 255, 0.4) 10%,
                    rgba(221, 245, 255, 0.7) 60%,
                    rgba(221, 246, 255, 0.6) 60%,
                    rgba(221, 255, 254, 0.4) 90%);
            top: -10%;
            bottom: -10%;
            left: -132%;
            transform: translateX(0) skew(-30deg);
            transition: all 0.7s ease;
        }

        .float:hover .reflex::before {
            transform: translate(280%, 0) skew(-30deg);
        }

        .float .front .reflex::before {
            transition-delay: 0.3s;
        }

        .ticket-body::before {
            content: "";
            position: absolute;
            inset: 0;
            mask-image: linear-gradient(white 50%, transparent 100%);
            border-radius: 7px 7px 0px 0px;
            background: radial-gradient(at 30% -5%,
                    #90f1f1,
                    #d3ccf0,
                    rgba(255, 255, 255, 0) 25%),
                radial-gradient(at 30% 40%, #aad1f0, rgba(255, 255, 255, 0) 20%),
                radial-gradient(at 50% 70%, #c4f2e5, rgba(255, 255, 255, 0) 30%),
                radial-gradient(at 70% 0%, #d3ccf0, rgba(255, 255, 255, 0) 20%),
                linear-gradient(75deg,
                    #90f1f1 5%,
                    rgba(255, 255, 255, 0),
                    #aad1f0,
                    rgba(255, 255, 255, 0),
                    #e9d0ed,
                    rgba(255, 255, 255, 0),
                    #d3ccf0,
                    rgba(255, 255, 255, 0),
                    #c4f2e5 90%),
                radial-gradient(at 30% 50%, #90f1f1, rgba(255, 255, 255, 0) 30%),
                radial-gradient(at 30% 50%, #9cb9fc, rgba(255, 255, 255, 0) 30%),
                radial-gradient(at 100% 50%, #90f1f1, #c2dcf2, rgba(255, 255, 255, 0) 50%),
                linear-gradient(115deg,
                    #90f1f1 5%,
                    #aad1f0 10%,
                    #d3ccf0,
                    #e9d0ed 20%,
                    #aad1f0,
                    #aad1f0 30%,
                    #d3ccf0,
                    #c2dcf2 40%,
                    #90f1f1,
                    #aad1f0 70%);
        }

        .noise {
            position: absolute;
            top: -25px;
            bottom: -20px;
            left: 0;
            right: 0;
            opacity: 0.07;
            mask-image: linear-gradient(transparent 5%,
                    white 30%,
                    white 70%,
                    transparent 95%);
            filter: grayscale(1);
            pointer-events: none;
            z-index: 1;
        }
    

</style>

<style>
/* Global scrollbar fix */
body { overflow-y: hidden !important; }
html { overflow-y: auto !important; overflow-x: hidden !important; }

/* Glow Card Specific Styles (GPU Optimized) */
.glow-card-wrapper {
  --border: 3px;
  --rounded: 30px;
  --w-card: 100%;
  --max-w: 1100px;
  
  width: var(--w-card);
  max-width: var(--max-w);
  border-radius: var(--rounded);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: var(--border);
  margin: 0 auto;
  background: linear-gradient(135deg, var(--neon-pink), var(--neon-blue), #8E44AD, #00ff9d);
  box-shadow: 0 0 32px rgba(255, 0, 128, 0.22), 0 0 32px rgba(0, 217, 255, 0.18);
}

.glow-points_wrapper {
  position: absolute;
  overflow: hidden;
  width: calc(100% - (var(--border) * 4));
  height: calc(100% - (var(--border) * 4));
  border-radius: calc(var(--rounded) - 4px);
  pointer-events: none;
  z-index: 8;
}

.glow-point {
  --sz-point: 4px;
  position: absolute;
  top: -8px;
  width: var(--sz-point);
  height: var(--sz-point);
  border-radius: 999px;
  background: var(--neon-blue);
  opacity: 0.5;
}

.glow-card-content {
  width: 100%;
  height: 100%;
  border-radius: calc(var(--rounded) - 4px);
  z-index: 7;
  background: linear-gradient(160deg, rgba(12, 16, 38, 0.96), rgba(8, 11, 26, 0.98));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Frutiger Button Styles */
.frutiger-button {
  cursor: pointer;
  position: relative;
  padding: 3px;
  border-radius: 12px;
  border: 0;
  text-shadow: 1px 1px #000a;
  background: linear-gradient(#006caa, #00c3ff);
  box-shadow: 0px 6px 10px 0px #0008;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  transform: scale(1.15);
}

.frutiger-button:hover {
  box-shadow: 0px 8px 15px 0px rgba(0, 195, 255, 0.6);
  transform: scale(1.2);
}

.frutiger-button:active {
  box-shadow: 0px 0px 0px 0px #0000;
  transform: scale(1.1);
}

.frutiger-button .inner {
  position: relative;
  inset: 0px;
  padding: 1.2em 2.5em;
  border-radius: 10px;
  background: radial-gradient(circle at 50% 100%, #30f8f8 10%, #30f8f800 55%),
    linear-gradient(#00526a, #009dcd);
  overflow: hidden;
}

.frutiger-button .top-white {
  position: absolute;
  border-radius: inherit;
  inset: 0 -8em;
  background: radial-gradient(
    circle at 50% -270%,
    #fff 45%,
    #fff6 60%,
    #fff0 60%
  );
}

.frutiger-button .text {
  position: relative;
  z-index: 1;
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: 1px;
  font-family: 'Pretendard', sans-serif;
}
</style>
