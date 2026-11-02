<template>
  <div class="auth-page-wrapper">
    <!-- 11.html의 구조를 1:1로 반영 -->
    <div class="container" :class="{ 'active': isSignup }" id="container">
      
      <!-- 회원가입 폼 (Sign Up) -->
      <div class="form-container signup-container">
        <form @submit.prevent="submitSignup">
          <h1 class="neon-text-purple">회원가입</h1>
          
          <div class="input-row">
            <input type="text" v-model="signupForm.username" placeholder="아이디" required />
            <button type="button" class="check-btn" @click="checkId" :disabled="checkingId">중복확인</button>
          </div>
          
          <div class="input-row">
            <input type="text" v-model="signupForm.nickname" placeholder="닉네임" required />
            <button type="button" class="check-btn" @click="checkNick" :disabled="checkingNick">중복확인</button>
          </div>
          
          <input type="password" v-model="signupForm.password" placeholder="비밀번호" required />

          <!-- 사용자 숙련도 선택 추가 -->
          <div class="user-level-box w-100 mt-2 text-left">
             <div class="d-flex justify-space-between align-center px-2">
               <label class="level-label text-white opacity-60">하드웨어 숙련도</label>
               <v-btn
                 icon="mdi-help-circle-outline"
                 variant="text"
                 size="x-small"
                 color="white"
                 class="opacity-60"
                 @click="tutorialDialog = true"
               ></v-btn>
             </div>
             <div class="d-flex gap-4 justify-center mt-1">
                <v-radio-group v-model="signupForm.user_level" inline hide-details color="purple" density="compact">
                  <v-radio label="뉴비" value="newbie" class="text-white"></v-radio>
                  <v-radio label="전문가" value="expert" class="text-white"></v-radio>
                </v-radio-group>
             </div>
          </div>

          <!-- 내 컴퓨터 정보 입력 버튼 -->
          <v-btn
            variant="tonal"
            color="secondary"
            class="my-pc-btn mt-2 w-100 rounded-pill"
            prepend-icon="mdi-monitor-dashboard"
            @click="pcDialog = true"
          >
            {{ isPcInfoSaved ? '내 컴퓨터 정보 수정' : '내 컴퓨터 정보 입력 (선택)' }}
            <v-chip v-if="isPcInfoSaved" size="x-small" color="success" class="ml-2">저장됨</v-chip>
          </v-btn>
          
          <button type="submit" class="submit-btn purple-btn" :disabled="loading">
            {{ loading ? '처리 중...' : '가입하기' }}
          </button>
        </form>
      </div>

      <!-- 로그인 폼 (Sign In) -->
      <div class="form-container signin-container">
        <form @submit.prevent="submitLogin">
          <h1 class="neon-text-cyan">로그인</h1>
          <input type="text" v-model="loginForm.username" placeholder="아이디" required />
          <input type="password" v-model="loginForm.password" placeholder="비밀번호" required />
          <a href="#" class="forgot-password"></a>
          <button type="submit" class="submit-btn cyan-btn" :disabled="loading">
            {{ loading ? '처리 중...' : '로그인' }}
          </button>
        </form>
      </div>

      <!-- 오버레이 패널 -->
      <div class="overlay-container">
        <div class="overlay">
          <div class="overlay-panel overlay-left">
            <h1>반가워요!</h1>
            <p>이미 계정이 있으신가요? 지금 로그인하여 당신의 견적을 확인하세요.</p>
            <button class="ghost-btn" id="signIn" @click="isSignup = false">로그인으로 이동</button>
          </div>
          <div class="overlay-panel overlay-right">
            <h1>환영합니다!</h1>
            <p>아직 계정이 없으신가요? 회원가입을 통해 나만의 최적화된 PC를 맞춰보세요.</p>
            <button class="ghost-btn" id="signUp" @click="isSignup = true">회원가입으로 이동</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 내 컴퓨터 정보 입력 팝업 (레이어 팝업 스타일) -->
    <v-dialog v-model="pcDialog" max-width="450" persistent>
      <v-card class="pc-modal-content">
        <v-btn icon="mdi-close" variant="text" size="small" class="pc-modal-close" @click="pcDialog = false"></v-btn>
        
        <v-card-title class="text-center pt-8 pb-4">
          <h3 class="pc-modal-title neon-text-cyan">내 컴퓨터 정보</h3>
          <p style="font-size: 12px; color: #00d9ff !important; margin-top: 5px; margin-bottom: 0;">
            * 코어 부품 라이브러리(1,000종)와 네이버 검색을 연동하여 부품명을 자동 완성해 줍니다.
          </p>
        </v-card-title>

        <v-card-text class="px-6 pb-8">
          <div class="input-group-custom">
            <label class="label-neon">CPU 모델명</label>
            <v-combobox
              v-model="signupForm.my_pc.cpu"
              v-model:search="searchInputs.cpu"
              :items="suggestions.cpu"
              placeholder="예: Intel i5-13400F"
              variant="solo"
              flat
              density="compact"
              hide-details
              no-filter
              class="autocomplete-neon" theme="dark"
              bg-color="rgba(0, 243, 255, 0.05)" color="#00f3ff" base-color="#00f3ff" menu-icon="mdi-chevron-down"
            ></v-combobox>
          </div>

          <v-row dense>
            <v-col cols="6">
              <div class="input-group-custom">
                <label class="label-neon">GPU (그래픽카드)</label>
                <v-combobox
                  v-model="signupForm.my_pc.gpu"
                  v-model:search="searchInputs.gpu"
                  :items="suggestions.gpu"
                  placeholder="예: RTX 3060 Ti"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  no-filter
                  class="autocomplete-neon" theme="dark"
                  bg-color="rgba(0, 243, 255, 0.05)" color="#00f3ff" base-color="#00f3ff" menu-icon="mdi-chevron-down"
                ></v-combobox>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="input-group-custom">
                <label class="label-neon">RAM (메모리)</label>
                <v-combobox
                  v-model="signupForm.my_pc.ram"
                  v-model:search="searchInputs.ram"
                  :items="suggestions.ram"
                  placeholder="예: 16GB"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  no-filter
                  class="autocomplete-neon" theme="dark"
                  bg-color="rgba(0, 243, 255, 0.05)" color="#00f3ff" base-color="#00f3ff" menu-icon="mdi-chevron-down"
                ></v-combobox>
              </div>
            </v-col>
          </v-row>

          <div class="input-group-custom">
            <label class="label-neon">파워 서플라이</label>
            <v-combobox
              v-model="signupForm.my_pc.psu"
              v-model:search="searchInputs.psu"
              :items="suggestions.psu"
              placeholder="예: 마이크로닉스 700W"
              variant="solo"
              flat
              density="compact"
              hide-details
              no-filter
              class="autocomplete-neon" theme="dark"
              bg-color="rgba(0, 243, 255, 0.05)" color="#00f3ff" base-color="#00f3ff" menu-icon="mdi-chevron-down"
            ></v-combobox>
          </div>

          <div class="button-group-custom mt-6">
            <v-btn variant="flat" color="#f5f5f5" class="flex-grow-1" @click="pcDialog = false">취소</v-btn>
            <v-btn variant="flat" color="#1a4f76" class="flex-grow-1 text-white" @click="savePcInfo">저장하기</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 튜토리얼 팝업 (내 PC 정보 확인법) -->
    <v-dialog v-model="tutorialDialog" max-width="500">
      <v-card class="tutorial-card rounded-xl">
        <v-card-title class="d-flex justify-space-between align-center pa-6">
          <span class="text-h5 font-weight-black color-navy">내 PC 정보 확인 방법</span>
          <v-btn icon="mdi-close" variant="text" @click="tutorialDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-6 pt-0">
          <div class="tutorial-step mb-6">
            <div class="d-flex align-center mb-2">
              <v-avatar color="primary" size="24" class="mr-2 text-caption font-weight-bold text-white">1</v-avatar>
              <span class="font-weight-bold" style="color: black;">작업 관리자로 확인하기 (추천)</span>
            </div>
            <p class="tutorial-desc">
              단축키 <strong style="color: #333;">Ctrl + Shift + Esc</strong>를 누른 후, 상단 <strong style="color: #333;">[성능]</strong> 탭을 클릭하세요.
              왼쪽 메뉴에서 CPU, 메모리, GPU를 각각 눌러 정확한 모델명을 확인하실 수 있습니다.
            </p>
          </div>
          <div class="tutorial-step mb-6">
            <div class="d-flex align-center mb-2">
              <v-avatar color="primary" size="24" class="mr-2 text-caption font-weight-bold text-white">2</v-avatar>
              <span class="font-weight-bold" style="color: black;">DirectX 진단 도구 이용</span>
            </div>
            <p class="tutorial-desc">
              윈도우 검색창에 <strong style="color: #333;">dxdiag</strong>를 입력하고 실행하세요.
              <strong style="color: #333;">[시스템]</strong> 탭에서 CPU와 RAM을, <strong style="color: #333;">[디스플레이]</strong> 탭에서 GPU 정보를 한눈에 볼 수 있습니다.
            </p>
          </div>
          <div class="tutorial-step">
            <div class="d-flex align-center mb-2">
              <v-avatar color="primary" size="24" class="mr-2 text-caption font-weight-bold text-white">3</v-avatar>
              <span class="font-weight-bold" style="color: black;">파워(PSU) 정보 확인</span>
            </div>
            <p class="tutorial-desc">
              파워 정보는 소프트웨어로 확인이 어렵습니다. 본체 옆면 유리창을 통해 파워에 붙은 <strong style="color: #333;">스티커(W수)</strong>를 확인하는 것이 가장 정확합니다. (모르시면 비워두셔도 됩니다!)
            </p>
          </div>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn block color="primary" size="large" variant="flat" @click="tutorialDialog = false" class="rounded-lg">알겠습니다!</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import api from '@/services/api';

