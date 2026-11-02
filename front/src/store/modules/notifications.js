import api from '@/services/api';

export default {
  namespaced: true,
  state: {
    items: [],
    unreadCount: 0
  },
  mutations: {
    SET_ITEMS(state, items) {
      state.items = items;
      state.unreadCount = items.filter(n => !n.is_read).length;
    },
    ADD_NOTIFICATION(state, notif) {
      state.items.unshift(notif);
      if (!notif.is_read) state.unreadCount++;
    },
    MARK_AS_READ(state, id) {
      if (id === 'all') {
        state.items.forEach(n => n.is_read = true);
        state.unreadCount = 0;
      } else {
        const notif = state.items.find(n => n.id === id);
        if (notif && !notif.is_read) {
          notif.is_read = true;
          state.unreadCount--;
        }
      }
    }
  },
  actions: {
    async fetchNotifications({ commit, rootState }) {
      if (!rootState.auth.isAuthenticated) return;
      try {
        const res = await api.get('notifications');
        commit('SET_ITEMS', res.data.data || []);
      } catch (e) {
        console.error('[Notifications] fetch failed:', e);
      }
    },
    async markAsRead({ commit }, id) {
      commit('MARK_AS_READ', id);
      try {
        await api.put(`notifications/${id}/read`);
      } catch (e) {
        console.error('[Notifications] mark as read failed:', e);
      }
    },
    receiveRealtimeNotification({ commit, dispatch }, notif) {
      commit('ADD_NOTIFICATION', notif);
      dispatch('ui/showInfo', `[새 알림] ${notif.message}`, { root: true });
    }
  }
};
