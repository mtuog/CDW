package com.example.BackEndSpring.service;

import com.example.BackEndSpring.dto.WishlistDTO;
import com.example.BackEndSpring.dto.WishlistRequest;
import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.model.Wishlist;
import com.example.BackEndSpring.repository.ProductRepository;
import com.example.BackEndSpring.repository.UserRepository;
import com.example.BackEndSpring.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {
    
    @Autowired
    private WishlistRepository wishlistRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    /**
     * Lấy danh sách yêu thích của người dùng
     */
    public List<WishlistDTO> getWishlistByUserId(Long userId) {
        return wishlistRepository.findByUserId(userId)
            .stream()
            .map(WishlistDTO::fromEntity)
            .collect(Collectors.toList());
    }
    
    /**
     * Kiểm tra sản phẩm có trong danh sách yêu thích không
     */
    public boolean checkWishlistItem(Long userId, Long productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }
    
    /**
     * Thêm sản phẩm vào danh sách yêu thích
     */
    @Transactional
    public WishlistDTO addToWishlist(Long productId) {
        User user = getCurrentUser();
        
        // Kiểm tra xem sản phẩm đã được thêm vào wishlist chưa
        if (wishlistRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            // Nếu đã tồn tại, trả về thông tin hiện có
            Wishlist existingItem = wishlistRepository.findByUserIdAndProductId(user.getId(), productId)
                .orElseThrow(() -> new RuntimeException("Item should exist but not found"));
            return WishlistDTO.fromEntity(existingItem);
        }
        
        // Lấy thông tin sản phẩm
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        // Lưu giá trị cũ để log
        boolean previousFavorite = product.isFavorite();
        Integer previousLikesCount = product.getLikesCount();
        
        // Đặt trạng thái favorite thành true
        product.setFavorite(true);
        
        // Tăng likesCount
        if (product.getLikesCount() == null) {
            product.setLikesCount(1);
        } else {
            product.setLikesCount(product.getLikesCount() + 1);
        }
        
        // Lưu sản phẩm vào database
        Product savedProduct = productRepository.save(product);
        
        System.out.println("Product status updated - ProductID: " + product.getId() + 
            ", Favorite: " + previousFavorite + " -> " + savedProduct.isFavorite() + 
            ", LikesCount: " + previousLikesCount + " -> " + savedProduct.getLikesCount());
        
        // Tạo mới wishlist item
        Wishlist wishlistItem = new Wishlist();
        wishlistItem.setUser(user);
        wishlistItem.setProduct(savedProduct);  // Sử dụng savedProduct thay vì product
        
        // Lưu vào database
        wishlistItem = wishlistRepository.save(wishlistItem);
        
        return WishlistDTO.fromEntity(wishlistItem);
    }
    
    /**
     * Xóa sản phẩm khỏi danh sách yêu thích
     */
    @Transactional
    public void removeFromWishlist(Long productId) {
        User user = getCurrentUser();
        wishlistRepository.deleteByUserIdAndProductId(user.getId(), productId);
        
        // Kiểm tra xem sản phẩm còn nằm trong wishlist của bất kỳ người dùng nào không
        long wishlistCount = wishlistRepository.countByProductId(productId);
        
        // Lấy thông tin sản phẩm
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        // Lưu giá trị cũ để log
        boolean previousFavorite = product.isFavorite();
        Integer previousLikesCount = product.getLikesCount();
        
        // Giảm likesCount
        if (product.getLikesCount() == null || product.getLikesCount() <= 0) {
            product.setLikesCount(0);
        } else {
            product.setLikesCount(product.getLikesCount() - 1);
        }
        
        // Nếu không còn tồn tại trong bất kỳ wishlist nào, đặt lại favorite=false
        if (wishlistCount == 0) {
            product.setFavorite(false);
        }
        
        // Lưu sản phẩm vào database
        Product savedProduct = productRepository.save(product);
        
        System.out.println("Product status after wishlist removal - ProductID: " + productId +
            ", Previous favorite: " + previousFavorite + 
            ", Current favorite: " + savedProduct.isFavorite() +
            ", Previous likesCount: " + previousLikesCount + 
            ", Current likesCount: " + savedProduct.getLikesCount() +
            ", Wishlist count: " + wishlistCount);
    }
    
    /**
     * Lấy thông tin người dùng hiện tại
     */
    private User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated() || 
                "anonymousUser".equals(authentication.getPrincipal())) {
                throw new RuntimeException("User not authenticated");
            }
            
            Object principal = authentication.getPrincipal();
            String username;
            
            if (principal instanceof UserDetails) {
                username = ((UserDetails) principal).getUsername();
            } else if (principal instanceof String) {
                username = (String) principal;
            } else {
                throw new RuntimeException("Unknown authentication type");
            }
            
            return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
        } catch (Exception e) {
            throw new RuntimeException("Error getting current user: " + e.getMessage(), e);
        }
    }
} 