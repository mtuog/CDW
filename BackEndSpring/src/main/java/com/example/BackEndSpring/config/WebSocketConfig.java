package com.example.BackEndSpring.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kích hoạt simple broker cho các destination bắt đầu với "/topic"
        config.enableSimpleBroker("/topic");
        
        // Prefix cho các message từ client
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Đăng ký endpoint cho WebSocket connection
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Cho phép tất cả origins (có thể cấu hình cụ thể hơn)
                .withSockJS(); // Fallback cho browsers không hỗ trợ WebSocket
    }
} 