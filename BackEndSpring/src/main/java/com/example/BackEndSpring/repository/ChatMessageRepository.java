package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.ChatConversation;
import com.example.BackEndSpring.model.ChatMessage;
import com.example.BackEndSpring.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    // Lấy tin nhắn trong cuộc hội thoại theo thời gian
    List<ChatMessage> findByConversationOrderBySentAtAsc(ChatConversation conversation);
    
    // Lấy tin nhắn trong cuộc hội thoại với phân trang
    Page<ChatMessage> findByConversationOrderBySentAtDesc(ChatConversation conversation, Pageable pageable);
    
    // Lấy tin nhắn chưa đọc trong cuộc hội thoại
    List<ChatMessage> findByConversationAndIsReadFalseOrderBySentAtAsc(ChatConversation conversation);
    
    // Đếm tin nhắn chưa đọc trong cuộc hội thoại cho một user cụ thể
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation = :conversation AND m.isRead = false AND m.sender != :excludeUser")
    long countUnreadMessagesForUser(@Param("conversation") ChatConversation conversation, @Param("excludeUser") User excludeUser);
    
    // Lấy tin nhắn cuối cùng của cuộc hội thoại
    @Query("SELECT m FROM ChatMessage m WHERE m.conversation = :conversation ORDER BY m.sentAt DESC")
    List<ChatMessage> findLatestMessageByConversation(@Param("conversation") ChatConversation conversation, Pageable pageable);
    
    // Đánh dấu tất cả tin nhắn đã đọc trong cuộc hội thoại (trừ tin nhắn của chính user)
    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true, m.readAt = :readAt WHERE m.conversation = :conversation AND m.sender != :currentUser AND m.isRead = false")
    void markMessagesAsReadInConversation(@Param("conversation") ChatConversation conversation, 
                                         @Param("currentUser") User currentUser, 
                                         @Param("readAt") LocalDateTime readAt);
    
    // Tìm tin nhắn theo từ khóa trong content
    @Query("SELECT m FROM ChatMessage m WHERE m.conversation = :conversation AND m.content LIKE %:keyword% ORDER BY m.sentAt DESC")
    List<ChatMessage> findByConversationAndContentContaining(@Param("conversation") ChatConversation conversation, 
                                                            @Param("keyword") String keyword);
    
    // Lấy tin nhắn trong khoảng thời gian
    @Query("SELECT m FROM ChatMessage m WHERE m.conversation = :conversation AND m.sentAt BETWEEN :startDate AND :endDate ORDER BY m.sentAt ASC")
    List<ChatMessage> findMessagesByConversationAndDateRange(@Param("conversation") ChatConversation conversation,
                                                            @Param("startDate") LocalDateTime startDate,
                                                            @Param("endDate") LocalDateTime endDate);
    
    // Đếm tổng số tin nhắn trong cuộc hội thoại
    long countByConversation(ChatConversation conversation);
    
    // Lấy tin nhắn gần đây nhất (trong vòng 24h) của user
    @Query("SELECT m FROM ChatMessage m WHERE m.sender = :user AND m.sentAt >= :since ORDER BY m.sentAt DESC")
    List<ChatMessage> findRecentMessagesByUser(@Param("user") User user, @Param("since") LocalDateTime since);
    
    // Xóa tin nhắn cũ (quá X ngày)
    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMessage m WHERE m.sentAt < :cutoffDate")
    void deleteOldMessages(@Param("cutoffDate") LocalDateTime cutoffDate);
} 