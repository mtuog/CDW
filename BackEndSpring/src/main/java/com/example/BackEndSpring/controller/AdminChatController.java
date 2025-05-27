package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.dto.ChatConversationDTO;
import com.example.BackEndSpring.dto.ChatMessageDTO;
import com.example.BackEndSpring.service.ChatService;
import com.example.BackEndSpring.repository.UserRepository;
import com.example.BackEndSpring.model.User;
import com.example.BackEndSpring.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/chat")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowCredentials = "true")
public class AdminChatController {
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    /**
     * Lấy tất cả cuộc hội thoại cho admin
     */
    @GetMapping("/conversations")
    public ResponseEntity<Page<ChatConversationDTO>> getAdminConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<ChatConversationDTO> conversations = chatService.getAdminConversations(page, size);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            System.err.println("Error getting admin conversations: " + e.getMessage());
            throw new RuntimeException("Failed to get conversations");
        }
    }
    
    /**
     * Lấy cuộc hội thoại chờ xử lý
     */
    @GetMapping("/conversations/pending")
    public ResponseEntity<List<ChatConversationDTO>> getPendingConversations() {
        try {
            List<ChatConversationDTO> conversations = chatService.getPendingConversations();
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            System.err.println("Error getting pending conversations: " + e.getMessage());
            throw new RuntimeException("Failed to get pending conversations");
        }
    }
    
    /**
     * Đếm số cuộc hội thoại chờ xử lý
     */
    @GetMapping("/conversations/pending/count")
    public ResponseEntity<Map<String, Long>> getPendingConversationsCount() {
        try {
            long count = chatService.getPendingConversationsCount();
            Map<String, Long> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error getting pending conversations count: " + e.getMessage());
            throw new RuntimeException("Failed to get count");
        }
    }
    
    /**
     * Đếm số cuộc hội thoại chờ xử lý (shorthand endpoint for header)
     */
    @GetMapping("/pending/count")
    public ResponseEntity<Long> getPendingCount() {
        try {
            long count = chatService.getPendingConversationsCount();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            System.err.println("Error getting pending count: " + e.getMessage());
            throw new RuntimeException("Failed to get count");
        }
    }
    
    /**
     * Gán admin xử lý cuộc hội thoại
     */
    @PutMapping("/conversations/{conversationId}/assign")
    public ResponseEntity<ChatConversationDTO> assignAdminToConversation(
            @PathVariable Long conversationId,
            @RequestBody(required = false) Map<String, Long> request,
            HttpServletRequest httpRequest) {
        try {
            Long adminId;
            
            // Nếu có adminId trong request thì dùng, không thì dùng current admin
            if (request != null && request.containsKey("adminId")) {
                adminId = request.get("adminId");
            } else {
                adminId = getCurrentUserId(httpRequest);
            }
            
            ChatConversationDTO conversation = chatService.assignAdminToConversation(conversationId, adminId);
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            System.err.println("Error assigning admin to conversation: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to assign admin");
        }
    }
    
    /**
     * Lấy tin nhắn trong cuộc hội thoại (admin view)
     */
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<ChatMessageDTO>> getConversationMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<ChatMessageDTO> messages = chatService.getConversationMessages(conversationId, page, size);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            System.err.println("Error getting conversation messages: " + e.getMessage());
            throw new RuntimeException("Failed to get messages");
        }
    }
    
    /**
     * Gửi tin nhắn từ admin
     */
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ChatMessageDTO> sendAdminMessage(
            @PathVariable Long conversationId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            Long adminId = getCurrentUserId(httpRequest);
            String content = request.get("content");
            
            // Debug log
            System.out.println("🔍 Admin sending message:");
            System.out.println("   - Conversation ID: " + conversationId);
            System.out.println("   - Admin ID: " + adminId);
            System.out.println("   - Content: " + content);
            
            if (content == null || content.trim().isEmpty()) {
                throw new RuntimeException("Message content cannot be empty");
            }
            
            ChatMessageDTO message = chatService.sendMessage(conversationId, adminId, content, true); // Admin context
            
            // Debug log phản hồi
            System.out.println("✅ Message sent successfully:");
            System.out.println("   - Message ID: " + message.getId());
            System.out.println("   - Sender ID: " + message.getSenderId());
            System.out.println("   - Is from admin: " + message.getIsFromAdmin());
            
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            System.err.println("Error sending admin message: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send message");
        }
    }
    
    /**
     * Đánh dấu tin nhắn đã đọc (admin)
     */
    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Map<String, String>> markMessagesAsRead(
            @PathVariable Long conversationId,
            HttpServletRequest httpRequest) {
        try {
            Long adminId = getCurrentUserId(httpRequest);
            chatService.markMessagesAsRead(conversationId, adminId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Messages marked as read");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error marking messages as read: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to mark messages as read");
        }
    }
    
    /**
     * Đóng cuộc hội thoại
     */
    @PutMapping("/conversations/{conversationId}/close")
    public ResponseEntity<String> closeConversation(@PathVariable Long conversationId) {
        try {
            chatService.closeConversation(conversationId);
            return ResponseEntity.ok("Conversation closed successfully");
        } catch (Exception e) {
            System.err.println("Error closing conversation: " + e.getMessage());
            throw new RuntimeException("Failed to close conversation");
        }
    }
    
    /**
     * Xóa cuộc hội thoại đã đóng
     */
    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<String> deleteConversation(
            @PathVariable Long conversationId,
            HttpServletRequest request) {
        try {
            chatService.deleteConversation(conversationId);
            return ResponseEntity.ok("Conversation deleted successfully");
        } catch (Exception e) {
            System.err.println("Error deleting conversation: " + e.getMessage());
            throw new RuntimeException("Failed to delete conversation: " + e.getMessage());
        }
    }
    
    /**
     * Xóa tất cả cuộc hội thoại đã đóng
     */
    @DeleteMapping("/conversations/closed/all")
    public ResponseEntity<String> deleteAllClosedConversations(HttpServletRequest request) {
        try {
            int deletedCount = chatService.deleteAllClosedConversations();
            return ResponseEntity.ok("Deleted " + deletedCount + " closed conversations successfully");
        } catch (Exception e) {
            System.err.println("Error deleting closed conversations: " + e.getMessage());
            throw new RuntimeException("Failed to delete closed conversations: " + e.getMessage());
        }
    }
    

    
    // Helper method để lấy user ID từ JWT token
    private Long getCurrentUserId(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new RuntimeException("No JWT token found");
            }
            
            String jwt = authHeader.substring(7);
            
            // Debug log để kiểm tra JWT
            System.out.println("🔍 JWT Debug - FULL CLAIMS:");
            System.out.println("   - Token: " + jwt.substring(0, Math.min(20, jwt.length())) + "...");
            
            // Extract ALL claims để xem token chứa gì
            var allClaims = jwtUtil.extractAllClaims(jwt);
            System.out.println("   - ALL JWT CLAIMS: " + allClaims);
            
            Object userIdObj = allClaims.get("id");
            String username = jwtUtil.extractUsername(jwt);
            Object subjectObj = allClaims.get("sub");
            
            System.out.println("   - Username from JWT: " + username);
            System.out.println("   - UserID from JWT: " + userIdObj);
            System.out.println("   - Subject from JWT: " + subjectObj);
            System.out.println("   - Available keys: " + allClaims.keySet());
            
            // JWT Token có thể lưu ID hoặc chỉ username - thử cả 2 cách
            Long adminId = null;
            
            if (userIdObj != null && userIdObj instanceof Number) {
                // Trường hợp JWT có ID
                adminId = ((Number) userIdObj).longValue();
                System.out.println("   - Got admin ID from JWT: " + adminId);
            } else {
                // Trường hợp JWT chỉ có username - query database
                System.out.println("   - JWT has no ID field, looking up by username: " + username);
                
                Optional<User> userOpt = userRepository.findByUsername(username);
                if (userOpt.isEmpty()) {
                    userOpt = userRepository.findByEmail(username);
                    System.out.println("   - Tried email lookup: " + username);
                }
                
                if (userOpt.isPresent()) {
                    adminId = userOpt.get().getId();
                    System.out.println("   - ✅ Found admin ID by username: " + adminId);
                } else {
                    System.out.println("   - ❌ Admin not found by username or email: " + username);
                    throw new RuntimeException("Admin not found with username: " + username);
                }
            }
            
            System.out.println("   - 🎯 FINAL ADMIN ID: " + adminId);
            return adminId;
        } catch (Exception e) {
            System.err.println("Error extracting admin user ID: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get admin ID: " + e.getMessage());
        }
    }
} 