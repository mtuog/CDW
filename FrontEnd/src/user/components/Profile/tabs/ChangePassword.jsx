import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../../config';
import Swal from 'sweetalert2';

const ChangePassword = ({ user }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [formErrors, setFormErrors] = useState({});

    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        setPasswordStrength(strength);
    };

    const validateForm = () => {
        const errors = {};
        if (!currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
        if (!newPassword) errors.newPassword = 'Vui lòng nhập mật khẩu mới';
        else if (newPassword.length < 8) errors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
        if (!confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
        else if (newPassword !== confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            
            const response = await axios.post(
                `${BACKEND_URL_HTTP}/api/UserServices/change-password?userId=${userId}`,
                {
                    currentPassword,
                    newPassword,
                    confirmPassword: newPassword
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Mật khẩu của bạn đã được thay đổi',
                    icon: 'success',
                    confirmButtonText: 'Đóng'
                });
                
                // Reset form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordStrength(0);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            
            let errorMessage = 'Đã xảy ra lỗi khi thay đổi mật khẩu';
            if (error.response) {
                if (error.response.status === 400) {
                    errorMessage = 'Mật khẩu hiện tại không đúng';
                } else if (error.response.status === 401) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
            
            Swal.fire({
                title: 'Lỗi!',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'Đóng'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-tab">
            <h4 className="mb-4">Đổi mật khẩu</h4>
            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="currentPassword" className="form-label">Mật khẩu hiện tại</label>
                            <input
                                type="password"
                                className={`form-control ${formErrors.currentPassword ? 'is-invalid' : ''}`}
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                            {formErrors.currentPassword && (
                                <div className="invalid-feedback">{formErrors.currentPassword}</div>
                            )}
                        </div>
                        
                        <div className="mb-3">
                            <label htmlFor="newPassword" className="form-label">Mật khẩu mới</label>
                            <input
                                type="password"
                                className={`form-control ${formErrors.newPassword ? 'is-invalid' : ''}`}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    checkPasswordStrength(e.target.value);
                                }}
                            />
                            {formErrors.newPassword && (
                                <div className="invalid-feedback">{formErrors.newPassword}</div>
                            )}
                            
                            <div className="password-strength mt-2">
                                <div className="strength-bars d-flex">
                                    <div className={`strength-bar ${passwordStrength >= 1 ? 'active' : ''}`}></div>
                                    <div className={`strength-bar ${passwordStrength >= 2 ? 'active' : ''}`}></div>
                                    <div className={`strength-bar ${passwordStrength >= 3 ? 'active' : ''}`}></div>
                                    <div className={`strength-bar ${passwordStrength >= 4 ? 'active' : ''}`}></div>
                                </div>
                                <small className="text-muted">
                                    {passwordStrength === 0 && 'Mật khẩu yếu'}
                                    {passwordStrength === 1 && 'Mật khẩu yếu'}
                                    {passwordStrength === 2 && 'Mật khẩu trung bình'}
                                    {passwordStrength === 3 && 'Mật khẩu mạnh'}
                                    {passwordStrength === 4 && 'Mật khẩu rất mạnh'}
                                </small>
                            </div>
                            
                            <div className="password-tips mt-1">
                                <small className="text-muted">
                                    Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                                </small>
                            </div>
                        </div>
                        
                        <div className="mb-3">
                            <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                className={`form-control ${formErrors.confirmPassword ? 'is-invalid' : ''}`}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {formErrors.confirmPassword && (
                                <div className="invalid-feedback">{formErrors.confirmPassword}</div>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Đang xử lý...
                                </>
                            ) : 'Đổi mật khẩu'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword; 