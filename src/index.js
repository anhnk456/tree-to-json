import TreeToJson from '../src/components/TreeNodeToJson.vue';
import ToastService from 'primevue/toastservice';
import Toast from 'primevue/toast';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ConfirmationService from 'primevue/confirmationservice';
export default {
    install(app) {
        app.use(PrimeVue, {
            theme: {
                preset: Aura,
                options: {
                    darkModeSelector: '.app-dark'
                }
            }
        });
        app.use(ToastService);
        // eslint-disable-next-line vue/multi-word-component-names
        app.component('Toast', Toast);
        app.use(ConfirmationService);
        app.component('TreeToJson', TreeToJson); // Register globally
    },
};

export { TreeToJson };
