import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllUsers } from '../../../admin/api/userApi';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topCustomerFilter, setTopCustomerFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  
  // Status options for the filter
  const statusOptions = [
    { value: 'all', label: 'Tất cả khách hàng' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' },
    { value: 'potential', label: 'Tiềm năng' }
  ];
  
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      
      console.log('Raw user data from API:', data);
      
      // Format data from backend to match our component needs
      const formattedCustomers = data.map(user => {
        // Extract roles array from string if needed
        let roles = [];
        if (typeof user.roles === 'string') {
          // Remove 'ROLE_' prefix if present
          roles = [user.roles.replace('ROLE_', '')];
        } else if (Array.isArray(user.roles)) {
          roles = user.roles.map(role => role.replace('ROLE_', ''));
        }
        
        // Xác định trạng thái khách hàng
        const status = isActive(user);
        
        // Debug phone field
        console.log(`User ${user.username} phone:`, user.phone);
        
        const formatted = {
          id: user.id,
          name: user.fullName || user.username,
          username: user.username,
          email: user.email,
          phone: user.phone || 'Chưa cập nhật',
          address: user.address || 'Chưa cập nhật',
          createdAt: user.createdAt ? user.createdAt.split('T')[0] : 'N/A',
          orders: user.orderCount || 0,
          totalSpent: user.totalSpent || 0,
          lastOrderDate: user.lastOrderDate ? user.lastOrderDate.split('T')[0] : null,
          status: status,
          role: roles.includes('ADMIN') ? 'Admin' : 'Khách hàng',
          enabled: user.enabled !== false
        };
        
        console.log('Formatted user data:', formatted);
        return formatted;
      });
      
      setCustomers(formattedCustomers);
      setFilteredCustomers(formattedCustomers);
      
      // Set top customers based on filter
      updateTopCustomers(formattedCustomers);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Không thể tải danh sách khách hàng. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };
  
  // Kiểm tra xem người dùng có hoạt động không
  const isActive = (user) => {
    // Log thông tin để debug
    console.log(`Checking user activity for ${user.username}:`, {
      enabled: user.enabled,
      lastOrderDate: user.lastOrderDate,
      createdAt: user.createdAt,
      orders: user.orderCount
    });
    
    // Nếu tài khoản bị vô hiệu hóa
    if (user.enabled === false) {
      return 'inactive';
    }
    
    // Khách hàng tiềm năng: Đã đăng ký tài khoản nhưng chưa có đơn hàng nào
    if (user.orderCount === 0 || !user.orderCount) {
      return 'potential';
    }
    
    // Khách hàng hoạt động: Có đơn hàng và tài khoản được xác thực
    return 'active';
  };
  
  useEffect(() => {
    // Apply filters and search
    let result = [...customers];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(customer => customer.status === statusFilter);
    }
    
    // Apply search
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(customer => 
        customer.name.toLowerCase().includes(lowercasedSearch) ||
        customer.username.toLowerCase().includes(lowercasedSearch) ||
        customer.email.toLowerCase().includes(lowercasedSearch) ||
        customer.phone.includes(searchTerm)
      );
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortConfig.key === 'createdAt') {
        if (a.createdAt === 'N/A') return 1;
        if (b.createdAt === 'N/A') return -1;
        return sortConfig.direction === 'asc' 
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortConfig.key === 'orders') {
        return sortConfig.direction === 'asc' 
          ? a.orders - b.orders
          : b.orders - a.orders;
      } else if (sortConfig.key === 'totalSpent') {
        return sortConfig.direction === 'asc' 
          ? a.totalSpent - b.totalSpent
          : b.totalSpent - a.totalSpent;
      } else {
        return 0;
      }
    });
    
    setFilteredCustomers(result);
  }, [customers, statusFilter, searchTerm, sortConfig]);
  
  useEffect(() => {
    updateTopCustomers(customers);
  }, [topCustomerFilter, customers]);

  // Function to update top customers based on filter
  const updateTopCustomers = (customersData = customers) => {
    if (!customersData.length) return;
    
    let filtered = [...customersData];
    
    // Apply top customer filter
    if (topCustomerFilter === 'spending') {
      filtered = filtered.filter(customer => customer.totalSpent > 0)
                         .sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (topCustomerFilter === 'orders') {
      filtered = filtered.filter(customer => customer.orders > 0)
                         .sort((a, b) => b.orders - a.orders);
    } else if (topCustomerFilter === 'recent') {
      filtered = filtered.filter(customer => customer.lastOrderDate)
                         .sort((a, b) => new Date(b.lastOrderDate || 0) - new Date(a.lastOrderDate || 0));
    }
    
    // Debug top customers
    console.log('Top customers with phone data:', filtered.slice(0, 5).map(c => ({
      name: c.name,
      phone: c.phone
    })));
    
    // Take top 5
    setTopCustomers(filtered.slice(0, 5));
  };

  // Handle top customer filter change
  const handleTopCustomerFilterChange = (e) => {
    setTopCustomerFilter(e.target.value);
  };
  
  // Format date string to display format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  // Format price to Vietnamese format
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
  
  // Handle clearing all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };
  
  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };
  
  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu...</div>;
  }
  
  return (
    <div className="customer-list-container">
      {/* Header */}
      <div className="page-header">
        <h1>Quản lý khách hàng</h1>
      </div>
      
      {/* Top Customers Section */}
      <div className="top-customers-section">
        <div className="top-customers-header">
          <h2>Khách hàng hàng đầu</h2>
          <div className="top-filter">
            <select value={topCustomerFilter} onChange={handleTopCustomerFilterChange}>
              <option value="all">Tất cả khách hàng</option>
              <option value="spending">Chi tiêu cao nhất</option>
              <option value="orders">Đơn hàng nhiều nhất</option>
              <option value="recent">Mua hàng gần đây</option>
            </select>
          </div>
        </div>
        <div className="top-customers-table-container">
          <table className="top-customers-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Thông tin liên hệ</th>
                <th>Số đơn hàng</th>
                <th>Tổng chi tiêu</th>
                <th>Đơn hàng gần nhất</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.length > 0 ? (
                topCustomers.map(customer => (
                  <tr key={`top-${customer.id}`}>
                    <td>
                      <div className="customer-name">
                        <Link to={`/admin/customers/${customer.id}`} className="customer-link">
                          {customer.name}
                        </Link>
                        {customer.role === 'Admin' && (
                          <span className="admin-badge">Admin</span>
                        )}
                      </div>
                      <div className="customer-username">@{customer.username}</div>
                    </td>
                    <td>
                      <div>{customer.email}</div>
                      <div>{customer.phone}</div>
                    </td>
                    <td>{customer.orders}</td>
                    <td>{formatPrice(customer.totalSpent)}</td>
                    <td>{customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Chưa cập nhật'}</td>
                    <td>
                      <span className={`status-badge ${customer.status}`}>
                        {customer.status === 'active' ? 'Hoạt động' : 
                         customer.status === 'potential' ? 'Tiềm năng' : 'Không hoạt động'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    Chưa có dữ liệu chi tiêu khách hàng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Information Box about Customer Management */}
      <div className="info-box">
        <div className="info-icon"><i className="fa fa-info-circle"></i></div>
        <div className="info-content">
          <h3>Thông tin khách hàng</h3>
          <p>Danh sách này hiển thị tất cả khách hàng đã đăng ký tài khoản trên hệ thống.</p>
          <ul>
            <li><strong>Khách hàng hoạt động:</strong> Đã đặt hàng trong 6 tháng gần đây hoặc mới đăng ký trong 3 tháng gần đây</li>
            <li><strong>Khách hàng không hoạt động:</strong> Không có đơn hàng trong 6 tháng gần đây và không còn hoạt động</li>
          </ul>
        </div>
      </div>
      
      {/* Filters */}
      <div className="filters-section">
        <div className="search-filter">
          <div className="search-box">
            <i className="fa fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => setSearchTerm('')}
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
          
          <button className="clear-filters-btn" onClick={handleClearFilters}>
            Xóa bộ lọc
          </button>
        </div>
        
        <div className="filter-summary">
          Hiển thị {filteredCustomers.length} trên tổng số {customers.length} khách hàng
        </div>
      </div>
      
      {/* Customers Table */}
      <div className="table-container">
        <table className="customers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th onClick={() => requestSort('name')} className="sortable-header">
                Khách hàng {getSortIndicator('name')}
              </th>
              <th>Thông tin liên hệ</th>
              <th>Địa chỉ</th>
              <th onClick={() => requestSort('createdAt')} className="sortable-header">
                Ngày đăng ký {getSortIndicator('createdAt')}
              </th>
              <th onClick={() => requestSort('orders')} className="sortable-header">
                Số đơn hàng {getSortIndicator('orders')}
              </th>
              <th onClick={() => requestSort('totalSpent')} className="sortable-header">
                Tổng chi tiêu {getSortIndicator('totalSpent')}
              </th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="loading-cell">
                  <div className="loading-spinner"></div>
                  <div>Đang tải dữ liệu...</div>
                </td>
              </tr>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>
                    <div className="customer-name">
                      {customer.name}
                      {customer.role === 'Admin' && (
                        <span className="admin-badge">Admin</span>
                      )}
                    </div>
                    <div className="customer-username">@{customer.username}</div>
                  </td>
                  <td>
                    <div>{customer.email}</div>
                    <div>{customer.phone}</div>
                  </td>
                  <td className="address-cell">{customer.address}</td>
                  <td>{formatDate(customer.createdAt)}</td>
                  <td>{customer.orders}</td>
                  <td>{formatPrice(customer.totalSpent)}</td>
                  <td>
                    <span className={`status-badge ${customer.status}`}>
                      {customer.status === 'active' ? 'Hoạt động' : 
                       customer.status === 'potential' ? 'Tiềm năng' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/customers/${customer.id}`} className="view-button">
                        <i className="fa fa-eye"></i>
                      </Link>
                      <Link to={`/admin/customers/${customer.id}/orders`} className="orders-button">
                        <i className="fa fa-shopping-cart"></i>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">
                  Không tìm thấy khách hàng nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <style jsx>{`
        .customer-list-container {
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
        
        /* Top Customers Section */
        .top-customers-section {
          margin-bottom: 30px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .top-customers-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }
        
        .top-customers-section h2 {
          font-size: 18px;
          margin: 0;
          color: #333;
        }
        
        .top-filter select {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          background-color: white;
        }
        
        .top-customers-table-container {
          overflow-x: auto;
        }
        
        .top-customers-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .top-customers-table th,
        .top-customers-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        
        .top-customers-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #495057;
        }
        
        .top-customers-table tr:last-child td {
          border-bottom: none;
        }
        
        .top-customers-table tr:hover {
          background-color: #f1f3f5;
        }
        
        .customer-link {
          color: #007bff;
          text-decoration: none;
          font-weight: 500;
        }
        
        .customer-link:hover {
          text-decoration: underline;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          font-size: 16px;
          color: #6c757d;
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
        
        /* Filters Section */
        .filters-section {
          margin-bottom: 24px;
        }
        
        .search-filter {
          margin-bottom: 16px;
        }
        
        .search-box {
          position: relative;
          max-width: 500px;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }
        
        .search-box input {
          width: 100%;
          padding: 10px 40px 10px 35px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
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
        
        .filter-group select {
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
        
        /* Customers Table */
        .table-container {
          overflow-x: auto;
        }
        
        .customers-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .customers-table th,
        .customers-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        
        .customers-table th {
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
        
        .customer-name {
          font-weight: 500;
          color: #212529;
          display: flex;
          align-items: center;
        }
        
        .customer-username {
          font-size: 12px;
          color: #6c757d;
        }
        
        .admin-badge {
          background-color: #dc3545;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 8px;
          font-weight: normal;
        }
        
        .address-cell {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
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
        
        .status-badge.potential {
          background-color: #fff3cd;
          color: #856404;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .view-button,
        .orders-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          text-decoration: none;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .view-button {
          background-color: #17a2b8;
        }
        
        .view-button:hover {
          background-color: #138496;
        }
        
        .orders-button {
          background-color: #28a745;
        }
        
        .orders-button:hover {
          background-color: #218838;
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
      `}</style>
    </div>
  );
};

export default CustomerList; 