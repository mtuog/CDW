package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.ProductSize;
import com.example.BackEndSpring.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductSizeRepository extends JpaRepository<ProductSize, Long> {
    
    List<ProductSize> findByProduct(Product product);
    
    List<ProductSize> findByProductId(Long productId);
    
    Optional<ProductSize> findByProductAndSize(Product product, String size);
    
    Optional<ProductSize> findByProductIdAndSize(Long productId, String size);
    
    void deleteByProductId(Long productId);
} 