export default {
  name: 'AuthPage',
  data() {
    return {
      isSignup: false,
      pcDialog: false,
      tutorialDialog: false,
      isPcInfoSaved: false,
      loginForm: {
        username: '',
        password: ''
      },
      signupForm: {
        username: '',
        nickname: '',
        password: '',
        user_level: 'newbie',
        my_pc: {
          cpu: '',
          gpu: '',
          ram: '',
          psu: ''
        }
      },
      checkingId: false,
      checkingNick: false,
      isIdAvailable: false,
      isNickAvailable: false,
      searchInputs: { cpu: '', gpu: '', ram: '', psu: '' },
      suggestions: { cpu: [], gpu: [], ram: [], psu: [] },
      debounceTimers: { cpu: null, gpu: null, ram: null, psu: null }
    };
  },
  watch: {
    'searchInputs.cpu'(val) { this.fetchSuggestions('cpu', val); },
    'searchInputs.gpu'(val) { this.fetchSuggestions('gpu', val); },
    'searchInputs.ram'(val) { this.fetchSuggestions('ram', val); },
    'searchInputs.psu'(val) { this.fetchSuggestions('psu', val); }
  },
  computed: {
    ...mapState('auth', ['loading'])
  },
  methods: {
    ...mapActions('auth', ['login', 'signup']),
    async fetchSuggestions(type, keyword) {
      if (!keyword || keyword.length < 1) {
        this.suggestions[type] = [];
        return;
      }
      
      if (this.debounceTimers[type]) clearTimeout(this.debounceTimers[type]);
      
      this.debounceTimers[type] = setTimeout(async () => {
        try {
          const res = await api.get('search/parts-db', { params: { type, keyword } });
          // 하이브리드 검색 결과 (객체 배열)에서 이름만 추출하여 리스트업
          this.suggestions[type] = res.data.data.map(item => item.name);
        } catch (err) {
          console.error(`Autocomplete error for ${type}:`, err);
        }
      }, 300);
    },
    savePcInfo() {
      const hasAnyInfo = Object.values(this.signupForm.my_pc).some(v => v && v.trim() !== '');
      this.isPcInfoSaved = hasAnyInfo;
      this.pcDialog = false;
      if (hasAnyInfo) {
        this.$store.dispatch('ui/showSuccess', '컴퓨터 정보가 임시 저장되었습니다.');
      }
    },
    async submitLogin() {
      try {
        await this.login(this.loginForm);
        const redirect = this.$route.query.redirect || '/';
        this.$router.push(redirect);
        this.$store.dispatch('ui/showSuccess', '로그인 성공!');
      } catch (err) { /* handled in vuex */ }
    },
    async checkId() {
      if (!this.signupForm.username || this.signupForm.username.length < 4) {
        return this.$store.dispatch('ui/showWarning', '아이디를 4자 이상 입력해주세요.');
      }
      this.checkingId = true;
      try {
        const res = await api.get('auth/check-username', { params: { username: this.signupForm.username } });
        this.isIdAvailable = res.data.available;
        if (this.isIdAvailable) this.$store.dispatch('ui/showSuccess', '사용 가능한 아이디입니다.');
        else this.$store.dispatch('ui/showError', '이미 사용 중인 아이디입니다.');
      } catch (err) { this.$store.dispatch('ui/showError', '아이디 중복 확인 중 오류가 발생했습니다.'); }
      finally { this.checkingId = false; }
    },
    async checkNick() {
      if (!this.signupForm.nickname || this.signupForm.nickname.length < 2) {
        return this.$store.dispatch('ui/showWarning', '닉네임을 2자 이상 입력해주세요.');
      }
      this.checkingNick = true;
      try {
        const res = await api.get('auth/check-nickname', { params: { nickname: this.signupForm.nickname } });
        this.isNickAvailable = res.data.available;
        if (this.isNickAvailable) this.$store.dispatch('ui/showSuccess', '사용 가능한 닉네임입니다.');
        else this.$store.dispatch('ui/showError', '이미 사용 중인 닉네임입니다.');
      } catch (err) { this.$store.dispatch('ui/showError', '닉네임 중복 확인 중 오류가 발생했습니다.'); }
      finally { this.checkingNick = false; }
    },
    async submitSignup() {
      if (!this.isIdAvailable || !this.isNickAvailable) {
        return this.$store.dispatch('ui/showWarning', '아이디와 닉네임 중복 확인을 먼저 해주세요.');
      }
      try {
        await this.signup(this.signupForm);
        this.isSignup = false;
        this.$store.dispatch('ui/showSuccess', '회원가입 성공! 로그인해주세요.');
      } catch (err) { /* handled in vuex */ }
    }
  }
};
</script>

