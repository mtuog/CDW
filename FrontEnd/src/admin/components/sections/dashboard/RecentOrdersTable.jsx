import React from 'react';
import { Link } from 'react-router-dom';

const RecentOrdersTable = ({ orders, formatCurrency, formatDate, getStatusClass, translateStatus }) => {
  return (
    <div className="recent-orders-section">
      <div className="section-header">
        <h2>Đơn hàng gần đây</h2>
        <Link to="/admin/orders" className="view-all-link">
          Xem tất cả
        </Link>
      </div>
      
      <div className="table-container">
        <table className="recent-orders-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th>Giá trị</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="order-id">#{order.orderCode || order.id}</td>
                <td className="customer-name">{order.customer}</td>
                <td className="order-date">{formatDate(order.date)}</td>
                <td className="order-amount">{formatCurrency(order.amount)}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {translateStatus(order.status)}
                  </span>
                </td>
                <td>
                  <Link to={`/admin/orders/${order.id}`} className="view-details-link">
                    Chi tiết
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="6" className="no-data">
                  Chưa có đơn hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .recent-orders-section {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 20px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .section-header h2 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .view-all-link {
          font-size: 14px;
          color: #007bff;
          text-decoration: none;
        }
        
        .view-all-link:hover {
          text-decoration: underline;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .recent-orders-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .recent-orders-table th,
        .recent-orders-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        
        .recent-orders-table th {
          font-weight: 600;
          color: #495057;
          background-color: #f8f9fa;
        }
        
        .order-id {
          font-family: monospace;
          font-weight: 600;
        }
        
        .customer-name {
          font-weight: 500;
        }
        
        .order-date {
          color: #6c757d;
        }
        
        .order-amount {
          font-weight: 500;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
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
        
        .status-badge.canceled {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .view-details-link {
          color: #007bff;
          text-decoration: none;
          font-size: 14px;
        }
        
        .view-details-link:hover {
          text-decoration: underline;
        }
        
        .no-data {
          text-align: center;
          color: #6c757d;
          padding: 24px 0;
        }
      `}</style>
    </div>
  );
};

export default RecentOrdersTable; 