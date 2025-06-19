
// API calls cho i18n - tái sử dụng được
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const i18nApi = {
    // Lấy tất cả messages theo ngôn ngữ
    getMessages: async (language = 'vi') => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/i18n/messages?lang=${language}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('❌ Error fetching i18n messages:', error);
            throw error;
        }
    },

    // Lấy danh sách ngôn ngữ có sẵn
    getAvailableLanguages: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/i18n/languages`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('❌ Error fetching available languages:', error);
            return ['vi', 'en']; // fallback
        }
    },

    // Lấy ngôn ngữ mặc định từ backend
    getDefaultLanguage: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/i18n/default-language`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.language || 'vi';
        } catch (error) {
            console.error('❌ Error fetching default language:', error);
            return 'vi'; // fallback
        }
    }
};
