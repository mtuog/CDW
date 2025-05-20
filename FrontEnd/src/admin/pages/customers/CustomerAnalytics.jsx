import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getUsersStatistics } from '../../../api/userApi';
import { toast } from 'react-toastify';

const CustomerAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [customerType, setCustomerType] = useState('all');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Gọi API để lấy thống kê người dùng
        const statisticsData = await getUsersStatistics();
        console.log('Fetched user statistics:', statisticsData);
        setAnalytics(statisticsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching customer analytics:", error);
        toast.error("Không thể tải dữ liệu phân tích khách hàng. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    return value.toLocaleString('vi-VN') + ' ₫';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Get chart data based on selected period
  const getGrowthData = () => {
    if (!analytics) return [];
    return period === 'month' ? analytics.customerGrowth : analytics.customerGrowthWeekly;
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu thống kê...</div>;
  }

  if (!analytics) {
    return <div className="error-container">Không thể tải dữ liệu phân tích khách hàng. Vui lòng thử lại sau.</div>;
  }

  return (
    <div className="customer-analytics-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>Phân tích khách hàng</h1>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon total-icon">
            <i className="fa fa-users"></i>
          </div>
          <div className="summary-content">
            <h3>Tổng số khách hàng</h3>
            <div className="summary-value">{analytics.summary.totalCustomers}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon active-icon">
            <i className="fa fa-user-check"></i>
          </div>
          <div className="summary-content">
            <h3>Khách hàng hoạt động</h3>
            <div className="summary-value">{analytics.summary.activeCustomers}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon new-icon">
            <i className="fa fa-user-plus"></i>
          </div>
          <div className="summary-content">
            <h3>Khách hàng mới tháng này</h3>
            <div className="summary-value">{analytics.summary.newCustomersThisMonth}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon retention-icon">
            <i className="fa fa-redo-alt"></i>
          </div>
          <div className="summary-content">
            <h3>Tỷ lệ giữ chân</h3>
            <div className="summary-value">{analytics.summary.retentionRate}%</div>
          </div>
        </div>
      </div>

      {/* Customer Growth Chart */}
      <div className="chart-section">
        <div className="chart-container growth-chart">
          <div className="chart-header">
            <h2>Tăng trưởng khách hàng</h2>
            <div className="chart-actions">
              <div className="period-selector">
                <button 
                  className={`period-btn ${period === 'week' ? 'active' : ''}`}
                  onClick={() => setPeriod('week')}
                >
                  Tuần
                </button>
                <button 
                  className={`period-btn ${period === 'month' ? 'active' : ''}`}
                  onClick={() => setPeriod('month')}
                >
                  Tháng
                </button>
              </div>
            </div>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getGrowthData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newCustomers" name="Khách hàng mới" fill="#8884d8" />
                <Bar dataKey="activeCustomers" name="Khách hàng hoạt động" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demographics Charts */}
      <div className="demographics-section">
        <h2>Thông tin nhân khẩu học</h2>
        <div className="demographics-charts">
          {/* Gender Chart */}
          <div className="chart-container demographic-chart">
            <h3>Phân bố giới tính</h3>
            <div className="chart-content pie-chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.customersByGender}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.customersByGender.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} khách hàng`, 'Số lượng']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age Chart */}
          <div className="chart-container demographic-chart">
            <h3>Phân bố độ tuổi</h3>
            <div className="chart-content pie-chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.customersByAge}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.customersByAge.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} khách hàng`, 'Số lượng']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Location Chart */}
          <div className="chart-container demographic-chart">
            <h3>Phân bố địa lý</h3>
            <div className="chart-content pie-chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.customersByLocation}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.customersByLocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} khách hàng`, 'Số lượng']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="top-customers-section">
        <div className="section-header">
          <h2>Khách hàng hàng đầu</h2>
          <div className="filter-container">
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              className="customer-type-filter"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="potential">Tiềm năng</option>
            </select>
          </div>
        </div>
        
        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Đơn hàng</th>
                <th>Tổng chi tiêu</th>
                <th>Đơn hàng gần nhất</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topCustomers
                .filter(customer => customerType === 'all' || customer.status === customerType)
                .map(customer => (
                  <tr key={customer.id}>
                    <td className="customer-cell">
                      <div className="customer-info">
                        <div className="avatar">
                          <span>{customer.name.charAt(0)}</span>
                        </div>
                        <div className="customer-details">
                          <div className="customer-name">{customer.name}</div>
                          <div className="customer-email">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{customer.orders}</td>
                    <td className="amount-cell">{formatCurrency(customer.totalSpent)}</td>
                    <td>{customer.lastOrder ? formatDate(customer.lastOrder) : 'Chưa có'}</td>
                    <td>
                      <span className={`status-badge ${customer.status}`}>
                        {customer.status === 'active' ? 'Hoạt động' : 
                          customer.status === 'potential' ? 'Tiềm năng' : 'Không hoạt động'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .customer-analytics-container {
          padding: 20px;
          background-color: #f5f7fa;
        }
        
        .page-header {
          margin-bottom: 24px;
        }
        
        .page-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .loading-container,
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          font-size: 16px;
          color: #666;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .summary-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .summary-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
        }
        
        .summary-icon i {
          font-size: 20px;
          color: white;
        }
        
        .total-icon {
          background: linear-gradient(45deg, #2196F3, #4FC3F7);
        }
        
        .active-icon {
          background: linear-gradient(45deg, #4CAF50, #8BC34A);
        }
        
        .new-icon {
          background: linear-gradient(45deg, #FF9800, #FFCA28);
        }
        
        .retention-icon {
          background: linear-gradient(45deg, #9C27B0, #BA68C8);
        }
        
        .summary-content h3 {
          font-size: 14px;
          color: #666;
          margin: 0 0 8px 0;
          font-weight: 500;
        }
        
        .summary-value {
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }
        
        .chart-section {
          margin-bottom: 30px;
        }
        
        .chart-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .chart-header h2 {
          font-size: 18px;
          margin: 0;
          color: #333;
        }
        
        .period-selector {
          display: flex;
          background: #f1f3f5;
          border-radius: 4px;
          padding: 2px;
        }
        
        .period-btn {
          background: none;
          border: none;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          color: #666;
        }
        
        .period-btn.active {
          background: #fff;
          color: #333;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .chart-content {
          width: 100%;
          height: 100%;
        }
        
        .demographics-section {
          margin-bottom: 30px;
        }
        
        .demographics-section h2 {
          font-size: 18px;
          margin: 0 0 20px 0;
          color: #333;
        }
        
        .demographics-charts {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .demographic-chart {
          padding: 20px;
        }
        
        .demographic-chart h3 {
          font-size: 16px;
          margin: 0 0 20px 0;
          color: #333;
          text-align: center;
        }
        
        .pie-chart-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .top-customers-section {
          margin-bottom: 30px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .section-header h2 {
          font-size: 18px;
          margin: 0;
          color: #333;
        }
        
        .customer-type-filter {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 14px;
        }
        
        .customers-table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          overflow: hidden;
        }
        
        .customers-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .customers-table th {
          background: #f8f9fa;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
          white-space: nowrap;
        }
        
        .customers-table td {
          padding: 12px 16px;
          border-top: 1px solid #e9ecef;
          color: #212529;
          font-size: 14px;
        }
        
        .customer-cell {
          min-width: 250px;
        }
        
        .customer-info {
          display: flex;
          align-items: center;
        }
        
        .avatar {
          width: 36px;
          height: 36px;
          background: #e9ecef;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }
        
        .avatar span {
          font-weight: 600;
          color: #495057;
        }
        
        .customer-details {
          display: flex;
          flex-direction: column;
        }
        
        .customer-name {
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .customer-email {
          font-size: 12px;
          color: #6c757d;
        }
        
        .amount-cell {
          font-weight: 500;
        }
        
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .status-badge.active {
          background-color: #e3fcef;
          color: #0ca678;
        }
        
        .status-badge.potential {
          background-color: #fff3bf;
          color: #f08c00;
        }
        
        .status-badge.inactive {
          background-color: #e9ecef;
          color: #495057;
        }
        
        @media (max-width: 768px) {
          .summary-cards {
            grid-template-columns: 1fr;
          }
          
          .demographics-charts {
            grid-template-columns: 1fr;
          }
          
          .customers-table-container {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerAnalytics; 