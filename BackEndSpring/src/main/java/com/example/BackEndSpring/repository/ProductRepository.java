package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.Category;
import com.example.BackEndSpring.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(Category category);
    List<Product> findByBestSellerTrue();
    List<Product> findByNewProductTrue();
    List<Product> findByFavoriteTrue();
    List<Product> findByInStockTrue();
    List<Product> findByInStockFalse();
    List<Product> findByCategoryAndInStockTrue(Category category);
    
    // Đếm số lượng sản phẩm theo danh mục
    Long countByCategory(Category category);
    
    // Đếm số lượng sản phẩm theo danh mục ID
    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :categoryId")
    Long countByCategoryId(@Param("categoryId") Long categoryId);

    // Tìm tất cả sản phẩm sắp xếp theo số lượng đã bán (soldCount) giảm dần
    @Query("SELECT p FROM Product p ORDER BY p.soldCount DESC")
    List<Product> findAllOrderBySoldCountDesc();
    
    // Tìm sản phẩm nổi bật
    List<Product> findByFeaturedTrue();
    
    // Cập nhật trạng thái favorite trực tiếp bằng SQL
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.favorite = :favoriteValue WHERE p.id = :productId")
    void updateFavoriteStatus(@Param("productId") Long productId, @Param("favoriteValue") boolean favoriteValue);
    
    // Tăng giá trị likesCount lên 1
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.likesCount = p.likesCount + 1 WHERE p.id = :productId")
    void incrementLikesCount(@Param("productId") Long productId);
    
    // Giảm giá trị likesCount đi 1
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.likesCount = CASE WHEN p.likesCount > 0 THEN p.likesCount - 1 ELSE 0 END WHERE p.id = :productId")
    void decrementLikesCount(@Param("productId") Long productId);
} 