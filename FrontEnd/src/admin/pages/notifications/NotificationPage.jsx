import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../config';
import './NotificationPage.css';

const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedType, setSelectedType] = useState('ALL');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const notificationTypes = [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'NEW_ORDER', label: 'Đơn hàng mới' },
        { value: 'ORDER_CANCELLED', label: 'Đơn hàng bị hủy' },
        { value: 'LOW_STOCK', label: 'Sắp hết hàng' },
        { value: 'NEW_USER', label: 'Người dùng mới' },
        { value: 'NEW_REVIEW', label: 'Đánh giá mới' },
        { value: 'PAYMENT_RECEIVED', label: 'Thanh toán thành công' },
        { value: 'SYSTEM', label: 'Hệ thống' }
    ];

    useEffect(() => {
        fetchNotifications();
    }, [currentPage, selectedType, showUnreadOnly]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('Không tìm thấy token xác thực');
                setLoading(false);
                return;
            }

            console.log('🔍 Fetching notifications with params:', {
                currentPage,
                selectedType,
                showUnreadOnly,
                token: token ? 'exists' : 'missing'
            });

            let url = `${BACKEND_URL_HTTP}/api/admin/notifications`;
            
            if (showUnreadOnly) {
                url = `${BACKEND_URL_HTTP}/api/admin/notifications/unread`;
                console.log('📡 API URL (unread):', url);
                const response = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('✅ Unread response:', response.data);
                setNotifications(response.data);
                setTotalElements(response.data.length);
                setTotalPages(1);
            } else if (selectedType !== 'ALL') {
                url = `${BACKEND_URL_HTTP}/api/admin/notifications/type/${selectedType}`;
                console.log('📡 API URL (by type):', url);
                const response = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('✅ Type response:', response.data);
                setNotifications(response.data);
                setTotalElements(response.data.length);
                setTotalPages(1);
            } else {
                console.log('📡 API URL (paginated):', url, 'with params:', { page: currentPage, size: 20 });
                const response = await axios.get(url, {
                    params: { page: currentPage, size: 20 },
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('✅ Paginated response:', response.data);
                setNotifications(response.data.content || []);
                setTotalPages(response.data.totalPages || 0);
                setTotalElements(response.data.totalElements || 0);
            }
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            setError(`Không thể tải thông báo: ${error.response?.data?.message || error.message}`);
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
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === notificationId 
                        ? { ...notif, isRead: true }
                        : notif
                )
            );
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
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            setNotifications(prev => 
                prev.map(notif => ({ ...notif, isRead: true }))
            );
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(
                `${BACKEND_URL_HTTP}/api/admin/notifications/${notificationId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            setNotifications(prev => 
                prev.filter(notif => notif.id !== notificationId)
            );
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Đã loại bỏ hàm tạo thông báo test theo yêu cầu

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'NEW_ORDER': return 'fa-shopping-cart';
            case 'ORDER_CANCELLED': return 'fa-times-circle';
            case 'LOW_STOCK': return 'fa-exclamation-triangle';
            case 'NEW_USER': return 'fa-user-plus';
            case 'NEW_REVIEW': return 'fa-star';
            case 'PAYMENT_RECEIVED': return 'fa-credit-card';
            case 'SYSTEM': return 'fa-cog';
            default: return 'fa-bell';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'NEW_ORDER': return '#28a745';
            case 'ORDER_CANCELLED': return '#dc3545';
            case 'LOW_STOCK': return '#ffc107';
            case 'NEW_USER': return '#17a2b8';
            case 'NEW_REVIEW': return '#fd7e14';
            case 'PAYMENT_RECEIVED': return '#28a745';
            case 'SYSTEM': return '#6c757d';
            default: return '#007bff';
        }
    };

    return (
        <div className="notification-page">
            <div className="page-header">
                <h1>Quản lý thông báo</h1>
                <div className="header-actions">
                    <button 
                        className="btn btn-success"
                        onClick={markAllAsRead}
                    >
                        <i className="fa fa-check-double"></i>
                        Đánh dấu tất cả đã đọc
                    </button>
                </div>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <label>Loại thông báo:</label>
                    <select 
                        value={selectedType} 
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        {notificationTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="filter-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={showUnreadOnly}
                            onChange={(e) => setShowUnreadOnly(e.target.checked)}
                        />
                        Chỉ hiển thị chưa đọc
                    </label>
                </div>
            </div>

            <div className="notification-stats">
                <span>Tổng số thông báo: {totalElements}</span>
            </div>

            {loading ? (
                <div className="loading">
                    <i className="fa fa-spinner fa-spin"></i>
                    Đang tải...
                </div>
            ) : error ? (
                <div className="error">
                    <i className="fa fa-exclamation-triangle"></i>
                    {error}
                </div>
            ) : (
                <>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="empty-state">
                                <i className="fa fa-bell-slash"></i>
                                <p>Không có thông báo nào</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                >
                                    <div className="notification-icon">
                                        <i 
                                            className={`fa ${getNotificationIcon(notification.type)}`}
                                            style={{ color: getNotificationColor(notification.type) }}
                                        ></i>
                                    </div>
                                    
                                    <div className="notification-content">
                                        <div className="notification-header">
                                            <h4>{notification.title}</h4>
                                            <span className="notification-time">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        
                                        <p className="notification-message">
                                            {notification.message}
                                        </p>
                                        
                                        <div className="notification-meta">
                                            <span className="notification-type">
                                                {notificationTypes.find(t => t.value === notification.type)?.label || notification.type}
                                            </span>
                                            {notification.actionUrl && (
                                                <a 
                                                    href={notification.actionUrl}
                                                    className="action-link"
                                                >
                                                    Xem chi tiết
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="notification-actions">
                                        {!notification.isRead && (
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => markAsRead(notification.id)}
                                                title="Đánh dấu đã đọc"
                                            >
                                                <i className="fa fa-check"></i>
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => deleteNotification(notification.id)}
                                            title="Xóa thông báo"
                                        >
                                            <i className="fa fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn-outline-primary"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                <i className="fa fa-chevron-left"></i>
                                Trước
                            </button>
                            
                            <span className="page-info">
                                Trang {currentPage + 1} / {totalPages}
                            </span>
                            
                            <button
                                className="btn btn-outline-primary"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                Sau
                                <i className="fa fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NotificationPage; 