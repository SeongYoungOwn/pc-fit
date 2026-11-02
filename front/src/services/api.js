import axios from 'axios';
import store from '@/store';

function resolveBaseUrl() {
  const raw = (process.env.VUE_APP_API_URL || '/api/v1/').trim();
  if (raw.endsWith('/api')) return `${raw}/v1/`;
  if (raw.endsWith('/api/')) return `${raw}v1/`;
  return raw.endsWith('/') ? raw : `${raw}/`;
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 60000,
  withCredentials: true    // 세션 쿠키 자동 포함 (핵심!)
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      store.dispatch('ui/showError', '인터넷 연결을 확인해주세요.');
    } else if (error.response.status === 401) {
      // /auth/me (세션 체크) 요청 시 401은 정상적인 상황(미로그인)이므로 경고를 띄우지 않음
      if (!error.config.url.includes('/auth/me')) {
        store.dispatch('ui/showWarning', '로그인이 필요합니다.');
      }
      store.commit('auth/SET_USER', null);
    } else if (error.response.status === 429) {
      store.dispatch('ui/showWarning', error.response.data?.error || '요청이 너무 많습니다.');
    }
    return Promise.reject(error);
  }
);

export default api;