import React, { useState, useEffect } from 'react';
import { getAvailableRoles } from '../../../api/userApi';

const CustomerForm = ({ 
    customer = null, 
    onSubmit, 
    onCancel, 
    isLoading = false,
    title = "Thêm khách hàng mới"
}) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phone: '',
        address: '',
        roles: ['USER'],
        enabled: true
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const availableRoles = getAvailableRoles();

    // Initialize form data when editing
    useEffect(() => {
        if (customer) {
            setFormData({
                username: customer.username || '',
                email: customer.email || '',
                password: '', // Always empty for security
                fullName: customer.fullName || '',
                phone: customer.phone || '',
                address: customer.address || '',
                roles: customer.roles || ['USER'],
                enabled: customer.enabled !== false
            });
        }
    }, [customer]);

    const validateForm = () => {
        const newErrors = {};

        // Username validation
        if (!formData.username.trim()) {
            newErrors.username = 'Tên người dùng là bắt buộc';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Tên người dùng phải có ít nhất 3 ký tự';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        // Password validation (only required when creating new user)
        if (!customer && !formData.password.trim()) {
            newErrors.password = 'Mật khẩu là bắt buộc';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        // Full name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ và tên là bắt buộc';
        }

        // Phone validation
        if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Số điện thoại không hợp lệ (10-11 chữ số)';
        }

        // Roles validation
        if (!formData.roles || formData.roles.length === 0) {
            newErrors.roles = 'Phải chọn ít nhất một quyền';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleRoleChange = (e) => {
        const { value, checked } = e.target;
        
        setFormData(prev => {
            let newRoles = [...prev.roles];
            
            if (checked) {
                if (!newRoles.includes(value)) {
                    newRoles.push(value);
                }
            } else {
                newRoles = newRoles.filter(role => role !== value);
            }
            
            return {
                ...prev,
                roles: newRoles
            };
        });

        // Clear role error
        if (errors.roles) {
            setErrors(prev => ({
                ...prev,
                roles: ''
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Prepare data for submission
        const submitData = { ...formData };
        
        // Remove password if it's empty (for updates)
        if (!submitData.password.trim()) {
            delete submitData.password;
        }

        onSubmit(submitData);
    };

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">{title}</h5>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Username */}
                        <div className="col-md-6 mb-3">
                            <label htmlFor="username" className="form-label">
                                Tên người dùng <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder="Nhập tên người dùng"
                                disabled={isLoading}
                            />
                            {errors.username && (
                                <div className="invalid-feedback">{errors.username}</div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="col-md-6 mb-3">
                            <label htmlFor="email" className="form-label">
                                Email <span className="text-danger">*</span>
                            </label>
                            <input
                                type="email"
                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Nhập địa chỉ email"
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <div className="invalid-feedback">{errors.email}</div>
                            )}
                        </div>

                        {/* Password */}
                        <div className="col-md-6 mb-3">
                            <label htmlFor="password" className="form-label">
                                Mật khẩu {!customer && <span className="text-danger">*</span>}
                                {customer && <small className="text-muted"> (Để trống nếu không đổi)</small>}
                            </label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder={customer ? "Nhập mật khẩu mới" : "Nhập mật khẩu"}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                                {errors.password && (
                                    <div className="invalid-feedback">{errors.password}</div>
                                )}
                            </div>
                        </div>

                        {/* Full Name */}
                        <div className="col-md-6 mb-3">
                            <label htmlFor="fullName" className="form-label">
                                Họ và tên <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Nhập họ và tên"
                                disabled={isLoading}
                            />
                            {errors.fullName && (
                                <div className="invalid-feedback">{errors.fullName}</div>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="col-md-6 mb-3">
                            <label htmlFor="phone" className="form-label">Số điện thoại</label>
                            <input
                                type="tel"
                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Nhập số điện thoại"
                                disabled={isLoading}
                            />
                            {errors.phone && (
                                <div className="invalid-feedback">{errors.phone}</div>
                            )}
                        </div>

                        {/* Address */}
                        <div className="col-md-6 mb-3">
                            <label htmlFor="address" className="form-label">Địa chỉ</label>
                            <input
                                type="text"
                                className="form-control"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Nhập địa chỉ"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Roles */}
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                Quyền hạn <span className="text-danger">*</span>
                            </label>
                            <div className="border rounded p-2">
                                {availableRoles.map(role => (
                                    <div key={role.value} className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id={`role-${role.value}`}
                                            value={role.value}
                                            checked={formData.roles.includes(role.value)}
                                            onChange={handleRoleChange}
                                            disabled={isLoading}
                                        />
                                        <label 
                                            className="form-check-label" 
                                            htmlFor={`role-${role.value}`}
                                        >
                                            {role.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {errors.roles && (
                                <div className="text-danger small mt-1">{errors.roles}</div>
                            )}
                        </div>

                        {/* Status */}
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Trạng thái</label>
                            <div className="form-check form-switch">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="enabled"
                                    name="enabled"
                                    checked={formData.enabled}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                />
                                <label className="form-check-label" htmlFor="enabled">
                                    {formData.enabled ? 'Hoạt động' : 'Tạm khóa'}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            <i className="fas fa-times me-2"></i>
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save me-2"></i>
                                    {customer ? 'Cập nhật' : 'Tạo mới'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerForm; 