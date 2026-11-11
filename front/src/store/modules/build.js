import api from '@/services/api';

export default {
  namespaced: true,
  state: () => ({
    prompt: '', aiModel: 'claude',
    title: '',
    overall_summary: '',
    detailed_review: '',
    advisor_questions: [],
    reviewLoading: false,
    reviewError: null,

    parts: { cpu: null, gpu: null, ram: null, motherboard: null, storage: null, psu: null, cooler: null, case: null },
    part_reviews: {}, // Holds AI reviews for each part
    totalPrice: 0,
    totalWattage: 0,
    budget: 0,
    usage: 'gaming',
    program: '',
    recommendedPsu: 0,
    compatibility: { isCompatible: true, warnings: [] },
    performance_metrics: { game_fps: {}, build_score: 0, synergy: [] },
    combo_metrics: { grade: 'C', reasoning: [], finalScore: 0 },
    loading: false,
    saved: false,
    savedBuildId: null,
    isUpgradeMode: false,
    trackA: null,
    trackB: null,
    selectedModel: 'gemini',
    buildRevision: 0,
    analysisStale: false
  }),
  mutations: {
    SET_PROMPT(state, val) { state.prompt = val; },
    SET_AI_MODEL(state, val) { state.aiModel = val; },
    SET_MODEL(state, val) { state.selectedModel = val; },
    SET_REVIEW_LOADING(state, val) { state.reviewLoading = val; },
    SET_REVIEW_ERROR(state, val) { state.reviewError = val; },
    SET_BUILD(state, data) {
      if (data.parts) { state.buildRevision++; state.analysisStale=false; }
      if (data.analysisStale!==undefined) state.analysisStale=data.analysisStale;
      if (data.is_upgrade_mode) {
        state.isUpgradeMode = true;
        state.trackA = data.track_a;
        state.trackB = data.track_b;
        state.title = data.title || state.title;
        state.overall_summary = data.overall_summary || state.overall_summary;
        state.detailed_review = data.detailed_review || state.detailed_review;
        state.part_reviews = data.part_reviews || state.part_reviews || {};
        if (Array.isArray(data.advisor_questions) && data.advisor_questions.length > 0) {
          state.advisor_questions = data.advisor_questions;
        }
        // Default to trackA for common components
        state.parts = data.track_a.parts;
        state.totalPrice = data.track_a.totalPrice;
        state.totalWattage = data.track_a.totalWattage;
        state.recommendedPsu = data.track_a.recommendedPsu;
        state.compatibility = data.track_a.compatibility;
        state.performance_metrics = data.track_a.performance_metrics || { game_fps: {}, build_score: 0, synergy: [] };
      } else {
        state.isUpgradeMode = false;
        state.trackA = null;
        state.trackB = null;
        state.title = data.title || state.title;
        state.overall_summary = data.overall_summary || state.overall_summary;
        state.detailed_review = data.detailed_review || state.detailed_review;
        state.part_reviews = data.part_reviews || state.part_reviews || {};
        if (Array.isArray(data.advisor_questions) && data.advisor_questions.length > 0) {
          state.advisor_questions = data.advisor_questions;
        }
        if (data.parts) state.parts = data.parts;
        if (data.totalPrice !== undefined) state.totalPrice = data.totalPrice;
        if (data.totalWattage !== undefined) state.totalWattage = data.totalWattage;
        if (data.recommendedPsu !== undefined) state.recommendedPsu = data.recommendedPsu;
        if (data.compatibility) state.compatibility = data.compatibility;
        if (data.performance_metrics) state.performance_metrics = data.performance_metrics;
        if (data.combo_metrics) state.combo_metrics = data.combo_metrics;
      }
      try {
        sessionStorage.setItem('pc_fit_last_build', JSON.stringify({
          title: state.title,
          overall_summary: state.overall_summary,
          detailed_review: state.detailed_review,
          advisor_questions: state.advisor_questions,
          parts: state.parts,
          part_reviews: state.part_reviews,
          totalPrice: state.totalPrice,
          totalWattage: state.totalWattage,
          budget: state.budget,
          usage: state.usage,
          program: state.program,
          recommendedPsu: state.recommendedPsu,
          compatibility: state.compatibility,
          performance_metrics: state.performance_metrics,
          combo_metrics: state.combo_metrics,
          selectedModel: state.selectedModel,
          analysisStale: state.analysisStale
        }));
      } catch (_) {
        // Ignore sessionStorage quota errors
      }
    },
    RESTORE_LAST_BUILD(state) {
      try {
        const raw = sessionStorage.getItem('pc_fit_last_build');
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved && saved.parts && saved.parts.cpu) {
          state.title = saved.title || '';
          state.overall_summary = saved.overall_summary || '';
          state.detailed_review = saved.detailed_review || '';
          state.advisor_questions = Array.isArray(saved.advisor_questions) ? saved.advisor_questions : [];
          state.parts = saved.parts;
          state.part_reviews = saved.part_reviews || {};
          state.totalPrice = saved.totalPrice || 0;
          state.totalWattage = saved.totalWattage || 0;
          state.budget = saved.budget || 0;
          state.usage = saved.usage || 'gaming';
          state.program = saved.program || '';
          state.recommendedPsu = saved.recommendedPsu || 0;
          state.compatibility = saved.compatibility || { isCompatible: true, warnings: [] };
          state.performance_metrics = saved.performance_metrics || { game_fps: {}, build_score: 0, synergy: [] };
          state.combo_metrics = saved.combo_metrics || { grade: 'C', reasoning: [], finalScore: 0 };
          state.selectedModel = saved.selectedModel || 'claude';
          state.analysisStale=Boolean(saved.analysisStale);
        }
      } catch (_) {
        // Ignore parse errors
      }
    },
    SELECT_TRACK(state, track) {
      const target = track === 'a' ? state.trackA : state.trackB;
      if (target) {
        state.parts = target.parts;
        state.totalPrice = target.totalPrice;
        state.totalWattage = target.totalWattage;
        state.recommendedPsu = target.recommendedPsu;
        state.compatibility = target.compatibility;
        state.performance_metrics = target.performance_metrics || { game_fps: {}, build_score: 0, synergy: [] };
      }
    },
    SET_PART(state, { partType, partData }) { 
      state.parts[partType] = partData; 
      state.buildRevision++;
      state.saved = false;
      state.savedBuildId = null;
    },
    INVALIDATE_ANALYSIS(state) {
      state.analysisStale=true;
      state.overall_summary=''; state.detailed_review=''; state.part_reviews={}; state.advisor_questions=[];
      state.performance_metrics={game_fps:{},build_score:0,synergy:[]};
      state.combo_metrics={grade:'',reasoning:[],finalScore:0};
      state.reviewLoading=false;
      state.reviewError='부품이 변경되어 이전 AI 리뷰를 숨겼습니다. 필요하면 다시 요청해 주세요.';
    },
    SET_TOTAL_PRICE(state, val) { state.totalPrice = val; },
    SET_COMPATIBILITY(state, val) { state.compatibility = val; },
    SET_LOADING(state, val) { state.loading = val; },
    SET_SAVED(state, val) { state.saved = val; },
    SET_SAVED_BUILD_ID(state, val) { state.savedBuildId = val; },
    SET_BUILD_FROM_SAVED(state, buildData) {
      state.title = buildData.title || '저장된 견적';
      state.totalPrice = buildData.total_price || buildData.totalPrice || 0;
      state.parts = buildData.build_data || buildData.parts_data || {};
      state.saved = true;
      state.savedBuildId = buildData.id;
    },
    RESET(state) {
      state.buildRevision++;
      state.analysisStale=false;
      state.prompt = ''; state.aiModel = 'claude'; state.title = ''; state.overall_summary = ''; state.detailed_review = ''; state.totalPrice = 0; state.part_reviews = {};
      state.advisor_questions = []; state.reviewLoading = false; state.reviewError = null;
      state.parts = { cpu: null, gpu: null, ram: null, motherboard: null, storage: null, psu: null, cooler: null, case: null };
      state.compatibility = { isCompatible: true, warnings: [] };
      state.performance_metrics = { game_fps: {}, build_score: 0, synergy: [] };
      state.combo_metrics = { grade: 'C', reasoning: [], finalScore: 0 };
      state.loading = false; state.saved = false; state.savedBuildId = null;
    }
  },
  actions: {
    async generateBuild({ commit, dispatch, state }, payload) {
      // payload: { budget, usage, program, brand, model }
      commit('RESET');
      commit('SET_LOADING', true);
      if (payload.model) commit('SET_MODEL', payload.model);
      state.budget = payload.budget;
      state.usage = payload.usage;
      state.program = payload.program || '';
      
      try {
        const res = await api.post('recommend', payload);
        commit('SET_BUILD', res.data.data);
        return true;
      } catch (err) {
        dispatch('ui/showError', '견적 생성 중 오류가 발생했습니다.', { root: true });
        console.error(err);
        throw err;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async fetchAiReview({ commit, state }) {
      const revision=state.buildRevision;
      commit('SET_REVIEW_LOADING', true);
      commit('SET_REVIEW_ERROR', null);
      try {
        const payload = {
          parts: state.parts,
          budget: state.budget,
          usage: state.usage,
          program: state.program,
          model: state.selectedModel
        };
        const res = await api.post('recommend/ai-review', payload);
        if (revision===state.buildRevision) commit('SET_BUILD',{...res.data.data,analysisStale:false});
      } catch (err) {
        console.error('AI Review generation failed:', err);
        if (revision===state.buildRevision) commit('SET_REVIEW_ERROR', err.response?.data?.error || 'AI 전문가 리뷰를 불러오지 못했습니다. 다시 시도해 주세요.');
      } finally {
        if (revision===state.buildRevision) commit('SET_REVIEW_LOADING', false);
      }
    },
    async updatePart({ commit, state }, { partType, partData }) {
      if (!Object.hasOwn(state.parts,partType)) throw new Error('지원하지 않는 부품 종류입니다.');
      commit('SET_PART', { partType, partData });
      const revision=state.buildRevision;
      commit('INVALIDATE_ANALYSIS');
      commit('SET_COMPATIBILITY',{isCompatible:false,warnings:[{type:'check_pending',severity:'warning',message:'변경한 부품의 호환성을 확인하고 있습니다.',affectedParts:[]}]});
      // 부품 변경 후 총액 재계산
      const newTotal = Object.values(state.parts).reduce((sum,p)=>sum + (p?.priceStatus==='unavailable' ? 0 : Number(p?.price ?? p?.specs?.estimatedPrice ?? p?.specs?.Price ?? 0)),0);
      commit('SET_TOTAL_PRICE', newTotal);
      try {
        const response=await api.post('compatibility/check',{parts:state.parts});
        if (revision!==state.buildRevision) return;
        const result=response.data.data;
        commit('SET_BUILD',{compatibility:{isCompatible:result.isCompatible,warnings:result.warnings},
          totalWattage:result.totalWattage,recommendedPsu:result.recommendedPsu});
      } catch (error) {
        if (revision!==state.buildRevision) return;
        commit('SET_BUILD',{compatibility:{isCompatible:false,warnings:[{type:'check_failed',severity:'error',message:'호환성 재검증에 실패했습니다. 다시 확인해 주세요.',affectedParts:[]}]}});
        throw error;
      }
    },
    async saveBuild({ state, rootState, dispatch, commit }) {
      if (!rootState.auth.isAuthenticated) return null;
      try {
        const payload = {
          title: state.title,
          total_price: state.totalPrice,
          parts_data: state.parts
        };
        const res = await api.post('builds', payload);
        commit('SET_SAVED', true);
        commit('SET_SAVED_BUILD_ID', res.data.data.id);
        dispatch('ui/showSuccess', '견적이 성공적으로 저장되었습니다.', { root: true });
        return res.data.data.id;
      } catch (err) {
        dispatch('ui/showError', '견적 저장에 실패했습니다.', { root: true });
        console.error(err);
        return null;
      }
    }
  },
  getters: {
    isComplete: (state) => Object.values(state.parts).every(p => p !== null),
    isReadyToTakeoff: (state, getters) => {
      return getters.isComplete && state.compatibility.isCompatible && !state.loading;
    },
    errorParts: (state) => {
      const types = new Set();
      state.compatibility.warnings.filter(w => w.severity === 'error')
        .forEach(w => w.affectedParts.forEach(p => types.add(p)));
      return [...types];
    }
  }
};
