import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

const routes = [
  { path: '/', name: 'Home', component: () => import('@/views/HomePage.vue') },
  { path: '/auth/login', name: 'Login', component: () => import('@/views/AuthPage.vue'), meta: { guestOnly: true } },
  { path: '/builder', name: 'Builder', component: () => import('@/views/BuilderPage.vue') },
  { path: '/builder/result', name: 'BuilderResult', component: () => import('@/views/BuilderResultPage.vue') },
  { path: '/takeoff', name: 'TakeoffBoard', component: () => import('@/views/TakeoffBoardPage.vue') },
  { path: '/takeoff/:id', name: 'TakeoffDetail', component: () => import('@/views/TakeoffDetailPage.vue'), props: true },
  { path: '/mypage', name: 'MyPage', component: () => import('@/views/MyPage.vue'), meta: { requiresAuth: true } },
  { path: '/admin', name: 'Admin', component: () => import('@/views/AdminDashboard.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFoundPage.vue') }
];

const router = createRouter({ history: createWebHistory(), routes, scrollBehavior() { return { top: 0 }; } });

router.beforeEach(async (to) => {
  // 세션 정보가 아직 로드되지 않았으면 대기
  if (!store.state.auth.isInitialized) {
    await store.dispatch('auth/checkSession');
  }

  const isAuth = store.state.auth.isAuthenticated;
  const isAdmin = store.getters['auth/isAdmin'];

  if (to.meta.requiresAuth && !isAuth) return { name: 'Login', query: { redirect: to.fullPath } };
  if (to.meta.guestOnly && isAuth) return { name: 'Home' };
  if (to.meta.requiresAdmin && !isAdmin) return { name: 'Home' };
});

export default router;