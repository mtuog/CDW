import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../../../api/categoryApi';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ id: null, name: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      
      // Chuẩn bị dữ liệu danh mục để hiển thị
      const preparedCategories = data.map(cat => ({
        id: cat.id,
        name: cat.name,
        productCount: cat.productCount || 0
      }));
      
      setCategories(preparedCategories);
      setLoading(false);
    } catch (error) {
      toast.error("Không thể tải danh sách danh mục. Vui lòng thử lại sau.");
      setLoading(false);
      console.error("Error fetching categories:", error);
    }
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle opening the modal for adding new category
  const handleAddNew = () => {
    setCurrentCategory({ id: null, name: '' });
    setEditMode(false);
    setShowModal(true);
  };

  // Handle opening the modal for editing category
  const handleEdit = (category) => {
    setCurrentCategory({ ...category });
    setEditMode(true);
    setShowModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory(prev => ({ ...prev, [name]: value }));
  };

  // Handle category form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!currentCategory.name.trim()) {
      toast.error("Tên danh mục không được để trống");
      return;
    }
    
    try {
      // Chuẩn bị dữ liệu để gửi đến API
      const categoryData = {
        name: currentCategory.name
      };
      
      if (editMode) {
        // Update existing category
        await updateCategory(currentCategory.id, categoryData);
        toast.success("Cập nhật danh mục thành công!");
      } else {
        // Add new category
        await createCategory(categoryData);
        toast.success("Thêm danh mục mới thành công!");
      }
      
      // Refresh categories list
      fetchCategories();
      
      // Close modal and reset form
      setShowModal(false);
      setCurrentCategory({ id: null, name: '' });
    } catch (error) {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
      console.error("Error saving category:", error);
    }
  };

  // Handle deleting a category
  const handleDelete = async (categoryId) => {
    try {
      // Check if category has products
      const category = categories.find(cat => cat.id === categoryId);
      if (category.productCount > 0) {
        toast.error(`Không thể xóa danh mục này vì có ${category.productCount} sản phẩm liên kết.`);
        setConfirmDelete(null);
        return;
      }
      
      // Call API to delete category
      await deleteCategory(categoryId);
      toast.success("Xóa danh mục thành công!");
      
      // Refresh categories list
      fetchCategories();
      setConfirmDelete(null);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa danh mục. Vui lòng thử lại sau.");
      console.error("Error deleting category:", error);
      setConfirmDelete(null);
    }
  };

  // Close modals
  const handleCloseModal = () => {
    setShowModal(false);
    setConfirmDelete(null);
  };

  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="category-list-container">
      {/* Header */}
      <div className="page-header">
        <h1>Quản lý danh mục</h1>
        <button className="add-button" onClick={handleAddNew}>
          <i className="fa fa-plus"></i> Thêm mới
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="filters-container">
        <div className="search-box">
          <i className="fa fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        <div className="filter-info">
          {searchTerm ? `Tìm thấy ${filteredCategories.length} danh mục` : `Hiển thị tất cả ${categories.length} danh mục`}
        </div>
      </div>
      
      {/* Categories Table */}
      <div className="table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên danh mục</th>
              <th>Số sản phẩm</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td>{category.name}</td>
                  <td>
                    <span className={`product-count ${category.productCount > 0 ? 'has-products' : 'no-products'}`}>
                      {category.productCount}
                    </span>
                    {category.productCount > 0 && (
                      <span className="count-info">
                        (Không thể xóa danh mục có sản phẩm)
                      </span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="edit-button" 
                      onClick={() => handleEdit(category)}
                      title="Sửa danh mục"
                    >
                      <i className="fa fa-edit"></i>
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => setConfirmDelete(category.id)}
                      title="Xóa danh mục"
                      disabled={category.productCount > 0}
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">
                  {searchTerm ? 'Không tìm thấy danh mục nào phù hợp.' : 'Chưa có danh mục nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Category Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{editMode ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h2>
              <button className="close-button" onClick={handleCloseModal}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Tên danh mục <span className="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={currentCategory.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="save-button">
                  {editMode ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-container confirm-modal">
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="close-button" onClick={() => setConfirmDelete(null)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="confirm-content">
              <p>Bạn có chắc chắn muốn xóa danh mục này?</p>
              <p>Hành động này không thể hoàn tác.</p>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={() => setConfirmDelete(null)}>
                Hủy
              </button>
              <button type="button" className="delete-confirm-button" onClick={() => handleDelete(confirmDelete)}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .category-list-container {
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .page-header h1 {
          font-size: 24px;
          margin: 0;
          color: #333;
        }
        
        .add-button {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .add-button:hover {
          background-color: #218838;
        }
        
        .add-button i {
          margin-right: 8px;
        }
        
        .filters-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .search-box {
          position: relative;
          flex: 0 0 300px;
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
        
        .filter-info {
          font-size: 14px;
          color: #6c757d;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .categories-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .categories-table th,
        .categories-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        
        .categories-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #495057;
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
        
        .actions-cell {
          display: flex;
          gap: 8px;
        }
        
        .edit-button,
        .delete-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .edit-button {
          background-color: #17a2b8;
          color: white;
        }
        
        .edit-button:hover {
          background-color: #138496;
        }
        
        .delete-button {
          background-color: #dc3545;
          color: white;
        }
        
        .delete-button:hover {
          background-color: #c82333;
        }
        
        .delete-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .no-data {
          text-align: center;
          color: #6c757d;
          padding: 20px 0;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-container {
          background-color: white;
          border-radius: 8px;
          width: 500px;
          max-width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #333;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          color: #6c757d;
          cursor: pointer;
        }
        
        form {
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }
        
        .required {
          color: #dc3545;
        }
        
        .form-group input, 
        .form-group select, 
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-group textarea {
          resize: vertical;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }
        
        .cancel-button, 
        .save-button, 
        .delete-confirm-button {
          padding: 10px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .cancel-button {
          background-color: #6c757d;
          color: white;
        }
        
        .cancel-button:hover {
          background-color: #5a6268;
        }
        
        .save-button {
          background-color: #28a745;
          color: white;
        }
        
        .save-button:hover {
          background-color: #218838;
        }
        
        .delete-confirm-button {
          background-color: #dc3545;
          color: white;
        }
        
        .delete-confirm-button:hover {
          background-color: #c82333;
        }
        
        .confirm-modal {
          width: 400px;
        }
        
        .confirm-content {
          padding: 20px;
        }
        
        .confirm-content p {
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .confirm-content p:last-child {
          color: #6c757d;
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .filters-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .search-box {
            width: 100%;
            flex: none;
          }
          
          .actions-cell {
            flex-direction: column;
          }
        }
        
        .product-count {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 600;
          min-width: 30px;
          text-align: center;
        }
        
        .has-products {
          background-color: #28a745;
          color: white;
        }
        
        .no-products {
          background-color: #6c757d;
          color: white;
        }
        
        .count-info {
          margin-left: 8px;
          font-size: 12px;
          color: #6c757d;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default CategoryList; 