package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.Category;
import com.example.BackEndSpring.model.Translation;
import com.example.BackEndSpring.repository.TranslationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DatabaseTranslationService {
    
    private final TranslationRepository translationRepository;
    
    @Autowired
    public DatabaseTranslationService(TranslationRepository translationRepository) {
        this.translationRepository = translationRepository;
    }
    
    /**
     * Translate any text using database - FULL CONTENT translation
     */
    public String translate(String sourceText, String targetLanguage) {
        if (sourceText == null || "vi".equals(targetLanguage)) {
            return sourceText;
        }
        
        System.out.println("=== DATABASE TRANSLATION ===");
        System.out.println("Source length: " + sourceText.length() + " chars, Target: '" + targetLanguage + "'");
        
        // 1. Try exact match first - FULL CONTENT MATCH
        Optional<Translation> exactMatch = translationRepository.findBySourceTextAndTargetLanguage(sourceText, targetLanguage);
        if (exactMatch.isPresent()) {
            System.out.println("✅ Exact full content match found!");
            return exactMatch.get().getTranslatedText();
        }
        
        // 2. If no exact match for full content, apply comprehensive translation
        // This will save the FULL CONTENT translation for future use
        String result = translateComprehensively(sourceText, targetLanguage);
        
        // 3. Save the full content translation for next time (disabled to prevent startup errors)
        // if (!sourceText.equals(result)) {
        //     System.out.println("💾 Saving full content translation (" + sourceText.length() + " chars)");
        //     saveTranslation(sourceText, targetLanguage, result, determineCategory(sourceText));
        // }
        
        System.out.println("Final result length: " + result.length() + " chars");
        System.out.println("===========================");
        
        return result;
    }
    
    /**
     * Determine appropriate category based on content
     */
    private String determineCategory(String content) {
        if (content.length() > 200) {
            return "DESCRIPTION";
        } else if (content.length() > 50) {
            return "PRODUCT";
        } else {
            return "TEXT";
        }
    }
    
    /**
     * Comprehensive translation that covers all Vietnamese text patterns
     */
    private String translateComprehensively(String sourceText, String targetLanguage) {
        String result = sourceText;
        
        // Get all patterns from database
        List<Translation> patterns = translationRepository.findPatternsByTargetLanguage(targetLanguage);
        System.out.println("Applying " + patterns.size() + " patterns...");
        
        // Apply patterns with word boundaries to avoid partial matches
        for (Translation pattern : patterns) {
            String before = result;
            
            // Use case-insensitive matching with word boundaries
            String regex = "(?i)\\b" + java.util.regex.Pattern.quote(pattern.getSourceText()) + "\\b";
            result = result.replaceAll(regex, pattern.getTranslatedText());
            
            if (!before.equals(result)) {
                System.out.println("Pattern applied: '" + pattern.getSourceText() + "' -> '" + pattern.getTranslatedText() + "'");
            }
        }
        
        // Additional fallback patterns for common Vietnamese words not in database
        result = applyFallbackTranslations(result, targetLanguage);
        
        return result;
    }
    
    /**
     * Apply fallback translations for common Vietnamese words
     */
    private String applyFallbackTranslations(String text, String targetLanguage) {
        if (!"en".equals(targetLanguage)) {
            return text;
        }
        
        // Common fallback patterns that should always work
        text = text.replaceAll("(?i)\\bmàu\\b", "color");
        text = text.replaceAll("(?i)\\bkiểu\\b", "style");
        text = text.replaceAll("(?i)\\bloại\\b", "type");
        text = text.replaceAll("(?i)\\bthương hiệu\\b", "brand");
        text = text.replaceAll("(?i)\\bgiá\\b", "price");
        text = text.replaceAll("(?i)\\bmới\\b", "new");
        text = text.replaceAll("(?i)\\bcũ\\b", "old");
        text = text.replaceAll("(?i)\\bđẹp\\b", "beautiful");
        text = text.replaceAll("(?i)\\btốt\\b", "good");
        text = text.replaceAll("(?i)\\bxấu\\b", "bad");
        text = text.replaceAll("(?i)\\brẻ\\b", "cheap");
        text = text.replaceAll("(?i)\\bđắt\\b", "expensive");
        text = text.replaceAll("(?i)\\bsale\\b", "sale");
        text = text.replaceAll("(?i)\\bgiảm giá\\b", "discount");
        text = text.replaceAll("(?i)\\bkhuyến mãi\\b", "promotion");
        text = text.replaceAll("(?i)\\bmiễn phí\\b", "free");
        text = text.replaceAll("(?i)\\bgiao hàng\\b", "delivery");
        text = text.replaceAll("(?i)\\btận nhà\\b", "to home");
        text = text.replaceAll("(?i)\\bnhanh\\b", "fast");
        text = text.replaceAll("(?i)\\bchậm\\b", "slow");
        
        return text;
    }
    
    /**
     * Translate category name
     */
    public String translateCategory(String categoryName, String targetLanguage) {
        return translate(categoryName, targetLanguage);
    }
    
    /**
     * Translate product name
     */
    public String translateProductName(String productName, String targetLanguage) {
        return translate(productName, targetLanguage);
    }
    
    /**
     * Translate description
     */
    public String translateDescription(String description, String targetLanguage) {
        return translate(description, targetLanguage);
    }
    
    /**
     * Translate entire product object
     */
    public Product translateProduct(Product product, String targetLanguage) {
        if (product == null || "vi".equals(targetLanguage)) {
            return product;
        }
        
        // Create a copy to avoid modifying the original
        Product translatedProduct = new Product();
        translatedProduct.setId(product.getId());
        translatedProduct.setImg(product.getImg());
        translatedProduct.setPrice(product.getPrice());
        translatedProduct.setBestSeller(product.isBestSeller());
        translatedProduct.setNewProduct(product.isNewProduct());
        translatedProduct.setFavorite(product.isFavorite());
        translatedProduct.setFeatured(product.isFeatured());
        translatedProduct.setInStock(product.isInStock());
        translatedProduct.setQuantity(product.getQuantity());
        translatedProduct.setSoldCount(product.getSoldCount());
        translatedProduct.setLikesCount(product.getLikesCount());
        translatedProduct.setSizes(product.getSizes());
        
        // Translate name and description
        translatedProduct.setName(translateProductName(product.getName(), targetLanguage));
        translatedProduct.setDes(translateDescription(product.getDes(), targetLanguage));
        
        // Translate category if present
        if (product.getCategory() != null) {
            Category originalCategory = product.getCategory();
            Category translatedCategory = new Category();
            translatedCategory.setId(originalCategory.getId());
            translatedCategory.setName(translateCategory(originalCategory.getName(), targetLanguage));
            translatedCategory.setProductCount(originalCategory.getProductCount());
            translatedProduct.setCategory(translatedCategory);
        }
        
        return translatedProduct;
    }
    
    /**
     * Translate list of products
     */
    public List<Product> translateProducts(List<Product> products, String targetLanguage) {
        if (products == null || "vi".equals(targetLanguage)) {
            return products;
        }
        
        return products.stream()
                .map(product -> translateProduct(product, targetLanguage))
                .collect(Collectors.toList());
    }
    
    /**
     * Translate list of categories
     */
    public List<Category> translateCategories(List<Category> categories, String targetLanguage) {
        if (categories == null || "vi".equals(targetLanguage)) {
            return categories;
        }
        
        return categories.stream()
                .map(category -> {
                    Category translatedCategory = new Category();
                    translatedCategory.setId(category.getId());
                    translatedCategory.setName(translateCategory(category.getName(), targetLanguage));
                    translatedCategory.setProductCount(category.getProductCount());
                    return translatedCategory;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Add or update a translation
     */
    public Translation saveTranslation(String sourceText, String targetLanguage, String translatedText, String category) {
        Optional<Translation> existing = translationRepository.findBySourceTextAndTargetLanguage(sourceText, targetLanguage);
        
        Translation translation;
        if (existing.isPresent()) {
            translation = existing.get();
            translation.setTranslatedText(translatedText);
            translation.setCategory(category);
        } else {
            translation = new Translation(sourceText, targetLanguage, translatedText, category);
        }
        
        return translationRepository.save(translation);
    }
    
    /**
     * Get all translations for a language
     */
    public List<Translation> getAllTranslations(String targetLanguage) {
        return translationRepository.findByTargetLanguage(targetLanguage);
    }
    
    /**
     * Get translations by category
     */
    public List<Translation> getTranslationsByCategory(String category, String targetLanguage) {
        return translationRepository.findByCategoryAndTargetLanguage(category, targetLanguage);
    }
    
    /**
     * Delete a translation
     */
    public void deleteTranslation(String sourceText, String targetLanguage) {
        translationRepository.deleteBySourceTextAndTargetLanguage(sourceText, targetLanguage);
    }
    
    /**
     * Check if translation exists
     */
    public boolean translationExists(String sourceText, String targetLanguage) {
        return translationRepository.existsBySourceTextAndTargetLanguage(sourceText, targetLanguage);
    }
} 