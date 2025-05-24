import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createProduct, updateProduct, getProductById } from '../../../api/productApi';
import { getAllCategories } from '../../../api/categoryApi';
import { getProductSizes, addProductSize, updateProductSize } from '../../../api/productSizeApi';
import Swal from 'sweetalert2';
import axios from 'axios';
import { toast } from 'react-toastify';
import { uploadImage } from '../../../api/uploadApi';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    category: null,
    price: '',
    des: '',
    inStock: true,
    quantity: 0,
    img: '',
    sizes: []
  });
  
  // State to track size quantities
  const [sizeQuantities, setSizeQuantities] = useState({});
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [categories, setCategories] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [imageUrlTimer, setImageUrlTimer] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  
  // Mock sizes for the form
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Default mock categories in case API fails
        setCategories([
          { id: 1, name: 'Áo nam' },
          { id: 2, name: 'Áo nữ' },
          { id: 3, name: 'Quần nam' },
          { id: 4, name: 'Quần nữ' },
          { id: 5, name: 'Váy' },
          { id: 6, name: 'Giày' }
        ]);
      }
    };
    
    fetchCategories();
  }, []);
  
  useEffect(() => {
    if (isEditMode) {
      const fetchProductDetails = async () => {
        try {
          setLoading(true);
          const data = await getProductById(parseInt(id));
          
          // Transform the data to match the form format
          setFormData({
            name: data.name || '',
            category: data.category || null,
            price: data.price || '',
            des: data.des || '',
            inStock: data.inStock !== undefined ? data.inStock : true,
            quantity: data.quantity || 0,
            img: data.img || '',
            sizes: []
          });
          
          if (data.img) {
            setImagePreview(data.img);
            setImageUrlInput(data.img);
          }
          
          // Fetch product sizes using getProductSizes instead of getAllProductSizes
          const sizesData = await getProductSizes(parseInt(id));
          setProductSizes(sizesData);
          
          // Initialize sizeQuantities and formData.sizes from fetched data
          const sizeQuantitiesObj = {};
          const selectedSizes = [];
          
          if (sizesData && sizesData.length > 0) {
            console.log('Loaded product sizes:', sizesData);
            
            sizesData.forEach(size => {
              if (size.active) {
                selectedSizes.push(size.size);
                sizeQuantitiesObj[size.size] = size.quantity;
              }
            });
            
            // Set sizes and quantities
            setSizeQuantities(sizeQuantitiesObj);
            setFormData(prev => ({ 
              ...prev, 
              sizes: selectedSizes,
              // Update total quantity based on the sum of all size quantities
              quantity: sizesData.reduce((total, size) => total + (size.active ? size.quantity : 0), 0)
            }));
          } else {
            console.log('No sizes found for this product');
          }
          
          setLoading(false);
        } catch (error) {
          setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
          setLoading(false);
          console.error("Error fetching product details:", error);
        }
      };
      
      fetchProductDetails();
    }
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    if (type === 'checkbox') {
      if (name === 'inStock') {
        // Khi đánh dấu hết hàng, đặt số lượng về 0
        if (!checked) {
          setFormData(prev => ({ 
            ...prev, 
            [name]: checked,
            quantity: 0
          }));
        } else {
          setFormData(prev => ({ ...prev, [name]: checked }));
        }
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (name === 'price') {
      // Only allow numbers
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === 'quantity') {
      // Quantity must be a non-negative integer
      const quantity = parseInt(value) || 0;
      if (quantity < 0) return; // Don't allow negative values
      
      // Automatically update inStock based on quantity
      setFormData(prev => ({ 
        ...prev, 
        quantity: quantity,
        inStock: quantity > 0
      }));
    } else if (name === 'category') {
      // Handle category selection
      if (value === '') {
        setFormData(prev => ({ ...prev, category: null }));
      } else {
        const selectedCategory = categories.find(cat => cat.id === parseInt(value));
        setFormData(prev => ({ ...prev, category: selectedCategory }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSizeToggle = (size) => {
    setFormData(prev => {
      const newSizes = prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size];
      
      // If a size is being added, initialize its quantity using existing data or default to 0
      if (!prev.sizes.includes(size)) {
        // Kiểm tra xem có dữ liệu kích thước đã tồn tại không
        const existingSize = productSizes.find(s => s.size === size);
        const initialQuantity = existingSize ? existingSize.quantity : 0;
        
        setSizeQuantities(prevQuantities => ({
          ...prevQuantities,
          [size]: initialQuantity
        }));
      }
      
      // Recalculate total quantity after toggling a size
      setTimeout(() => recalculateTotalQuantity(), 0);
      
      return { ...prev, sizes: newSizes };
    });
  };
  
  const handleSizeQuantityChange = (size, quantity) => {
    // Allow quantity to be 0 (instead of minimum 1)
    const newQuantity = Math.max(0, parseInt(quantity) || 0);
    
    setSizeQuantities(prev => ({
      ...prev,
      [size]: newQuantity
    }));
    
    // Recalculate total quantity (with a slight delay to ensure state is updated)
    setTimeout(() => recalculateTotalQuantity(), 0);
  };
  
  const recalculateTotalQuantity = () => {
    // Only calculate if we have sizes selected
    if (formData.sizes && formData.sizes.length > 0) {
      const totalQty = formData.sizes.reduce((sum, size) => {
        const sizeQty = parseInt(sizeQuantities[size]) || 0;
        // Include all quantities, even zero, in the total
        return sum + sizeQty;
      }, 0);
      
      console.log('Recalculated total quantity:', totalQty);
      
      setFormData(prev => ({
        ...prev,
        quantity: totalQty,
        inStock: totalQty > 0
      }));
    } else {
      // If no sizes are selected, set quantity to 0
      setFormData(prev => ({
        ...prev,
        quantity: 0,
        inStock: false
      }));
    }
  };
  
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Tạo preview cho người dùng thấy ngay
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      
      try {
        // Chuẩn bị FormData để upload file
        const formData = new FormData();
        formData.append('file', file);
        
        // Lấy token xác thực từ localStorage nếu có
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        
        // Gọi API upload ảnh
        const response = await axios.post('http://localhost:8080/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        // Nhận URL của ảnh từ server
        const uploadedImageUrl = response.data.url;
        
        // Cập nhật state với URL từ server
        setFormData(prev => ({ ...prev, img: uploadedImageUrl }));
        
        // Tự động điền URL vào ô nhập URL
        setImageUrlInput(uploadedImageUrl);
        
        // Hiện ô nhập URL để người dùng có thể thấy và sao chép URL nếu cần
        setShowImageUrlInput(true);
        
        // Hiển thị thông báo thành công nhẹ nhàng
        toast.success('Ảnh đã được tải lên thành công!');
        
        console.log('Image uploaded successfully:', uploadedImageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        // Giữ nguyên URL preview để người dùng vẫn thấy ảnh đã chọn
        // Nhưng thông báo lỗi upload
        Swal.fire({
          title: 'Lỗi upload ảnh',
          text: 'Không thể tải ảnh lên máy chủ. Vui lòng thử lại sau.',
          icon: 'error',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#e65540'
        });
        
        // Giữ nguyên form data hiện tại, không cập nhật img
      }
    }
  };
  
  const handleRemoveImage = () => {
    setImagePreview('');
    setFormData(prev => ({ ...prev, img: '' }));
    setImageUrlInput('');
  };
  
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImageUrlInput(url);
    
    // Xóa timer cũ nếu có
    if (imageUrlTimer) {
      clearTimeout(imageUrlTimer);
    }
    
    // Đặt timer mới để tự động áp dụng URL sau khi người dùng ngừng nhập 800ms
    if (url.trim()) {
      setIsLoadingImage(true); // Bắt đầu trạng thái loading
      
      const timer = setTimeout(() => {
        applyImageUrl(url);
      }, 800);
      
      setImageUrlTimer(timer);
    } else {
      setIsLoadingImage(false);
      // Nếu xóa hết URL, cũng xóa ảnh preview
      if (imagePreview && formData.img === imageUrlInput) {
        setImagePreview('');
        setFormData(prev => ({ ...prev, img: '' }));
      }
    }
  };
  
  const applyImageUrl = (url) => {
    // Kiểm tra URL có hợp lệ không
    const isValidUrl = (urlToCheck) => {
      try {
        new URL(urlToCheck);
        return true;
      } catch (e) {
        return false;
      }
    };
    
    if (!isValidUrl(url)) {
      // Không hiển thị thông báo lỗi khi người dùng đang nhập
      // Chỉ áp dụng khi URL hợp lệ
      setIsLoadingImage(false);
      return;
    }
    
    // Tạo một đối tượng Image để kiểm tra xem URL có phải là hình ảnh hợp lệ không
    const img = new Image();
    img.onload = () => {
      // URL là hình ảnh hợp lệ
      setImagePreview(url);
      setFormData(prev => ({ ...prev, img: url }));
      setIsLoadingImage(false);
      toast.success('Đã áp dụng URL hình ảnh!');
    };
    img.onerror = () => {
      // URL không phải là hình ảnh hợp lệ
      setIsLoadingImage(false);
      // Không hiển thị thông báo lỗi khi người dùng đang nhập
      // Nếu muốn hiển thị lỗi, bỏ comment dòng dưới
      // toast.error('URL không phải là hình ảnh hợp lệ');
    };
    img.src = url;
  };
  
  const toggleImageUrlInput = () => {
    setShowImageUrlInput(!showImageUrlInput);
  };
  
  const handleCopyUrl = () => {
    if (imageUrlInput) {
      navigator.clipboard.writeText(imageUrlInput)
        .then(() => {
          setIsCopied(true);
          toast.success('Đã sao chép URL vào clipboard!');
          
          // Tự động reset trạng thái sau 3 giây
          setTimeout(() => {
            setIsCopied(false);
          }, 3000);
        })
        .catch(err => {
          console.error('Không thể sao chép:', err);
          toast.error('Không thể sao chép URL. Vui lòng thử lại.');
        });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.category || !formData.price) {
      Swal.fire({
        title: 'Thiếu thông tin',
        text: 'Vui lòng điền đầy đủ thông tin bắt buộc: tên, danh mục và giá.',
        icon: 'warning',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#e65540'
      });
      return;
    }
    
    // Nếu không có ảnh sản phẩm
    if (!formData.img) {
      Swal.fire({
        title: 'Thiếu ảnh sản phẩm',
        text: 'Vui lòng tải lên ảnh sản phẩm.',
        icon: 'warning',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#e65540'
      });
      return;
    }
    
    // Validate that at least one size is selected
    if (!formData.sizes || formData.sizes.length === 0) {
      Swal.fire({
        title: 'Thiếu kích thước',
        text: 'Vui lòng chọn ít nhất một kích thước và nhập số lượng tương ứng.',
        icon: 'warning',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#e65540'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for API - create a deep copy to avoid modifying state directly
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        des: formData.des,
        inStock: formData.quantity > 0,
        quantity: formData.quantity || 0,
        img: formData.img,
        // Explicitly empty array for sizes to avoid serialization issues
        sizes: []
      };
      
      // Handle category
      if (formData.category) {
        if (typeof formData.category === 'object' && formData.category.id) {
          productData.category = { id: formData.category.id };
        } else if (typeof formData.category === 'object' && formData.category.name) {
          productData.category = { name: formData.category.name };
        }
      }
      
      // Log dữ liệu sản phẩm được gửi đi
      console.log('Submitting product data:', productData);
      
      let result;
      try {
      if (isEditMode) {
        result = await updateProduct(parseInt(id), productData);
      } else {
        result = await createProduct(productData);
        }
      } catch (productError) {
        console.error('Error saving product:', productError);
        throw productError;
      }
      
      // If product creation/update is successful, add sizes one by one
      if (result && result.id) {
        console.log('Product saved successfully with ID:', result.id);
        
        if (isEditMode) {
          // For edit mode, get existing sizes to deactivate unselected ones
          const existingSizes = await getProductSizes(parseInt(id));
          
          // Find sizes that need to be deactivated (they exist in DB but are not in formData.sizes)
          const sizesToDeactivate = existingSizes
            .filter(existing => existing.active && !formData.sizes.includes(existing.size));
          
          // Deactivate removed sizes
          for (const sizeToDeactivate of sizesToDeactivate) {
            try {
              console.log(`Deactivating size ${sizeToDeactivate.size}`);
              await updateProductSize(sizeToDeactivate.id, {
                ...sizeToDeactivate,
                active: false
              });
              
              // Add a small delay between requests
              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
              console.error(`Error deactivating size ${sizeToDeactivate.size}:`, error);
            }
          }
        }
        
        // Add or update selected sizes
        if (formData.sizes && formData.sizes.length > 0) {
          const sizesPromises = [];
          
          for (const size of formData.sizes) {
            try {
              const quantity = sizeQuantities[size] || 0;
              console.log(`Adding size ${size} with quantity ${quantity}`);
              
              // Simple size object with only the necessary fields
              const sizeObj = {
                size: size,
                quantity: quantity,
                active: true
              };
              
              // Add to promises array
              sizesPromises.push(addProductSize(result.id, sizeObj));
              
              // Add a small delay between requests to avoid overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (sizeError) {
              console.error(`Error adding size ${size}:`, sizeError);
              // Continue with other sizes even if one fails
            }
          }
          
          // Wait for all size promises to complete
          await Promise.all(sizesPromises);
          
          // After all sizes are added, recalculate total quantity on the server
          // This is handled by the backend so no additional action needed
        }
      }
      
      setLoading(false);
      
      // Show success message
      Swal.fire({
        title: isEditMode ? 'Cập nhật thành công' : 'Thêm sản phẩm thành công',
        text: isEditMode ? 'Sản phẩm đã được cập nhật.' : 'Sản phẩm mới đã được thêm vào hệ thống.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50'
      }).then((result) => {
        // Redirect to product list after success confirmation
      navigate('/admin/products');
      });
    } catch (error) {
      setLoading(false);
      console.error('Error in product submission process:', error);
      
      // Show error message
      Swal.fire({
        title: 'Lỗi',
        text: `Không thể ${isEditMode ? 'cập nhật' : 'thêm'} sản phẩm. Lỗi: ${error.response?.data?.message || error.message || 'Unknown error'}`,
        icon: 'error',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#e65540'
      });
    }
  };
  
  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="product-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h1>
        <button 
          type="button" 
          className="cancel-button"
          onClick={() => navigate('/admin/products')}
        >
          Hủy
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-grid">
          <div className="form-section">
            <h2>Thông tin cơ bản</h2>
            
            <div className="form-group">
              <label htmlFor="name">Tên sản phẩm <span className="required">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Danh mục <span className="required">*</span></label>
              <select
                id="category"
                name="category"
                value={formData.category?.id || ''}
                onChange={handleChange}
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="price">Giá (VNĐ) <span className="required">*</span></label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="Ví dụ: 450000"
              />
              {formData.price && (
                <div className="price-display">
                  {parseInt(formData.price).toLocaleString()} VNĐ
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="des">Mô tả sản phẩm</label>
              <textarea
                id="des"
                name="des"
                value={formData.des}
                onChange={handleChange}
                rows="5"
              ></textarea>
            </div>
            
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="inStock"
                name="inStock"
                checked={formData.inStock}
                onChange={handleChange}
              />
              <label htmlFor="inStock">Còn hàng</label>
              <p className="field-help-text">
                Khi sản phẩm hết hàng, khách hàng sẽ không thể thêm sản phẩm vào giỏ hàng. 
                Bạn có thể quản lý trạng thái tồn kho chi tiết hơn trong mục "Quản lý tồn kho".
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">Tổng số lượng tồn kho</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                readOnly
                className="quantity-input"
              />
              <p className="field-help-text">
                Tổng số lượng sản phẩm được tính từ các kích thước bên dưới. Khi tổng số lượng bằng 0, sản phẩm sẽ tự động được đánh dấu là hết hàng.
              </p>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Hình ảnh</h2>
            
            <div className="image-upload-container">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Product Preview" />
                  <button 
                    type="button" 
                    className="remove-image-button"
                    onClick={handleRemoveImage}
                  >
                    <i className="fa fa-times"></i>
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <i className="fa fa-cloud-upload-alt"></i>
                  <p>Kéo thả hình ảnh vào đây hoặc nhấp để tải lên</p>
                </div>
              )}
              
              <input
                type="file"
                id="img"
                name="img"
                accept="image/*"
                onChange={handleImageChange}
                className={imagePreview ? "hidden" : ""}
              />
            </div>
            
            <div className="image-url-section">
              <button 
                type="button" 
                className="toggle-url-button"
                onClick={toggleImageUrlInput}
              >
                {showImageUrlInput ? 'Ẩn nhập URL' : 'Hoặc nhập URL hình ảnh'}
              </button>
              
              {showImageUrlInput && (
                <div className="image-url-container">
                  <div className="image-url-input-container">
                    <input
                      type="text"
                      placeholder="Nhập/dán URL hình ảnh và đợi tải tự động..."
                      value={imageUrlInput}
                      onChange={handleImageUrlChange}
                      className={`image-url-input ${imagePreview && imageUrlInput ? 'has-value' : ''} ${isLoadingImage ? 'is-loading' : ''}`}
                    />
                    {imageUrlInput && (
                      <button 
                        type="button" 
                        className={`copy-url-button ${isCopied ? 'copied' : ''}`}
                        onClick={handleCopyUrl}
                        title="Sao chép URL vào clipboard"
                      >
                        <i className={`fa ${isCopied ? 'fa-check' : 'fa-copy'}`}></i>
                      </button>
                    )}
                    {isLoadingImage && (
                      <div className="loading-indicator">
                        <i className="fa fa-spinner fa-spin"></i>
                      </div>
                    )}
                  </div>
                  <p className="url-help-text">
                    {isLoadingImage ? (
                      <>
                        <i className="fa fa-spinner fa-spin"></i> 
                        Đang tải hình ảnh...
                      </>
                    ) : imageUrlInput && imagePreview ? (
                      <>
                        <i className="fa fa-check-circle" style={{ color: '#28a745' }}></i> 
                        URL hình ảnh đã được áp dụng tự động.
                      </>
                    ) : (
                      <>
                        <i className="fa fa-info-circle"></i> 
                        Dán URL hình ảnh vào ô trên, hệ thống sẽ tự động tải hình ảnh.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
            
            <h2>Kích thước và số lượng</h2>
            
            <div className="form-group size-quantity-container">
              <label>Chọn kích thước và nhập số lượng cho mỗi kích thước</label>
              <div className="size-options">
                {availableSizes.map((size, index) => (
                  <div key={index} className="size-option-with-quantity">
                  <div 
                    className={`size-option ${formData.sizes.includes(size) ? 'selected' : ''}`}
                    onClick={() => handleSizeToggle(size)}
                  >
                    {size}
                    </div>
                    {formData.sizes.includes(size) && (
                      <div className="size-quantity">
                        <label htmlFor={`quantity-${size}`} className="size-quantity-label">Số lượng:</label>
                        <input
                          id={`quantity-${size}`}
                          type="number"
                          min="0"
                          value={sizeQuantities[size] || 0}
                          onChange={(e) => handleSizeQuantityChange(size, e.target.value)}
                          className="size-quantity-input"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="field-help-text">
                <strong>Hướng dẫn:</strong> Nhấp vào kích thước để chọn, sau đó nhập số lượng cho mỗi kích thước đã chọn. 
                Tổng số lượng sẽ được tự động tính.
              </p>
              
              {formData.sizes.length === 0 && (
                <div className="no-sizes-warning">
                  <i className="fa fa-exclamation-triangle"></i> 
                  Vui lòng chọn ít nhất một kích thước và nhập số lượng tương ứng
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="save-button">
            {isEditMode ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
          </button>
        </div>
      </form>
      
      <style jsx>{`
        .product-form-container {
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .form-header h1 {
          font-size: 24px;
          margin: 0;
          color: #333;
        }
        
        .cancel-button {
          padding: 8px 16px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .cancel-button:hover {
          background-color: #5a6268;
        }
        
        .product-form {
          width: 100%;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        .form-section {
          margin-bottom: 24px;
        }
        
        .form-section h2 {
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 16px;
          color: #333;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 8px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #495057;
        }
        
        .required {
          color: #dc3545;
        }
        
        .form-group input[type="text"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-group textarea {
          resize: vertical;
        }
        
        .price-display {
          margin-top: 4px;
          font-size: 14px;
          color: #6c757d;
        }
        
        .checkbox-group {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .checkbox-group input {
          margin-right: 10px;
        }
        
        .checkbox-group label {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          margin-bottom: 5px;
        }
        
        .field-help-text {
          font-size: 13px;
          color: #6c757d;
          margin-top: 4px;
          margin-bottom: 0;
        }
        
        .quantity-input {
          width: 100%;
          max-width: 200px;
          padding: 10px 16px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          background-color: #f8f9fa;
        }
        
        .image-upload-container {
          position: relative;
          margin-bottom: 24px;
          border: 2px dashed #ced4da;
          border-radius: 4px;
          text-align: center;
          cursor: pointer;
        }
        
        .upload-placeholder {
          padding: 60px 20px;
          color: #6c757d;
        }
        
        .upload-placeholder i {
          font-size: 48px;
          margin-bottom: 8px;
        }
        
        .upload-placeholder p {
          margin: 0;
          font-size: 14px;
        }
        
        .image-preview {
          position: relative;
        }
        
        .image-preview img {
          max-width: 100%;
          max-height: 300px;
          border-radius: 4px;
        }
        
        .remove-image-button {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .hidden {
          display: none;
        }
        
        .size-quantity-container {
          margin-top: 16px;
        }
        
        .size-options {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 8px;
        }
        
        .size-option-with-quantity {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          border: 1px solid #e9ecef;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          background-color: #f8f9fa;
        }
        
        .size-option {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
        }
        
        .size-option.selected {
          background-color: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .size-quantity {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        
        .size-quantity-label {
          font-size: 12px;
          margin-bottom: 4px;
          font-weight: normal;
        }
        
        .size-quantity-input {
          width: 70px;
          padding: 6px 8px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          text-align: center;
        }
        
        .no-sizes-warning {
          margin-top: 12px;
          padding: 8px 12px;
          background-color: #fff3cd;
          color: #856404;
          border-radius: 4px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .form-actions {
          margin-top: 32px;
          text-align: center;
        }
        
        .save-button {
          padding: 12px 24px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .save-button:hover {
          background-color: #218838;
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
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .size-info {
          margin-top: 8px;
          font-size: 13px;
          color: #666;
        }
        
        .no-sizes {
          font-style: italic;
          color: #dc3545;
        }
        
        .loading-sizes {
          padding: 10px;
          text-align: center;
          font-style: italic;
          color: #666;
        }
        
        .image-url-section {
          margin-top: 16px;
        }
        
        .image-url-container {
          margin-top: 12px;
        }
        
        .toggle-url-button {
          background-color: #f8f9fa;
          border: 1px solid #ced4da;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          color: #495057;
          transition: all 0.3s;
        }
        
        .toggle-url-button:hover {
          background-color: #e9ecef;
        }
        
        .image-url-input-container {
          display: flex;
          margin-top: 12px;
          gap: 8px;
        }
        
        .image-url-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .apply-url-button {
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        
        .apply-url-button:hover {
          background-color: #218838;
        }
        
        .url-help-text {
          margin-top: 8px;
          font-size: 12px;
          color: #6c757d;
          font-style: italic;
        }
        
        .url-help-text i {
          margin-right: 4px;
        }
        
        .image-url-input.has-value {
          background-color: #f0fff4;
          border-color: #28a745;
          color: #28a745;
          font-weight: 500;
        }
        
        @keyframes highlight {
          0% { background-color: #f0fff4; }
          50% { background-color: #d1e7dd; }
          100% { background-color: #f0fff4; }
        }
        
        .has-value {
          animation: highlight 1.5s ease-in-out;
        }
        
        .copy-url-button {
          background-color: #f8f9fa;
          color: #6c757d;
          border: 1px solid #ced4da;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .copy-url-button:hover {
          background-color: #e9ecef;
        }
        
        .copy-url-button.copied {
          background-color: #d4edda;
          color: #28a745;
          border-color: #c3e6cb;
        }
        
        .image-url-input.is-loading {
          background-color: #fff9db;
          border-color: #ffc107;
        }
        
        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffc107;
          margin: 0 8px;
        }
      `}</style>
    </div>
  );
};

export default ProductForm; 