package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.Notification;
import com.example.BackEndSpring.model.Notification.NotificationType;
import com.example.BackEndSpring.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * Lấy tất cả thông báo với phân trang
     */
    @GetMapping
    public ResponseEntity<Page<Notification>> getAllNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        System.out.println("🔍 NotificationController: getAllNotifications called with page=" + page + ", size=" + size);
        
        try {
            Page<Notification> notifications = notificationService.getAllNotifications(page, size);
            System.out.println("✅ NotificationController: Found " + notifications.getTotalElements() + " notifications");
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            System.err.println("❌ NotificationController: Error in getAllNotifications: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Lấy thông báo chưa đọc
     */
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications() {
        List<Notification> notifications = notificationService.getUnreadNotifications();
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Lấy số lượng thông báo chưa đọc
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        System.out.println("🔍 NotificationController: getUnreadCount called");
        
        try {
            long count = notificationService.getUnreadCount();
            System.out.println("✅ NotificationController: Unread count = " + count);
            Map<String, Long> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ NotificationController: Error in getUnreadCount: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Đánh dấu thông báo đã đọc
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long id) {
        boolean success = notificationService.markAsRead(id);
        Map<String, String> response = new HashMap<>();
        
        if (success) {
            response.put("message", "Đã đánh dấu thông báo đã đọc");
            return ResponseEntity.ok(response);
        } else {
            response.put("error", "Không tìm thấy thông báo");
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead() {
        notificationService.markAllAsRead();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đã đánh dấu tất cả thông báo đã đọc");
        return ResponseEntity.ok(response);
    }
    
    /**
     * Xóa thông báo
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable Long id) {
        boolean success = notificationService.deleteNotification(id);
        Map<String, String> response = new HashMap<>();
        
        if (success) {
            response.put("message", "Đã xóa thông báo");
            return ResponseEntity.ok(response);
        } else {
            response.put("error", "Không tìm thấy thông báo");
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Lấy thông báo theo loại
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Notification>> getNotificationsByType(@PathVariable String type) {
        System.out.println("🔍 NotificationController: getNotificationsByType called with type=" + type);
        
        try {
            NotificationType notificationType = NotificationType.valueOf(type.toUpperCase());
            System.out.println("✅ NotificationController: Valid notification type: " + notificationType);
            List<Notification> notifications = notificationService.getNotificationsByType(notificationType);
            System.out.println("✅ NotificationController: Found " + notifications.size() + " notifications of type " + type);
            return ResponseEntity.ok(notifications);
        } catch (IllegalArgumentException e) {
            System.err.println("❌ NotificationController: Invalid notification type: " + type);
            System.err.println("❌ Available types: " + java.util.Arrays.toString(NotificationType.values()));
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("❌ NotificationController: Error in getNotificationsByType: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Lấy thông báo mới nhất (24h gần đây)
     */
    @GetMapping("/recent")
    public ResponseEntity<List<Notification>> getRecentNotifications() {
        List<Notification> notifications = notificationService.getRecentNotifications();
        return ResponseEntity.ok(notifications);
    }
    
    // Đã loại bỏ endpoint tạo thông báo test theo yêu cầu
    
    /**
     * Dọn dẹp thông báo cũ
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<Map<String, String>> cleanupOldNotifications() {
        notificationService.cleanupOldNotifications();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đã dọn dẹp thông báo cũ");
        return ResponseEntity.ok(response);
    }
} 