package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.dto.ReviewDTO;
import com.example.BackEndSpring.dto.ReviewRequest;
import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.Review;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.repository.ProductRepository;
import com.example.BackEndSpring.repository.ReviewRepository;
import com.example.BackEndSpring.repository.UserRepository;
import com.example.BackEndSpring.service.LoyaltyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(
    origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:5500"},
    allowCredentials = "true",
    allowedHeaders = {"Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class ReviewController {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private LoyaltyService loyaltyService;
    
    /**
     * Lấy tất cả đánh giá của sản phẩm
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getReviewsByProduct(@PathVariable Long productId) {
        try {
            List<Review> reviews = reviewRepository.findByProductId(productId);
            List<Map<String, Object>> result = reviews.stream()
                .map(review -> {
                    Map<String, Object> reviewMap = new HashMap<>();
                    reviewMap.put("id", review.getId());
                    
                    if (review.getUser() != null) {
                        Map<String, Object> userInfo = new HashMap<>();
                        userInfo.put("id", review.getUser().getId());
                        userInfo.put("username", review.getUser().getUsername());
                        userInfo.put("fullName", review.getUser().getFullName() != null ? 
                            review.getUser().getFullName() : review.getUser().getUsername());
                        reviewMap.put("user", userInfo);
                    }
                    
                    reviewMap.put("rating", review.getRating());
                    reviewMap.put("comment", review.getComment());
                    reviewMap.put("createdAt", review.getCreatedAt());
                    reviewMap.put("updatedAt", review.getUpdatedAt());
                    
                    return reviewMap;
                })
                .collect(Collectors.toList());
            
            // Add rating summary
            Map<String, Object> response = new HashMap<>();
            response.put("reviews", result);
            
            // Get average rating
            Double averageRating = reviewRepository.getAverageRatingByProductId(productId);
            response.put("averageRating", averageRating != null ? averageRating : 0);
            
            // Get total reviews count
            Long totalReviews = reviewRepository.getReviewCountByProductId(productId);
            response.put("totalReviews", totalReviews);
            
            // Get rating distribution
            Map<Integer, Long> ratingDistribution = new HashMap<>();
            for (int i = 1; i <= 5; i++) {
                ratingDistribution.put(i, reviewRepository.countByProductIdAndRating(productId, i));
            }
            response.put("ratingDistribution", ratingDistribution);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Lấy tất cả đánh giá của người dùng
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getReviewsByUser(@PathVariable Long userId) {
        try {
            List<Review> reviews = reviewRepository.findByUserId(userId);
            List<ReviewDTO> dtos = reviews.stream()
                .map(ReviewDTO::fromEntity)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Thêm đánh giá mới
     */
    @PostMapping
    public ResponseEntity<?> addReviewStandard(@Validated @RequestBody ReviewRequest request) {
        try {
            // Lấy thông tin người dùng từ request
            Long userId = request.getUserId();
            
            if (userId == null) {
                // Nếu không có userId trong request, thử lấy từ token
                User authenticatedUser = getCurrentUser();
                if (authenticatedUser == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not authenticated and no userId provided in request"));
                }
                
                userId = authenticatedUser.getId();
            }
            
            // Lấy user từ database
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }
            
            // Lấy product từ database
            Optional<Product> productOpt = productRepository.findById(request.getProductId());
            if (!productOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Product not found"));
            }
            
            // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
            boolean alreadyReviewed = reviewRepository.existsByUserIdAndProductId(userId, request.getProductId());
            if (alreadyReviewed) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "User has already reviewed this product"));
            }
            
            // Tạo review mới
            Review review = new Review();
            review.setUser(userOpt.get());
            review.setProduct(productOpt.get());
            review.setRating(request.getRating());
            review.setComment(request.getComment());
            
            // Lưu vào database
            Review savedReview = reviewRepository.save(review);
            
            // Thêm điểm thưởng cho việc đánh giá sản phẩm
            try {
                loyaltyService.addPoints(
                    userId,
                    5, // Thưởng 5 điểm cho mỗi đánh giá
                    "Đánh giá sản phẩm " + productOpt.get().getName()
                );
            } catch (Exception e) {
                // Log lỗi nhưng vẫn tiếp tục lưu đánh giá
                System.err.println("Error adding loyalty points for review: " + e.getMessage());
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(ReviewDTO.fromEntity(savedReview));
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Cập nhật đánh giá
     */
    @PutMapping("/update/{reviewId}")
    public ResponseEntity<?> updateReview(@PathVariable Long reviewId, @RequestBody Map<String, Object> updates) {
        try {
            Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
            if (!reviewOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Review not found"));
            }
            
            Review review = reviewOpt.get();
            
            // Kiểm tra quyền chỉnh sửa (chỉ người tạo review mới được sửa)
            User currentUser = getCurrentUser();
            if (currentUser == null || !review.getUser().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have permission to update this review"));
            }
            
            // Cập nhật thông tin
            if (updates.containsKey("rating")) {
                Integer rating = Integer.valueOf(updates.get("rating").toString());
                if (rating < 1 || rating > 5) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Rating must be between 1 and 5"));
                }
                review.setRating(rating);
            }
            
            if (updates.containsKey("comment")) {
                review.setComment((String) updates.get("comment"));
            }
            
            // Lưu vào database
            review = reviewRepository.save(review);
            
            return ResponseEntity.ok(ReviewDTO.fromEntity(review));
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Xóa đánh giá
     */
    @DeleteMapping("/delete/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {
        try {
            Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
            if (!reviewOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Review not found"));
            }
            
            Review review = reviewOpt.get();
            
            // Kiểm tra quyền xóa (chỉ người tạo review mới được xóa)
            User currentUser = getCurrentUser();
            if (currentUser == null || !review.getUser().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You don't have permission to delete this review"));
            }
            
            // Xóa khỏi database
            reviewRepository.delete(review);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Review deleted successfully"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
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