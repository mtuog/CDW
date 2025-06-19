import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Cấu hình i18next (backup cho trường hợp không dùng Context)
i18n
    .use(initReactI18next)
    .init({
        lng: 'vi',
        fallbackLng: 'vi',

        interpolation: {
            escapeValue: false,
        },

        // Resources rỗng - sẽ load từ backend
        resources: {
            vi: { translation: {} },
            en: { translation: {} }
        }
    });

export default i18n;
