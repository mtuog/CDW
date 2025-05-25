-- Tạo bảng notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    related_id BIGINT NULL,
    related_type VARCHAR(50) NULL,
    action_url VARCHAR(500) NULL,
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type),
    INDEX idx_related (related_id, related_type)
);

-- Thêm một số thông báo mẫu để test
INSERT INTO notifications (title, message, type, is_read, created_at, related_id, related_type, action_url) VALUES
('Chào mừng đến với hệ thống thông báo', 'Hệ thống thông báo đã được cài đặt thành công!', 'SYSTEM', FALSE, NOW(), NULL, NULL, '/admin/notifications'),
('Thông báo test', 'Đây là thông báo test để kiểm tra hệ thống', 'SYSTEM', FALSE, NOW(), NULL, NULL, NULL); 