<style scoped>
/* Neon Label Styles */
.label-neon {
  color: #00f3ff;
  font-weight: 800;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 5px;
  display: block;
}
.pc-modal-content {
  background: #0f172a !important;
  border: 1px solid rgba(0, 243, 255, 0.3);
  box-shadow: 0 0 30px rgba(0, 243, 255, 0.1);
  color: white;
}
:deep(.autocomplete-neon .v-field) {
  background-color: rgba(0, 0, 0, 0.5) !important;
  border-radius: 8px;
  border: 1px solid rgba(0, 243, 255, 0.2);
  color: white !important;
}
:deep(.autocomplete-neon .v-field:hover), :deep(.autocomplete-neon .v-field--focused) {
  border-color: #00f3ff;
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.2);
}

.auth-page-wrapper {
  height: calc(100vh - 64px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.container {
  position: relative;
  width: 900px;
  max-width: 95vw;
  height: 620px;
  background: rgba(17, 24, 39, 0.9);
  border-radius: 30px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-container {
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
}

.signin-container {
  left: 0;
  width: 50%;
  z-index: 2;
}

.signup-container {
  left: 0;
  width: 50%;
  opacity: 0;
  z-index: 1;
}

.container.active .signin-container {
  transform: translateX(100%);
  opacity: 0;
  z-index: 1;
}

.container.active .signup-container {
  transform: translateX(100%);
  opacity: 1;
  z-index: 5;
  animation: show 0.6s;
}

@keyframes show {
  0%, 49.99% { opacity: 0; z-index: 1; }
  50%, 100% { opacity: 1; z-index: 5; }
}

form {
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 40px;
  height: 100%;
  text-align: center;
}

h1 {
  font-weight: 800;
  margin-bottom: 20px;
  color: #fff;
}

input {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 15px;
  margin: 6px 0;
  width: 100%;
  border-radius: 12px;
  outline: none;
  color: #fff;
  transition: 0.3s;
  font-size: 14px;
}

input:focus {
  border-color: var(--neon-pink);
  box-shadow: 0 0 10px rgba(255, 0, 128, 0.2);
}

.input-row {
  display: flex;
  width: 100%;
  gap: 10px;
  align-items: center;
}

.check-btn {
  white-space: nowrap;
  background: transparent;
  border: 1px solid var(--neon-pink);
  color: var(--neon-pink);
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.level-label {
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  display: block;
}

.submit-btn {
  border-radius: 30px;
  border: none;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
  padding: 12px 45px;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: transform 80ms ease-in;
  cursor: pointer;
  margin-top: 15px;
  width: 100%;
}

.cyan-btn {
  background: linear-gradient(135deg, #ff0080 0%, #cc0066 100%);
  box-shadow: 0 4px 15px rgba(255, 0, 128, 0.3);
}

.purple-btn {
  background: linear-gradient(135deg, #00d9ff 0%, #0099cc 100%);
  box-shadow: 0 4px 15px rgba(0, 217, 255, 0.3);
}

.submit-btn:active { transform: scale(0.95); }

.overlay-container {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: transform 0.6s ease-in-out;
  z-index: 100;
}

.container.active .overlay-container {
  transform: translateX(-100%);
}

.overlay {
  background: linear-gradient(135deg, #ff0080 0%, #00d9ff 100%);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 0 0;
  color: #FFFFFF;
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
}

.container.active .overlay {
  transform: translateX(50%);
}

.overlay-panel {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 40px;
  text-align: center;
  top: 0;
  height: 100%;
  width: 50%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
}

.overlay-left { transform: translateX(-20%); }
.container.active .overlay-left { transform: translateX(0); }
.overlay-right { right: 0; transform: translateX(0); }
.container.active .overlay-right { transform: translateX(20%); }

/* 오버레이 패널 안의 p만 흰색 */
.overlay-panel p {
  color: #ffffff !important;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.5px;
  margin: 15px 0 25px;
}

.ghost-btn {
  background-color: transparent;
  border: 1px solid #FFFFFF;
  border-radius: 30px;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
  padding: 12px 45px;
  cursor: pointer;
  text-transform: uppercase;
}

/* 팝업 스타일링 */
.pc-modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #999 !important;
  z-index: 10;
}

.pc-modal-title {
  color: #ff0080;
  font-size: 24px;
  font-weight: bold;
}

.input-group-custom {
  margin-bottom: 15px;
  text-align: left;
}

:deep(.v-list-item-title) {
  color: #000 !important;
}

/* 튜토리얼 팝업 */
.tutorial-card {
  background-color: white !important;
  color: #333;
}

.tutorial-desc {
  color: #555 !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  line-height: 1.7 !important;
  padding-left: 32px;
  margin: 4px 0 0 0 !important;
}

.color-navy {
  color: #ff0080;
}

.button-group-custom {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.neon-text-cyan { color: var(--neon-pink); text-shadow: 0 0 10px rgba(255, 0, 128, 0.5); }
.neon-text-purple { color: var(--neon-blue); text-shadow: 0 0 10px rgba(0, 217, 255, 0.5); }

:deep(.autocomplete-neon input) {
  color: #00f3ff !important;
  font-weight: bold;
}
:deep(.autocomplete-neon .v-list) {
  background: #0f172a !important;
  color: #00f3ff !important;
}
</style>
