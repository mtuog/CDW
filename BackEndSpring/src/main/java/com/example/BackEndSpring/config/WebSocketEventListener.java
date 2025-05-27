package com.example.BackEndSpring.config;

import com.example.BackEndSpring.service.ChatService;
import com.example.BackEndSpring.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketEventListener {
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    // Track user sessions
    private final ConcurrentHashMap<String, Long> sessionUserMap = new ConcurrentHashMap<>();
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        try {
            StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
            String sessionId = headerAccessor.getSessionId();
            
            // Extract user ID from JWT token
            String authToken = headerAccessor.getFirstNativeHeader("Authorization");
            if (authToken != null && authToken.startsWith("Bearer ")) {
                String jwt = authToken.substring(7);
                Object userIdObj = jwtUtil.extractAllClaims(jwt).get("id");
                
                if (userIdObj instanceof Number) {
                    Long userId = ((Number) userIdObj).longValue();
                    sessionUserMap.put(sessionId, userId);
                    System.out.println("🔌 User " + userId + " connected with session: " + sessionId);
                }
            }
        } catch (Exception e) {
            System.err.println("Error handling WebSocket connect: " + e.getMessage());
        }
    }
    
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        try {
            StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
            String sessionId = headerAccessor.getSessionId();
            
            Long userId = sessionUserMap.remove(sessionId);
            if (userId != null) {
                System.out.println("🔌 User " + userId + " disconnected from session: " + sessionId);
                
                // Auto-close active conversation when user disconnects
                try {
                    var activeConversation = chatService.getUserActiveConversation(userId);
                    if (activeConversation != null && 
                        ("PENDING".equals(activeConversation.getStatus().toString()) || 
                         "OPEN".equals(activeConversation.getStatus().toString()))) {
                        
                        chatService.closeConversationByUser(activeConversation.getId(), userId);
                        System.out.println("📞 Auto-closed conversation " + activeConversation.getId() + " for disconnected user " + userId);
                    }
                } catch (Exception e) {
                    System.err.println("Error auto-closing conversation for user " + userId + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Error handling WebSocket disconnect: " + e.getMessage());
        }
    }
} 