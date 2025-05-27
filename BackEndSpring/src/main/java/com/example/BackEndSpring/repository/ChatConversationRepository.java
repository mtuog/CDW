package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.ChatConversation;
import com.example.BackEndSpring.model.ChatConversation.ConversationStatus;
import com.example.BackEndSpring.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    
    // Tìm cuộc hội thoại của user
    List<ChatConversation> findByUserOrderByLastMessageAtDesc(User user);
    
    // Tìm cuộc hội thoại của user với phân trang
    Page<ChatConversation> findByUserOrderByLastMessageAtDesc(User user, Pageable pageable);
    
    // Tìm cuộc hội thoại theo status
    List<ChatConversation> findByStatusOrderByLastMessageAtDesc(ConversationStatus status);
    
    // Tìm cuộc hội thoại được gán cho admin
    List<ChatConversation> findByAdminOrderByLastMessageAtDesc(User admin);
    
    // Tìm cuộc hội thoại chờ xử lý (chưa được gán admin)
    List<ChatConversation> findByStatusAndAdminIsNullOrderByCreatedAtAsc(ConversationStatus status);
    
    // Đếm số cuộc hội thoại chờ xử lý
    long countByStatusAndAdminIsNull(ConversationStatus status);
    
    // Đếm số cuộc hội thoại có tin nhắn chưa đọc của user
    @Query("SELECT COUNT(c) FROM ChatConversation c WHERE c.user = :user AND c.unreadCountUser > 0")
    long countUnreadConversationsForUser(@Param("user") User user);
    
    // Đếm số cuộc hội thoại có tin nhắn chưa đọc cho admin
    @Query("SELECT COUNT(c) FROM ChatConversation c WHERE c.admin = :admin AND c.unreadCountAdmin > 0")
    long countUnreadConversationsForAdmin(@Param("admin") User admin);
    
    // Tìm cuộc hội thoại mở của user (để tránh tạo nhiều cuộc hội thoại)
    Optional<ChatConversation> findByUserAndStatus(User user, ConversationStatus status);
    
    // Tìm cuộc hội thoại active của admin (để giới hạn 1 conversation/admin)
    Optional<ChatConversation> findByAdminAndStatus(User admin, ConversationStatus status);
    
    // Lấy tất cả cuộc hội thoại cho admin với phân trang
    @Query("SELECT c FROM ChatConversation c ORDER BY c.lastMessageAt DESC")
    Page<ChatConversation> findAllOrderByLastMessageAtDesc(Pageable pageable);
    
    // Tìm cuộc hội thoại trong khoảng thời gian
    @Query("SELECT c FROM ChatConversation c WHERE c.createdAt BETWEEN :startDate AND :endDate ORDER BY c.lastMessageAt DESC")
    List<ChatConversation> findConversationsInDateRange(@Param("startDate") LocalDateTime startDate, 
                                                        @Param("endDate") LocalDateTime endDate);
    
    // Tìm cuộc hội thoại theo từ khóa trong subject
    @Query("SELECT c FROM ChatConversation c WHERE c.subject LIKE %:keyword% ORDER BY c.lastMessageAt DESC")
    List<ChatConversation> findBySubjectContaining(@Param("keyword") String keyword);
} 