import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../config';
import { getAllOrders, updateOrderStatus as updateOrderStatusAPI, getOrderById } from '../../../api/orderApi';
import Pagination from '../../../user/components/Pagination/Pagination';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // New state to hold all orders for filtering
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  
  // Thêm state cho phân trang
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    pageSize: 10
  });
  
  // Status options for the filter
  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Đang xử lý' },
    { value: 'PROCESSING', label: 'Đang chuẩn bị' },
    { value: 'SHIPPED', label: 'Đang vận chuyển' },
    { value: 'DELIVERED', label: 'Đã giao hàng' },
    { value: 'CANCELLED', label: 'Đã hủy' }
  ];
  
  // Trạng thái hiển thị tiếng Việt
  const statusTranslations = {
    'PENDING': 'Đang xử lý',
    'PROCESSING': 'Đang chuẩn bị',
    'SHIPPED': 'Đang vận chuyển',
    'DELIVERED': 'Đã giao hàng',
    'CANCELLED': 'Đã hủy'
  };
  
  useEffect(() => {
    fetchOrders();
  }, []);

  // Use another effect for filtering
  useEffect(() => {
    // Apply filters to allOrders
    filterAndPaginateOrders();
  }, [searchTerm, statusFilter, dateRange, sortConfig, pagination.currentPage, allOrders]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch all orders at once without pagination or filtering
      const response = await getAllOrders({
        page: 0,
        size: 1000, // Get a large number of orders
        sortBy: 'createdAt', // Luôn sắp xếp theo thời gian tạo
        sortDir: 'desc'      // Luôn sắp xếp từ mới nhất đến cũ nhất
      });
      
      console.log("Orders API response:", response);
      console.log("Response.orders:", response.orders);
      console.log("Response.orders type:", typeof response.orders);
      console.log("Response.orders length:", response.orders?.length);
      
      // Kiểm tra có đúng cấu trúc dữ liệu không
      let ordersData = [];
      
      // Handle different response structures
      if (response && response.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
      } else if (response && Array.isArray(response)) {
        // In case API returns array directly
        ordersData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        // In case there's nested data property
        ordersData = response.data;
      } else {
        console.error("Invalid response structure:", response);
        toast.error("Dữ liệu không đúng định dạng");
        setLoading(false);
        return;
      }
      
      console.log("Orders data to process:", ordersData);
      
      if (ordersData.length > 0) {
        const formattedOrders = ordersData.map(order => {
          console.log("Processing order:", order);
          
          return {
            id: order.id,
            orderCode: order.orderCode || `ORD-${order.id}`,
            customer: order.user?.username || 'Khách vãng lai',
            email: order.user?.email || 'N/A',
            phone: order.phone || order.user?.phone || 'N/A',
            date: order.createdAt, // Giữ nguyên để format sau
            amount: order.totalAmount || 0,
            subtotalAmount: order.subtotalAmount || 0,
            discountCodeValue: order.discountCodeValue || 0,
            discountCodeId: order.discountCodeId || null,
            items: order.orderItems ? order.orderItems.length : 0,
            payment_method: order.paymentMethod || 'N/A',
            status: order.status || 'PENDING',
            statusVi: statusTranslations[order.status] || order.status || 'PENDING',
            createdAt: new Date(order.createdAt) // Add createdAt for sorting
          };
        });
        
        console.log("Formatted orders:", formattedOrders);
        
        // Store all orders for filtering
        setAllOrders(formattedOrders);
        
        // Total items is now the total of all orders
        setPagination(prev => ({
          ...prev,
          totalItems: formattedOrders.length
        }));
      } else {
        console.log("No orders found");
        setAllOrders([]);
        setPagination(prev => ({
          ...prev,
          totalItems: 0
        }));
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  // New function to filter and paginate orders
  const filterAndPaginateOrders = () => {
    if (!allOrders.length) return;
    
    // Apply filters
    let filteredResult = allOrders.filter(order => {
      // Filter by search term (case insensitive) - Add null checks
      const matchesSearch = searchTerm === '' || 
                           (order.orderCode && order.orderCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (order.customer && order.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (order.email && order.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (order.phone && order.phone.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by status
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Filter by date range
      let matchesDateRange = true;
      if (dateRange.from || dateRange.to) {
        const orderDate = new Date(order.date);
        
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          matchesDateRange = matchesDateRange && orderDate >= fromDate;
        }
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999); // End of day
          matchesDateRange = matchesDateRange && orderDate <= toDate;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
    
    // Apply sorting
    filteredResult.sort((a, b) => {
      // Get the property to sort by
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'customer':
          aValue = a.customer;
          bValue = b.customer;
          break;
        case 'totalAmount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'createdAt':
        default:
          // Đảm bảo rằng chúng ta đang so sánh đúng loại dữ liệu Date
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }
      
      // Compare based on direction
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Update total pages
    const totalPages = Math.ceil(filteredResult.length / pagination.pageSize);
    
    // Paginate the results
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const paginatedOrders = filteredResult.slice(startIndex, startIndex + pagination.pageSize);
    
    // Update state
    setOrders(paginatedOrders);
    setPagination(prev => ({
      ...prev,
      totalPages,
      totalItems: filteredResult.length
    }));
  };
  
  // Format date string to display format
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  // Format price to Vietnamese format
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Reset to first page when search term changes
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };
  
  // Handle date range filter change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    // Reset to first page when date filter changes
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };
  
  // Handle clearing all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ from: '', to: '' });
    // Reset to first page when clearing filters
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };
  
  // Get order status CSS class
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
        return 'canceled';
      default:
        return '';
    }
  };
  
  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    // Đặc biệt với createdAt, mặc định là desc (mới nhất trước)
    if (key === 'createdAt' && sortConfig.key !== key) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };
  
  // Cập nhật trạng thái đơn hàng
  const updateOrderStatus = async (orderId, newStatus, oldStatus) => {
    // Hiển thị cảnh báo trước khi thay đổi trạng thái
    if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      // Cảnh báo khi chuyển sang trạng thái HỦY
      const confirmed = window.confirm('Hủy đơn hàng sẽ hoàn trả số lượng sản phẩm về kho. Bạn có chắc chắn muốn tiếp tục?');
      if (!confirmed) return;
    } else if (oldStatus === 'CANCELLED' && newStatus !== 'CANCELLED') {
      // Cảnh báo khi kích hoạt lại đơn hàng đã hủy
      const confirmed = window.confirm('Kích hoạt lại đơn hàng sẽ giảm số lượng sản phẩm trong kho. Bạn có chắc chắn muốn tiếp tục?');
      if (!confirmed) return;
    }
  
    try {
      console.log(`Updating order ${orderId} from status ${oldStatus} to ${newStatus}`);
      
      // Gọi API cập nhật trạng thái đơn hàng từ orderApi
      const updatedOrder = await updateOrderStatusAPI(orderId, newStatus);
      console.log("Updated order response:", updatedOrder);
      
      // Cập nhật trạng thái đơn hàng trong danh sách
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            statusVi: statusTranslations[newStatus] || newStatus
          };
        }
        return order;
      });
      
      // Cập nhật cả allOrders để giữ state khi filter
      const updatedAllOrders = allOrders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            statusVi: statusTranslations[newStatus] || newStatus
          };
        }
        return order;
      });
      
      setOrders(updatedOrders);
      setAllOrders(updatedAllOrders);
      
      // Hiển thị thông báo thành công với thông tin về tồn kho
      if (newStatus === 'CANCELLED') {
        toast.success("Đã hủy đơn hàng và hoàn trả số lượng sản phẩm về kho!");
      } else if (oldStatus === 'CANCELLED') {
        toast.success("Đã kích hoạt lại đơn hàng và cập nhật số lượng trong kho!");
      } else if (newStatus === 'DELIVERED') {
        toast.success("Đã chuyển trạng thái sang ĐÃ GIAO HÀNG và cập nhật số lượng đã bán!");
      } else {
        toast.success("Cập nhật trạng thái đơn hàng thành công!");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.");
    }
  };
  
  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu...</div>;
  }
  
  return (
    <div className="order-list-container">
      {/* Header */}
      <div className="page-header">
        <h1>Quản lý đơn hàng</h1>
      </div>
      
      {/* Information Box about Inventory Management */}
      <div className="info-box">
        <div className="info-icon"><i className="fa fa-info-circle"></i></div>
        <div className="info-content">
          <h3>Quản lý tồn kho tự động</h3>
          <p>Hệ thống sẽ tự động điều chỉnh số lượng sản phẩm trong kho khi:</p>
          <ul>
            <li><strong>Tạo đơn hàng mới:</strong> Giảm số lượng trong kho</li>
            <li><strong>Hủy đơn hàng:</strong> Hoàn trả số lượng sản phẩm về kho</li>
            <li><strong>Kích hoạt lại đơn đã hủy:</strong> Giảm lại số lượng trong kho</li>
          </ul>
          <p>Hãy kiểm tra kỹ trước khi thay đổi trạng thái các đơn hàng.</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="filters-section">
        <div className="search-filter">
          <div className="search-box">
            <i className="fa fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên KH, email, SĐT..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button 
                type="button"
                className="clear-search" 
                onClick={() => {
                  setSearchTerm('');
                }}
                title="Xóa tìm kiếm"
              >
                <i className="fa fa-times"></i>
              </button>
            )}
          </div>
        </div>
        
        <div className="filters-row">
          <div className="filter-group">
            <label>Trạng thái:</label>
            <select value={statusFilter} onChange={handleStatusFilterChange}>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Từ ngày:</label>
            <input
              type="date"
              name="from"
              value={dateRange.from}
              onChange={handleDateRangeChange}
            />
          </div>
          
          <div className="filter-group">
            <label>Đến ngày:</label>
            <input
              type="date"
              name="to"
              value={dateRange.to}
              onChange={handleDateRangeChange}
            />
          </div>
          
          <button className="clear-filters-btn" onClick={handleClearFilters}>
            Xóa bộ lọc
          </button>
        </div>
        
        <div className="filter-summary">
          Hiển thị {orders.length} trên tổng số {pagination.totalItems} đơn hàng
        </div>
      </div>
      
      {/* Orders Table */}
      <div className="table-container">
        <div className="sort-indicator" style={{ marginBottom: '10px', color: '#666', fontSize: '0.9em', fontStyle: 'italic' }}>
          {sortConfig.key === 'createdAt' && 
            <small>
              Đơn hàng đang được sắp xếp theo {sortConfig.direction === 'desc' ? 'mới nhất trước' : 'cũ nhất trước'}
            </small>
          }
        </div>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Mã đơn hàng</th>
              <th onClick={() => requestSort('customer')} className="sortable-header">
                Khách hàng {getSortIndicator('customer')}
              </th>
              <th>Thông tin liên hệ</th>
              <th onClick={() => requestSort('createdAt')} className="sortable-header">
                Ngày đặt {getSortIndicator('createdAt')}
              </th>
              <th onClick={() => requestSort('totalAmount')} className="sortable-header">
                Tổng tiền {getSortIndicator('totalAmount')}
              </th>
              <th>PT Thanh toán</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="loading-cell">
                  <div className="loading-spinner"></div>
                  <div>Đang tải dữ liệu...</div>
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map(order => (
                <tr key={order.id}>
                  <td>{order.orderCode}</td>
                  <td>{order.customer}</td>
                  <td>
                    <div><b>Email:</b> {order.email}</div>
                    <div><b>ĐT:</b> {order.phone}</div>
                  </td>
                  <td>{formatDate(order.date)}</td>
                  <td>{formatPrice(order.amount)}</td>
                  <td>
                    {order.payment_method === 'COD' ? (
                      <span className="payment-method cod">COD</span>
                    ) : order.payment_method === 'Bank Transfer' ? (
                      <span className="payment-method banking">Chuyển khoản</span>
                    ) : order.payment_method === 'VNPAY' ? (
                      <span className="payment-method vnpay">VNPAY</span>
                    ) : (
                      <span className="payment-method other">{order.payment_method || 'Khác'}</span>
                    )}
                  </td>
                  <td>
                    <select 
                      className={`status-select ${getStatusClass(order.status)}`}
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value, order.status)}
                    >
                      {statusOptions.filter(option => option.value !== 'all').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/orders/${order.id}`} className="view-button">
                        <i className="fa fa-eye"></i> Chi tiết
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Phân trang */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
      
      <style jsx>{`
        .order-list-container {
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .page-header {
          margin-bottom: 24px;
        }
        
        .page-header h1 {
          font-size: 24px;
          margin: 0;
          color: #333;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          font-size: 16px;
          color: #6c757d;
        }
        
        /* Filters Section */
        .filters-section {
          margin-bottom: 24px;
        }
        
        .search-filter {
          margin-bottom: 16px;
        }
        
        .search-box {
          position: relative;
          max-width: 100%;
          display: flex;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }
        
        .search-box input {
          flex: 1;
          padding: 10px 40px 10px 35px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          width: 100%;
        }
        
        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          z-index: 1;
        }
        
        .filters-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .filter-group label {
          font-size: 14px;
          color: #495057;
        }
        
        .filter-group select,
        .filter-group input {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .clear-filters-btn {
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        
        .clear-filters-btn:hover {
          background-color: #5a6268;
        }
        
        .filter-summary {
          font-size: 14px;
          color: #6c757d;
        }
        
        /* Orders Table */
        .table-container {
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
          background-color: #f8f9fa;
          font-weight: 600;
          color: #495057;
        }
        
        .sortable-header {
          cursor: pointer;
          user-select: none;
        }
        
        .sortable-header:hover {
          background-color: #e9ecef;
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
        
        .payment-method.vnpay {
          background-color: #fff3cd;
          color: #856404;
        }
        
        .payment-method.other {
          background-color: #f8f9fa;
          color: #6c757d;
        }
        
        .status-select {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .status-select.delivered {
          background-color: #d4edda;
          color: #155724;
        }
        
        .status-select.shipping {
          background-color: #cce5ff;
          color: #004085;
        }
        
        .status-select.processing {
          background-color: #fff3cd;
          color: #856404;
        }
        
        .status-select.canceled {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .view-button {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background-color: #17a2b8;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          text-decoration: none;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .view-button:hover {
          background-color: #138496;
        }
        
        .view-button i {
          margin-right: 4px;
        }
        
        .no-data {
          text-align: center;
          color: #6c757d;
          padding: 20px 0;
        }
        
        .loading-cell {
          text-align: center;
          padding: 20px 0;
        }
        
        .loading-spinner {
          margin-bottom: 8px;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-top: 4px solid #007bff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .filters-row {
            flex-direction: column;
            gap: 12px;
          }
          
          .filter-group {
            width: 100%;
          }
          
          .action-buttons {
            flex-direction: column;
          }
        }
        
        /* Info Box Styles */
        .info-box {
          display: flex;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #e8f4fd;
          border-left: 4px solid #2196f3;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .info-icon {
          flex: 0 0 30px;
          font-size: 24px;
          color: #2196f3;
          margin-right: 15px;
        }
        
        .info-content {
          flex: 1;
        }
        
        .info-content h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #0d47a1;
          font-size: 16px;
        }
        
        .info-content p {
          margin: 0 0 10px;
          color: #333;
          font-size: 14px;
        }
        
        .info-content ul {
          margin: 0 0 10px;
          padding-left: 20px;
        }
        
        .info-content li {
          margin-bottom: 5px;
          color: #333;
          font-size: 14px;
        }
        
        .info-content strong {
          font-weight: 600;
          color: #0d47a1;
        }
      `}</style>
    </div>
  );
};

export default OrderList; 
