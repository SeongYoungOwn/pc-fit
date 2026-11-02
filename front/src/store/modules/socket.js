import { io } from 'socket.io-client';

export default {
  namespaced: true,
  state: () => ({ socket: null, connected: false }),
  mutations: {
    SET_SOCKET(state, socket) { state.socket = socket; },
    SET_CONNECTED(state, val) { state.connected = val; }
  },
  actions: {
    connect({ commit, state, dispatch }) {
      if (state.socket) return;
      const fallbackUrl =
        process.env.VUE_APP_API_URL
          ? process.env.VUE_APP_API_URL.replace(/\/api\/v1\/?$/, '')
          : (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin);
      const socketUrl = process.env.VUE_APP_SERVER_URL || fallbackUrl;
      const socket = io(socketUrl, { withCredentials: true });
      socket.on('connect', () => commit('SET_CONNECTED', true));
      socket.on('disconnect', () => commit('SET_CONNECTED', false));
      
      socket.on('new_notification', (notif) => {
        dispatch('notifications/receiveRealtimeNotification', notif, { root: true });
      });
      
      commit('SET_SOCKET', socket);
    },
    joinTakeoffBoard({ state }) { state.socket?.emit('join_takeoff_board'); },
    joinBuildDetail({ state }, buildId) { state.socket?.emit('join_build_detail', { buildId }); },
    joinUser({ state }, userId) { state.socket?.emit('join_user', { userId }); },
    leaveBuildDetail({ state }, buildId) { state.socket?.emit('leave_build_detail', { buildId }); },
    disconnect({ commit, state }) {
      state.socket?.disconnect();
      commit('SET_SOCKET', null);
      commit('SET_CONNECTED', false);
    }
  }
};