import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getUsersStatistics } from '../../../api/userApi';

const CustomerAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [customerType, setCustomerType] = useState('all');

  // Mock data
  const generateMockData = () => {
    const customersByGender = [
      { name: 'Nam', value: 62 },
      { name: 'Nữ', value: 38 }
    ];

    const customersByAge = [
      { name: '18-24', value: 25 },
      { name: '25-34', value: 42 },
      { name: '35-44', value: 18 },
      { name: '45-54', value: 10 },
      { name: '55+', value: 5 }
    ];

    const customersByLocation = [
      { name: 'TP.HCM', value: 45 },
      { name: 'Hà Nội', value: 30 },
      { name: 'Đà Nẵng', value: 10 },
      { name: 'Cần Thơ', value: 7 },
      { name: 'Khác', value: 8 }
    ];

    const customerGrowth = [
      { name: 'T1', newCustomers: 30, activeCustomers: 120 },
      { name: 'T2', newCustomers: 42, activeCustomers: 140 },
      { name: 'T3', newCustomers: 38, activeCustomers: 160 },
      { name: 'T4', newCustomers: 45, activeCustomers: 185 },
      { name: 'T5', newCustomers: 50, activeCustomers: 210 },
      { name: 'T6', newCustomers: 55, activeCustomers: 235 }
    ];

    const customerGrowthWeekly = [
      { name: 'Tuần 1', newCustomers: 12, activeCustomers: 80 },
      { name: 'Tuần 2', newCustomers: 15, activeCustomers: 85 },
      { name: 'Tuần 3', newCustomers: 18, activeCustomers: 92 },
      { name: 'Tuần 4', newCustomers: 10, activeCustomers: 88 }
    ];

    const topCustomers = [
      { 
        id: 1, 
        name: 'Nguyễn Văn A', 
        email: 'nguyenvana@example.com', 
        phone: '0912345678', 
        orders: 8, 
        totalSpent: 12500000, 
        lastOrder: '2023-07-18', 
        status: 'active'
      },
      { 
        id: 2, 
        name: 'Trần Thị B', 
        email: 'tranthib@example.com', 
        phone: '0923456789', 
        orders: 6, 
        totalSpent: 9800000, 
        lastOrder: '2023-07-20', 
        status: 'active'
      },
      { 
        id: 3, 
        name: 'Phạm Văn C', 
        email: 'phamvanc@example.com', 
        phone: '0934567890', 
        orders: 5, 
        totalSpent: 8200000, 
        lastOrder: '2023-07-15', 
        status: 'active'
      },
      { 
        id: 4, 
        name: 'Lê Thị D', 
        email: 'lethid@example.com', 
        phone: '0945678901', 
        orders: 4, 
        totalSpent: 6500000, 
        lastOrder: '2023-07-22', 
        status: 'active'
      },
      { 
        id: 5, 
        name: 'Hoàng Văn E', 
        email: 'hoangvane@example.com', 
        phone: '0956789012', 
        orders: 4, 
        totalSpent: 5800000, 
        lastOrder: '2023-07-10', 
        status: 'inactive'
      }
    ];

    const summary = {
      totalCustomers: 1258,
      activeCustomers: 850,
      newCustomersThisMonth: 55,
      retentionRate: 78.5,
      averageOrderValue: 1230000
    };

    return {
      customersByGender,
      customersByAge,
      customersByLocation,
      customerGrowth,
      customerGrowthWeekly,
      topCustomers,
      summary
    };
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Gọi API để lấy thống kê người dùng
        const statisticsData = await getUsersStatistics();
        setAnalytics(statisticsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching customer analytics:", error);
        setLoading(false);
        
        // Nếu lỗi, sử dụng dữ liệu mẫu
        setAnalytics(generateMockData());
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
                <Bar dataKey="potentialCustomers" name="Khách hàng hàng đầu" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demographics Charts */}
      <div className="demographics-section">
        <h2>Nhân khẩu học khách hàng</h2>
        <div className="demographics-charts">
          <div className="demographic-chart">
            <h3>Theo giới tính</h3>
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.customersByGender}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.customersByGender.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="demographic-chart">
            <h3>Theo độ tuổi</h3>
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.customersByAge}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.customersByAge.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="demographic-chart">
            <h3>Theo khu vực</h3>
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.customersByLocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.customersByLocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
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
          <div className="header-actions">
            <select 
              value={customerType} 
              onChange={(e) => setCustomerType(e.target.value)}
              className="customer-filter"
            >
              <option value="all">Tất cả khách hàng</option>
              <option value="active">Khách hàng hoạt động</option>
              <option value="potential">Khách hàng tiềm năng</option>
              <option value="inactive">Khách hàng không hoạt động</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="customers-table">
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
              {analytics.topCustomers
                .filter(customer => customerType === 'all' || customer.status === customerType)
                .map(customer => (
                  <tr key={customer.id}>
                    <td className="customer-name">{customer.name}</td>
                    <td>
                      <div>{customer.email}</div>
                      <div>{customer.phone}</div>
                    </td>
                    <td>{customer.orders}</td>
                    <td>{formatCurrency(customer.totalSpent)}</td>
                    <td>{formatDate(customer.lastOrder)}</td>
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
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 24px;
          margin: 0;
          color: #333;
        }

        .loading-container, .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          font-size: 16px;
          color: #6c757d;
        }

        .error-container {
          color: #dc3545;
        }

        /* Summary Cards */
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .summary-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 20px;
          display: flex;
          align-items: center;
        }

        .summary-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 20px;
          color: white;
        }

        .total-icon {
          background-color: #6f42c1;
        }

        .active-icon {
          background-color: #28a745;
        }

        .new-icon {
          background-color: #007bff;
        }

        .retention-icon {
          background-color: #fd7e14;
        }

        .summary-content h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #6c757d;
        }

        .summary-value {
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }

        /* Charts */
        .chart-section {
          margin-bottom: 24px;
        }

        .chart-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 20px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .chart-header h2 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .period-selector {
          display: flex;
          gap: 8px;
        }

        .period-btn {
          padding: 6px 12px;
          background-color: #f8f9fa;
          border: 1px solid #ced4da;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
        }

        .period-btn.active {
          background-color: #007bff;
          color: white;
          border-color: #007bff;
        }

        /* Demographics */
        .demographics-section {
          margin-bottom: 24px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 20px;
        }

        .demographics-section h2 {
          margin: 0 0 20px 0;
          font-size: 18px;
          color: #333;
        }

        .demographics-charts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .demographic-chart {
          text-align: center;
        }

        .demographic-chart h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #495057;
        }

        .pie-container {
          height: 200px;
        }

        /* Top Customers */
        .top-customers-section {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .customer-filter {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          background-color: white;
        }

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
          font-weight: 600;
          color: #495057;
          background-color: #f8f9fa;
        }

        .customer-name {
          font-weight: 600;
          color: #333;
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

        @media (max-width: 768px) {
          .demographics-charts {
            grid-template-columns: 1fr;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerAnalytics; 