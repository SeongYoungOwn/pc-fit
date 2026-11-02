export default {
  namespaced: true,
  state: () => ({
    toastList: [],
    globalLoading: false
  }),
  mutations: {
    ADD_TOAST(state, toast) { state.toastList.push(toast); },
    REMOVE_TOAST(state, id) { state.toastList = state.toastList.filter(t => t.id !== id); },
    SET_LOADING(state, val) { state.globalLoading = val; }
  },
  actions: {
    showToast({ commit }, { type, message, duration = 3000 }) {
      const id = Date.now();
      commit('ADD_TOAST', { id, type, message });
      setTimeout(() => commit('REMOVE_TOAST', id), duration);
    },
    showSuccess({ dispatch }, message) { dispatch('showToast', { type: 'success', message }); },
    showError({ dispatch }, message) { dispatch('showToast', { type: 'error', message }); },
    showWarning({ dispatch }, message) { dispatch('showToast', { type: 'warning', message }); },
    showInfo({ dispatch }, message) { dispatch('showToast', { type: 'info', message }); }
  }
};