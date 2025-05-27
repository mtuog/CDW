package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.Order;
import com.example.BackEndSpring.model.OrderItem;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.service.EmailService;
import com.example.BackEndSpring.service.OrderService;
import com.example.BackEndSpring.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.mail.MessagingException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/test-email")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowCredentials = "true")
public class EmailTestController {

    private final EmailService emailService;
    private final OrderService orderService;
    private final UserService userService;

    @Autowired
    public EmailTestController(EmailService emailService, OrderService orderService, UserService userService) {
        this.emailService = emailService;
        this.orderService = orderService;
        this.userService = userService;
    }

    @GetMapping("/connection")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        boolean isConnected = emailService.testConnection();
        
        response.put("success", isConnected);
        response.put("message", isConnected ? 
                "SMTP connection successful" : 
                "SMTP connection failed. Check server logs for details.");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendTestEmail(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        String to = request.get("email");
        if (to == null || to.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email address is required");
            return ResponseEntity.badRequest().body(response);
        }
        
        try {
            String subject = "Test Email from CD Web Shop";
            String content = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">"
                    + "<h2 style=\"color: #333;\">Test Email</h2>"
                    + "<p>This is a test email from CD Web Shop.</p>"
                    + "<p>If you received this email, it means the email service is working correctly.</p>"
                    + "<p>Current time: " + java.time.LocalDateTime.now() + "</p>"
                    + "<p>Trân trọng,<br>CD Web Shop</p>"
                    + "</div>";
            
            emailService.sendEmail(to, subject, content);
            
            response.put("success", true);
            response.put("message", "Test email sent successfully to " + to);
            return ResponseEntity.ok(response);
        } catch (MessagingException e) {
            response.put("success", false);
            response.put("message", "Failed to send test email: " + e.getMessage());
            response.put("error", e.toString());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @PostMapping("/order-confirmation")
    public ResponseEntity<Map<String, Object>> sendOrderConfirmationEmail(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get email parameter or user ID
            String email = (String) request.get("email");
            Long userId = request.get("userId") != null ? Long.valueOf(request.get("userId").toString()) : null;
            
            User user = null;
            
            if (email != null && !email.trim().isEmpty()) {
                Optional<User> userOpt = userService.getUserByEmail(email);
                if (userOpt.isPresent()) {
                    user = userOpt.get();
                } else {
                    // Create a temporary user with the provided email
                    user = new User();
                    user.setEmail(email);
                    user.setUsername("Test User");
                    user.setFullName("Test User");
                }
            } else if (userId != null) {
                Optional<User> userOpt = userService.getUserById(userId);
                if (userOpt.isPresent()) {
                    user = userOpt.get();
                } else {
                    response.put("success", false);
                    response.put("message", "User not found with ID: " + userId);
                    return ResponseEntity.badRequest().body(response);
                }
            } else {
                response.put("success", false);
                response.put("message", "Either email or userId is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Create a test order
            Order testOrder = new Order();
            testOrder.setUser(user);
            testOrder.setOrderCode("TEST-" + System.currentTimeMillis());
            testOrder.setCreatedAt(LocalDateTime.now());
            testOrder.setStatus(Order.Status.PENDING);
            testOrder.setShippingAddress("123 Test Street, Test City");
            testOrder.setPhone("0123456789");
            testOrder.setPaymentMethod("COD");
            testOrder.setTotalAmount(1000000.0);
            testOrder.setSubtotalAmount(1000000.0);
            
            // Add some test order items
            List<OrderItem> items = new ArrayList<>();
            OrderItem item = new OrderItem();
            item.setQuantity(1);
            item.setPrice(1000000.0);
            item.setSize("M");
            item.setColor("Black");
            items.add(item);
            testOrder.setOrderItems(items);
            
            // Send a direct, simple email to avoid any complexity
            String subject = "Xác nhận đơn hàng thử nghiệm";
            
            StringBuilder content = new StringBuilder();
            content.append("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">");
            content.append("<h2 style=\"color: #e65540;\">Email thử nghiệm - Đơn hàng</h2>");
            content.append("<p>Xin chào " + user.getFullName() + ",</p>");
            content.append("<p>Đây là email thử nghiệm xác nhận đơn hàng từ CD Web Shop.</p>");
            content.append("<p><strong>Thông tin đơn hàng thử nghiệm:</strong></p>");
            content.append("<ul>");
            content.append("<li>Mã đơn hàng: " + testOrder.getOrderCode() + "</li>");
            content.append("<li>Phương thức thanh toán: " + testOrder.getPaymentMethod() + "</li>");
            content.append("<li>Thời gian thử nghiệm: " + LocalDateTime.now() + "</li>");
            content.append("</ul>");
            content.append("<p>Nếu bạn nhận được email này, hệ thống gửi email của chúng tôi đang hoạt động bình thường.</p>");
            content.append("<p>Trân trọng,<br>CD Web Shop</p>");
            content.append("</div>");
            
            // Send email directly
            emailService.sendEmail(user.getEmail(), subject, content.toString());
            
            response.put("success", true);
            response.put("message", "Order confirmation test email sent successfully to " + user.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to send order confirmation email: " + e.getMessage());
            response.put("error", e.toString());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @PostMapping("/order-confirmation-by-id")
    public ResponseEntity<Map<String, Object>> sendOrderConfirmationByOrderId(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get order ID from request
            Long orderId = request.get("orderId") != null ? Long.valueOf(request.get("orderId").toString()) : null;
            
            if (orderId == null) {
                response.put("success", false);
                response.put("message", "Order ID is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Get order from database
            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            if (orderOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Order not found with ID: " + orderId);
                return ResponseEntity.badRequest().body(response);
            }
            
            Order order = orderOpt.get();
            
            // Check if order has a user with email
            if (order.getUser() == null || order.getUser().getEmail() == null || order.getUser().getEmail().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Order #" + orderId + " has no user or user email");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Send confirmation email directly
            orderService.sendOrderConfirmationEmail(order);
            
            response.put("success", true);
            response.put("message", "Order confirmation email sent successfully to " + order.getUser().getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to send order confirmation email: " + e.getMessage());
            response.put("error", e.toString());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @PostMapping("/confirm-order-email")
    public ResponseEntity<Map<String, Object>> sendConfirmOrderEmail(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get order ID from request
            Long orderId = request.get("orderId") != null ? Long.valueOf(request.get("orderId").toString()) : null;
            
            if (orderId == null) {
                response.put("success", false);
                response.put("message", "Order ID is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Get order from database
            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            if (orderOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Order not found with ID: " + orderId);
                return ResponseEntity.badRequest().body(response);
            }
            
            Order order = orderOpt.get();
            
            // Check if order has a user with email
            if (order.getUser() == null || order.getUser().getEmail() == null || order.getUser().getEmail().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Order #" + orderId + " has no user or user email");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Send order confirmation email
            orderService.sendOrderConfirmationEmail(order);
            
            response.put("success", true);
            response.put("message", "Order confirmation email sent successfully to " + order.getUser().getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to send order confirmation email: " + e.getMessage());
            response.put("error", e.toString());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @PostMapping("/order-status-email")
    public ResponseEntity<Map<String, Object>> sendOrderStatusEmail(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get order ID from request
            Long orderId = request.get("orderId") != null ? Long.valueOf(request.get("orderId").toString()) : null;
            
            if (orderId == null) {
                response.put("success", false);
                response.put("message", "Order ID is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Get order from database
            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            if (orderOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Order not found with ID: " + orderId);
                return ResponseEntity.badRequest().body(response);
            }
            
            Order order = orderOpt.get();
            
            // Check if order has a user with email
            if (order.getUser() == null || order.getUser().getEmail() == null || order.getUser().getEmail().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Order #" + orderId + " has no user or user email");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Send order status email based on current status
            boolean sent = orderService.sendOrderStatusEmail(order);
            
            if (sent) {
                response.put("success", true);
                response.put("message", "Order " + order.getStatus() + " email sent successfully to " + order.getUser().getEmail());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Failed to send order status email");
                return ResponseEntity.internalServerError().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to send order status email: " + e.getMessage());
            response.put("error", e.toString());
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 