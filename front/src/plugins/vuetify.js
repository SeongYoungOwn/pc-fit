import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

const darkTheme = {
  dark: true,
  colors: {
    background: '#0a0e27',
    surface: '#141832',
    'surface-variant': '#1e293b',
    primary: '#ff0080',        // Neon Pink (Neon Tokyo Primary)
    secondary: '#00d9ff',      // Neon Blue (Neon Tokyo Secondary)
    success: '#00ff9d',        // Neon Green
    error: '#ff0055',          // Neon Red
    warning: '#ffe600',        // Neon Yellow
    info: '#00d9ff',           // Neon Blue
    'on-background': '#ffffff',
    'on-surface': '#ffffff'
  }
};

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: { dark: darkTheme, catalog: { dark: false, colors: {
      background: '#f5f6f8', surface: '#ffffff', 'surface-variant': '#edf1f7',
      primary: '#2459d3', secondary: '#456184', success: '#16816b',
      error: '#c73346', warning: '#99621b', info: '#2459d3',
      'on-background': '#182334', 'on-surface': '#182334'
    } } }
  },
  defaults: {
    VCard: { elevation: 4, rounded: 'xl' },
    VBtn: { 
      rounded: 'lg', 
      fontWeight: '700',
      elevation: 2,
      style: 'text-transform: none; letter-spacing: -0.01em;'
    },
    VTextField: { 
      variant: 'outlined', 
      density: 'comfortable',
      color: 'primary'
    }
  }
});
