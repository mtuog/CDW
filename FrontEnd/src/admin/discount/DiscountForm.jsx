import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import discountCodeApi from '../../api/discountCodeApi';
import { getAllCategories } from '../../api/categoryApi';
import { getAllProducts } from '../../api/productApi';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { registerLocale } from 'react-datepicker';
import vi from 'date-fns/locale/vi';

registerLocale('vi', vi);

const DiscountForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    value: '',
    minimumPurchaseAmount: '',
    maximumDiscountAmount: '',
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    maxUsage: '',
    active: true,
    oneTimePerUser: false,
    applicableCategoryIds: [],
    applicableProductIds: []
  });

  // Fetch categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, productsData] = await Promise.all([
          getAllCategories(),
          getAllProducts()
        ]);

        setCategories(categoriesData);
        setProducts(productsData);

        if (isEditMode) {
          setLoading(true);
          const discountData = await discountCodeApi.getDiscountCodeById(id);

          // Convert string dates to Date objects
          discountData.startDate = new Date(discountData.startDate);
          discountData.endDate = new Date(discountData.endDate);

          setFormData(discountData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Không thể tải dữ liệu, vui lòng thử lại sau'
        });
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleCategoryChange = (selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      applicableCategoryIds: selectedOptions ? selectedOptions.map(option => option.value) : []
    }));
  };

  const handleProductChange = (selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      applicableProductIds: selectedOptions ? selectedOptions.map(option => option.value) : []
    }));
  };

  const validateForm = () => {
    if (!formData.code.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Vui lòng nhập mã giảm giá'
      });
      return false;
    }

    if (!formData.description.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Vui lòng nhập mô tả mã giảm giá'
      });
      return false;
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Vui lòng nhập giá trị hợp lệ cho mã giảm giá'
      });
      return false;
    }

    if (formData.discountType === 'PERCENTAGE' && parseFloat(formData.value) > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Giá trị phần trăm không thể lớn hơn 100%'
      });
      return false;
    }

    if (formData.startDate >= formData.endDate) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Ngày bắt đầu phải trước ngày kết thúc'
      });
      return false;
    }

    if (formData.minimumPurchaseAmount && parseFloat(formData.minimumPurchaseAmount) < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Giá trị đơn hàng tối thiểu không thể là số âm'
      });
      return false;
    }

    if (formData.maximumDiscountAmount && parseFloat(formData.maximumDiscountAmount) < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Số tiền giảm giá tối đa không thể là số âm'
      });
      return false;
    }

    if (formData.maxUsage && parseInt(formData.maxUsage) < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Số lần sử dụng tối đa không thể là số âm'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Handle empty fields with appropriate value
      const preparedData = {
        ...formData,
        minimumPurchaseAmount: formData.minimumPurchaseAmount || null,
        maximumDiscountAmount: formData.maximumDiscountAmount || null,
        maxUsage: formData.maxUsage || null
      };

      if (isEditMode) {
        await discountCodeApi.updateDiscountCode(id, preparedData);
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Mã giảm giá đã được cập nhật',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await discountCodeApi.createDiscountCode(preparedData);
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Mã giảm giá đã được tạo',
          timer: 1500,
          showConfirmButton: false
        });
      }

      navigate('/admin/discount');
    } catch (error) {
      console.error('Error saving discount code:', error);

      let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại sau';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }

      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/discount');
  };

  // Options for select fields
  const categoryOptions = categories.map(category => ({
    value: category.id,
    label: category.name
  }));

  const productOptions = products.map(product => ({
    value: product.id,
    label: product.name
  }));

  // Selected values for Select components
  const selectedCategories = categoryOptions.filter(option =>
    formData.applicableCategoryIds.includes(option.value)
  );

  const selectedProducts = productOptions.filter(option =>
    formData.applicableProductIds.includes(option.value)
  );

  if (loading && isEditMode) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="discount-form-container">
      <div className="page-header">
        <h1>{isEditMode ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Basic Information */}
          <div className="form-section">
            <h2>Thông tin cơ bản</h2>

            <div className="form-group">
              <label htmlFor="code">Mã giảm giá <span className="required">*</span></label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="VD: SUMMER2023"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Mô tả <span className="required">*</span></label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả chi tiết về mã giảm giá"
                className="form-control"
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="discountType">Loại giảm giá <span className="required">*</span></label>
              <select
                id="discountType"
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="value">Giá trị <span className="required">*</span></label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  id="value"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  placeholder={formData.discountType === 'PERCENTAGE' ? 'VD: 10' : 'VD: 50000'}
                  className="form-control"
                  min="0"
                  max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                  step="any"
                  required
                />
                <span className="input-suffix">
                  {formData.discountType === 'PERCENTAGE' ? '%' : 'VNĐ'}
                </span>
              </div>
            </div>
          </div>

          {/* Restrictions */}
          <div className="form-section">
            <h2>Điều kiện áp dụng</h2>

            <div className="form-group">
              <label htmlFor="minimumPurchaseAmount">Giá trị đơn hàng tối thiểu</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  id="minimumPurchaseAmount"
                  name="minimumPurchaseAmount"
                  value={formData.minimumPurchaseAmount}
                  onChange={handleInputChange}
                  placeholder="VD: 100000"
                  className="form-control"
                  min="0"
                  step="any"
                />
                <span className="input-suffix">VNĐ</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="maximumDiscountAmount">Số tiền giảm giá tối đa</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  id="maximumDiscountAmount"
                  name="maximumDiscountAmount"
                  value={formData.maximumDiscountAmount}
                  onChange={handleInputChange}
                  placeholder="VD: 200000"
                  className="form-control"
                  min="0"
                  step="any"
                  disabled={formData.discountType !== 'PERCENTAGE'}
                />
                <span className="input-suffix">VNĐ</span>
              </div>
              {formData.discountType === 'PERCENTAGE' && (
                <small className="form-text">
                  Áp dụng khi giảm giá theo phần trăm để giới hạn số tiền giảm tối đa
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="maxUsage">Số lần sử dụng tối đa</label>
              <input
                type="number"
                id="maxUsage"
                name="maxUsage"
                value={formData.maxUsage}
                onChange={handleInputChange}
                placeholder="Để trống nếu không giới hạn"
                className="form-control"
                min="0"
                step="1"
              />
              <small className="form-text">Để trống nếu không giới hạn số lần sử dụng</small>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="oneTimePerUser"
                  checked={formData.oneTimePerUser}
                  onChange={handleInputChange}
                />
                Chỉ sử dụng một lần trên mỗi tài khoản
              </label>
            </div>
          </div>

          {/* Validity Period */}
          <div className="form-section">
            <h2>Thời gian hiệu lực</h2>

            <div className="form-group">
              <label htmlFor="startDate">Ngày bắt đầu <span className="required">*</span></label>
              <DatePicker
                id="startDate"
                selected={formData.startDate}
                onChange={(date) => handleDateChange(date, 'startDate')}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                locale="vi"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Ngày kết thúc <span className="required">*</span></label>
              <DatePicker
                id="endDate"
                selected={formData.endDate}
                onChange={(date) => handleDateChange(date, 'endDate')}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                locale="vi"
                className="form-control"
                required
                minDate={formData.startDate}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                />
                Kích hoạt mã giảm giá
              </label>
            </div>
          </div>

          {/* Applicable To */}
          <div className="form-section">
            <h2>Phạm vi áp dụng</h2>

            <div className="form-group">
              <label htmlFor="applicableCategories">Áp dụng cho danh mục</label>
              <Select
                id="applicableCategories"
                isMulti
                options={categoryOptions}
                value={selectedCategories}
                onChange={handleCategoryChange}
                placeholder="Chọn danh mục áp dụng"
                noOptionsMessage={() => "Không có danh mục nào"}
                classNamePrefix="react-select"
              />
              <small className="form-text">Để trống nếu áp dụng cho tất cả danh mục</small>
            </div>

            <div className="form-group">
              <label htmlFor="applicableProducts">Áp dụng cho sản phẩm</label>
              <Select
                id="applicableProducts"
                isMulti
                options={productOptions}
                value={selectedProducts}
                onChange={handleProductChange}
                placeholder="Chọn sản phẩm áp dụng"
                noOptionsMessage={() => "Không có sản phẩm nào"}
                classNamePrefix="react-select"
              />
              <small className="form-text">Để trống nếu áp dụng cho tất cả sản phẩm</small>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Tạo mã giảm giá'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .discount-form-container {
          background-color: #fff;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          padding: 20px;
        }

        .page-header {
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }

        .page-header h1 {
          font-size: 24px;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-section {
          background-color: #f9fafb;
          border-radius: 5px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .form-section h2 {
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 15px;
          color: #4b5563;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #374151;
        }

        .form-control {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-control:focus {
          border-color: #2c7be5;
          outline: none;
          box-shadow: 0 0 0 2px rgba(44, 123, 229, 0.2);
        }

        .input-with-suffix {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-suffix input {
          flex: 1;
          padding-right: 40px;
        }

        .input-suffix {
          position: absolute;
          right: 10px;
          color: #6b7280;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-group input[type="checkbox"] {
          margin-right: 8px;
        }

        .form-text {
          display: block;
          margin-top: 5px;
          font-size: 12px;
          color: #6b7280;
        }

        .required {
          color: #ef4444;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background-color: #2c7be5;
          color: white;
        }

        .btn-primary:hover {
          background-color: #1a68d1;
        }

        .btn-primary:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #f3f4f6;
          color: #4b5563;
        }

        .btn-secondary:hover {
          background-color: #e5e7eb;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
        }

        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2c7be5;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Override react-select styles */
        :global(.react-select__control) {
          border-color: #d1d5db;
          box-shadow: none;
          min-height: 42px;
        }

        :global(.react-select__control--is-focused) {
          border-color: #2c7be5;
          box-shadow: 0 0 0 1px #2c7be5;
        }

        :global(.react-select__multi-value) {
          background-color: #e0f2fe;
        }

        :global(.react-select__multi-value__label) {
          color: #0c4a6e;
        }

        /* Override react-datepicker styles */
        :global(.react-datepicker-wrapper) {
          width: 100%;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DiscountForm;
