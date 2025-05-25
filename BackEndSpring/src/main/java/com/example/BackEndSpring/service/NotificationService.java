package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.Notification;
import com.example.BackEndSpring.model.Notification.NotificationType;
import com.example.BackEndSpring.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * Tạo thông báo mới
     */
    public Notification createNotification(String title, String message, NotificationType type) {
        Notification notification = new Notification(title, message, type);
        notification = notificationRepository.save(notification);
        
        // Gửi thông báo real-time qua WebSocket
        sendRealTimeNotification(notification);
        
        return notification;
    }
    
    /**
     * Tạo thông báo với thông tin liên quan
     */
    public Notification createNotification(String title, String message, NotificationType type, 
                                         Long relatedId, String relatedType, String actionUrl) {
        Notification notification = new Notification(title, message, type, relatedId, relatedType);
        notification.setActionUrl(actionUrl);
        notification = notificationRepository.save(notification);
        
        // Gửi thông báo real-time qua WebSocket
        sendRealTimeNotification(notification);
        
        return notification;
    }
    
    /**
     * Lấy tất cả thông báo với phân trang
     */
    public Page<Notification> getAllNotifications(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    /**
     * Lấy thông báo chưa đọc
     */
    public List<Notification> getUnreadNotifications() {
        return notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
    }
    
    /**
     * Lấy thông báo chưa đọc với phân trang
     */
    public Page<Notification> getUnreadNotifications(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByIsReadFalseOrderByCreatedAtDesc(pageable);
    }
    
    /**
     * Đếm số thông báo chưa đọc
     */
    public long getUnreadCount() {
        return notificationRepository.countByIsReadFalse();
    }
    
    /**
     * Đánh dấu thông báo đã đọc
     */
    public boolean markAsRead(Long notificationId) {
        Optional<Notification> optionalNotification = notificationRepository.findById(notificationId);
        if (optionalNotification.isPresent()) {
            Notification notification = optionalNotification.get();
            notification.setIsRead(true);
            notificationRepository.save(notification);
            return true;
        }
        return false;
    }
    
    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    public void markAllAsRead() {
        List<Notification> unreadNotifications = notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
        }
        notificationRepository.saveAll(unreadNotifications);
    }
    
    /**
     * Xóa thông báo
     */
    public boolean deleteNotification(Long notificationId) {
        if (notificationRepository.existsById(notificationId)) {
            notificationRepository.deleteById(notificationId);
            return true;
        }
        return false;
    }
    
    /**
     * Lấy thông báo theo loại
     */
    public List<Notification> getNotificationsByType(NotificationType type) {
        return notificationRepository.findByTypeOrderByCreatedAtDesc(type);
    }
    
    /**
     * Lấy thông báo mới nhất (24h gần đây)
     */
    public List<Notification> getRecentNotifications() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        return notificationRepository.findRecentNotifications(since);
    }
    
    /**
     * Gửi thông báo real-time qua WebSocket
     */
    @Async
    private void sendRealTimeNotification(Notification notification) {
        try {
            System.out.println("Đang gửi thông báo real-time qua WebSocket: " + notification.getTitle());
            
            // Gửi đến tất cả admin đang online
            messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
            System.out.println("Đã gửi thông báo đến /topic/admin/notifications");
            
            // Gửi số lượng thông báo chưa đọc mới
            long unreadCount = getUnreadCount();
            messagingTemplate.convertAndSend("/topic/admin/unread-count", unreadCount);
            System.out.println("Đã gửi số lượng chưa đọc: " + unreadCount + " đến /topic/admin/unread-count");
        } catch (Exception e) {
            // Log error nhưng không throw exception để không ảnh hưởng đến việc tạo thông báo
            System.err.println("Error sending real-time notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Tạo thông báo cho đơn hàng mới
     */
    public void createNewOrderNotification(Long orderId, String customerName, Double totalAmount) {
        String title = "Đơn hàng mới #" + orderId;
        String message = String.format("Khách hàng %s vừa đặt đơn hàng với tổng giá trị %.0f VNĐ", 
                                      customerName, totalAmount);
        String actionUrl = "/admin/orders/" + orderId;
        
        createNotification(title, message, NotificationType.NEW_ORDER, orderId, "ORDER", actionUrl);
    }
    
    /**
     * Tạo thông báo cho đơn hàng bị hủy
     */
    public void createOrderCancelledNotification(Long orderId, String customerName, String reason) {
        String title = "Đơn hàng #" + orderId + " bị hủy";
        String message = String.format("Khách hàng %s đã hủy đơn hàng. Lý do: %s", customerName, reason);
        String actionUrl = "/admin/orders/" + orderId;
        
        createNotification(title, message, NotificationType.ORDER_CANCELLED, orderId, "ORDER", actionUrl);
    }
    
    /**
     * Tạo thông báo cho sản phẩm sắp hết hàng
     */
    public void createLowStockNotification(Long productId, String productName, int currentStock) {
        String title = "Sản phẩm sắp hết hàng";
        String message = String.format("Sản phẩm '%s' chỉ còn %d sản phẩm trong kho", productName, currentStock);
        String actionUrl = "/admin/products/" + productId;
        
        createNotification(title, message, NotificationType.LOW_STOCK, productId, "PRODUCT", actionUrl);
    }
    
    /**
     * Tạo thông báo cho người dùng mới
     */
    public void createNewUserNotification(Long userId, String userName, String email) {
        String title = "Người dùng mới đăng ký";
        String message = String.format("Người dùng mới: %s (%s) vừa đăng ký tài khoản", userName, email);
        String actionUrl = "/admin/customers/" + userId;
        
        createNotification(title, message, NotificationType.NEW_USER, userId, "USER", actionUrl);
    }
    
    /**
     * Tạo thông báo cho đánh giá mới
     */
    public void createNewReviewNotification(Long reviewId, String productName, int rating, String customerName) {
        String title = "Đánh giá sản phẩm mới";
        String message = String.format("Khách hàng %s vừa đánh giá %d sao cho sản phẩm '%s'", 
                                      customerName, rating, productName);
        String actionUrl = "/admin/reviews/" + reviewId;
        
        createNotification(title, message, NotificationType.NEW_REVIEW, reviewId, "REVIEW", actionUrl);
    }
    
    /**
     * Dọn dẹp thông báo cũ (chạy định kỳ)
     */
    @Transactional
    public void cleanupOldNotifications() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        notificationRepository.deleteOldNotifications(cutoffDate);
    }
} 