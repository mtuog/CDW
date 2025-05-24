import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BACKEND_URL_HTTP } from '../../../config';
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { getAllOrders, getOrdersStatistics } from '../../../api/orderApi';
import { getAllUsers, getUsersStatistics } from '../../../api/userApi';
import { getAllProducts, getTopSellingProducts, getFeaturedProducts } from '../../../api/productApi';
import { getAllCategories } from '../../../api/categoryApi';
import SalesChart from '../../components/sections/dashboard/SalesChart';
import TopProductsTable from '../../components/sections/dashboard/TopProductsTable';
import RecentOrdersTable from '../../components/sections/dashboard/RecentOrdersTable';
import CustomerGrowthChart from '../../components/sections/dashboard/CustomerGrowthChart';
import FeaturedProductsTable from '../../components/sections/dashboard/FeaturedProductsTable';

const Dashboard = () => {
  const [stats, setStats] = useState({
    salesData: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      canceledOrders: 0
    },
    monthlyRevenueData: [],
    weeklyRevenueData: [],
    productCategoriesData: [],
    topSellingProducts: [],
    featuredProducts: [],
    recentOrders: [],
    customerData: {
      customerGrowth: [],
      customerGrowthWeekly: [],
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomersThisMonth: 0,
      retentionRate: 0
    }
  });
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Khởi tạo đối tượng để lưu dữ liệu dashboard
        let dashboardData = {
          salesData: {
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            pendingOrders: 0,
            processingOrders: 0,
            shippingOrders: 0,
            completedOrders: 0,
            canceledOrders: 0
          },
          monthlyRevenueData: [],
          weeklyRevenueData: [],
          productCategoriesData: [],
          topSellingProducts: [],
          featuredProducts: [],
          recentOrders: [],
          customerData: {
            customerGrowth: [],
            customerGrowthWeekly: [],
            totalCustomers: 0,
            activeCustomers: 0,
            newCustomersThisMonth: 0,
            retentionRate: 0
          }
        };
        
        // Mảng để lưu kết quả các Promise
        const apiResults = {
          ordersStats: null,
          usersStats: null,
          recentOrders: null,
          products: null,
          topSellingProducts: null,
          featuredProducts: null,
          categories: null
        };
        
        try {
          // Gọi tất cả API cùng lúc
          const [ordersStats, usersStats, recentOrders, products, categories, topSelling, featured] = await Promise.allSettled([
            getOrdersStatistics(),
            getUsersStatistics(),
            getAllOrders({ limit: 5, sortBy: 'createdAt', direction: 'DESC' }),
            getAllProducts(),
            getAllCategories(),
            getTopSellingProducts(),
            getFeaturedProducts()
          ]);
          
          // Kiểm tra và lưu kết quả của từng API
          if (ordersStats.status === 'fulfilled') {
            apiResults.ordersStats = ordersStats.value;
          } else {
            console.error("Error fetching order stats:", ordersStats.reason);
          }
          
          if (usersStats.status === 'fulfilled') {
            apiResults.usersStats = usersStats.value;
          } else {
            console.error("Error fetching user stats:", usersStats.reason);
          }
          
          if (recentOrders.status === 'fulfilled') {
            apiResults.recentOrders = recentOrders.value;
            console.log("Recent orders API response:", recentOrders.value);
          } else {
            console.error("Error fetching recent orders:", recentOrders.reason);
          }
          
          if (products.status === 'fulfilled') {
            apiResults.products = products.value;
          } else {
            console.error("Error fetching products:", products.reason);
          }
          
          if (categories.status === 'fulfilled') {
            apiResults.categories = categories.value;
          } else {
            console.error("Error fetching categories:", categories.reason);
          }
          
          if (topSelling.status === 'fulfilled') {
            apiResults.topSellingProducts = topSelling.value;
          } else {
            console.error("Error fetching top selling products:", topSelling.reason);
          }
          
          if (featured.status === 'fulfilled') {
            apiResults.featuredProducts = featured.value;
          } else {
            console.error("Error fetching featured products:", featured.reason);
          }
          
          // Xử lý dữ liệu thống kê đơn hàng
          if (apiResults.ordersStats) {
            dashboardData.salesData = {
              totalRevenue: apiResults.ordersStats.totalRevenue || 0,
              totalOrders: apiResults.ordersStats.totalOrders || 0,
              averageOrderValue: apiResults.ordersStats.averageOrderValue || 0,
              pendingOrders: apiResults.ordersStats.countByStatus?.PENDING || 0,
              processingOrders: apiResults.ordersStats.countByStatus?.PROCESSING || 0,
              shippingOrders: apiResults.ordersStats.countByStatus?.SHIPPED || 0,
              completedOrders: apiResults.ordersStats.countByStatus?.DELIVERED || 0,
              canceledOrders: apiResults.ordersStats.countByStatus?.CANCELLED || 0
            };
            
            dashboardData.monthlyRevenueData = apiResults.ordersStats.revenueByMonth || [];
            dashboardData.weeklyRevenueData = apiResults.ordersStats.revenueByWeek || [];
          }
          
          // Xử lý dữ liệu thống kê người dùng
          if (apiResults.usersStats) {
            dashboardData.customerData = {
              customerGrowth: apiResults.usersStats.customerGrowth || [],
              customerGrowthWeekly: apiResults.usersStats.customerGrowthWeekly || [],
              totalCustomers: apiResults.usersStats.summary?.totalCustomers || 0,
              activeCustomers: apiResults.usersStats.summary?.activeCustomers || 0,
              newCustomersThisMonth: apiResults.usersStats.summary?.newCustomersThisMonth || 0,
              retentionRate: apiResults.usersStats.summary?.retentionRate || 0
            };
          }
          
          // Xử lý dữ liệu đơn hàng gần đây
          if (apiResults.recentOrders) {
            console.log("Processing recent orders:", apiResults.recentOrders);
            
            // Kiểm tra xem dữ liệu trả về có cấu trúc { orders: [...] } không
            const ordersData = apiResults.recentOrders.orders ? apiResults.recentOrders.orders : apiResults.recentOrders;
            
            if (Array.isArray(ordersData) && ordersData.length > 0) {
              dashboardData.recentOrders = ordersData.map(order => ({
                id: order.id,
                orderCode: order.orderCode,
                customer: order.user ? order.user.username : 'Khách vãng lai',
                date: new Date(order.createdAt).toISOString().split('T')[0],
                amount: order.totalAmount,
                status: order.status
              }));
              console.log("Processed recent orders:", dashboardData.recentOrders);
            } else {
              console.error("Recent orders data is not in expected format:", ordersData);
            }
          }
          
          // Xử lý dữ liệu danh mục sản phẩm
          if (apiResults.products && apiResults.products.length > 0) {
            // Tạo dữ liệu phân loại sản phẩm theo danh mục
            const productsByCategory = {};
            
            // Đếm số lượng sản phẩm trong mỗi danh mục
            apiResults.products.forEach(product => {
              const categoryName = product.category ? product.category.name : 'Không phân loại';
              
              if (!productsByCategory[categoryName]) {
                productsByCategory[categoryName] = 0;
              }
              
              productsByCategory[categoryName]++;
            });
            
            // Chuyển đổi dữ liệu danh mục thành định dạng cho biểu đồ
            dashboardData.productCategoriesData = Object.entries(productsByCategory).map(([name, value]) => ({
              name,
              value
            }));
            
            // Tìm top 5 sản phẩm bán chạy nhất (từ tất cả sản phẩm)
            dashboardData.topSellingProducts = [...apiResults.products]
              .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
              .slice(0, 5)
              .map(product => ({
                id: product.id,
                name: product.name,
                price: product.price,
                sold: product.soldCount || 0,
                image: product.img || 'https://via.placeholder.com/50'
              }));
          }
          
          // Sử dụng API top-selling nếu có dữ liệu
          if (apiResults.topSellingProducts && apiResults.topSellingProducts.length > 0) {
            dashboardData.topSellingProducts = apiResults.topSellingProducts.map(product => ({
              id: product.id,
              name: product.name,
              price: product.price,
              sold: product.soldCount || 0,
              image: product.img || 'https://via.placeholder.com/50'
            }));
          }
          
          // Sử dụng API featured nếu có dữ liệu
          if (apiResults.featuredProducts && apiResults.featuredProducts.length > 0) {
            dashboardData.featuredProducts = apiResults.featuredProducts.map(product => ({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.img || 'https://via.placeholder.com/50',
              likesCount: product.likesCount || 0
            }));
          }
          
          // Kiểm tra nếu không có dữ liệu từ API
          const hasRealData = apiResults.ordersStats || apiResults.usersStats || (apiResults.recentOrders && apiResults.recentOrders.length > 0);
          
          if (!hasRealData) {
            console.log("No data available from API");
          }
          
          setStats(dashboardData);
          
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error in dashboard:", error);
        setLoading(false);
        setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
      }
    };
    
    fetchStats();
  }, []);
  
  // Format number to Vietnamese currency
  const formatCurrency = (value) => {
    return value.toLocaleString('vi-VN') + ' ₫';
  };
  
  // Format date string to display format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };
  
  // Get chart data based on selected period
  const getChartData = () => {
    if (!stats) return [];
    return period === 'month' ? stats.monthlyRevenueData : stats.weeklyRevenueData;
  };
  
  // Get customer data based on selected period
  const getCustomerData = () => {
    if (!stats?.customerData) return [];
    return period === 'month' ? stats.customerData.customerGrowth : stats.customerData.customerGrowthWeekly;
  };
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#58D68D', '#F4D03F'];
  
  // Cập nhật hàm getStatusClass để phù hợp với enum từ backend
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
  
  // Hàm dịch trạng thái sang tiếng Việt
  const translateStatus = (status) => {
    const statusTranslations = {
      'PENDING': 'Đang xử lý',
      'PROCESSING': 'Đang chuẩn bị',
      'SHIPPED': 'Đang vận chuyển',
      'DELIVERED': 'Đã giao hàng',
      'CANCELLED': 'Đã hủy'
    };
    
    return statusTranslations[status] || status;
  };
  
  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu thống kê...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  if (!stats) {
    return <div className="error-container">Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.</div>;
  }
  
  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>Thống kê bán hàng</h1>
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
      
      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stats-card">
          <div className="stats-icon revenue-icon">
            <i className="fa fa-money-bill-wave"></i>
          </div>
          <div className="stats-content">
            <h3>Tổng doanh thu</h3>
            <div className="stats-value">{formatCurrency(stats.salesData.totalRevenue)}</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon orders-icon">
            <i className="fa fa-shopping-cart"></i>
          </div>
          <div className="stats-content">
            <h3>Tổng đơn hàng</h3>
            <div className="stats-value">{stats.salesData.totalOrders}</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon avg-icon">
            <i className="fa fa-chart-line"></i>
          </div>
          <div className="stats-content">
            <h3>Giá trị đơn hàng TB</h3>
            <div className="stats-value">{formatCurrency(stats.salesData.averageOrderValue)}</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon pending-icon">
            <i className="fa fa-clock"></i>
          </div>
          <div className="stats-content">
            <h3>Đơn chờ xử lý</h3>
            <div className="stats-value">{stats.salesData.pendingOrders}</div>
          </div>
        </div>
      </div>
      
      {/* Customer Stats Cards */}
      <div className="stats-cards">
        <div className="stats-card">
          <div className="stats-icon customers-icon">
            <i className="fa fa-users"></i>
          </div>
          <div className="stats-content">
            <h3>Tổng khách hàng</h3>
            <div className="stats-value">{stats.customerData?.totalCustomers || 0}</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon active-icon">
            <i className="fa fa-user-check"></i>
          </div>
          <div className="stats-content">
            <h3>Khách hàng hoạt động</h3>
            <div className="stats-value">{stats.customerData?.activeCustomers || 0}</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon new-icon">
            <i className="fa fa-user-plus"></i>
          </div>
          <div className="stats-content">
            <h3>Khách hàng mới</h3>
            <div className="stats-value">{stats.customerData?.newCustomersThisMonth || 0}</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon retention-icon">
            <i className="fa fa-redo-alt"></i>
          </div>
          <div className="stats-content">
            <h3>Tỷ lệ giữ chân</h3>
            <div className="stats-value">{stats.customerData?.retentionRate || 0}%</div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="charts-container">
        <div className="chart-row">
          <div className="chart-column">
            <SalesChart 
              data={getChartData()} 
              period={period} 
              formatCurrency={formatCurrency} 
            />
          </div>
          
          <div className="chart-column">
            <CustomerGrowthChart 
              data={getCustomerData()} 
              period={period} 
            />
          </div>
        </div>
      </div>
      
      {/* Product Categories */}
      <div className="categories-chart-section">
        <div className="section-header">
          <h2>Phân loại sản phẩm</h2>
        </div>
        
        <div className="pie-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.productCategoriesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {stats.productCategoriesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Products and Orders */}
      <div className="tables-container">
        <div className="table-column">
          <TopProductsTable 
            products={stats.topSellingProducts} 
            formatCurrency={formatCurrency} 
          />
        </div>
        
        <div className="table-column">
          <RecentOrdersTable 
            orders={stats.recentOrders} 
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusClass={getStatusClass}
            translateStatus={translateStatus}
          />
        </div>
      </div>

      {/* Featured Products */}
      <div className="tables-container">
        <div className="table-column">
          <FeaturedProductsTable 
            products={stats.featuredProducts || []} 
            formatCurrency={formatCurrency} 
          />
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 20px;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .page-header h1 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }
        
        .period-selector {
          display: flex;
          gap: 8px;
        }
        
        .period-btn {
          padding: 8px 16px;
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
        
        /* Stats Cards */
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .stats-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 20px;
          display: flex;
          align-items: center;
        }
        
        .stats-icon {
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
        
        .revenue-icon {
          background-color: #28a745;
        }
        
        .orders-icon {
          background-color: #007bff;
        }
        
        .avg-icon {
          background-color: #17a2b8;
        }
        
        .pending-icon {
          background-color: #ffc107;
        }
        
        .customers-icon {
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
        
        .stats-content h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #6c757d;
        }
        
        .stats-value {
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }
        
        /* Charts */
        .charts-container {
          margin-bottom: 24px;
        }
        
        .chart-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 20px;
        }
        
        .chart-column {
          flex: 1;
        }
        
        /* Categories Chart */
        .categories-chart-section {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 20px;
          margin-bottom: 24px;
        }
        
        .section-header {
          margin-bottom: 16px;
        }
        
        .section-header h2 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .pie-chart-container {
          height: 300px;
        }
        
        /* Tables */
        .tables-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 20px;
        }
        
        .table-column {
          flex: 1;
        }
        
        @media (max-width: 992px) {
          .chart-row, .tables-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 