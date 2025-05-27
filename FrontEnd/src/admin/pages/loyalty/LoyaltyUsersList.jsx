import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faMinus, faUserTag, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

const LoyaltyUsersList = ({ users, loading, onUserSelect, onAddPoints, onRedeemPoints }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('all');
  
  const membershipRanks = {
    BRONZE: { color: '#CD7F32', name: 'Đồng' },
    SILVER: { color: '#C0C0C0', name: 'Bạc' },
    GOLD: { color: '#FFD700', name: 'Vàng' },
    PLATINUM: { color: '#E5E4E2', name: 'Bạch Kim' }
  };
  
  const handleAddPoints = (userId) => {
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
        onAddPoints(userId, result.value.points, result.value.description);
      }
    });
  };
  
  const handleRedeemPoints = (userId, currentPoints) => {
    Swal.fire({
      title: 'Trừ điểm',
      html: `
        <div class="swal2-input-container">
          <input 
            id="points" 
            class="swal2-input" 
            type="number" 
            min="1" 
            max="${currentPoints}"
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
        
        if (parseInt(points) > currentPoints) {
          Swal.showValidationMessage(`Số điểm không thể lớn hơn số điểm hiện có (${currentPoints})`);
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
        onRedeemPoints(userId, result.value.points, result.value.description);
      }
    });
  };
  
  // Filter users based on search term and selected rank
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRank = selectedRank === 'all' || user.membershipRank === selectedRank;
    
    return matchesSearch && matchesRank;
  });
  
  return (
    <div className="loyalty-users-list">
      <div className="filters">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="rank-filter">
          <label>Lọc theo hạng:</label>
          <select 
            value={selectedRank} 
            onChange={(e) => setSelectedRank(e.target.value)}
          >
            <option value="all">Tất cả hạng</option>
            <option value="BRONZE">Đồng</option>
            <option value="SILVER">Bạc</option>
            <option value="GOLD">Vàng</option>
            <option value="PLATINUM">Bạch Kim</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Điểm tích lũy</th>
                <th>Hạng thành viên</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.fullName || '(Chưa cập nhật)'}</td>
                    <td>{user.email}</td>
                    <td className="points-cell">{user.loyaltyPoints || 0}</td>
                    <td>
                      <span 
                        className="rank-badge"
                        style={{ 
                          backgroundColor: membershipRanks[user.membershipRank]?.color || '#ccc',
                          color: user.membershipRank === 'GOLD' ? '#333' : '#fff'
                        }}
                      >
                        {membershipRanks[user.membershipRank]?.name || user.membershipRank}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn view-btn"
                        onClick={() => onUserSelect(user)}
                        title="Xem chi tiết giao dịch"
                      >
                        <FontAwesomeIcon icon={faInfoCircle} />
                      </button>
                      <button
                        className="action-btn add-btn"
                        onClick={() => handleAddPoints(user.id)}
                        title="Thêm điểm"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                      <button
                        className="action-btn redeem-btn"
                        onClick={() => handleRedeemPoints(user.id, user.loyaltyPoints || 0)}
                        title="Trừ điểm"
                        disabled={!user.loyaltyPoints || user.loyaltyPoints <= 0}
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    {searchTerm || selectedRank !== 'all'
                      ? 'Không tìm thấy khách hàng phù hợp với điều kiện lọc.'
                      : 'Chưa có khách hàng nào.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      <style jsx>{`
        .loyalty-users-list {
          margin-top: 20px;
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
        
        .rank-filter {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .rank-filter select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f5f5f5;
          outline: none;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2c7be5;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .table-responsive {
          overflow-x: auto;
        }
        
        .users-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .users-table th, .users-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .users-table thead {
          background-color: #f9fafb;
        }
        
        .users-table th {
          font-weight: 600;
          color: #6b7280;
        }
        
        .points-cell {
          font-weight: bold;
          text-align: center;
        }
        
        .rank-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          text-align: center;
        }
        
        .actions-cell {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 5px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .action-btn:hover {
          background-color: #f5f5f5;
        }
        
        .action-btn:disabled {
          color: #ccc;
          cursor: not-allowed;
        }
        
        .view-btn {
          color: #2c7be5;
        }
        
        .add-btn {
          color: #10b981;
        }
        
        .redeem-btn {
          color: #ef4444;
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

export default LoyaltyUsersList; 