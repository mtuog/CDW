package com.example.BackEndSpring.config;

import com.example.BackEndSpring.service.DatabaseTranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class TranslationInitializer implements ApplicationRunner {

    private final DatabaseTranslationService translationService;

    @Autowired
    public TranslationInitializer(DatabaseTranslationService translationService) {
        this.translationService = translationService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // Use a separate thread to avoid blocking startup
        new Thread(() -> {
            try {
                Thread.sleep(3000); // Wait 3 seconds for Spring to fully initialize
                initializeBasicTranslations();
            } catch (Exception e) {
                System.err.println("Error in translation initialization: " + e.getMessage());
            }
        }).start();
    }

    private void initializeBasicTranslations() {
        System.out.println("=== INITIALIZING BASIC TRANSLATIONS ===");
        
        try {
            // Check if translations already exist
            if (translationService.getAllTranslations("en").isEmpty()) {
                System.out.println("No translations found, initializing basic translations...");
                
                // Categories (exact match)
                translationService.saveTranslation("Áo sơ mi", "en", "Shirts", "CATEGORY");
                translationService.saveTranslation("Quần jean", "en", "Jeans", "CATEGORY");
                translationService.saveTranslation("Áo khoác", "en", "Jackets", "CATEGORY");
                translationService.saveTranslation("Váy", "en", "Dresses", "CATEGORY");
                translationService.saveTranslation("Giày", "en", "Shoes", "CATEGORY");
                translationService.saveTranslation("Phụ kiện", "en", "Accessories", "CATEGORY");

                // Basic product patterns
                translationService.saveTranslation("Áo", "en", "Shirt", "PRODUCT_PATTERN");
                translationService.saveTranslation("Quần", "en", "Pants", "PRODUCT_PATTERN");
                translationService.saveTranslation("nam", "en", "men's", "PRODUCT_PATTERN");
                translationService.saveTranslation("nữ", "en", "women's", "PRODUCT_PATTERN");
                translationService.saveTranslation("trắng", "en", "white", "PRODUCT_PATTERN");
                translationService.saveTranslation("đen", "en", "black", "PRODUCT_PATTERN");
                translationService.saveTranslation("xanh", "en", "blue", "PRODUCT_PATTERN");
                translationService.saveTranslation("đỏ", "en", "red", "PRODUCT_PATTERN");

                System.out.println("✅ Basic translations initialized successfully!");
            } else {
                System.out.println("Translations already exist, skipping initialization.");
            }
        } catch (Exception e) {
            System.err.println("❌ Error initializing translations: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("===================================");
    }
} 