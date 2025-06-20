package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.Category;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductTranslationService {
    
    // Từ điển dịch cho categories
    private final Map<String, Map<String, String>> categoryTranslations = new HashMap<>();
    
    // Từ điển dịch cho product names patterns
    private final Map<String, Map<String, String>> productNameTranslations = new HashMap<>();
    
    // Từ điển dịch cho descriptions patterns
    private final Map<String, Map<String, String>> descriptionTranslations = new HashMap<>();
    
    public ProductTranslationService() {
        initializeTranslations();
    }
    
    private void initializeTranslations() {
        // Category translations - Vietnamese
        Map<String, String> viCategories = new HashMap<>();
        viCategories.put("Áo sơ mi", "Áo sơ mi");
        viCategories.put("Áo vest", "Áo vest");
        viCategories.put("Quần tây", "Quần tây");
        viCategories.put("Áo khoác", "Áo khoác");
        viCategories.put("Phụ kiện", "Phụ kiện");
        viCategories.put("Giày dép", "Giày dép");
        viCategories.put("Đồng phục công sở", "Đồng phục công sở");
        viCategories.put("Đồng phục học sinh", "Đồng phục học sinh");
        categoryTranslations.put("vi", viCategories);
        
        // Category translations - English
        Map<String, String> enCategories = new HashMap<>();
        enCategories.put("Áo sơ mi", "Shirts");
        enCategories.put("Áo vest", "Suits");
        enCategories.put("Quần tây", "Trousers");
        enCategories.put("Áo khoác", "Jackets");
        enCategories.put("Phụ kiện", "Accessories");
        enCategories.put("Giày dép", "Shoes");
        enCategories.put("Đồng phục công sở", "Office Uniforms");
        enCategories.put("Đồng phục học sinh", "School Uniforms");
        categoryTranslations.put("en", enCategories);
        
        // Product name translations - Vietnamese
        Map<String, String> viProducts = new HashMap<>();
        viProducts.put("Áo sơ mi", "Áo sơ mi");
        viProducts.put("Áo vest", "Áo vest");
        viProducts.put("Quần tây", "Quần tây");
        viProducts.put("Áo khoác", "Áo khoác");
        viProducts.put("Cặp táp", "Cặp táp");
        viProducts.put("Giày", "Giày");
        viProducts.put("nam", "nam");
        viProducts.put("nữ", "nữ");
        viProducts.put("trắng", "trắng");
        viProducts.put("đen", "đen");
        viProducts.put("xanh", "xanh");
        viProducts.put("đỏ", "đỏ");
        viProducts.put("cao cấp", "cao cấp");
        viProducts.put("thường", "thường");
        viProducts.put("công sở", "công sở");
        viProducts.put("học sinh", "học sinh");
        productNameTranslations.put("vi", viProducts);
        
        // Product name translations - English
        Map<String, String> enProducts = new HashMap<>();
        enProducts.put("Áo sơ mi", "Shirt");
        enProducts.put("Áo vest", "Suit");
        enProducts.put("Quần tây", "Trousers");
        enProducts.put("Áo khoác", "Jacket");
        enProducts.put("Cặp táp", "Briefcase");
        enProducts.put("Giày", "Shoes");
        enProducts.put("nam", "Men's");
        enProducts.put("nữ", "Women's");
        enProducts.put("trắng", "White");
        enProducts.put("đen", "Black");
        enProducts.put("xanh", "Blue");
        enProducts.put("đỏ", "Red");
        enProducts.put("cao cấp", "Premium");
        enProducts.put("thường", "Regular");
        enProducts.put("công sở", "Office");
        enProducts.put("học sinh", "Student");
        productNameTranslations.put("en", enProducts);
        
        // Description translations - Vietnamese
        Map<String, String> viDescriptions = new HashMap<>();
        viDescriptions.put("Thiết kế hiện đại", "Thiết kế hiện đại");
        viDescriptions.put("Chất liệu cao cấp", "Chất liệu cao cấp");
        viDescriptions.put("Phù hợp cho", "Phù hợp cho");
        viDescriptions.put("Màu sắc", "Màu sắc");
        viDescriptions.put("Kích thước", "Kích thước");
        viDescriptions.put("Thương hiệu", "Thương hiệu");
        viDescriptions.put("Xuất xứ", "Xuất xứ");
        viDescriptions.put("Việt Nam", "Việt Nam");
        viDescriptions.put("cotton", "cotton");
        viDescriptions.put("polyester", "polyester");
        viDescriptions.put("dễ giặt", "dễ giặt");
        viDescriptions.put("không nhăn", "không nhăn");
        viDescriptions.put("thoáng mát", "thoáng mát");
        viDescriptions.put("co giãn", "co giãn");
        viDescriptions.put("bền đẹp", "bền đẹp");
        descriptionTranslations.put("vi", viDescriptions);
        
        // Description translations - English
        Map<String, String> enDescriptions = new HashMap<>();
        enDescriptions.put("Thiết kế hiện đại", "Modern design");
        enDescriptions.put("Chất liệu cao cấp", "Premium material");
        enDescriptions.put("Phù hợp cho", "Suitable for");
        enDescriptions.put("Màu sắc", "Color");
        enDescriptions.put("Kích thước", "Size");
        enDescriptions.put("Thương hiệu", "Brand");
        enDescriptions.put("Xuất xứ", "Origin");
        enDescriptions.put("Việt Nam", "Vietnam");
        enDescriptions.put("cotton", "cotton");
        enDescriptions.put("polyester", "polyester");
        enDescriptions.put("dễ giặt", "easy care");
        enDescriptions.put("không nhăn", "wrinkle-free");
        enDescriptions.put("thoáng mát", "breathable");
        enDescriptions.put("co giãn", "stretchable");
        enDescriptions.put("bền đẹp", "durable");
        descriptionTranslations.put("en", enDescriptions);
    }
    
    /**
     * Translate category name
     */
    public String translateCategory(String categoryName, String targetLanguage) {
        System.out.println("=== TRANSLATE CATEGORY DEBUG ===");
        System.out.println("Input: '" + categoryName + "', Target: '" + targetLanguage + "'");
        
        if (categoryName == null || "vi".equals(targetLanguage)) {
            System.out.println("No translation needed, returning: " + categoryName);
            return categoryName;
        }
        
        Map<String, String> translations = categoryTranslations.get(targetLanguage);
        String result = translations != null ? translations.getOrDefault(categoryName, categoryName) : categoryName;
        
        System.out.println("Available translations: " + translations);
        System.out.println("Result: '" + result + "'");
        System.out.println("=================================");
        
        return result;
    }
    
    /**
     * Translate product name using pattern matching
     */
    public String translateProductName(String productName, String targetLanguage) {
        if (productName == null || "vi".equals(targetLanguage)) {
            return productName;
        }
        
        String translatedName = productName;
        Map<String, String> translations = productNameTranslations.get(targetLanguage);
        
        if (translations != null) {
            // Apply translations for common patterns
            for (Map.Entry<String, String> entry : translations.entrySet()) {
                String viTerm = entry.getKey();
                String enTerm = entry.getValue();
                // Use word boundary regex for better matching
                translatedName = translatedName.replaceAll("\\b" + viTerm + "\\b", enTerm);
            }
        }
        
        return translatedName;
    }
    
    /**
     * Translate product description using pattern matching
     */
    public String translateDescription(String description, String targetLanguage) {
        if (description == null || "vi".equals(targetLanguage)) {
            return description;
        }
        
        String translatedDesc = description;
        Map<String, String> translations = descriptionTranslations.get(targetLanguage);
        
        if (translations != null) {
            // Apply translations for common patterns
            for (Map.Entry<String, String> entry : translations.entrySet()) {
                String viTerm = entry.getKey();
                String enTerm = entry.getValue();
                translatedDesc = translatedDesc.replaceAll("\\b" + viTerm + "\\b", enTerm);
            }
        }
        
        return translatedDesc;
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
} 