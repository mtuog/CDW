package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.Category;
import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.ProductSize;
import com.example.BackEndSpring.repository.ProductRepository;
import com.example.BackEndSpring.repository.ProductSizeRepository;
import com.example.BackEndSpring.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final WishlistRepository wishlistRepository;
    private final ProductSizeRepository productSizeRepository;

    @Autowired
    public ProductService(ProductRepository productRepository, CategoryService categoryService, 
                        WishlistRepository wishlistRepository, ProductSizeRepository productSizeRepository) {
        this.productRepository = productRepository;
        this.categoryService = categoryService;
        this.wishlistRepository = wishlistRepository;
        this.productSizeRepository = productSizeRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByCategory(String categoryName) {
        Category category = categoryService.getCategoryByName(categoryName);
        return productRepository.findByCategory(category);
    }

    public List<Product> getProductsInStockByCategory(String categoryName) {
        Category category = categoryService.getCategoryByName(categoryName);
        return productRepository.findByCategoryAndInStockTrue(category);
    }

    public List<Product> getBestSellerProducts() {
        return productRepository.findByBestSellerTrue();
    }

    public List<Product> getNewProducts() {
        return productRepository.findByNewProductTrue();
    }

    public List<Product> getFavoriteProducts() {
        return productRepository.findByFavoriteTrue();
    }

    public List<Product> getTopSellingProducts(int limit) {
        List<Product> topSellingProducts = productRepository.findAllOrderBySoldCountDesc()
                .stream()
                .limit(limit)
                .toList();
        
        // Cập nhật trạng thái bestSeller cho các sản phẩm
        for (Product product : topSellingProducts) {
            product.setBestSeller(true);
            productRepository.save(product);
        }
        
        return topSellingProducts;
    }

    public List<Product> getFeaturedProducts() {
        // Lấy 10 sản phẩm được thêm vào wishlist nhiều nhất
        org.springframework.data.domain.Pageable topTen = org.springframework.data.domain.PageRequest.of(0, 10);
        List<Object[]> mostWishlistedProducts = wishlistRepository.findMostWishlistedProducts(topTen);
        
        if (mostWishlistedProducts.isEmpty()) {
            // Nếu không có sản phẩm nào trong wishlist, trả về danh sách trống
            return new ArrayList<>();
        }
        
        // Chuyển đổi kết quả từ Object[] thành danh sách sản phẩm
        List<Product> products = new ArrayList<>();
        for (Object[] result : mostWishlistedProducts) {
            Product product = (Product) result[0];
            Long wishlistCount = (Long) result[1];
            
            // Cập nhật trạng thái featured và likesCount cho sản phẩm
            product.setFeatured(true);
            product.setLikesCount(wishlistCount.intValue());
            productRepository.save(product);
            
            products.add(product);
        }
        
        return products;
    }

    public List<Product> getInStockProducts() {
        return productRepository.findByInStockTrue();
    }

    public List<Product> getOutOfStockProducts() {
        return productRepository.findByInStockFalse();
    }

    public boolean updateProductStock(Long productId, boolean inStock) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            product.setInStock(inStock);
            if (!inStock) {
                product.setQuantity(0);
            }
            productRepository.save(product);
            return true;
        }
        return false;
    }

    public boolean updateProductQuantity(Long productId, int quantity) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            product.setQuantity(quantity);
            product.setInStock(quantity > 0);
            productRepository.save(product);
            return true;
        }
        return false;
    }

    public Long countProductsByCategory(Category category) {
        return productRepository.countByCategory(category);
    }
    
    public Long countProductsByCategoryId(Long categoryId) {
        return productRepository.countByCategoryId(categoryId);
    }

    public Product saveProduct(Product product) {
        try {
            // Đảm bảo các giá trị mặc định cho sản phẩm mới
            if (product.getLikesCount() == null) {
                product.setLikesCount(0);
            }
            
            // Đảm bảo tính nhất quán giữa inStock và quantity
            product.setInStock(product.getQuantity() > 0);
            
            // Nếu sản phẩm có các size, cập nhật lại tổng số lượng 
            if (product.getSizes() != null && !product.getSizes().isEmpty()) {
                int totalQuantity = product.updateTotalQuantity();
                System.out.println("Saving product " + (product.getId() != null ? product.getId() : "new") + 
                                   " with total quantity: " + totalQuantity);
            } else {
                System.out.println("Product has no sizes. Setting inStock based on quantity: " + product.getQuantity());
            }
            
            // Lưu sản phẩm vào database
            return productRepository.save(product);
        } catch (Exception e) {
            System.err.println("Error saving product: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Giảm số lượng tồn kho của sản phẩm khi đặt hàng
     * @param productId ID của sản phẩm
     * @param quantity Số lượng cần giảm
     * @param size Kích thước sản phẩm (có thể null nếu sản phẩm không có size)
     * @return true nếu cập nhật thành công, false nếu thất bại
     */
    @Transactional
    public boolean decreaseStock(Long productId, int quantity, String size) {
        try {
            System.out.println("====== DECREASE STOCK ======");
            System.out.println("Product ID: " + productId);
            System.out.println("Quantity: " + quantity);
            System.out.println("Size: " + size);
            
            if (size != null && !size.isEmpty()) {
                // Nếu có size cụ thể, giảm số lượng của size đó
                Optional<ProductSize> productSizeOpt = productSizeRepository.findByProductIdAndSize(productId, size);
                if (productSizeOpt.isPresent()) {
                    ProductSize productSize = productSizeOpt.get();
                    System.out.println("Found product size. Current quantity: " + productSize.getQuantity());
                    int newQuantity = Math.max(0, productSize.getQuantity() - quantity);
                    productSize.setQuantity(newQuantity);
                    productSizeRepository.save(productSize);
                    System.out.println("Updated size quantity to: " + newQuantity);
                    
                    // Cập nhật tổng số lượng của sản phẩm
                    Product product = productSize.getProduct();
                    product.updateTotalQuantity();
                    productRepository.save(product);
                    System.out.println("Updated total product quantity: " + product.getQuantity());
                    return true;
                }
                System.out.println("Product size not found for productId: " + productId + " and size: " + size);
                return false;
            } else {
                // Nếu không có size, giảm trực tiếp số lượng sản phẩm
                Optional<Product> productOpt = productRepository.findById(productId);
                if (productOpt.isPresent()) {
                    Product product = productOpt.get();
                    System.out.println("Found product. Current quantity: " + product.getQuantity());
                    int newQuantity = Math.max(0, product.getQuantity() - quantity);
                    product.setQuantity(newQuantity);
                    product.setInStock(newQuantity > 0);
                    productRepository.save(product);
                    System.out.println("Updated product quantity to: " + newQuantity);
                    return true;
                }
                System.out.println("Product not found with ID: " + productId);
                return false;
            }
        } catch (Exception e) {
            System.err.println("Error decreasing stock: " + e.getMessage());
            e.printStackTrace();
            return false;
        } finally {
            System.out.println("====== END DECREASE STOCK ======");
        }
    }
    
    /**
     * Tăng số lượng tồn kho của sản phẩm khi hủy đơn hàng
     * @param productId ID của sản phẩm
     * @param quantity Số lượng cần tăng
     * @param size Kích thước sản phẩm (có thể null nếu sản phẩm không có size)
     * @return true nếu cập nhật thành công, false nếu thất bại
     */
    @Transactional
    public boolean increaseStock(Long productId, int quantity, String size) {
        try {
            if (size != null && !size.isEmpty()) {
                // Nếu có size cụ thể, tăng số lượng của size đó
                Optional<ProductSize> productSizeOpt = productSizeRepository.findByProductIdAndSize(productId, size);
                if (productSizeOpt.isPresent()) {
                    ProductSize productSize = productSizeOpt.get();
                    productSize.setQuantity(productSize.getQuantity() + quantity);
                    productSizeRepository.save(productSize);
                    
                    // Cập nhật tổng số lượng của sản phẩm
                    Product product = productSize.getProduct();
                    product.updateTotalQuantity();
                    productRepository.save(product);
                    return true;
                }
                return false;
            } else {
                // Nếu không có size, tăng trực tiếp số lượng sản phẩm
                Optional<Product> productOpt = productRepository.findById(productId);
                if (productOpt.isPresent()) {
                    Product product = productOpt.get();
                    product.setQuantity(product.getQuantity() + quantity);
                    product.setInStock(product.getQuantity() > 0);
                    productRepository.save(product);
                    return true;
                }
                return false;
            }
        } catch (Exception e) {
            System.err.println("Error increasing stock: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
    
    /**
     * Cập nhật trạng thái yêu thích của sản phẩm trực tiếp bằng SQL
     * @param productId ID của sản phẩm cần cập nhật
     * @param favorite trạng thái yêu thích mới (true/false)
     */
    public void directUpdateFavorite(Long productId, boolean favorite) {
        // Sử dụng repository để cập nhật trực tiếp
        productRepository.updateFavoriteStatus(productId, favorite);
    }
    
    /**
     * Tăng số lượng lượt thích của sản phẩm lên 1
     * @param productId ID của sản phẩm cần tăng lượt thích
     */
    public void incrementLikesCount(Long productId) {
        productRepository.incrementLikesCount(productId);
        System.out.println("Increased likes count for product: " + productId);
    }
    
    /**
     * Giảm số lượng lượt thích của sản phẩm đi 1
     * @param productId ID của sản phẩm cần giảm lượt thích
     */
    public void decrementLikesCount(Long productId) {
        productRepository.decrementLikesCount(productId);
        System.out.println("Decreased likes count for product: " + productId);
    }
} 