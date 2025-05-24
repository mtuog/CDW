import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faToggleOn, faToggleOff, faSearch } from '@fortawesome/free-solid-svg-icons';
import discountCodeApi from '../../../api/discountCodeApi';
import Swal from 'sweetalert2';

const DiscountList = () => {
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      const data = await discountCodeApi.getAllDiscountCodes();
      
      // Kiểm tra và đảm bảo trạng thái isValid được tính toán chính xác
      const processedData = data.map(code => {
        // Convert string dates to Date objects
        const startDate = new Date(code.startDate);
        const endDate = new Date(code.endDate);
        const now = new Date();
        
        // Fix timezone issues by comparing only dates
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);  // End of day for end date
        
        // Kiểm tra hạn sử dụng riêng biệt với trạng thái kích hoạt
        const isDateValid = now >= startDate && now <= endDate;
        const isUsageValid = code.maxUsage === 0 || code.usageCount < code.maxUsage;
        
        // Mã giảm giá có hiệu lực khi đang kích hoạt VÀ còn trong thời hạn VÀ chưa vượt quá giới hạn sử dụng
        const isValid = code.active && isDateValid && isUsageValid;
        
        console.log(`Code ${code.code}: active=${code.active}, dateValid=${isDateValid}, usageValid=${isUsageValid}`);
        
        return {
          ...code,
          isValid: isValid,
          isDateValid: isDateValid,
          isUsageValid: isUsageValid,
          startDate: startDate,
          endDate: endDate
        };
      });
      
      setDiscountCodes(processedData);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải danh sách mã giảm giá'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      console.log(`Toggling status for discount code with ID: ${id}`);
      
      // Show loading indicator
      const loadingToast = Swal.fire({
        title: 'Đang xử lý...',
        text: 'Vui lòng đợi trong giây lát',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Call the API to toggle status
      const updatedDiscount = await discountCodeApi.toggleDiscountCodeStatus(id);
      
      // Close loading indicator
      loadingToast.close();
      
      // Update the state with the updated discount code
      setDiscountCodes(prevCodes => 
        prevCodes.map(code => 
          code.id === id 
            ? { 
                ...code, 
                active: updatedDiscount.active,
                isValid: updatedDiscount.active && code.isDateValid && code.isUsageValid,
                isDateValid: code.isDateValid,
                isUsageValid: code.isUsageValid
              } 
            : code
        )
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Đã thay đổi trạng thái mã giảm giá',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error toggling discount code status:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Không thể thay đổi trạng thái mã giảm giá';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: errorMessage
      });
      
      // Since the toggle failed, re-fetch all discount codes to ensure UI is in sync
      fetchDiscountCodes();
    }
  };

  const handleDeleteDiscount = async (id) => {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Bạn không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await discountCodeApi.deleteDiscountCode(id);
          setDiscountCodes(discountCodes.filter(code => code.id !== id));
          Swal.fire({
            icon: 'success',
            title: 'Đã xóa',
            text: 'Mã giảm giá đã được xóa',
            showConfirmButton: false,
            timer: 1500
          });
        } catch (error) {
          console.error('Error deleting discount code:', error);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Không thể xóa mã giảm giá'
          });
        }
      }
    });
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    
    let date;
    // Handle both string dates and Date objects
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateInput);
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Filter and search
  const filteredDiscountCodes = discountCodes
    .filter(code => {
      if (filterActive === 'all') return true;
      if (filterActive === 'active') return code.active;
      if (filterActive === 'inactive') return !code.active;
      if (filterActive === 'valid') return code.isDateValid && code.isUsageValid;
      if (filterActive === 'expired') return !code.isDateValid || !code.isUsageValid;
      return true;
    })
    .filter(code => 
      code.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="discount-list-container">
      <div className="page-header">
        <h1>Quản lý mã giảm giá</h1>
        <Link to="/admin/discount/add" className="btn btn-primary">
          <FontAwesomeIcon icon={faPlus} /> Tạo mã giảm giá
        </Link>
      </div>

      <div className="filter-container">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Tìm kiếm mã giảm giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterActive === 'all' ? 'active' : ''}`}
            onClick={() => setFilterActive('all')}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filterActive === 'active' ? 'active' : ''}`}
            onClick={() => setFilterActive('active')}
          >
            Đang kích hoạt
          </button>
          <button
            className={`filter-btn ${filterActive === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterActive('inactive')}
          >
            Không kích hoạt
          </button>
          <button
            className={`filter-btn ${filterActive === 'valid' ? 'active' : ''}`}
            onClick={() => setFilterActive('valid')}
          >
            Còn hiệu lực
          </button>
          <button
            className={`filter-btn ${filterActive === 'expired' ? 'active' : ''}`}
            onClick={() => setFilterActive('expired')}
          >
            Hết hạn
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="discount-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Mô tả</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Thời gian hiệu lực</th>
                <th>Giới hạn</th>
                <th>Đã dùng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiscountCodes.length > 0 ? (
                filteredDiscountCodes.map((discount) => (
                  <tr key={discount.id} className={!discount.isValid ? 'expired-row' : ''}>
                    <td className="code-cell">{discount.code}</td>
                    <td>{discount.description}</td>
                    <td>
                      {discount.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền cố định'}
                    </td>
                    <td>
                      {discount.discountType === 'PERCENTAGE' 
                        ? `${discount.value}%` 
                        : formatCurrency(discount.value)}
                    </td>
                    <td>
                      {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                    </td>
                    <td>
                      {discount.maxUsage ? discount.maxUsage : 'Không giới hạn'}
                      {discount.minimumPurchaseAmount && 
                        <div className="min-purchase">Tối thiểu: {formatCurrency(discount.minimumPurchaseAmount)}</div>
                      }
                    </td>
                    <td>{discount.usageCount}</td>
                    <td>
                      <span className={`status-badge ${discount.active ? 'active' : 'inactive'}`}>
                        {discount.active ? 'Đang kích hoạt' : 'Không kích hoạt'}
                      </span>
                      <span className={`validity-badge ${(discount.isDateValid && discount.isUsageValid) ? 'valid' : 'invalid'}`}>
                        {(discount.isDateValid && discount.isUsageValid) ? 'Còn hiệu lực' : 'Hết hạn'}
                      </span>
                      {!discount.isDateValid && 
                        <div className="validity-reason">
                          {new Date() < discount.startDate 
                            ? 'Chưa đến ngày bắt đầu' 
                            : new Date() > discount.endDate 
                              ? 'Đã quá hạn' 
                              : 'Không hợp lệ'}
                        </div>
                      }
                      {discount.isDateValid && !discount.isUsageValid && 
                        <div className="validity-reason">
                          Đã đạt giới hạn sử dụng
                        </div>
                      }
                    </td>
                    <td className="actions-cell">
                      <button
                        className={`action-btn toggle-btn ${discount.active ? 'toggle-active' : 'toggle-inactive'}`}
                        onClick={() => handleToggleStatus(discount.id)}
                        title={discount.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        <FontAwesomeIcon icon={discount.active ? faToggleOn : faToggleOff} />
                      </button>
                      <Link
                        to={`/admin/discount/edit/${discount.id}`}
                        className="action-btn edit-btn"
                        title="Sửa"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Link>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteDiscount(discount.id)}
                        title="Xóa"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="empty-state">
                    {searchTerm || filterActive !== 'all' 
                      ? 'Không tìm thấy mã giảm giá phù hợp với điều kiện lọc.' 
                      : 'Chưa có mã giảm giá nào. Hãy tạo mã giảm giá đầu tiên!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .discount-list-container {
          background-color: #fff;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }

        .page-header h1 {
          font-size: 24px;
          margin: 0;
        }

        .filter-container {
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

        .filter-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .filter-btn {
          background-color: #f5f5f5;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background-color: #2c7be5;
          color: white;
        }

        .discount-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .discount-table th, .discount-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .discount-table thead {
          background-color: #f9fafb;
        }

        .discount-table th {
          font-weight: 600;
          color: #6b7280;
        }

        .code-cell {
          font-family: monospace;
          font-weight: bold;
          background-color: #f5f5f5;
          padding: 4px 8px !important;
          border-radius: 4px;
        }

        .status-badge, .validity-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          margin-right: 5px;
          margin-bottom: 5px;
        }

        .status-badge.active {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #10b981;
        }

        .status-badge.inactive {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #ef4444;
        }

        .validity-badge.valid {
          background-color: #e0f2fe;
          color: #0c4a6e;
          border: 1px solid #0ea5e9;
        }

        .validity-badge.invalid {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #f59e0b;
        }
        
        .validity-reason {
          font-size: 11px;
          color: #ef4444;
          margin-top: 4px;
          margin-bottom: 4px;
          font-style: italic;
        }

        .min-purchase {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
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

        .toggle-btn {
          color: #2c7be5;
          font-size: 20px;
          transition: all 0.3s ease;
          padding: 5px 10px;
          border-radius: 4px;
        }
        
        .toggle-btn:hover {
          transform: scale(1.1);
          background-color: #f0f9ff;
        }
        
        .toggle-active {
          color: #10b981;
        }
        
        .toggle-inactive {
          color: #9ca3af;
        }

        .edit-btn {
          color: #4b5563;
        }

        .delete-btn {
          color: #ef4444;
        }

        .btn-primary {
          background-color: #2c7be5;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
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

        .empty-state {
          text-align: center;
          padding: 30px;
          color: #6b7280;
        }

        .expired-row {
          background-color: #fafafa;
          color: #6b7280;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .discount-table {
            font-size: 14px;
          }
        }

        @media (max-width: 992px) {
          .filter-container {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default DiscountList; 