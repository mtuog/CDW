package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.*;
import com.example.BackEndSpring.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

/**
 * Service to automatically translate all text fields from database tables
 */
@Service
public class DatabaseContentTranslator {

    private final DatabaseTranslationService translationService;
    private final DataSource dataSource;
    private final ProductService productService;
    private final CategoryService categoryService;

    @Autowired
    public DatabaseContentTranslator(DatabaseTranslationService translationService, 
                                   DataSource dataSource,
                                   ProductService productService,
                                   CategoryService categoryService) {
        this.translationService = translationService;
        this.dataSource = dataSource;
        this.productService = productService;
        this.categoryService = categoryService;
    }

    /**
     * Translate all text content from database tables
     */
    @Transactional
    public Map<String, Integer> translateAllDatabaseContent(String targetLanguage) {
        System.out.println("=== TRANSLATING ALL DATABASE CONTENT TO " + targetLanguage + " ===");
        
        Map<String, Integer> results = new HashMap<>();
        
        // Translate products
        int productsTranslated = translateProducts(targetLanguage);
        results.put("products", productsTranslated);
        
        // Translate categories
        int categoriesTranslated = translateCategories(targetLanguage);
        results.put("categories", categoriesTranslated);
        
        // Translate other tables with text fields
        results.putAll(translateOtherTables(targetLanguage));
        
        System.out.println("=== DATABASE TRANSLATION COMPLETED ===");
        System.out.println("Results: " + results);
        
        return results;
    }
    
    /**
     * Translate all products and save translations - FULL CONTENT approach
     */
    private int translateProducts(String targetLanguage) {
        System.out.println("Translating products (FULL CONTENT)...");
        int count = 0;
        
        List<Product> products = productService.getAllProducts();
        for (Product product : products) {
            System.out.println("Processing product ID: " + product.getId());
            
            if (product.getName() != null) {
                // Translate and save FULL product name
                System.out.println("  - Translating product name: " + product.getName());
                String translatedName = translationService.translate(product.getName(), targetLanguage);
                saveTranslation(product.getName(), targetLanguage, translatedName, "PRODUCT");
                count++;
            }
            
            if (product.getDes() != null && !product.getDes().isEmpty()) {
                // Translate and save FULL product description
                System.out.println("  - Translating product description (" + product.getDes().length() + " chars)");
                String translatedDes = translationService.translate(product.getDes(), targetLanguage);
                saveTranslation(product.getDes(), targetLanguage, translatedDes, "DESCRIPTION");
                count++;
            }
        }
        
        System.out.println("✅ Translated " + count + " product fields (FULL CONTENT)");
        return count;
    }
    
    /**
     * Translate all categories and save translations - FULL CONTENT approach
     */
    private int translateCategories(String targetLanguage) {
        System.out.println("Translating categories (FULL CONTENT)...");
        int count = 0;
        
        List<Category> categories = categoryService.getAllCategories();
        for (Category category : categories) {
            System.out.println("Processing category ID: " + category.getId());
            
            if (category.getName() != null) {
                // Translate and save FULL category name
                System.out.println("  - Translating category name: " + category.getName());
                String translatedName = translationService.translate(category.getName(), targetLanguage);
                saveTranslation(category.getName(), targetLanguage, translatedName, "CATEGORY");
                count++;
            }
        }
        
        System.out.println("✅ Translated " + count + " category fields (FULL CONTENT)");
        return count;
    }
    
    /**
     * Translate text fields from other tables using JDBC
     */
    private Map<String, Integer> translateOtherTables(String targetLanguage) {
        Map<String, Integer> results = new HashMap<>();
        
        // Tables and their text columns to translate
        Map<String, List<String>> tablesToTranslate = new HashMap<>();
        tablesToTranslate.put("users", Arrays.asList("username", "full_name", "address"));
        tablesToTranslate.put("orders", Arrays.asList("shipping_address", "note"));
        tablesToTranslate.put("reviews", Arrays.asList("content"));
        
        for (Map.Entry<String, List<String>> entry : tablesToTranslate.entrySet()) {
            String tableName = entry.getKey();
            List<String> columns = entry.getValue();
            
            try {
                int count = translateTableColumns(tableName, columns, targetLanguage);
                results.put(tableName, count);
            } catch (Exception e) {
                System.err.println("Error translating table " + tableName + ": " + e.getMessage());
                results.put(tableName, 0);
            }
        }
        
        return results;
    }
    
    /**
     * Translate columns in a specific table - FULL CONTENT approach
     */
    private int translateTableColumns(String tableName, List<String> columns, String targetLanguage) {
        System.out.println("Translating table: " + tableName + ", columns: " + columns + " (FULL CONTENT)");
        int count = 0;
        
        try (Connection conn = dataSource.getConnection()) {
            // Check if table exists
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet tables = meta.getTables(null, null, tableName, null);
            
            if (!tables.next()) {
                System.out.println("Table " + tableName + " does not exist, skipping");
                return 0;
            }
            
            // Get all rows
            try (Statement stmt = conn.createStatement()) {
                ResultSet rs = stmt.executeQuery("SELECT * FROM " + tableName);
                
                while (rs.next()) {
                    long id = rs.getLong("id");
                    System.out.println("Processing " + tableName + " ID: " + id);
                    
                    // Translate each text column - FULL CONTENT
                    for (String column : columns) {
                        try {
                            String text = rs.getString(column);
                            if (text != null && !text.isEmpty()) {
                                System.out.println("  - Translating " + column + " (" + text.length() + " chars)");
                                
                                // Translate and save FULL content
                                String translatedText = translationService.translate(text, targetLanguage);
                                saveTranslation(text, targetLanguage, translatedText, tableName.toUpperCase() + "_" + column.toUpperCase());
                                count++;
                            }
                        } catch (SQLException e) {
                            System.out.println("Column " + column + " not found in " + tableName + ", skipping");
                        }
                    }
                }
            }
            
        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("✅ Translated " + count + " fields in " + tableName + " (FULL CONTENT)");
        return count;
    }
    
    /**
     * Save FULL CONTENT translation to database if it doesn't exist
     */
    private void saveTranslation(String sourceText, String targetLanguage, String translatedText, String category) {
        // Skip if source and translated are the same
        if (sourceText.equals(translatedText)) {
            return;
        }
        
        // Skip if translation already exists
        if (!translationService.translationExists(sourceText, targetLanguage)) {
            System.out.println("📝 Saving FULL CONTENT translation for category: " + category);
            System.out.println("   - Source length: " + sourceText.length() + " chars");
            System.out.println("   - Target length: " + translatedText.length() + " chars");
            
            // Always save the ENTIRE content, not just patterns
            translationService.saveTranslation(sourceText, targetLanguage, translatedText, category);
        }
    }
} 