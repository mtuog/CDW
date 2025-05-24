import React, { useState, useEffect } from 'react';
import { getAllProducts, updateProductStock } from '../../../api/productApi';
import { getAllCategories } from '../../../api/categoryApi';
import { getProductSizes, addProductSize, updateProductSize, updateSizeQuantity } from '../../../api/productSizeApi';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const ProductStockManager = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [productSizes, setProductSizes] = useState({});
  const [loadingSizes, setLoadingSizes] = useState({});
  const [newSize, setNewSize] = useState({ size: '', quantity: 1 });
  const [editingQuantities, setEditingQuantities] = useState({});
  const [editingSizeQuantities, setEditingSizeQuantities] = useState({});
  
  // Các kích thước mẫu để hiển thị
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  
  const productsPerPage = 10;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        const productsData = await getAllProducts();
        setProducts(productsData);
        
        // Fetch categories
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
        
        setLoading(false);
      } catch (error) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        setLoading(false);
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter products
  const filteredProducts = products
    .filter(product => {
      // Filter by search term
      const matchesSearch = searchTerm === '' ||
                           product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.des && product.des.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by category
      const matchesCategory = selectedCategory === '' || 
                             (product.category && product.category.name === selectedCategory);
      
      // Filter by stock status
      const matchesStock = stockFilter === 'all' || 
                          (stockFilter === 'inStock' && product.inStock) || 
                          (stockFilter === 'outOfStock' && !product.inStock);
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  
  // Paginate products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1); // Reset to first page when category changes
  };
  
  const handleStockFilterChange = (e) => {
    setStockFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handleToggleStock = async (productId, currentStock) => {
    try {
      setUpdatingProductId(productId);
      
      const newStockStatus = !currentStock;
      // Call API to update stock status
      await updateProductStock(productId, newStockStatus);
      
      // Update local state
      setProducts(products.map(product => {
        if (product.id === productId) {
          // Nếu đánh dấu hết hàng, đặt số lượng về 0
          if (!newStockStatus) {
            return { 
              ...product, 
              inStock: false,
              quantity: 0
            };
          } else {
            // Nếu đánh dấu còn hàng nhưng số lượng = 0, đặt số lượng = 1
            return { 
              ...product, 
              inStock: true,
              quantity: product.quantity > 0 ? product.quantity : 1
            };
          }
        }
        return product;
      }));
      
      // Show success message
      Swal.fire({
        title: 'Cập nhật thành công',
        text: `Sản phẩm đã được cập nhật thành ${!currentStock ? 'còn hàng' : 'hết hàng'}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      setUpdatingProductId(null);
    } catch (error) {
      console.error('Error toggling stock status:', error);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể cập nhật trạng thái tồn kho. Vui lòng thử lại sau.',
        icon: 'error',
        confirmButtonText: 'Đóng'
      });
      setUpdatingProductId(null);
    }
  };

  const handleBulkUpdateStock = async (inStock) => {
    const selectedProductIds = filteredProducts
      .filter(product => stockFilter === 'all' || 
              (stockFilter === 'inStock' && product.inStock) || 
              (stockFilter === 'outOfStock' && !product.inStock))
      .map(product => product.id);
    
    if (selectedProductIds.length === 0) {
      Swal.fire({
        title: 'Thông báo',
        text: 'Không có sản phẩm nào được chọn để cập nhật',
        icon: 'info',
        confirmButtonText: 'Đóng'
      });
      return;
    }
    
    try {
      // Confirm before bulk update
      const result = await Swal.fire({
        title: 'Xác nhận cập nhật hàng loạt',
        text: `Bạn có chắc chắn muốn cập nhật ${selectedProductIds.length} sản phẩm thành ${inStock ? 'còn hàng' : 'hết hàng'}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#28a745'
      });
      
      if (result.isConfirmed) {
        setLoading(true);
        
        // Update each product
        for (const id of selectedProductIds) {
          await updateProductStock(id, inStock);
        }
        
        // Update local state
        setProducts(products.map(product => 
          selectedProductIds.includes(product.id)
            ? { ...product, inStock }
            : product
        ));
        
        setLoading(false);
        
        // Show success message
        Swal.fire({
          title: 'Thành công',
          text: `Đã cập nhật ${selectedProductIds.length} sản phẩm thành ${inStock ? 'còn hàng' : 'hết hàng'}`,
          icon: 'success',
          confirmButtonText: 'Đóng'
        });
      }
    } catch (error) {
      console.error('Error in bulk update:', error);
      setLoading(false);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể cập nhật trạng thái tồn kho. Vui lòng thử lại sau.',
        icon: 'error',
        confirmButtonText: 'Đóng'
      });
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    // Đảm bảo newQuantity không âm
    if (newQuantity < 0) newQuantity = 0;
    
    try {
      setUpdatingProductId(productId);
      
      // Call API to update quantity
      await updateProductStock(productId, newQuantity);
      
      // Update local state
      setProducts(products.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              quantity: newQuantity,
              inStock: newQuantity > 0
            } 
          : product
      ));
      
      // Show success message
      Swal.fire({
        title: 'Cập nhật thành công',
        text: newQuantity > 0 
          ? `Số lượng sản phẩm đã được cập nhật thành ${newQuantity}`
          : 'Sản phẩm đã được đánh dấu là hết hàng',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      setUpdatingProductId(null);
    } catch (error) {
      console.error('Error updating quantity:', error);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể cập nhật số lượng sản phẩm. Vui lòng thử lại sau.',
        icon: 'error',
        confirmButtonText: 'Đóng'
      });
      setUpdatingProductId(null);
    }
  };

  // Mở rộng/thu gọn thông tin chi tiết sản phẩm
  const toggleProductExpand = async (productId) => {
    if (expandedProductId === productId) {
      // Thu gọn nếu đang mở
      setExpandedProductId(null);
    } else {
      // Mở rộng thông tin và tải sizes
      setExpandedProductId(productId);
      
      if (!productSizes[productId]) {
        await fetchProductSizes(productId);
      }
    }
  };
  
  // Tải kích thước cho sản phẩm
  const fetchProductSizes = async (productId) => {
    try {
      const sizes = await getProductSizes(productId);
      setProductSizes(prev => ({
        ...prev,
        [productId]: sizes
      }));
    } catch (error) {
      console.error('Error fetching product sizes:', error);
      toast.error('Không thể tải thông tin kích thước sản phẩm');
    }
  };
  
  // Cập nhật số lượng cho một kích thước
  const handleSizeQuantityChange = async (productId, sizeId, newQuantity) => {
    // Đảm bảo newQuantity không âm
    if (newQuantity < 0) newQuantity = 0;
    
    try {
      setUpdatingProductId(productId);
      
      // Call API to update size quantity
      await updateProductStock(productId, newQuantity);
      
      // Update local state
      setProductSizes(prev => ({
        ...prev,
        [productId]: prev[productId].map(size => 
          size.id === sizeId 
            ? { ...size, quantity: newQuantity } 
            : size
        )
      }));
      
      // Sau khi cập nhật size, fetch lại thông tin sản phẩm để cập nhật tổng số lượng
      const updatedProducts = [...products];
      const productIndex = updatedProducts.findIndex(p => p.id === productId);
      
      if (productIndex !== -1) {
        // Tính tổng số lượng từ tất cả các sizes
        const totalQuantity = productSizes[productId]
          .reduce((sum, size) => {
            return sum + (size.id === sizeId ? newQuantity : size.quantity);
          }, 0);
        
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          quantity: totalQuantity,
          inStock: totalQuantity > 0
        };
        
        setProducts(updatedProducts);
      }
      
      // Show success message
      Swal.fire({
        title: 'Cập nhật thành công',
        text: `Số lượng đã được cập nhật`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      setUpdatingProductId(null);
    } catch (error) {
      console.error('Error updating size quantity:', error);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể cập nhật số lượng. Vui lòng thử lại sau.',
        icon: 'error',
        confirmButtonText: 'Đóng'
      });
      setUpdatingProductId(null);
    }
  };
  
  // Thêm kích thước mới cho sản phẩm
  const handleAddSize = async (productId) => {
    if (!newSize.size) {
      Swal.fire({
        title: 'Thiếu thông tin',
        text: 'Vui lòng chọn kích thước',
        icon: 'warning',
        confirmButtonText: 'Đóng'
      });
      return;
    }
    
    // Kiểm tra xem kích thước đã tồn tại chưa
    const existingSize = productSizes[productId]?.find(
      size => size.size.toLowerCase() === newSize.size.toLowerCase()
    );
    
    if (existingSize) {
      Swal.fire({
        title: 'Kích thước đã tồn tại',
        text: `Kích thước ${newSize.size} đã tồn tại cho sản phẩm này`,
        icon: 'warning',
        confirmButtonText: 'Đóng'
      });
      return;
    }
    
    try {
      setUpdatingProductId(productId);
      
      // Gọi API để thêm kích thước mới
      const sizeData = {
        size: newSize.size,
        quantity: parseInt(newSize.quantity),
        active: true
      };
      
      const updatedSizes = await getProductSizes(productId, sizeData);
      
      // Cập nhật state
      setProductSizes(prev => ({
        ...prev,
        [productId]: updatedSizes
      }));
      
      // Cập nhật tổng số lượng của sản phẩm
      const updatedProducts = [...products];
      const productIndex = updatedProducts.findIndex(p => p.id === productId);
      
      if (productIndex !== -1) {
        const currentQuantity = updatedProducts[productIndex].quantity || 0;
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          quantity: currentQuantity + parseInt(newSize.quantity),
          inStock: (currentQuantity + parseInt(newSize.quantity)) > 0
        };
        
        setProducts(updatedProducts);
      }
      
      // Reset form
      setNewSize({ size: '', quantity: 1 });
      
      // Thông báo thành công
      Swal.fire({
        title: 'Thêm thành công',
        text: `Đã thêm kích thước ${updatedSizes[updatedSizes.length - 1].size}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      setUpdatingProductId(null);
    } catch (error) {
      console.error('Error adding size:', error);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể thêm kích thước mới. Vui lòng thử lại sau.',
        icon: 'error',
        confirmButtonText: 'Đóng'
      });
      setUpdatingProductId(null);
    }
  };
  
  // Xóa kích thước
  const handleDeleteSize = async (productId, sizeId, sizeName) => {
    try {
      // Xác nhận trước khi xóa
      const result = await Swal.fire({
        title: 'Xác nhận xóa',
        text: `Bạn có chắc chắn muốn xóa kích thước ${sizeName}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#dc3545'
      });
      
      if (!result.isConfirmed) return;
      
      setUpdatingProductId(productId);
      
      // Tìm số lượng của size sẽ bị xóa
      const sizeToDelete = productSizes[productId].find(size => size.id === sizeId);
      const quantityToRemove = sizeToDelete ? sizeToDelete.quantity : 0;
      
      // Gọi API để xóa kích thước
      const updatedSizes = await getProductSizes(productId);
      
      // Cập nhật state
      setProductSizes(prev => ({
        ...prev,
        [productId]: updatedSizes
      }));
      
      // Cập nhật tổng số lượng của sản phẩm
      const updatedProducts = [...products];
      const productIndex = updatedProducts.findIndex(p => p.id === productId);
      
      if (productIndex !== -1) {
        const currentQuantity = updatedProducts[productIndex].quantity || 0;
        const newQuantity = Math.max(0, currentQuantity - quantityToRemove);
        
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          quantity: newQuantity,
          inStock: newQuantity > 0
        };
        
        setProducts(updatedProducts);
      }
      
      // Thông báo thành công
      Swal.fire({
        title: 'Xóa thành công',
        text: `Đã xóa kích thước ${sizeName}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      setUpdatingProductId(null);
    } catch (error) {
      console.error('Error deleting size:', error);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể xóa kích thước. Vui lòng thử lại sau.',
        icon: 'error',
        confirmButtonText: 'Đóng'
      });
      setUpdatingProductId(null);
    }
  };

  // Hàm chuyển hướng đến trang chỉnh sửa sản phẩm
  const handleEditProduct = (productId) => {
    navigate(`/admin/products/${productId}/edit`);
  };

  // Hàm xử lý khi input thay đổi (chỉ cập nhật state tạm thời)
  const handleQuantityInputChange = (productId, quantity) => {
    setEditingQuantities({
      ...editingQuantities,
      [productId]: quantity
    });
  };

  // Hàm xử lý khi input mất focus hoặc người dùng nhấn Enter
  const handleQuantityInputBlur = async (productId) => {
    if (productId in editingQuantities) {
      const newQuantity = editingQuantities[productId];
      // Xóa khỏi danh sách đang chỉnh sửa
      const updatedEditingQuantities = { ...editingQuantities };
      delete updatedEditingQuantities[productId];
      setEditingQuantities(updatedEditingQuantities);
      
      // Gọi hàm cập nhật số lượng
      await handleQuantityChange(productId, newQuantity);
    }
  };

  // Hàm xử lý khi input nhấn phím
  const handleQuantityKeyDown = (e, productId) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Kích hoạt sự kiện blur
    }
  };

  // Tương tự cho kích thước sản phẩm
  const handleSizeQuantityInputChange = (productId, sizeId, quantity) => {
    const key = `${productId}-${sizeId}`;
    setEditingSizeQuantities({
      ...editingSizeQuantities,
      [key]: quantity
    });
  };

  const handleSizeQuantityInputBlur = async (productId, sizeId) => {
    const key = `${productId}-${sizeId}`;
    if (key in editingSizeQuantities) {
      const newQuantity = editingSizeQuantities[key];
      // Xóa khỏi danh sách đang chỉnh sửa
      const updatedEditingSizeQuantities = { ...editingSizeQuantities };
      delete updatedEditingSizeQuantities[key];
      setEditingSizeQuantities(updatedEditingSizeQuantities);
      
      // Gọi hàm cập nhật số lượng
      await handleSizeQuantityChange(productId, sizeId, newQuantity);
    }
  };

  const handleSizeQuantityKeyDown = (e, productId, sizeId) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Kích hoạt sự kiện blur
    }
  };

  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  // Render product size management UI for a specific product
  const renderSizeManagement = (product) => {
    const productId = product.id;
    const sizes = productSizes[productId] || [];
    const isLoading = loadingSizes[productId];

    return (
      <div className="size-management">
        <h4>Quản lý kích thước</h4>
        
        {isLoading ? (
          <div className="loading-sizes">Đang tải thông tin kích thước...</div>
        ) : (
          <>
            {sizes.length > 0 ? (
              <div className="size-table">
                <table>
                  <thead>
                    <tr>
                      <th>Kích thước</th>
                      <th>Số lượng</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map(size => (
                      <tr key={size.id}>
                        <td>{size.size}</td>
                        <td>
                          <input
                            type="number"
                            value={`${productId}-${size.id}` in editingSizeQuantities ? 
                              editingSizeQuantities[`${productId}-${size.id}`] : 
                              size.quantity}
                            min="0"
                            onChange={(e) => handleSizeQuantityInputChange(
                              productId, 
                              size.id, 
                              parseInt(e.target.value) || 0
                            )}
                            onBlur={(e) => handleSizeQuantityInputBlur(productId, size.id)}
                            onKeyDown={(e) => handleSizeQuantityKeyDown(e, productId, size.id)}
                            className="quantity-input"
                          />
                        </td>
                        <td>
                          <button 
                            className="delete-size-btn"
                            onClick={() => handleDeleteSize(productId, size.id, size.size)}
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-sizes">
                Chưa có kích thước nào được thêm cho sản phẩm này.
              </div>
            )}
            
            <div className="add-size-form">
              <h5>Thêm kích thước mới</h5>
              <div className="form-row">
                <div className="size-select">
                  <select 
                    value={newSize.size}
                    onChange={(e) => setNewSize({...newSize, size: e.target.value})}
                  >
                    <option value="">Chọn kích thước</option>
                    {availableSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div className="size-quantity">
                  <input
                    type="number"
                    value={newSize.quantity}
                    min="1"
                    onChange={(e) => setNewSize({
                      ...newSize, 
                      quantity: parseInt(e.target.value) || 1
                    })}
                    className="quantity-input"
                  />
                </div>
                <button 
                  className="add-size-btn"
                  onClick={() => handleAddSize(productId)}
                >
                  Thêm
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="stock-manager-container">
      <h2>Quản lý tồn kho</h2>
      
      <div className="filter-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="category-filter">
          <select value={selectedCategory} onChange={handleCategoryChange}>
            <option value="">Tất cả danh mục</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>
        
        <div className="stock-filter">
          <select value={stockFilter} onChange={handleStockFilterChange}>
            <option value="all">Tất cả trạng thái</option>
            <option value="inStock">Còn hàng</option>
            <option value="outOfStock">Hết hàng</option>
          </select>
        </div>
      </div>
      
      <div className="bulk-actions">
        <button
          className="mark-in-stock-btn"
          onClick={() => handleBulkUpdateStock(true)}
        >
          Đánh dấu tất cả là còn hàng
        </button>
        <button
          className="mark-out-of-stock-btn"
          onClick={() => handleBulkUpdateStock(false)}
        >
          Đánh dấu tất cả là hết hàng
        </button>
      </div>
      
      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Hình ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
              <th>Số lượng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map(product => (
              <React.Fragment key={product.id}>
                <tr>
                  <td>{product.id}</td>
                  <td>
                    <img 
                      src={product.img} 
                      alt={product.name} 
                      className="product-thumbnail"
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category ? product.category.name : 'Không xác định'}</td>
                  <td>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id={`stock-toggle-${product.id}`}
                        checked={product.inStock}
                        onChange={() => handleToggleStock(product.id, product.inStock)}
                        disabled={updatingProductId === product.id}
                      />
                      <label htmlFor={`stock-toggle-${product.id}`}>
                        {product.inStock ? 'Còn hàng' : 'Hết hàng'}
                      </label>
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={product.id in editingQuantities ? editingQuantities[product.id] : (product.quantity || 0)}
                      min="0"
                      onChange={(e) => handleQuantityInputChange(product.id, parseInt(e.target.value) || 0)}
                      onBlur={(e) => handleQuantityInputBlur(product.id)}
                      onKeyDown={(e) => handleQuantityKeyDown(e, product.id)}
                      disabled={updatingProductId === product.id || !product.inStock}
                      className="quantity-input"
                    />
                  </td>
                  <td className="action-buttons">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditProduct(product.id)}
                      title="Chỉnh sửa sản phẩm"
                    >
                      <i className="fa fa-edit"></i>
                    </button>
                    <button 
                      className="manage-sizes-btn"
                      onClick={() => toggleProductExpand(product.id)}
                      title="Quản lý kích thước"
                    >
                      <i className="fa fa-th-list"></i>
                    </button>
                  </td>
                </tr>
                {expandedProductId === product.id && (
                  <tr className="size-management-row">
                    <td colSpan="7">
                      {renderSizeManagement(product)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredProducts.length > productsPerPage && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={currentPage === page ? 'active' : ''}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>
      )}
      
      <style jsx>{`
        .stock-manager-container {
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        h2 {
          margin-top: 0;
          margin-bottom: 24px;
          color: #333;
        }
        
        .filter-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .search-box input,
        .category-filter select,
        .stock-filter select {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .search-box input {
          width: 300px;
        }
        
        .bulk-actions {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
        }
        
        .mark-in-stock-btn,
        .mark-out-of-stock-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .mark-in-stock-btn {
          background-color: #28a745;
          color: white;
        }
        
        .mark-out-of-stock-btn {
          background-color: #dc3545;
          color: white;
        }
        
        .mark-in-stock-btn:hover {
          background-color: #218838;
        }
        
        .mark-out-of-stock-btn:hover {
          background-color: #c82333;
        }
        
        .products-table {
          overflow-x: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        
        tr.expanded {
          background-color: #f8f9fa;
        }
        
        .product-thumbnail {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 4px;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-switch label {
          position: relative;
          display: inline-block;
          width: 80px;
          height: 30px;
          background-color: #dc3545;
          border-radius: 15px;
          cursor: pointer;
          color: white;
          text-align: center;
          line-height: 30px;
          font-size: 12px;
          transition: background-color 0.3s;
          padding-left: 10px;
          padding-right: 10px;
        }
        
        .toggle-switch input:checked + label {
          background-color: #28a745;
        }
        
        .quantity-input {
          width: 70px;
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .expand-btn {
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .expand-btn:hover {
          background-color: #0069d9;
        }
        
        .expand-btn.expanded {
          background-color: #6c757d;
        }
        
        .pagination {
          margin-top: 20px;
          display: flex;
          justify-content: center;
          gap: 5px;
        }
        
        .pagination button {
          width: 36px;
          height: 36px;
          border: 1px solid #ddd;
          background-color: white;
          color: #333;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.3s;
        }
        
        .pagination button.active {
          background-color: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .pagination button:hover:not(.active) {
          background-color: #f1f1f1;
        }
        
        .loading-container, .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          font-size: 16px;
          color: #6c757d;
        }
        
        .error-container {
          color: #dc3545;
        }
        
        /* Size Management Styles */
        .size-management {
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 4px;
          margin-top: 10px;
        }
        
        .size-management h4 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
          color: #333;
        }
        
        .size-management h5 {
          margin-top: 15px;
          margin-bottom: 10px;
          font-size: 16px;
          color: #333;
        }
        
        .loading-sizes {
          text-align: center;
          padding: 15px;
          color: #6c757d;
        }
        
        .no-sizes {
          text-align: center;
          padding: 15px;
          color: #6c757d;
          font-style: italic;
        }
        
        .size-table {
          margin-bottom: 20px;
        }
        
        .size-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .size-table th, .size-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        .size-table th {
          background-color: #f2f2f2;
          font-weight: 600;
        }
        
        .delete-size-btn {
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .delete-size-btn:hover {
          background-color: #c82333;
        }
        
        .form-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .size-select select {
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 150px;
        }
        
        .size-quantity input {
          width: 70px;
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .add-size-btn {
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        
        .add-size-btn:hover {
          background-color: #218838;
        }
        
        @media (max-width: 768px) {
          .filter-controls {
            flex-direction: column;
          }
          
          .search-box input {
            width: 100%;
          }
          
          .size-management-row td {
            padding: 0;
          }
        }
        
        /* Toggle switch và nút styles */
        .edit-btn {
          background-color: #17a2b8;
          color: white;
          border: none;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .edit-btn:hover {
          background-color: #138496;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .manage-sizes-btn {
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
        }
        
        .manage-sizes-btn:hover {
          background-color: #5a6268;
        }
        
        .size-management-row td {
          padding: 0;
        }
        
        .size-management {
          margin: 0;
          border-top: none;
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default ProductStockManager; 