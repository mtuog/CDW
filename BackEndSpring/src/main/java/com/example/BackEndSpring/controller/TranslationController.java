package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.Translation;
import com.example.BackEndSpring.service.DatabaseTranslationService;
import com.example.BackEndSpring.service.AutoTranslationEnhancer;
import com.example.BackEndSpring.service.DatabaseContentTranslator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/translations")
public class TranslationController {

    private final DatabaseTranslationService translationService;
    private final AutoTranslationEnhancer autoEnhancer;
    private final DatabaseContentTranslator contentTranslator;

    @Autowired
    public TranslationController(DatabaseTranslationService translationService, 
                               AutoTranslationEnhancer autoEnhancer,
                               DatabaseContentTranslator contentTranslator) {
        this.translationService = translationService;
        this.autoEnhancer = autoEnhancer;
        this.contentTranslator = contentTranslator;
    }

    /**
     * Get all translations for a specific language
     */
    @GetMapping
    public ResponseEntity<List<Translation>> getAllTranslations(@RequestParam(defaultValue = "en") String lang) {
        List<Translation> translations = translationService.getAllTranslations(lang);
        return ResponseEntity.ok(translations);
    }

    /**
     * Get translations by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Translation>> getTranslationsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "en") String lang) {
        List<Translation> translations = translationService.getTranslationsByCategory(category, lang);
        return ResponseEntity.ok(translations);
    }

    /**
     * Add or update a translation
     */
    @PostMapping
    public ResponseEntity<Translation> saveTranslation(@RequestBody TranslationRequest request) {
        try {
            Translation translation = translationService.saveTranslation(
                request.getSourceText(),
                request.getTargetLanguage(),
                request.getTranslatedText(),
                request.getCategory()
            );
            return ResponseEntity.ok(translation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Translate a single text
     */
    @PostMapping("/translate")
    public ResponseEntity<TranslationResponse> translateText(@RequestBody TranslateRequest request) {
        try {
            String translatedText = translationService.translate(request.getSourceText(), request.getTargetLanguage());
            return ResponseEntity.ok(new TranslationResponse(translatedText));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Check if translation exists
     */
    @GetMapping("/exists")
    public ResponseEntity<Boolean> translationExists(
            @RequestParam String sourceText,
            @RequestParam String targetLanguage) {
        boolean exists = translationService.translationExists(sourceText, targetLanguage);
        return ResponseEntity.ok(exists);
    }

    /**
     * Delete a translation
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteTranslation(
            @RequestParam String sourceText,
            @RequestParam String targetLanguage) {
        try {
            translationService.deleteTranslation(sourceText, targetLanguage);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Bulk add translations
     */
    @PostMapping("/bulk")
    public ResponseEntity<String> bulkAddTranslations(@RequestBody List<TranslationRequest> requests) {
        try {
            int addedCount = 0;
            for (TranslationRequest request : requests) {
                translationService.saveTranslation(
                    request.getSourceText(),
                    request.getTargetLanguage(),
                    request.getTranslatedText(),
                    request.getCategory()
                );
                addedCount++;
            }
            return ResponseEntity.ok("Successfully added " + addedCount + " translations");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error adding translations: " + e.getMessage());
        }
    }

    /**
     * Auto-enhance translations from existing data
     */
    @PostMapping("/enhance")
    public ResponseEntity<String> enhanceTranslations() {
        try {
            autoEnhancer.enhanceTranslationsFromData();
            return ResponseEntity.ok("Translations enhanced successfully from existing data");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error enhancing translations: " + e.getMessage());
        }
    }
    
    /**
     * Translate ALL content from database tables
     */
    @PostMapping("/translate-all-content")
    public ResponseEntity<?> translateAllDatabaseContent(@RequestParam(defaultValue = "en") String targetLanguage) {
        try {
            Map<String, Integer> results = contentTranslator.translateAllDatabaseContent(targetLanguage);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error translating database content: " + e.getMessage());
        }
    }

    /**
     * Initialize default translations
     */
    @PostMapping("/init")
    public ResponseEntity<String> initializeDefaultTranslations() {
        try {
            // Categories
            translationService.saveTranslation("Áo sơ mi", "en", "Shirts", "CATEGORY");
            translationService.saveTranslation("Quần jean", "en", "Jeans", "CATEGORY");
            translationService.saveTranslation("Áo khoác", "en", "Jackets", "CATEGORY");
            translationService.saveTranslation("Váy", "en", "Dresses", "CATEGORY");
            translationService.saveTranslation("Giày", "en", "Shoes", "CATEGORY");
            translationService.saveTranslation("Phụ kiện", "en", "Accessories", "CATEGORY");

            // Product patterns
            translationService.saveTranslation("Áo", "en", "Shirt", "PRODUCT_PATTERN");
            translationService.saveTranslation("sơ mi", "en", "dress shirt", "PRODUCT_PATTERN");
            translationService.saveTranslation("Quần", "en", "Pants", "PRODUCT_PATTERN");
            translationService.saveTranslation("jean", "en", "jeans", "PRODUCT_PATTERN");
            translationService.saveTranslation("Váy", "en", "Dress", "PRODUCT_PATTERN");
            translationService.saveTranslation("Giày", "en", "Shoes", "PRODUCT_PATTERN");
            translationService.saveTranslation("nam", "en", "men's", "PRODUCT_PATTERN");
            translationService.saveTranslation("nữ", "en", "women's", "PRODUCT_PATTERN");
            translationService.saveTranslation("trắng", "en", "white", "PRODUCT_PATTERN");
            translationService.saveTranslation("đen", "en", "black", "PRODUCT_PATTERN");
            translationService.saveTranslation("xanh", "en", "blue", "PRODUCT_PATTERN");
            translationService.saveTranslation("đỏ", "en", "red", "PRODUCT_PATTERN");

            // Description patterns
            translationService.saveTranslation("chất liệu", "en", "material", "DESCRIPTION_PATTERN");
            translationService.saveTranslation("cotton", "en", "cotton", "DESCRIPTION_PATTERN");
            translationService.saveTranslation("thoải mái", "en", "comfortable", "DESCRIPTION_PATTERN");
            translationService.saveTranslation("phong cách", "en", "style", "DESCRIPTION_PATTERN");
            translationService.saveTranslation("thời trang", "en", "fashion", "DESCRIPTION_PATTERN");
            translationService.saveTranslation("cao cấp", "en", "premium", "DESCRIPTION_PATTERN");

            return ResponseEntity.ok("Default translations initialized successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error initializing translations: " + e.getMessage());
        }
    }

    // DTO classes
    public static class TranslationRequest {
        private String sourceText;
        private String targetLanguage;
        private String translatedText;
        private String category;

        // Constructors
        public TranslationRequest() {}

        public TranslationRequest(String sourceText, String targetLanguage, String translatedText, String category) {
            this.sourceText = sourceText;
            this.targetLanguage = targetLanguage;
            this.translatedText = translatedText;
            this.category = category;
        }

        // Getters and Setters
        public String getSourceText() { return sourceText; }
        public void setSourceText(String sourceText) { this.sourceText = sourceText; }

        public String getTargetLanguage() { return targetLanguage; }
        public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }

        public String getTranslatedText() { return translatedText; }
        public void setTranslatedText(String translatedText) { this.translatedText = translatedText; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
    }

    public static class TranslateRequest {
        private String sourceText;
        private String targetLanguage;

        // Constructors
        public TranslateRequest() {}

        public TranslateRequest(String sourceText, String targetLanguage) {
            this.sourceText = sourceText;
            this.targetLanguage = targetLanguage;
        }

        // Getters and Setters
        public String getSourceText() { return sourceText; }
        public void setSourceText(String sourceText) { this.sourceText = sourceText; }

        public String getTargetLanguage() { return targetLanguage; }
        public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }
    }

    public static class TranslationResponse {
        private String translatedText;

        public TranslationResponse() {}

        public TranslationResponse(String translatedText) {
            this.translatedText = translatedText;
        }

        public String getTranslatedText() { return translatedText; }
        public void setTranslatedText(String translatedText) { this.translatedText = translatedText; }
    }
} 