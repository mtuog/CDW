package com.example.BackEndSpring.dto;

import com.example.BackEndSpring.model.ChatMessage.MessageType;
import java.time.LocalDateTime;

public class ChatMessageDTO {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String content;
    private MessageType type;
    private String fileUrl;
    private String fileName;
    private LocalDateTime sentAt;
    private Boolean isRead;
    private LocalDateTime readAt;
    private Boolean isFromAdmin; // Helper field để frontend biết tin nhắn từ admin hay user
    
    // Constructors
    public ChatMessageDTO() {}
    
    public ChatMessageDTO(Long id, Long conversationId, Long senderId, String senderName, 
                         String content, MessageType type, 
                         LocalDateTime sentAt, Boolean isRead, Boolean isFromAdmin) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.type = type;
        this.sentAt = sentAt;
        this.isRead = isRead;
        this.isFromAdmin = isFromAdmin;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getConversationId() {
        return conversationId;
    }
    
    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }
    
    public Long getSenderId() {
        return senderId;
    }
    
    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }
    
    public String getSenderName() {
        return senderName;
    }
    
    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }
    

    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public MessageType getType() {
        return type;
    }
    
    public void setType(MessageType type) {
        this.type = type;
    }
    
    public String getFileUrl() {
        return fileUrl;
    }
    
    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
    
    public Boolean getIsRead() {
        return isRead;
    }
    
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    public Boolean getIsFromAdmin() {
        return isFromAdmin;
    }
    
    public void setIsFromAdmin(Boolean isFromAdmin) {
        this.isFromAdmin = isFromAdmin;
    }
} 