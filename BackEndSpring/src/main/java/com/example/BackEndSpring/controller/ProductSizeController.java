package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.ProductSize;
import com.example.BackEndSpring.service.ProductSizeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true",
        allowedHeaders = {"authorization", "content-type", "x-auth-token", "origin", "x-requested-with", "accept"},
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/products")
public class ProductSizeController {

    private final ProductSizeService productSizeService;

    @Autowired
    public ProductSizeController(ProductSizeService productSizeService) {
        this.productSizeService = productSizeService;
    }

    /**
     * Lấy tất cả kích thước của một sản phẩm
     */
    @GetMapping("/{productId}/sizes")
    public ResponseEntity<List<ProductSize>> getProductSizes(@PathVariable Long productId) {
        List<ProductSize> sizes = productSizeService.getSizesByProductId(productId);
        return ResponseEntity.ok(sizes);
    }

    /**
     * Lấy thông tin kích thước cụ thể của một sản phẩm
     */
    @GetMapping("/{productId}/sizes/{size}")
    public ResponseEntity<ProductSize> getProductSizeByName(@PathVariable Long productId, @PathVariable String size) {
        Optional<ProductSize> productSizeOpt = productSizeService.getSizeByProductAndSize(productId, size);
        return productSizeOpt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Thêm kích thước mới cho sản phẩm
     */
    @PostMapping(
        value = "/{productId}/sizes",
        consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE, 
        produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ProductSize> addProductSize(@PathVariable Long productId, @RequestBody ProductSize productSize) {
        try {
            System.out.println("Received request to add size to product ID: " + productId);
            System.out.println("Size data: " + productSize.getSize() + ", quantity: " + productSize.getQuantity());
            
            ProductSize savedSize = productSizeService.saveProductSize(productId, productSize);
            return new ResponseEntity<>(savedSize, HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("Error adding size to product " + productId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Cập nhật nhiều kích thước cùng lúc cho một sản phẩm
     */
    @PostMapping(
        value = "/{productId}/sizes/batch",
        consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE, 
        produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<List<ProductSize>> addProductSizes(@PathVariable Long productId, @RequestBody List<ProductSize> sizes) {
        try {
            // Xử lý từng size một thay vì sử dụng batch để tránh lỗi
            List<ProductSize> savedSizes = new ArrayList<>();
            for (ProductSize size : sizes) {
                ProductSize savedSize = productSizeService.saveProductSize(productId, size);
                savedSizes.add(savedSize);
            }
            return new ResponseEntity<>(savedSizes, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cập nhật thông tin kích thước
     */
    @PutMapping(
        value = "/sizes/{sizeId}",
        consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE, 
        produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ProductSize> updateProductSize(@PathVariable Long sizeId, @RequestBody ProductSize productSize) {
        try {
            // Đảm bảo ID trùng khớp
            productSize.setId(sizeId);
            
            // Lấy product ID từ size hiện tại
            Optional<ProductSize> existingSize = productSizeService.getSizeByProductAndSize(
                    productSize.getProduct().getId(), productSize.getSize());
            
            if (!existingSize.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            ProductSize savedSize = productSizeService.saveProductSize(
                    existingSize.get().getProduct().getId(), productSize);
            
            return ResponseEntity.ok(savedSize);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cập nhật số lượng cho một kích thước
     */
    @PutMapping(
        value = "/sizes/{sizeId}/quantity",
        produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Void> updateSizeQuantity(@PathVariable Long sizeId, @RequestParam int quantity) {
        boolean updated = productSizeService.updateSizeQuantity(sizeId, quantity);
        if (updated) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Xóa một kích thước
     */
    @DeleteMapping("/sizes/{sizeId}")
    public ResponseEntity<Void> deleteSize(@PathVariable Long sizeId) {
        boolean deleted = productSizeService.deleteSize(sizeId);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
} 