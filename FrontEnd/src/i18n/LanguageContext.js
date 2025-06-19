import React, { createContext, useContext, useState, useEffect } from 'react';
import { i18nService } from '../services/i18nService';

// Context để share state toàn app
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState('vi');
    const [messages, setMessages] = useState({});
    const [loading, setLoading] = useState(true);
    const [availableLanguages, setAvailableLanguages] = useState(['vi', 'en']);

    // Load messages khi component mount
    useEffect(() => {
        const initializeI18n = async () => {
            try {
                setLoading(true);

                // Lấy ngôn ngữ đã lưu
                const savedLanguage = i18nService.getCurrentLanguage();
                setCurrentLanguage(savedLanguage);

                // Lấy danh sách ngôn ngữ có sẵn
                const languages = await i18nService.getAvailableLanguages();
                setAvailableLanguages(languages);

                // Preload messages cho performance
                await i18nService.preloadLanguages(languages);

                // Load messages cho ngôn ngữ hiện tại
                const currentMessages = await i18nService.getMessages(savedLanguage);
                setMessages(currentMessages);

                setLoading(false);
                console.log('🎉 I18n initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize i18n:', error);
                setLoading(false);
            }
        };

        initializeI18n();
    }, []);

    // Function để thay đổi ngôn ngữ
    const changeLanguage = async (newLanguage) => {
        if (newLanguage === currentLanguage) return;

        try {
            console.log(`🔄 Changing language from ${currentLanguage} to ${newLanguage}`);
            setLoading(true);

            const newMessages = await i18nService.getMessages(newLanguage);
            setMessages(newMessages);
            setCurrentLanguage(newLanguage);
            i18nService.setCurrentLanguage(newLanguage);

            setLoading(false);
            console.log(`✅ Language changed to ${newLanguage}`);
        } catch (error) {
            console.error('❌ Failed to change language:', error);
            setLoading(false);
        }
    };

    // Function translate - có thể dùng ở mọi nơi
    const t = (key, options = {}) => {
        const { fallback = key, params = {} } = options;

        let translation = messages[key] || fallback;

        // Replace parameters trong text
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{${param}}`, params[param]);
        });

        return translation;
    };

    const value = {
        currentLanguage,
        messages,
        loading,
        availableLanguages,
        changeLanguage,
        t
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

// Hook để sử dụng context
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
