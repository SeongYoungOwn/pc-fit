import { createStore } from 'vuex';
import auth from './modules/auth';
import ui from './modules/ui';
import build from './modules/build';
import socket from './modules/socket';
import notifications from './modules/notifications';

export default createStore({
  modules: {
    auth,
    ui,
    build,
    socket,
    notifications
  }
});