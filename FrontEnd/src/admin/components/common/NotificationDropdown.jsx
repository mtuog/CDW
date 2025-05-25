import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../config';
import './NotificationDropdown.css';

const NotificationDropdown = ({ isOpen, onClose, unreadCount, onUnreadCountChange }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const dropdownRef = useRef(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            fetchNotifications();
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/admin/notifications/unread`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setError('Không thể tải thông báo');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `${BACKEND_URL_HTTP}/api/admin/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Cập nhật state local
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === notificationId 
                        ? { ...notif, isRead: true }
                        : notif
                )
            );

            // Cập nhật số lượng chưa đọc
            if (onUnreadCountChange) {
                onUnreadCountChange(Math.max(0, unreadCount - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `${BACKEND_URL_HTTP}/api/admin/notifications/read-all`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Cập nhật state local
            setNotifications(prev => 
                prev.map(notif => ({ ...notif, isRead: true }))
            );

            // Reset số lượng chưa đọc
            if (onUnreadCountChange) {
                onUnreadCountChange(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        // Đánh dấu đã đọc
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        // Chuyển hướng nếu có actionUrl
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'NEW_ORDER':
                return 'fa-shopping-cart';
            case 'ORDER_CANCELLED':
                return 'fa-times-circle';
            case 'LOW_STOCK':
                return 'fa-exclamation-triangle';
            case 'NEW_USER':
                return 'fa-user-plus';
            case 'NEW_REVIEW':
                return 'fa-star';
            case 'PAYMENT_RECEIVED':
                return 'fa-credit-card';
            case 'SYSTEM':
                return 'fa-cog';
            default:
                return 'fa-bell';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'NEW_ORDER':
                return '#28a745';
            case 'ORDER_CANCELLED':
                return '#dc3545';
            case 'LOW_STOCK':
                return '#ffc107';
            case 'NEW_USER':
                return '#17a2b8';
            case 'NEW_REVIEW':
                return '#fd7e14';
            case 'PAYMENT_RECEIVED':
                return '#28a745';
            case 'SYSTEM':
                return '#6c757d';
            default:
                return '#007bff';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            <div className="notification-header">
                <h6>Thông báo</h6>
                {notifications.length > 0 && (
                    <button 
                        className="mark-all-read-btn"
                        onClick={markAllAsRead}
                        title="Đánh dấu tất cả đã đọc"
                    >
                        <i className="fa fa-check-double"></i>
                    </button>
                )}
            </div>

            <div className="notification-body">
                {loading ? (
                    <div className="notification-loading">
                        <i className="fa fa-spinner fa-spin"></i>
                        <span>Đang tải...</span>
                    </div>
                ) : error ? (
                    <div className="notification-error">
                        <i className="fa fa-exclamation-triangle"></i>
                        <span>{error}</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notification-empty">
                        <i className="fa fa-bell-slash"></i>
                        <span>Không có thông báo mới</span>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.slice(0, 10).map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="notification-icon">
                                    <i 
                                        className={`fa ${getNotificationIcon(notification.type)}`}
                                        style={{ color: getNotificationColor(notification.type) }}
                                    ></i>
                                </div>
                                <div className="notification-content">
                                    <div className="notification-title">
                                        {notification.title}
                                    </div>
                                    <div className="notification-message">
                                        {notification.message}
                                    </div>
                                    <div className="notification-time">
                                        {formatTime(notification.createdAt)}
                                    </div>
                                </div>
                                {!notification.isRead && (
                                    <div className="notification-unread-dot"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {notifications.length > 10 && (
                <div className="notification-footer">
                    <a href="/admin/notifications" className="view-all-link">
                        Xem tất cả thông báo
                    </a>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown; 