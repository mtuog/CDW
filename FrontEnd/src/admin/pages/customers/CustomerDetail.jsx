import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserById } from '../../../admin/api/userApi';
import { getOrdersByUser } from '../../../admin/api/orderApi';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);
  
  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch user details
      const userData = await getUserById(id);
      
      // Extract roles array from string if needed
      let roles = [];
      if (typeof userData.roles === 'string') {
        // Remove 'ROLE_' prefix if present
        roles = [userData.roles.replace('ROLE_', '')];
      } else if (Array.isArray(userData.roles)) {
        roles = userData.roles.map(role => role.replace('ROLE_', ''));
      }
      
      // Format customer data
      const formattedCustomer = {
        id: userData.id,
        username: userData.username,
        fullName: userData.fullName || userData.username,
        email: userData.email,
        phone: userData.phone || 'Chưa cập nhật',
        address: userData.address || 'Chưa cập nhật',
        createdAt: userData.createdAt ? new Date(userData.createdAt) : null,
        roles: roles,
        enabled: userData.enabled !== false,
        loyaltyPoints: userData.loyaltyPoints || 0
      };
      
      setCustomer(formattedCustomer);
      
      // Fetch user orders
      const ordersData = await getOrdersByUser(id);
      
      // Format orders data
      const formattedOrders = ordersData.map(order => ({
        id: order.id,
        date: new Date(order.createdAt),
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.orderItems ? order.orderItems.length : 0,
        paymentMethod: order.paymentMethod
      }));
      
      setOrders(formattedOrders);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      setError("Không thể tải thông tin khách hàng. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };
  
  // Calculate total spent
  const calculateTotalSpent = () => {
    return orders.reduce((total, order) => total + order.totalAmount, 0);
  };
  
  // Get status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'delivered';
      case 'SHIPPED':
        return 'shipping';
      case 'PENDING':
      case 'PROCESSING':
        return 'processing';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return '';
    }
  };
  
  // Status translations
  const statusTranslations = {
    'PENDING': 'Đang xử lý',
    'PROCESSING': 'Đang chuẩn bị',
    'SHIPPED': 'Đang vận chuyển',
    'DELIVERED': 'Đã giao hàng',
    'CANCELLED': 'Đã hủy'
  };
  
  const isRoleAdmin = (roles) => {
    if (!roles) return false;
    if (Array.isArray(roles)) {
      return roles.includes('ADMIN');
    }
    if (typeof roles === 'string') {
      return roles.includes('ADMIN');
    }
    return false;
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin khách hàng...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Đã xảy ra lỗi</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/admin/customers')} className="back-button">
          <i className="fa fa-arrow-left"></i> Quay lại danh sách khách hàng
        </button>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="not-found-container">
        <h2>Không tìm thấy khách hàng</h2>
        <p>Khách hàng với ID {id} không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => navigate('/admin/customers')} className="back-button">
          <i className="fa fa-arrow-left"></i> Quay lại danh sách khách hàng
        </button>
      </div>
    );
  }
  
  return (
    <div className="customer-detail-container">
      <div className="customer-detail-header">
        <div className="header-left">
          <button onClick={() => navigate('/admin/customers')} className="back-button">
            <i className="fa fa-arrow-left"></i> Quay lại
          </button>
          <h1>
            {customer.fullName}
            {isRoleAdmin(customer.roles) && (
              <span className="admin-badge">Admin</span>
            )}
          </h1>
        </div>
        <div className="header-actions">
          <button 
            className="disable-button"
            onClick={() => toast.info("Chức năng này sẽ được triển khai trong tương lai")}
          >
            {customer.enabled ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
          </button>
        </div>
      </div>
      
      <div className="customer-detail-content">
        {/* Customer Info Section */}
        <div className="detail-section customer-info-section">
          <h2>Thông tin khách hàng</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Tên đăng nhập:</div>
              <div className="info-value">@{customer.username}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Email:</div>
              <div className="info-value">{customer.email}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Số điện thoại:</div>
              <div className="info-value">{customer.phone}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Địa chỉ:</div>
              <div className="info-value address-value">{customer.address}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Ngày đăng ký:</div>
              <div className="info-value">{formatDate(customer.createdAt)}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Trạng thái:</div>
              <div className="info-value">
                <span className={`status-badge ${customer.enabled ? 'active' : 'inactive'}`}>
                  {customer.enabled ? 'Hoạt động' : 'Vô hiệu hóa'}
                </span>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Điểm tích lũy:</div>
              <div className="info-value loyalty-points">{customer.loyaltyPoints} điểm</div>
            </div>
          </div>
        </div>
        
        {/* Customer Statistics Section */}
        <div className="detail-section customer-stats-section">
          <h2>Thống kê mua hàng</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon orders-icon">
                <i className="fa fa-shopping-cart"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Tổng đơn hàng</div>
                <div className="stat-value">{orders.length}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon spent-icon">
                <i className="fa fa-money-bill-wave"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Tổng chi tiêu</div>
                <div className="stat-value">{formatPrice(calculateTotalSpent())}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon recent-icon">
                <i className="fa fa-clock"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Đơn hàng gần nhất</div>
                <div className="stat-value">
                  {orders.length > 0 
                    ? formatDate(orders.sort((a, b) => b.date - a.date)[0].date)
                    : 'Chưa có đơn hàng nào'}
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon loyalty-icon">
                <i className="fa fa-star"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Điểm tích lũy</div>
                <div className="stat-value">{customer.loyaltyPoints} điểm</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Orders Section */}
        <div className="detail-section recent-orders-section">
          <div className="section-header">
            <h2>Đơn hàng gần đây</h2>
            <Link to={`/admin/customers/${customer.id}/orders`} className="view-all-link">
              Xem tất cả <i className="fa fa-arrow-right"></i>
            </Link>
          </div>
          
          {orders.length > 0 ? (
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Mã đơn hàng</th>
                    <th>Ngày đặt</th>
                    <th>Trạng thái</th>
                    <th>Tổng tiền</th>
                    <th>Thanh toán</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .sort((a, b) => b.date - a.date)
                    .slice(0, 5)
                    .map(order => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{formatDate(order.date)}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(order.status)}`}>
                            {statusTranslations[order.status] || order.status}
                          </span>
                        </td>
                        <td>{formatPrice(order.totalAmount)}</td>
                        <td>
                          {order.paymentMethod === 'COD' ? (
                            <span className="payment-method cod">COD</span>
                          ) : (
                            <span className="payment-method banking">Chuyển khoản</span>
                          )}
                        </td>
                        <td>
                          <Link to={`/admin/orders/${order.id}`} className="view-order-button">
                            <i className="fa fa-eye"></i> Chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-orders-message">
              <i className="fa fa-shopping-cart empty-cart-icon"></i>
              <p>Khách hàng chưa có đơn hàng nào.</p>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .customer-detail-container {
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .customer-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .header-left {
          display: flex;
          align-items: center;
        }
        
        .back-button {
          display: flex;
          align-items: center;
          margin-right: 16px;
          color: #6c757d;
          text-decoration: none;
          transition: color 0.3s;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        
        .back-button:hover {
          color: #495057;
        }
        
        .back-button i {
          margin-right: 8px;
        }
        
        .customer-detail-header h1 {
          font-size: 24px;
          margin: 0;
          color: #333;
          display: flex;
          align-items: center;
        }
        
        .admin-badge {
          background-color: #dc3545;
          color: white;
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 12px;
          margin-left: 10px;
          font-weight: normal;
        }
        
        .header-actions {
          display: flex;
          gap: 8px;
        }
        
        .disable-button {
          padding: 8px 16px;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .disable-button:hover {
          background-color: #c82333;
        }
        
        .customer-detail-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .detail-section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        
        .detail-section h2 {
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 16px;
          color: #333;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 8px;
        }
        
        /* Customer Info Section */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 16px;
          color: #212529;
          font-weight: 500;
        }
        
        .address-value {
          line-height: 1.4;
        }
        
        .loyalty-points {
          color: #28a745;
          font-weight: 600;
        }
        
        /* Status Badge */
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .status-badge.active {
          background-color: #d4edda;
          color: #155724;
        }
        
        .status-badge.inactive {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .status-badge.delivered {
          background-color: #d4edda;
          color: #155724;
        }
        
        .status-badge.shipping {
          background-color: #cce5ff;
          color: #004085;
        }
        
        .status-badge.processing {
          background-color: #fff3cd;
          color: #856404;
        }
        
        .status-badge.cancelled {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        /* Stats Section */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          background-color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-right: 16px;
          font-size: 18px;
        }
        
        .orders-icon {
          background-color: #007bff;
        }
        
        .spent-icon {
          background-color: #28a745;
        }
        
        .recent-icon {
          background-color: #17a2b8;
        }
        
        .loyalty-icon {
          background-color: #fd7e14;
        }
        
        .stat-content {
          flex: 1;
        }
        
        .stat-label {
          font-size: 13px;
          color: #6c757d;
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #212529;
        }
        
        /* Orders Section */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .section-header h2 {
          margin: 0;
          padding: 0;
          border: none;
        }
        
        .view-all-link {
          color: #007bff;
          text-decoration: none;
          font-size: 14px;
          display: flex;
          align-items: center;
        }
        
        .view-all-link i {
          margin-left: 4px;
        }
        
        .view-all-link:hover {
          text-decoration: underline;
        }
        
        .orders-table-container {
          overflow-x: auto;
        }
        
        .orders-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .orders-table th,
        .orders-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        
        .orders-table th {
          background-color: #e9ecef;
          font-weight: 600;
          color: #495057;
        }
        
        .payment-method {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .payment-method.cod {
          background-color: #f8f9fa;
          color: #495057;
        }
        
        .payment-method.banking {
          background-color: #e8f4fd;
          color: #0d6efd;
        }
        
        .view-order-button {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          background-color: #17a2b8;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          text-decoration: none;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .view-order-button:hover {
          background-color: #138496;
        }
        
        .view-order-button i {
          margin-right: 4px;
        }
        
        .no-orders-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          color: #6c757d;
        }
        
        .empty-cart-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .loading-container, .error-container, .not-found-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          background-color: #fff;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
        }
        
        .loading-spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-top: 4px solid #007bff;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .customer-detail-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .header-actions {
            margin-top: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerDetail; 