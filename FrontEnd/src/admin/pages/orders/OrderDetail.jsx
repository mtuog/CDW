import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../config';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discountDetails, setDiscountDetails] = useState(null);
  
  // Status options
  const statusOptions = ['DELIVERED', 'SHIPPED', 'PROCESSING', 'PENDING', 'CANCELLED'];
  
  // Trạng thái hiển thị tiếng Việt
  const statusTranslations = {
    'PENDING': 'Đang xử lý',
    'PROCESSING': 'Đang chuẩn bị',
    'SHIPPED': 'Đang vận chuyển',
    'DELIVERED': 'Đã giao hàng',
    'CANCELLED': 'Đã hủy'
  };
  
  useEffect(() => {
    fetchOrderDetails();
  }, [id]);
  
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      const response = await axios.get(`${BACKEND_URL_HTTP}/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("OrderDetail API response:", response.data);
      console.log("Payment method:", response.data.paymentMethod);
      console.log("User data:", response.data.user);
      console.log("Phone from order:", response.data.phone);
      console.log("Shipping address:", response.data.shippingAddress);
      
      // Tạo orderCode nếu chưa có từ API
      const orderData = response.data;
      if (!orderData.orderCode) {
        orderData.orderCode = `ORD-${orderData.id}`;
      }
      
      setOrder(orderData);
      
      // Fetch discount code details if available
      if (orderData.discountCodeValue) {
        try {
          const discountResponse = await axios.get(
            `${BACKEND_URL_HTTP}/api/discount-codes/code/${orderData.discountCodeValue}`, 
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          setDiscountDetails(discountResponse.data);
        } catch (error) {
          console.error("Error fetching discount code details:", error);
          // Continue without discount details
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const oldStatus = order.status;
    
    // Hiển thị cảnh báo trước khi thay đổi trạng thái
    if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      // Cảnh báo khi chuyển sang trạng thái HỦY
      const result = await Swal.fire({
        title: 'Xác nhận hủy đơn hàng?',
        text: 'Hủy đơn hàng sẽ hoàn trả số lượng sản phẩm về kho. Bạn có chắc chắn muốn tiếp tục?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Đồng ý, hủy đơn hàng',
        cancelButtonText: 'Không, giữ nguyên'
      });
      
      if (!result.isConfirmed) {
        return;
      }
    } else if (oldStatus === 'CANCELLED' && newStatus !== 'CANCELLED') {
      // Cảnh báo khi kích hoạt lại đơn hàng đã hủy
      const result = await Swal.fire({
        title: 'Kích hoạt lại đơn hàng?',
        text: 'Kích hoạt lại đơn hàng sẽ giảm số lượng sản phẩm trong kho. Bạn có chắc chắn muốn tiếp tục?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Đồng ý, kích hoạt lại',
        cancelButtonText: 'Không, giữ nguyên'
      });
      
      if (!result.isConfirmed) {
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`${BACKEND_URL_HTTP}/api/orders/${id}/status?status=${newStatus}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Hiển thị thông báo thành công với thông tin về tồn kho
      if (newStatus === 'CANCELLED') {
        toast.success("Đã hủy đơn hàng và hoàn trả số lượng sản phẩm về kho!");
      } else if (oldStatus === 'CANCELLED') {
        toast.success("Đã kích hoạt lại đơn hàng và cập nhật số lượng trong kho!");
      } else {
        toast.success("Cập nhật trạng thái đơn hàng thành công!");
      }
      
      // Cập nhật state để hiển thị trạng thái mới
      setOrder({
        ...order,
        status: newStatus
      });
      
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.");
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };
  
  // Xử lý in đơn hàng
  const handlePrint = () => {
    window.print();
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Đã xảy ra lỗi</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/admin/orders')} className="back-button">
          <i className="fa fa-arrow-left"></i> Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="not-found-container">
        <h2>Không tìm thấy đơn hàng</h2>
        <p>Đơn hàng với mã {id} không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => navigate('/admin/orders')} className="back-button">
          <i className="fa fa-arrow-left"></i> Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }
  
  return (
    <div className="order-detail-container">
      <div className="order-detail-header">
        <div className="header-left">
          <button onClick={() => navigate('/admin/orders')} className="back-button">
            <i className="fa fa-arrow-left"></i> Quay lại
          </button>
          <h1>Chi tiết đơn hàng #{order.orderCode}</h1>
        </div>
        <button onClick={handlePrint} className="print-button">
          <i className="fa fa-print"></i> In đơn hàng
        </button>
      </div>
      
      <div className="order-meta">
        <div className="order-status">
          <div className="status-label">Trạng thái:</div>
          <select 
            className={`status-select ${order.status.toLowerCase()}`}
            value={order.status}
            onChange={handleStatusChange}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {statusTranslations[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="order-date">
          <div className="date-label">Ngày đặt:</div>
          <div className="date-value">{formatDate(order.createdAt)}</div>
        </div>
        {order.updatedAt && (
          <div className="order-date">
            <div className="date-label">Cập nhật:</div>
            <div className="date-value">{formatDate(order.updatedAt)}</div>
          </div>
        )}
      </div>
      
      <div className="order-content">
        {/* Customer Information */}
        <div className="order-section customer-info-section">
          <h2>Thông tin khách hàng</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Tên khách hàng:</div>
              <div className="info-value">{order.user ? (order.user.fullName || order.user.username) : 'Khách vãng lai'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Email:</div>
              <div className="info-value">{order.user ? order.user.email : 'N/A'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Số điện thoại:</div>
              <div className="info-value">{order.phone || (order.user ? order.user.phone : 'N/A')}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Phương thức thanh toán:</div>
              <div className="info-value">
                {order.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng' : 'Chuyển khoản ngân hàng'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Shipping Address */}
        <div className="order-section shipping-address-section">
          <h2>Địa chỉ giao hàng</h2>
          <div className="address-content">
            <p>{order.shippingAddress}</p>
          </div>
        </div>
        
        {/* Discount Code Info */}
        {order.discountCodeValue && (
          <div className="order-section discount-info-section">
            <h2>Thông tin mã giảm giá</h2>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Mã giảm giá:</div>
                <div className="info-value">{order.discountCodeValue}</div>
              </div>
              
              {discountDetails && (
                <>
                  <div className="info-item">
                    <div className="info-label">Loại giảm giá:</div>
                    <div className="info-value">
                      {discountDetails.discountType === 'PERCENTAGE' 
                        ? `Giảm ${discountDetails.value}%` 
                        : `Giảm ${formatPrice(discountDetails.value)}`}
                    </div>
                  </div>
                  
                  {discountDetails.minimumPurchaseAmount > 0 && (
                    <div className="info-item">
                      <div className="info-label">Giá trị đơn hàng tối thiểu:</div>
                      <div className="info-value">{formatPrice(discountDetails.minimumPurchaseAmount)}</div>
                    </div>
                  )}
                  
                  {discountDetails.maximumDiscountAmount > 0 && (
                    <div className="info-item">
                      <div className="info-label">Giảm tối đa:</div>
                      <div className="info-value">{formatPrice(discountDetails.maximumDiscountAmount)}</div>
                    </div>
                  )}
                </>
              )}
              
              {order.subtotalAmount && (
                <div className="info-item">
                  <div className="info-label">Giá trị đơn hàng gốc:</div>
                  <div className="info-value">{formatPrice(order.subtotalAmount)}</div>
                </div>
              )}
              
              <div className="info-item">
                <div className="info-label">Giá trị đã giảm:</div>
                <div className="info-value discount-amount">
                  {order.subtotalAmount 
                    ? formatPrice(order.subtotalAmount - order.totalAmount) 
                    : "Không xác định"}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Order Items */}
        <div className="order-section order-items-section">
          <h2>Sản phẩm đặt mua</h2>
          <div className="order-items">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Mã SP</th>
                  <th>Tên sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems && order.orderItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.product.id}</td>
                    <td>
                      <Link to={`/admin/products/${item.product.id}/edit`}>
                        {item.product.name}
                      </Link>
                      {item.size && <span className="product-variant"> - Size: {item.size}</span>}
                      {item.color && <span className="product-variant"> - Màu: {item.color}</span>}
                    </td>
                    <td>{formatPrice(item.price)}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className="text-right">Tổng tiền hàng:</td>
                  <td>{order.subtotalAmount ? formatPrice(order.subtotalAmount) : formatPrice(order.totalAmount)}</td>
                </tr>
                {order.shippingFee && (
                  <tr>
                    <td colSpan="4" className="text-right">Phí vận chuyển:</td>
                    <td>{formatPrice(order.shippingFee)}</td>
                  </tr>
                )}
                {order.discountCodeValue && order.subtotalAmount && (
                  <tr>
                    <td colSpan="4" className="text-right">Giảm giá ({order.discountCodeValue}):</td>
                    <td className="discount-amount">-{formatPrice(order.subtotalAmount - order.totalAmount)}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td colSpan="4" className="text-right">Tổng thanh toán:</td>
                  <td>{formatPrice(order.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .discount-amount {
          color: #28a745;
          font-weight: 600;
        }
        
        .discount-info-section {
          background-color: #f8f9fa;
          border-left: 4px solid #28a745;
        }
        
        .order-detail-container {
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .order-detail-header {
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
        
        .order-detail-header h1 {
          font-size: 24px;
          margin: 0;
          color: #333;
        }
        
        .print-button {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .print-button:hover {
          background-color: #5a6268;
        }
        
        .print-button i {
          margin-right: 8px;
        }
        
        .order-meta {
          display: flex;
          margin-bottom: 24px;
          background-color: #f8f9fa;
          padding: 16px;
          border-radius: 4px;
        }
        
        .order-status, .order-date {
          display: flex;
          align-items: center;
          margin-right: 32px;
        }
        
        .status-label, .date-label {
          font-weight: 600;
          margin-right: 8px;
          color: #495057;
        }
        
        .status-select {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          border: 1px solid #ced4da;
          background-color: white;
        }
        
        .status-select.delivered {
          background-color: #d4edda;
          color: #155724;
          border-color: #c3e6cb;
        }
        
        .status-select.shipped {
          background-color: #cce5ff;
          color: #004085;
          border-color: #b8daff;
        }
        
        .status-select.processing, .status-select.pending {
          background-color: #fff3cd;
          color: #856404;
          border-color: #ffeeba;
        }
        
        .status-select.cancelled {
          background-color: #f8d7da;
          color: #721c24;
          border-color: #f5c6cb;
        }
        
        .date-value {
          color: #495057;
        }
        
        .order-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }
        
        .order-section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        
        .order-items-section {
          grid-column: 1 / -1;
        }
        
        .order-section h2 {
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 16px;
          color: #333;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 8px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        .info-item {
          display: flex;
        }
        
        .info-label {
          font-weight: 600;
          margin-right: 8px;
          min-width: 150px;
          color: #495057;
        }
        
        .info-value {
          color: #212529;
        }
        
        .address-content {
          color: #212529;
        }
        
        .address-content p {
          margin: 4px 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .items-table th, .items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        
        .items-table th {
          background-color: #e9ecef;
          font-weight: 600;
          color: #495057;
        }
        
        .items-table a {
          color: #007bff;
          text-decoration: none;
        }
        
        .items-table a:hover {
          text-decoration: underline;
        }
        
        .product-variant {
          font-size: 12px;
          color: #6c757d;
        }
        
        .text-right {
          text-align: right;
        }
        
        .total-row {
          font-weight: 600;
        }
        
        .total-row td {
          border-top: 2px solid #dee2e6;
          font-size: 16px;
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
        
        /* Printer friendly styles */
        @media print {
          .back-button, .print-button, .status-select {
            display: none;
          }
          
          .order-detail-container {
            box-shadow: none;
            padding: 0;
          }
          
          .order-meta {
            background-color: transparent;
          }
          
          .order-section {
            background-color: transparent;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderDetail; 