package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.ProductSize;
import com.example.BackEndSpring.repository.ProductRepository;
import com.example.BackEndSpring.repository.ProductSizeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductSizeService {

    private final ProductSizeRepository productSizeRepository;
    private final ProductRepository productRepository;

    @Autowired
    public ProductSizeService(ProductSizeRepository productSizeRepository, ProductRepository productRepository) {
        this.productSizeRepository = productSizeRepository;
        this.productRepository = productRepository;
    }

    /**
     * Lấy tất cả kích thước của một sản phẩm
     */
    public List<ProductSize> getSizesByProductId(Long productId) {
        return productSizeRepository.findByProductId(productId);
    }

    /**
     * Lấy thông tin kích thước cụ thể của một sản phẩm
     */
    public Optional<ProductSize> getSizeByProductAndSize(Long productId, String size) {
        return productSizeRepository.findByProductIdAndSize(productId, size);
    }

    /**
     * Thêm hoặc cập nhật kích thước cho sản phẩm
     */
    @Transactional
    public ProductSize saveProductSize(Long productId, ProductSize productSize) {
        try {
            System.out.println("Saving size " + productSize.getSize() + " for product ID: " + productId);
            
            // Tìm sản phẩm
            Optional<Product> productOpt = productRepository.findById(productId);
            if (!productOpt.isPresent()) {
                System.err.println("Product not found with ID: " + productId);
                throw new RuntimeException("Không tìm thấy sản phẩm với ID: " + productId);
            }

            Product product = productOpt.get();
            System.out.println("Found product: " + product.getName());
            productSize.setProduct(product);

            // Kiểm tra xem size này đã tồn tại cho sản phẩm chưa
            Optional<ProductSize> existingSizeOpt = productSizeRepository.findByProductIdAndSize(productId, productSize.getSize());
            
            ProductSize savedSize;
            if (existingSizeOpt.isPresent()) {
                // Nếu size đã tồn tại, cập nhật thông tin
                ProductSize existingSize = existingSizeOpt.get();
                System.out.println("Updating existing size: " + existingSize.getSize());
                existingSize.setQuantity(productSize.getQuantity());
                existingSize.setActive(productSize.isActive());
                savedSize = productSizeRepository.save(existingSize);
            } else {
                // Nếu size chưa tồn tại, tạo mới
                System.out.println("Creating new size: " + productSize.getSize());
                savedSize = productSizeRepository.save(productSize);
            }

            // Cập nhật tổng số lượng của sản phẩm
            product.updateTotalQuantity();
            productRepository.save(product);
            System.out.println("Updated product total quantity: " + product.getQuantity());

            return savedSize;
        } catch (Exception e) {
            System.err.println("Error in saveProductSize: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Lưu nhiều kích thước cho sản phẩm
     */
    @Transactional
    public List<ProductSize> saveProductSizes(Long productId, List<ProductSize> sizes) {
        // Tìm sản phẩm
        Optional<Product> productOpt = productRepository.findById(productId);
        if (!productOpt.isPresent()) {
            throw new RuntimeException("Không tìm thấy sản phẩm với ID: " + productId);
        }

        Product product = productOpt.get();

        // Xóa kích thước cũ
        productSizeRepository.deleteByProductId(productId);

        // Thêm kích thước mới
        List<ProductSize> savedSizes = new ArrayList<>();
        for (ProductSize size : sizes) {
            size.setProduct(product);
            savedSizes.add(productSizeRepository.save(size));
        }

        // Cập nhật tổng số lượng của sản phẩm
        product.updateTotalQuantity();
        productRepository.save(product);

        return savedSizes;
    }

    /**
     * Cập nhật số lượng cho một kích thước
     */
    @Transactional
    public boolean updateSizeQuantity(Long sizeId, int quantity) {
        Optional<ProductSize> sizeOpt = productSizeRepository.findById(sizeId);
        if (!sizeOpt.isPresent()) {
            return false;
        }

        ProductSize size = sizeOpt.get();
        size.setQuantity(quantity);
        productSizeRepository.save(size);

        // Cập nhật tổng số lượng của sản phẩm
        Product product = size.getProduct();
        product.updateTotalQuantity();
        productRepository.save(product);

        return true;
    }

    /**
     * Xóa một kích thước
     */
    @Transactional
    public boolean deleteSize(Long sizeId) {
        Optional<ProductSize> sizeOpt = productSizeRepository.findById(sizeId);
        if (!sizeOpt.isPresent()) {
            return false;
        }

        ProductSize size = sizeOpt.get();
        Product product = size.getProduct();

        productSizeRepository.delete(size);

        // Cập nhật tổng số lượng của sản phẩm
        product.updateTotalQuantity();
        productRepository.save(product);

        return true;
    }
} 