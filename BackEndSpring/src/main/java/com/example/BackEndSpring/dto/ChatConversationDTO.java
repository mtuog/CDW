package com.example.BackEndSpring.dto;

import com.example.BackEndSpring.model.ChatConversation.ConversationStatus;
import java.time.LocalDateTime;

public class ChatConversationDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long adminId;
    private String adminName;
    private ConversationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;
    private String subject;
    private Integer unreadCountUser;
    private Integer unreadCountAdmin;
    private String lastMessage; // Tin nhắn cuối cùng để hiển thị preview
    private String lastMessageSender; // Tên người gửi tin nhắn cuối
    
    // Constructors
    public ChatConversationDTO() {}
    
    public ChatConversationDTO(Long id, Long userId, String userName, 
                              ConversationStatus status, LocalDateTime createdAt, 
                              LocalDateTime lastMessageAt, String subject, 
                              Integer unreadCountUser, Integer unreadCountAdmin) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.status = status;
        this.createdAt = createdAt;
        this.lastMessageAt = lastMessageAt;
        this.subject = subject;
        this.unreadCountUser = unreadCountUser;
        this.unreadCountAdmin = unreadCountAdmin;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
    

    
    public String getUserEmail() {
        return userEmail;
    }
    
    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
    
    public Long getAdminId() {
        return adminId;
    }
    
    public void setAdminId(Long adminId) {
        this.adminId = adminId;
    }
    
    public String getAdminName() {
        return adminName;
    }
    
    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }
    

    
    public ConversationStatus getStatus() {
        return status;
    }
    
    public void setStatus(ConversationStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }
    
    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }
    
    public String getSubject() {
        return subject;
    }
    
    public void setSubject(String subject) {
        this.subject = subject;
    }
    
    public Integer getUnreadCountUser() {
        return unreadCountUser;
    }
    
    public void setUnreadCountUser(Integer unreadCountUser) {
        this.unreadCountUser = unreadCountUser;
    }
    
    public Integer getUnreadCountAdmin() {
        return unreadCountAdmin;
    }
    
    public void setUnreadCountAdmin(Integer unreadCountAdmin) {
        this.unreadCountAdmin = unreadCountAdmin;
    }
    
    public String getLastMessage() {
        return lastMessage;
    }
    
    public void setLastMessage(String lastMessage) {
        this.lastMessage = lastMessage;
    }
    
    public String getLastMessageSender() {
        return lastMessageSender;
    }
    
    public void setLastMessageSender(String lastMessageSender) {
        this.lastMessageSender = lastMessageSender;
    }
} 