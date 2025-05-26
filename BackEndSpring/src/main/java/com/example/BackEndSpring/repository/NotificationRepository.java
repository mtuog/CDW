package com.example.BackEndSpring.repository;

import com.example.BackEndSpring.model.Notification;
import com.example.BackEndSpring.model.Notification.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Lấy tất cả thông báo chưa đọc
    List<Notification> findByIsReadFalseOrderByCreatedAtDesc();
    
    // Lấy thông báo theo loại
    List<Notification> findByTypeOrderByCreatedAtDesc(NotificationType type);
    
    // Lấy thông báo với phân trang
    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    // Lấy thông báo chưa đọc với phân trang
    Page<Notification> findByIsReadFalseOrderByCreatedAtDesc(Pageable pageable);
    
    // Đếm số thông báo chưa đọc
    long countByIsReadFalse();
    
    // Lấy thông báo trong khoảng thời gian
    @Query("SELECT n FROM Notification n WHERE n.createdAt BETWEEN :startDate AND :endDate ORDER BY n.createdAt DESC")
    List<Notification> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);
    
    // Lấy thông báo liên quan đến một đối tượng cụ thể
    List<Notification> findByRelatedIdAndRelatedTypeOrderByCreatedAtDesc(Long relatedId, String relatedType);
    
    // Lấy thông báo mới nhất (trong 24h gần đây)
    @Query("SELECT n FROM Notification n WHERE n.createdAt >= :since ORDER BY n.createdAt DESC")
    List<Notification> findRecentNotifications(@Param("since") LocalDateTime since);
    
    // Xóa thông báo cũ (quá 30 ngày)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
} 