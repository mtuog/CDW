package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.dto.WishlistDTO;
import com.example.BackEndSpring.dto.WishlistRequest;
import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.model.Wishlist;
import com.example.BackEndSpring.repository.ProductRepository;
import com.example.BackEndSpring.repository.UserRepository;
import com.example.BackEndSpring.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(
    origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:5500"},
    allowCredentials = "true",
    allowedHeaders = {"Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class WishlistController {
    
    @Autowired
    private WishlistRepository wishlistRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private com.example.BackEndSpring.service.ProductService productService;
    
    /**
     * Lấy danh sách yêu thích của người dùng
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getWishlistByUserId(@PathVariable Long userId) {
        try {
            System.out.println("Fetching wishlist items for user ID: " + userId);
            
            // Kiểm tra user có tồn tại không
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found with ID: " + userId));
            }
            System.out.println("User found: " + userOpt.get().getUsername());
            
            // Lấy dữ liệu wishlist
            List<Wishlist> items = wishlistRepository.findByUserId(userId);
            System.out.println("Found " + items.size() + " wishlist items");
            
            // Chuyển đổi thành format đơn giản để frontend dễ xử lý
            List<Map<String, Object>> formattedItems = new ArrayList<>();
            for (Wishlist item : items) {
                Map<String, Object> wishlistItem = new HashMap<>();
                wishlistItem.put("id", item.getId());
                wishlistItem.put("userId", userId);
                
                if (item.getProduct() != null) {
                    wishlistItem.put("productId", item.getProduct().getId());
                    wishlistItem.put("product", Map.of(
                        "id", item.getProduct().getId(),
                        "name", item.getProduct().getName(),
                        "imageUrl", item.getProduct().getImg(),
                        "price", item.getProduct().getPrice()
                    ));
                } else {
                    // Nếu product null, bỏ qua item này
                    continue;
                }
                
                wishlistItem.put("dateAdded", item.getCreatedAt());
                formattedItems.add(wishlistItem);
            }
            
            return ResponseEntity.ok(formattedItems);
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Kiểm tra sản phẩm có trong danh sách yêu thích không
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkWishlistItem(
            @RequestParam Long userId, 
            @RequestParam Long productId) {
        try {
            boolean exists = wishlistRepository.existsByUserIdAndProductId(userId, productId);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Thêm sản phẩm vào danh sách yêu thích
     */
    @PostMapping("/add")
    public ResponseEntity<?> addToWishlist(@RequestBody WishlistRequest request) {
        try {
            // Lấy thông tin người dùng từ request
            Long userId = request.getUserId();
            
            if (userId == null) {
                // Nếu không có userId trong request, thử lấy từ token
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                System.out.println("Authentication details:");
                System.out.println("- Is authenticated: " + (auth != null && auth.isAuthenticated()));
                System.out.println("- Principal: " + (auth != null ? auth.getPrincipal() : "null"));
                System.out.println("- Authorities: " + (auth != null ? auth.getAuthorities() : "null"));
                
                User authenticatedUser = getCurrentUser();
                if (authenticatedUser == null) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "User not authenticated and no userId provided in request");
                    errorResponse.put("authDetails", auth != null ? auth.toString() : "null");
                    errorResponse.put("isAuthenticated", auth != null && auth.isAuthenticated());
                    
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(errorResponse);
                }
                
                userId = authenticatedUser.getId();
                System.out.println("Using authenticated user ID: " + userId);
            } else {
                System.out.println("Using userId from request: " + userId);
            }
            
            // Lấy user từ database
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }
            User user = userOpt.get();
            
            System.out.println("User found: " + user.getUsername() + " (ID: " + user.getId() + ")");
            
            // Kiểm tra xem sản phẩm đã tồn tại trong wishlist chưa
            Optional<Wishlist> existingItem = wishlistRepository
                .findByUserIdAndProductId(user.getId(), request.getProductId());
            
            if (existingItem.isPresent()) {
                return ResponseEntity.ok(convertToDTO(existingItem.get()));
            }
            
            // Lấy thông tin sản phẩm
            Optional<Product> productOpt = productRepository.findById(request.getProductId());
            if (!productOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Product not found"));
            }
            
            Product product = productOpt.get();
            // Lưu giá trị cũ để log
            boolean previousFavorite = product.isFavorite();
            Integer previousLikeCount = product.getLikesCount();
            
            // Cập nhật trường favorite cho sản phẩm thành true bằng SQL trực tiếp
            try {
                productService.directUpdateFavorite(request.getProductId(), true);
                System.out.println("Product favorite updated through direct SQL - ProductID: " + request.getProductId());
            } catch (Exception e) {
                System.err.println("Error updating product favorite: " + e.getMessage());
            }
            
            // Tăng likesCount của sản phẩm
            try {
                productService.incrementLikesCount(request.getProductId());
            } catch (Exception e) {
                System.err.println("Error incrementing product likes count: " + e.getMessage());
            }
            
            // Lưu sản phẩm vào database để cập nhật favorite và likesCount
            Product savedProduct = productRepository.save(product);
            
            System.out.println("Product status updated - ProductID: " + product.getId() + 
                ", Favorite: " + previousFavorite + " -> " + savedProduct.isFavorite() + 
                ", LikesCount: " + previousLikeCount + " -> " + savedProduct.getLikesCount());
            
            // Tạo mới wishlist item
            Wishlist wishlistItem = new Wishlist();
            wishlistItem.setUser(user);
            wishlistItem.setProduct(savedProduct);  // Sử dụng savedProduct thay vì product
            
            // Lưu vào database
            wishlistItem = wishlistRepository.save(wishlistItem);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(wishlistItem));
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Xóa sản phẩm khỏi danh sách yêu thích
     */
    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<?> removeFromWishlist(
            @PathVariable Long productId,
            @RequestParam(required = false) Long userId) {
        try {
            // Nếu không có userId trong parameter, thử lấy từ token
            if (userId == null) {
                User authenticatedUser = getCurrentUser();
                if (authenticatedUser == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not authenticated and no userId provided in request"));
                }
                userId = authenticatedUser.getId();
                System.out.println("Using authenticated user ID: " + userId);
            } else {
                System.out.println("Using userId from request: " + userId);
            }
            
            // Lấy user từ database
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }
            
            // Tìm lại thông tin wishlist item
            Optional<Wishlist> wishlistItem = wishlistRepository
                .findByUserIdAndProductId(userId, productId);
            
            if (wishlistItem.isPresent()) {
                wishlistRepository.delete(wishlistItem.get());
                
                // Kiểm tra xem sản phẩm còn nằm trong wishlist của bất kỳ người dùng nào không
                long wishlistCount = wishlistRepository.countByProductId(productId);
                
                // Lấy thông tin sản phẩm
                Optional<Product> productOpt = productRepository.findById(productId);
                if (!productOpt.isPresent()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Product not found"));
                }
                
                Product product = productOpt.get();
                // Lưu giá trị cũ để log
                boolean previousFavorite = product.isFavorite();
                Integer previousLikeCount = product.getLikesCount();
                
                // Giảm likesCount của sản phẩm
                try {
                    productService.decrementLikesCount(productId);
                } catch (Exception e) {
                    System.err.println("Error decrementing product likes count: " + e.getMessage());
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
                    ", Previous likesCount: " + previousLikeCount + 
                    ", Current likesCount: " + savedProduct.getLikesCount() +
                        ", Wishlist count: " + wishlistCount);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Item removed from wishlist");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Item not found in wishlist"));
            }
        } catch (Exception e) {
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Lấy số lượng sản phẩm trong danh sách yêu thích của người dùng
     */
    @GetMapping("/count/{userId}")
    public ResponseEntity<?> getWishlistCount(@PathVariable Long userId) {
        try {
            // Kiểm tra user có tồn tại không
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found with ID: " + userId));
            }
            
            // Lấy dữ liệu wishlist và đếm số lượng
            List<Wishlist> items = wishlistRepository.findByUserId(userId);
            int count = items.size();
            
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Chuyển đổi entity thành DTO
     */
    private WishlistDTO convertToDTO(Wishlist wishlist) {
        WishlistDTO dto = new WishlistDTO();
        dto.setId(wishlist.getId());
        
        if (wishlist.getUser() != null) {
            dto.setUserId(wishlist.getUser().getId());
        } else {
            System.out.println("Warning: User is null for wishlist item " + wishlist.getId());
            return null; // Trả về null để skip item này khi mapping
        }
        
        if (wishlist.getProduct() != null) {
            dto.setProductId(wishlist.getProduct().getId());
            dto.setProduct(wishlist.getProduct());
        } else {
            System.out.println("Warning: Product is null for wishlist item " + wishlist.getId());
            return null; // Trả về null để skip item này khi mapping
        }
        
        dto.setDateAdded(wishlist.getCreatedAt());
        return dto;
    }
    
    /**
     * Lấy thông tin người dùng hiện tại
     */
    private User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated() || 
                "anonymousUser".equals(authentication.getPrincipal())) {
                return null;
            }
            
            Object principal = authentication.getPrincipal();
            String username;
            
            if (principal instanceof UserDetails) {
                username = ((UserDetails) principal).getUsername();
            } else if (principal instanceof String) {
                username = (String) principal;
            } else {
                return null;
            }
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            return userOpt.orElse(null);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Tạo response báo lỗi với thông tin chi tiết
     */
    private ResponseEntity<?> createErrorResponse(Exception e, HttpStatus status) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", e.getMessage());
        error.put("status", status.value());
        error.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(status).body(error);
    }
} 