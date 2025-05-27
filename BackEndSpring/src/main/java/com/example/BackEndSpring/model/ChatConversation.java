package com.example.BackEndSpring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_conversations")
public class ChatConversation {
    
    public enum ConversationStatus {
        OPEN,
        CLOSED,
        PENDING
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "admin_id")
    private User admin; // Admin handling this conversation
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConversationStatus status = ConversationStatus.PENDING;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;
    
    @Column(name = "subject", length = 200)
    private String subject; // Chủ đề cuộc hội thoại
    
    @Column(name = "unread_count_user")
    private Integer unreadCountUser = 0; // Số tin nhắn chưa đọc của user
    
    @Column(name = "unread_count_admin")
    private Integer unreadCountAdmin = 0; // Số tin nhắn chưa đọc của admin
    
    // Constructors
    public ChatConversation() {
        this.createdAt = LocalDateTime.now();
        this.lastMessageAt = LocalDateTime.now();
    }
    
    public ChatConversation(User user, String subject) {
        this();
        this.user = user;
        this.subject = subject;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public User getAdmin() {
        return admin;
    }
    
    public void setAdmin(User admin) {
        this.admin = admin;
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
    
    // Helper methods
    public void incrementUnreadCountUser() {
        this.unreadCountUser = (this.unreadCountUser == null ? 0 : this.unreadCountUser) + 1;
    }
    
    public void incrementUnreadCountAdmin() {
        this.unreadCountAdmin = (this.unreadCountAdmin == null ? 0 : this.unreadCountAdmin) + 1;
    }
    
    public void resetUnreadCountUser() {
        this.unreadCountUser = 0;
    }
    
    public void resetUnreadCountAdmin() {
        this.unreadCountAdmin = 0;
    }
} 