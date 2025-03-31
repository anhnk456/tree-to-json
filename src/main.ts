import { createApp } from 'vue';
import App from './App.vue';
import router from './router'
import store from './store'
import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
// import '@/assets/base.css';
// import '@/assets/tailwind.css'
// import '@/assets/custom.css';
import '@/assets/primeicons/primeicons.css';
const app = createApp(App);

app.use(router);
app.use(store);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService); // ⚠️ Cần có dòng này

app.mount('#app');