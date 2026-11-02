import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';

import './assets/css/custom-dark.css';
import './assets/css/glassmorphism.css';
import './assets/css/neon.css';
import './assets/css/animations.css';

// ResizeObserver 에러 무시 (UI 차단 방지)
window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || 
      e.message === 'ResizeObserver loop limit exceeded') {
    e.stopImmediatePropagation();
  }
});

import NewbieTooltip from './components/common/NewbieTooltip.vue';

const app = createApp(App);
app.component('NewbieTooltip', NewbieTooltip);
app.use(store);
app.use(router);
app.use(vuetify);
app.mount('#app');