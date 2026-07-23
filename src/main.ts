import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { registerServiceWorker } from './utils/pwa';

createApp(App).mount('#app');

// Register PWA service worker
registerServiceWorker();
