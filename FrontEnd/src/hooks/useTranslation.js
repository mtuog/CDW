import { useLanguage } from '../i18n/LanguageContext';

// Hook đơn giản để sử dụng trong components
export const useTranslation = () => {
    const { t, currentLanguage, changeLanguage, loading, availableLanguages } = useLanguage();

    return {
        t,                    // Function translate
        currentLanguage,      // Ngôn ngữ hiện tại
        changeLanguage,       // Function đổi ngôn ngữ
        loading,             // Loading state
        availableLanguages,   // Danh sách ngôn ngữ
        ready: !loading      // Shorthand cho ready state
    };
};
