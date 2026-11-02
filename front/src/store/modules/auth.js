import api from '@/services/api';

export default {
  namespaced: true,
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    isInitialized: false
  }),
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      state.isAuthenticated = !!user;
      state.isInitialized = true;
    },
    SET_LOADING(state, val) { state.loading = val; }
  },
  actions: {
    async login({ commit, dispatch }, { username, password }) {
      commit('SET_LOADING', true);
      try {
        const res = await api.post('auth/login', { username, password });
        commit('SET_USER', res.data.data.user);
        dispatch('ui/showSuccess', '환영합니다!', { root: true });
      } catch (err) {
        dispatch('ui/showError', err.response?.data?.error || '로그인 실패', { root: true });
        throw err;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async signup({ commit, dispatch }, userData) {
      commit('SET_LOADING', true);
      try {
        await api.post('auth/signup', userData);
        dispatch('ui/showSuccess', '회원가입이 완료되었습니다.', { root: true });
      } catch (err) {
        dispatch('ui/showError', err.response?.data?.error || '회원가입 실패', { root: true });
        throw err;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async logout({ commit, dispatch }) {
      await api.post('auth/logout');
      commit('SET_USER', null);
      dispatch('ui/showInfo', '로그아웃 되었습니다.', { root: true });
    },
    async checkSession({ commit }) {
      try {
        const res = await api.get('auth/me');
        commit('SET_USER', res.data.data.user);
      } catch {
        commit('SET_USER', null);
      }
    },
    async updateMyPc({ state, commit, dispatch }, my_pc) {
      try {
        const res = await api.put('auth/my-pc', { my_pc });
        const updatedUser = { ...state.user, my_pc: res.data.data.my_pc };
        commit('SET_USER', updatedUser);
        dispatch('ui/showSuccess', 'PC 정보가 업데이트되었습니다.', { root: true });
      } catch (err) {
        dispatch('ui/showError', err.response?.data?.error || '업데이트 실패', { root: true });
        throw err;
      }
    }
  },
  getters: {
    userId: (state) => state.user?.id,
    isAdmin: (state) => state.user?.role === 'admin',
    isNewbie: (state) => state.user?.user_level === 'newbie'
  }
};
