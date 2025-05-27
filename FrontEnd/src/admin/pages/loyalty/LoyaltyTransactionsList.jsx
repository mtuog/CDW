import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faSearch, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const LoyaltyTransactionsList = ({ transactions, user, onAddPoints, onRedeemPoints }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const handleAddPoints = () => {
    if (!user) return;
    
    Swal.fire({
      title: 'Thêm điểm',
      html: `
        <div class="swal2-input-container">
          <input 
            id="points" 
            class="swal2-input" 
            type="number" 
            min="1" 
            placeholder="Số điểm"
            style="margin-bottom: 10px;"
          >
          <input 
            id="description" 
            class="swal2-input" 
            placeholder="Mô tả (vd: Thưởng chương trình khảo sát)"
          >
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Thêm',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const points = document.getElementById('points').value;
        const description = document.getElementById('description').value;
        
        if (!points || isNaN(points) || parseInt(points) <= 0) {
          Swal.showValidationMessage('Vui lòng nhập số điểm hợp lệ (lớn hơn 0)');
          return false;
        }
        
        if (!description) {
          Swal.showValidationMessage('Vui lòng nhập mô tả');
          return false;
        }
        
        return { points: parseInt(points), description };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        onAddPoints(user.id, result.value.points, result.value.description);
      }
    });
  };
  
  const handleRedeemPoints = () => {
    if (!user) return;
    
    Swal.fire({
      title: 'Trừ điểm',
      html: `
        <div class="swal2-input-container">
          <input 
            id="points" 
            class="swal2-input" 
            type="number" 
            min="1" 
            max="${user.loyaltyPoints || 0}"
            placeholder="Số điểm"
            style="margin-bottom: 10px;"
          >
          <input 
            id="description" 
            class="swal2-input" 
            placeholder="Mô tả (vd: Điều chỉnh do nhập sai)"
          >
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Trừ điểm',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const points = document.getElementById('points').value;
        const description = document.getElementById('description').value;
        
        if (!points || isNaN(points) || parseInt(points) <= 0) {
          Swal.showValidationMessage('Vui lòng nhập số điểm hợp lệ (lớn hơn 0)');
          return false;
        }
        
        if (parseInt(points) > (user.loyaltyPoints || 0)) {
          Swal.showValidationMessage(`Số điểm không thể lớn hơn số điểm hiện có (${user.loyaltyPoints || 0})`);
          return false;
        }
        
        if (!description) {
          Swal.showValidationMessage('Vui lòng nhập mô tả');
          return false;
        }
        
        return { points: parseInt(points), description };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        onRedeemPoints(user.id, result.value.points, result.value.description);
      }
    });
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.orderCode && transaction.orderCode.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  return (
    <div className="loyalty-transactions-list">
      <div className="user-info">
        <div className="user-details">
          <h3>{user.username}</h3>
          <p>Email: {user.email}</p>
          <p>Họ tên: {user.fullName || '(Chưa cập nhật)'}</p>
        </div>
        <div className="loyalty-summary">
          <div className="points-display">
            <span className="points-label">Điểm tích lũy:</span>
            <span className="points-value">{user.loyaltyPoints || 0}</span>
          </div>
          <div className="rank-display">
            <span className="rank-label">Hạng thành viên:</span>
            <span className="rank-value">{user.membershipRank || 'BRONZE'}</span>
          </div>
          <div className="actions">
            <button
              className="btn btn-primary add-btn"
              onClick={handleAddPoints}
              title="Thêm điểm"
            >
              <FontAwesomeIcon icon={faPlus} /> Thêm điểm
            </button>
            <button
              className="btn btn-danger redeem-btn"
              onClick={handleRedeemPoints}
              disabled={!user.loyaltyPoints || user.loyaltyPoints <= 0}
              title="Trừ điểm"
            >
              <FontAwesomeIcon icon={faMinus} /> Trừ điểm
            </button>
          </div>
        </div>
      </div>
      
      <div className="filters">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Tìm kiếm theo mô tả, mã đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="type-filter">
          <label>Loại giao dịch:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="EARN">Tích điểm</option>
            <option value="REDEEM">Đổi điểm</option>
          </select>
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Mô tả</th>
              <th>Điểm</th>
              <th>Loại</th>
              <th>Mã đơn hàng</th>
              <th>Giá trị đơn hàng</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.description}</td>
                  <td className={`points-cell ${transaction.type === 'EARN' ? 'earn' : 'redeem'}`}>
                    {transaction.type === 'EARN' ? '+' : '-'}{transaction.points}
                  </td>
                  <td>
                    <span className={`type-badge ${transaction.type === 'EARN' ? 'earn' : 'redeem'}`}>
                      {transaction.type === 'EARN' ? 'Tích điểm' : 'Đổi điểm'}
                    </span>
                  </td>
                  <td>
                    {transaction.orderCode ? (
                      <Link to={`/admin/orders/${transaction.orderId}`} className="order-link">
                        {transaction.orderCode} <FontAwesomeIcon icon={faExternalLinkAlt} size="xs" />
                      </Link>
                    ) : ''}
                  </td>
                  <td>
                    {transaction.orderAmount ? formatCurrency(transaction.orderAmount) : ''}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-state">
                  {searchTerm || filterType !== 'all'
                    ? 'Không tìm thấy giao dịch phù hợp với điều kiện lọc.'
                    : 'Chưa có giao dịch nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <style jsx>{`
        .loyalty-transactions-list {
          margin-top: 20px;
        }
        
        .user-info {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        
        .user-details h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        
        .user-details p {
          margin: 5px 0;
          color: #666;
        }
        
        .loyalty-summary {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .points-display {
          margin-bottom: 5px;
        }
        
        .points-label, .rank-label {
          margin-right: 10px;
          font-weight: 500;
        }
        
        .points-value {
          font-size: 20px;
          font-weight: bold;
          color: #10b981;
        }
        
        .rank-value {
          font-weight: bold;
          color: #2c7be5;
        }
        
        .actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary {
          background-color: #10b981;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #0e9f6e;
        }
        
        .btn-danger {
          background-color: #ef4444;
          color: white;
        }
        
        .btn-danger:hover {
          background-color: #dc2626;
        }
        
        .btn:disabled {
          background-color: #d1d5db;
          cursor: not-allowed;
        }
        
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .search-box {
          display: flex;
          align-items: center;
          background-color: #f5f5f5;
          border-radius: 4px;
          padding: 8px 12px;
          flex: 1;
        }
        
        .search-box input {
          border: none;
          background: transparent;
          margin-left: 8px;
          flex: 1;
          outline: none;
        }
        
        .type-filter {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .type-filter select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f5f5f5;
          outline: none;
        }
        
        .table-responsive {
          overflow-x: auto;
        }
        
        .transactions-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .transactions-table th, .transactions-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .transactions-table thead {
          background-color: #f9fafb;
        }
        
        .transactions-table th {
          font-weight: 600;
          color: #6b7280;
        }
        
        .points-cell {
          font-weight: bold;
        }
        
        .points-cell.earn {
          color: #10b981;
        }
        
        .points-cell.redeem {
          color: #ef4444;
        }
        
        .type-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
        }
        
        .type-badge.earn {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .type-badge.redeem {
          background-color: #fee2e2;
          color: #991b1b;
        }
        
        .order-link {
          color: #2c7be5;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        
        .order-link:hover {
          text-decoration: underline;
        }
        
        .empty-state {
          text-align: center;
          padding: 30px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default LoyaltyTransactionsList; 