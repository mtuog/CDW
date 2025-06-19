import { i18nApi } from '../api/i18nApi';

// Service xử lý logic i18n - có thể mở rộng dễ dàng
class I18nService {
    constructor() {
        this.cache = new Map(); // Cache messages
        this.currentLanguage = 'vi';
        this.fallbackLanguage = 'vi';
    }

    // Lấy messages với cache
    async getMessages(language) {
        const cacheKey = `messages_${language}`;

        // Kiểm tra cache trước
        if (this.cache.has(cacheKey)) {
            console.log(`📦 Using cached messages for ${language}`);
            return this.cache.get(cacheKey);
        }

        try {
            console.log(`🌐 Fetching messages for ${language} from backend...`);
            const messages = await i18nApi.getMessages(language);

            // Lưu vào cache
            this.cache.set(cacheKey, messages);
            console.log(`✅ Cached messages for ${language}:`, Object.keys(messages).length, 'keys');

            return messages;
        } catch (error) {
            console.error(`❌ Failed to fetch messages for ${language}:`, error);

            // Fallback to cached fallback language
            if (language !== this.fallbackLanguage && this.cache.has(`messages_${this.fallbackLanguage}`)) {
                console.log(`🔄 Using fallback language: ${this.fallbackLanguage}`);
                return this.cache.get(`messages_${this.fallbackLanguage}`);
            }

            return {};
        }
    }

    // Clear cache khi cần
    clearCache(language = null) {
        if (language) {
            this.cache.delete(`messages_${language}`);
            console.log(`🗑️ Cleared cache for ${language}`);
        } else {
            this.cache.clear();
            console.log('🗑️ Cleared all i18n cache');
        }
    }

    // Preload messages cho performance
    async preloadLanguages(languages = ['vi', 'en']) {
        console.log('🚀 Preloading languages:', languages);
        const promises = languages.map(lang => this.getMessages(lang));
        await Promise.allSettled(promises);
        console.log('✅ Preload completed');
    }

    // Get available languages
    async getAvailableLanguages() {
        return await i18nApi.getAvailableLanguages();
    }

    // Set current language
    setCurrentLanguage(language) {
        this.currentLanguage = language;
        localStorage.setItem('preferred_language', language);
    }

    // Get current language
    getCurrentLanguage() {
        return localStorage.getItem('preferred_language') || this.currentLanguage;
    }
}

// Singleton instance
export const i18nService = new I18nService();
