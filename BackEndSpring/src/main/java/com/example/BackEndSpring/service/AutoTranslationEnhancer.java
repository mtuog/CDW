package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

@Service
public class AutoTranslationEnhancer {
    
    private final DatabaseTranslationService translationService;
    private final ProductService productService;
    private final CategoryService categoryService;
    
    @Autowired
    public AutoTranslationEnhancer(DatabaseTranslationService translationService, 
                                 ProductService productService,
                                 CategoryService categoryService) {
        this.translationService = translationService;
        this.productService = productService;
        this.categoryService = categoryService;
    }
    
    /**
     * Analyze existing product/category data and auto-generate translations
     */
    public void enhanceTranslationsFromData() {
        System.out.println("=== AUTO-ENHANCING TRANSLATIONS ===");
        
        // Get all products and categories
        List<Product> products = productService.getAllProducts();
        List<Category> categories = categoryService.getAllCategories();
        
        Set<String> uniqueWords = new HashSet<>();
        Set<String> uniquePhrases = new HashSet<>();
        
        // Extract words from categories
        for (Category category : categories) {
            if (category.getName() != null) {
                extractWordsAndPhrases(category.getName(), uniqueWords, uniquePhrases);
            }
        }
        
        // Extract words from products
        for (Product product : products) {
            if (product.getName() != null) {
                extractWordsAndPhrases(product.getName(), uniqueWords, uniquePhrases);
            }
            if (product.getDes() != null) {
                extractWordsAndPhrases(product.getDes(), uniqueWords, uniquePhrases);
            }
        }
        
        // Auto-create translations for common patterns
        createAutoTranslations(uniqueWords, uniquePhrases);
        
        System.out.println("✅ Auto-enhancement completed!");
        System.out.println("=====================================");
    }
    
    /**
     * Extract Vietnamese words and phrases from text
     */
    private void extractWordsAndPhrases(String text, Set<String> words, Set<String> phrases) {
        if (text == null || text.trim().isEmpty()) return;
        
        // Extract individual words
        String[] wordArray = text.toLowerCase().split("\\s+");
        for (String word : wordArray) {
            word = word.replaceAll("[^a-zA-ZÀ-ỹ]", "").trim();
            if (word.length() > 1 && isVietnamese(word)) {
                words.add(word);
            }
        }
        
        // Extract 2-word phrases
        for (int i = 0; i < wordArray.length - 1; i++) {
            String phrase = (wordArray[i] + " " + wordArray[i + 1]).replaceAll("[^a-zA-ZÀ-ỹ\\s]", "").trim();
            if (phrase.length() > 3 && isVietnamese(phrase)) {
                phrases.add(phrase);
            }
        }
    }
    
    /**
     * Check if text contains Vietnamese characters
     */
    private boolean isVietnamese(String text) {
        return text.matches(".*[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ].*");
    }
    
    /**
     * Create auto-translations for extracted words and phrases
     */
    private void createAutoTranslations(Set<String> words, Set<String> phrases) {
        int addedCount = 0;
        
        // Auto-translate common Vietnamese words that we recognize
        for (String word : words) {
            String translation = getAutoTranslation(word);
            if (translation != null && !translationService.translationExists(word, "en")) {
                translationService.saveTranslation(word, "en", translation, "PRODUCT_PATTERN");
                addedCount++;
                System.out.println("Auto-added: '" + word + "' -> '" + translation + "'");
            }
        }
        
        // Auto-translate phrases
        for (String phrase : phrases) {
            String translation = getAutoTranslation(phrase);
            if (translation != null && !translationService.translationExists(phrase, "en")) {
                translationService.saveTranslation(phrase, "en", translation, "PRODUCT_PATTERN");
                addedCount++;
                System.out.println("Auto-added phrase: '" + phrase + "' -> '" + translation + "'");
            }
        }
        
        System.out.println("Auto-added " + addedCount + " new translations");
    }
    
    /**
     * Get automatic translation for Vietnamese words
     */
    private String getAutoTranslation(String vietnamese) {
        vietnamese = vietnamese.toLowerCase().trim();
        
        // Common clothing terms
        switch (vietnamese) {
            // Basic clothing
            case "áo": return "shirt";
            case "quần": return "pants";
            case "váy": return "dress";
            case "giày": return "shoes";
            case "mũ": return "hat";
            case "đầm": return "dress";
            case "vest": return "vest";
            case "suit": return "suit";
            
            // Types
            case "polo": return "polo";
            case "hoodie": return "hoodie";
            case "sweater": return "sweater";
            case "cardigan": return "cardigan";
            case "tank top": return "tank top";
            case "crop top": return "crop top";
            
            // Colors
            case "đỏ": return "red";
            case "xanh": return "blue";
            case "vàng": return "yellow";
            case "xanh lá": return "green";
            case "tím": return "purple";
            case "cam": return "orange";
            case "hồng": return "pink";
            case "nâu": return "brown";
            case "xám": return "gray";
            case "be": return "beige";
            
            // Sizes
            case "s": return "S";
            case "m": return "M";
            case "l": return "L";
            case "xl": return "XL";
            case "xxl": return "XXL";
            
            // Genders
            case "nam": return "men's";
            case "nữ": return "women's";
            case "unisex": return "unisex";
            
            // Materials
            case "cotton": return "cotton";
            case "polyester": return "polyester";
            case "lụa": return "silk";
            case "len": return "wool";
            case "da": return "leather";
            case "vải": return "fabric";
            
            // Common adjectives
            case "mới": return "new";
            case "cũ": return "old";
            case "đẹp": return "beautiful";
            case "tốt": return "good";
            case "cao cấp": return "premium";
            case "sang trọng": return "luxury";
            case "thời trang": return "fashion";
            case "hiện đại": return "modern";
            case "cổ điển": return "classic";
            case "vintage": return "vintage";
            case "casual": return "casual";
            case "formal": return "formal";
            case "sporty": return "sporty";
            
            // Common phrases
            case "chất lượng": return "quality";
            case "phong cách": return "style";
            case "thiết kế": return "design";
            case "thương hiệu": return "brand";
            case "xuất xứ": return "origin";
            case "sản xuất": return "manufactured";
            case "made in": return "made in";
            
            default:
                return null;
        }
    }
} 