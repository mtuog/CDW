package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.LoyaltyTransaction;
import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.service.LoyaltyService;
import com.example.BackEndSpring.service.OrderService;
import com.example.BackEndSpring.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true",
    allowedHeaders = {"authorization", "content-type", "x-auth-token", "origin", "x-requested-with", "accept"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/loyalty")
@Tag(name = "Loyalty Controller", description = "API để quản lý điểm tích lũy và hạng thành viên")
public class LoyaltyController {

    @Autowired
    private LoyaltyService loyaltyService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private OrderService orderService;
    
    @GetMapping("/{userId}")
    @Operation(summary = "Lấy thông tin điểm tích lũy và hạng thành viên của người dùng")
    public ResponseEntity<?> getLoyaltyInfo(@PathVariable Long userId) {
        try {
            Map<String, Object> loyaltyInfo = loyaltyService.getLoyaltyInfo(userId);
            
            // Chuyển đổi danh sách giao dịch thành định dạng phù hợp cho frontend
            List<LoyaltyTransaction> transactions = (List<LoyaltyTransaction>) loyaltyInfo.get("transactions");
            List<Map<String, Object>> formattedTransactions = transactions.stream()
                .map(tx -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", tx.getId());
                    map.put("date", tx.getCreatedAt());
                    map.put("description", tx.getDescription());
                    map.put("points", tx.getPoints());
                    map.put("type", tx.getType().toString());
                    map.put("orderCode", tx.getOrderCode());
                    map.put("orderAmount", tx.getOrderAmount());
                    map.put("subtotalAmount", tx.getSubtotalAmount());
                    map.put("discountCodeValue", tx.getDiscountCodeValue());
                    if (tx.getOrder() != null) {
                        map.put("orderId", tx.getOrder().getId());
                    }
                    return map;
                })
                .collect(Collectors.toList());
            
            loyaltyInfo.put("transactions", formattedTransactions);
            
            return ResponseEntity.ok(loyaltyInfo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/add-points/{userId}")
    @Operation(summary = "Thêm điểm cho người dùng (cho mục đích quản trị)")
    public ResponseEntity<?> addPoints(
            @PathVariable Long userId,
            @RequestParam int points,
            @RequestParam String description) {
        try {
            LoyaltyTransaction transaction = loyaltyService.addPoints(userId, points, description);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã thêm " + points + " điểm");
            response.put("transaction", transaction);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/redeem-points/{userId}")
    @Operation(summary = "Sử dụng điểm của người dùng")
    public ResponseEntity<?> redeemPoints(
            @PathVariable Long userId,
            @RequestParam int points,
            @RequestParam String description) {
        try {
            LoyaltyTransaction transaction = loyaltyService.redeemPoints(userId, points, description);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã sử dụng " + points + " điểm");
            response.put("transaction", transaction);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/add-points-from-order")
    @Operation(summary = "Thêm điểm cho người dùng từ đơn hàng")
    public ResponseEntity<?> addPointsFromOrder(
            @RequestParam Long userId,
            @RequestParam Long orderId,
            @RequestParam String description) {
        try {
            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            if (!orderOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Order not found"));
            }
            
            Order order = orderOpt.get();
            
            // Kiểm tra xem đơn hàng có phải của người dùng này không
            if (order.getUser() == null || !order.getUser().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Order does not belong to this user"));
            }
            
            LoyaltyTransaction transaction = loyaltyService.addPointsFromOrder(userId, order, description);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã thêm " + transaction.getPoints() + " điểm từ đơn hàng #" + orderId);
            response.put("transaction", transaction);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/transactions/{userId}")
    @Operation(summary = "Lấy lịch sử giao dịch điểm của người dùng")
    public ResponseEntity<?> getUserTransactions(@PathVariable Long userId) {
        try {
            List<LoyaltyTransaction> transactions = loyaltyService.getUserTransactions(userId);
            
            // Chuyển đổi danh sách thành định dạng phù hợp
            List<Map<String, Object>> result = transactions.stream()
                .map(tx -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", tx.getId());
                    map.put("date", tx.getCreatedAt());
                    map.put("description", tx.getDescription());
                    map.put("points", tx.getPoints());
                    map.put("type", tx.getType().toString());
                    map.put("orderCode", tx.getOrderCode());
                    map.put("orderAmount", tx.getOrderAmount());
                    map.put("subtotalAmount", tx.getSubtotalAmount());
                    map.put("discountCodeValue", tx.getDiscountCodeValue());
                    if (tx.getOrder() != null) {
                        map.put("orderId", tx.getOrder().getId());
                    }
                    return map;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/update-transactions-data")
    @Operation(summary = "Cập nhật dữ liệu đơn hàng cho các giao dịch điểm tích lũy hiện có")
    public ResponseEntity<?> updateTransactionsWithOrderData() {
        try {
            loyaltyService.updateExistingTransactionsWithOrderData();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã cập nhật dữ liệu đơn hàng cho các giao dịch điểm tích lũy");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/process-delivered-orders")
    @Operation(summary = "Xử lý tích điểm cho tất cả đơn hàng đã hoàn thành nhưng chưa được tích điểm")
    public ResponseEntity<?> processDeliveredOrders() {
        try {
            int processedCount = loyaltyService.processExistingDeliveredOrders();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã xử lý tích điểm cho " + processedCount + " đơn hàng đã hoàn thành");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/users")
    @Operation(summary = "Lấy danh sách tất cả người dùng kèm thông tin tích điểm")
    public ResponseEntity<?> getAllUsersWithLoyaltyInfo() {
        try {
            List<User> users = userService.getAllUsers();
            
            List<Map<String, Object>> result = users.stream()
                .map(user -> {
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", user.getId());
                    userInfo.put("username", user.getUsername());
                    userInfo.put("email", user.getEmail());
                    userInfo.put("fullName", user.getFullName());
                    userInfo.put("phone", user.getPhone());
                    userInfo.put("loyaltyPoints", user.getLoyaltyPoints());
                    userInfo.put("membershipRank", user.getMembershipRank());
                    userInfo.put("createdAt", user.getCreatedAt());
                    
                    return userInfo;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
} 