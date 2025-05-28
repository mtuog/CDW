package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.dto.ChatConversationDTO;
import com.example.BackEndSpring.dto.ChatMessageDTO;
import com.example.BackEndSpring.service.ChatService;
import com.example.BackEndSpring.service.AutoChatService;
import com.example.BackEndSpring.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, allowCredentials = "true")
public class ChatController {
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private AutoChatService autoChatService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    /**
     * Tạo cuộc hội thoại mới hoặc lấy cuộc hội thoại hiện có
     */
    @PostMapping("/conversations")
    public ResponseEntity<ChatConversationDTO> createOrGetConversation(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        try {
            Long userId = getCurrentUserId(httpRequest);
            String subject = request.get("subject");
            
            ChatConversationDTO conversation = chatService.createOrGetConversation(userId, subject);
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            System.err.println("Error creating conversation: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create conversation");
        }
    }
    
    /**
     * Lấy conversation ACTIVE của user hiện tại (Live Support)
     */
    @GetMapping("/conversations/active")
    public ResponseEntity<ChatConversationDTO> getUserActiveConversation(HttpServletRequest httpRequest) {
        try {
            Long userId = getCurrentUserId(httpRequest);
            ChatConversationDTO conversation = chatService.getUserActiveConversation(userId);
            
            if (conversation != null) {
                return ResponseEntity.ok(conversation);
            } else {
                return ResponseEntity.noContent().build();
            }
        } catch (Exception e) {
            System.err.println("Error getting user active conversation: " + e.getMessage());
            throw new RuntimeException("Failed to get active conversation");
        }
    }
    
    /**
     * Lấy tin nhắn trong cuộc hội thoại
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
     * Gửi tin nhắn
     */
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ChatMessageDTO> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = getCurrentUserId(httpRequest);
            String content = request.get("content");
            
            if (content == null || content.trim().isEmpty()) {
                throw new RuntimeException("Message content cannot be empty");
            }
            
            ChatMessageDTO message = chatService.sendMessage(conversationId, userId, content);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            System.err.println("Error sending message: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send message");
        }
    }
    
    /**
     * Đánh dấu tin nhắn đã đọc
     */
    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Map<String, String>> markMessagesAsRead(@PathVariable Long conversationId, HttpServletRequest httpRequest) {
        try {
            Long userId = getCurrentUserId(httpRequest);
            chatService.markMessagesAsRead(conversationId, userId);
            
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
     * Lấy thông tin chi tiết cuộc hội thoại
     */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ChatConversationDTO> getConversationById(@PathVariable Long conversationId) {
        try {
            // Tạm thời return empty - sẽ implement sau
            Map<String, String> response = new HashMap<>();
            response.put("message", "Get conversation detail - to be implemented");
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Error getting conversation: " + e.getMessage());
            throw new RuntimeException("Failed to get conversation");
        }
    }
    
    /**
     * User đóng conversation (logout hoặc đóng tab)
     */
    @PutMapping("/conversations/{conversationId}/close")
    public ResponseEntity<Map<String, String>> closeConversation(
            @PathVariable Long conversationId,
            HttpServletRequest httpRequest) {
        try {
            Long userId = getCurrentUserId(httpRequest);
            chatService.closeConversationByUser(conversationId, userId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Conversation closed");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error closing conversation: " + e.getMessage());
            throw new RuntimeException("Failed to close conversation");
        }
    }
    
    /**
     * Auto chat response endpoint - Chế độ tự động với selection options
     */
    @PostMapping("/autochat/response")
    public ResponseEntity<ChatMessageDTO> getAutoChatResponse(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        try {
            Long conversationId = Long.valueOf(request.get("conversationId").toString());
            String userMessage = request.get("message").toString();
            
            // Check if user wants to transfer to agent
            if (autoChatService.shouldTransferToAgent(userMessage)) {
                // Return a special response indicating transfer
                Map<String, String> transferResponse = new HashMap<>();
                transferResponse.put("action", "TRANSFER_TO_AGENT");
                transferResponse.put("message", "Đang chuyển bạn đến nhân viên hỗ trợ...");
                
                // Here you could trigger the actual transfer logic
                return ResponseEntity.ok().build(); // Handle this in frontend
            }
            
            // Get auto chat response
            ChatMessageDTO autoResponse = autoChatService.processAutoMessage(conversationId, userMessage);
            return ResponseEntity.ok(autoResponse);
            
        } catch (Exception e) {
            System.err.println("Error getting auto chat response: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get auto chat response");
        }
    }
    
    /**
     * Initialize auto chat conversation - Khởi tạo chế độ tự động
     */
    @PostMapping("/autochat/init")
    public ResponseEntity<ChatMessageDTO> initAutoChat(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            Long conversationId = Long.valueOf(request.get("conversationId"));
            
            // Get welcome message from auto chat
            ChatMessageDTO welcomeMessage = autoChatService.getWelcomeMessage(conversationId);
            return ResponseEntity.ok(welcomeMessage);
            
        } catch (Exception e) {
            System.err.println("Error initializing auto chat: " + e.getMessage());
            throw new RuntimeException("Failed to initialize auto chat");
        }
    }
    
    // Helper method để lấy user ID từ JWT token
    private Long getCurrentUserId(HttpServletRequest request) {
        try {
            System.out.println("🔍 ChatController.getCurrentUserId() - START");
            
            String authHeader = request.getHeader("Authorization");
            System.out.println("   - Authorization header: " + (authHeader != null ? authHeader.substring(0, Math.min(authHeader.length(), 20)) + "..." : "null"));
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.err.println("   - ERROR: No valid JWT token found in Authorization header");
                throw new RuntimeException("No JWT token found");
            }
            
            String jwt = authHeader.substring(7);
            System.out.println("   - JWT token extracted (first 20 chars): " + jwt.substring(0, Math.min(jwt.length(), 20)) + "...");
            
            Object userIdObj = jwtUtil.extractAllClaims(jwt).get("id");
            System.out.println("   - User ID object from token: " + userIdObj + " (type: " + (userIdObj != null ? userIdObj.getClass().getSimpleName() : "null") + ")");
            
            if (userIdObj == null) {
                System.err.println("   - ERROR: User ID not found in token claims");
                throw new RuntimeException("User ID not found in token");
            }
            
            // Convert to Long (có thể là Integer hoặc Long)
            if (userIdObj instanceof Number) {
                Long userId = ((Number) userIdObj).longValue();
                System.out.println("   - ✅ Successfully extracted user ID: " + userId);
                return userId;
            }
            
            System.err.println("   - ERROR: Invalid user ID format: " + userIdObj.getClass().getSimpleName());
            throw new RuntimeException("Invalid user ID format in token");
        } catch (Exception e) {
            System.err.println("🚨 Error extracting user ID: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get user ID: " + e.getMessage());
        }
    }
} 