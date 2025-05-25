import React, { useState, useEffect } from 'react';
import { FaLock } from 'react-icons/fa';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import '../css/login.css';
import '../css/Loading.css';
import { BACKEND_URL_HTTP } from '../../../config';
import imgHolder from '../img/login-holder.jpg';
import Swal from 'sweetalert2';
import axios from 'axios';

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [isCheckingToken, setIsCheckingToken] = useState(true);

    useEffect(() => {
        // Kiểm tra token có hợp lệ không khi component mount
        if (!token) {
            Swal.fire({
                title: 'Lỗi xác thực',
                text: 'Token đặt lại mật khẩu không hợp lệ hoặc thiếu',
                icon: 'error',
                confirmButtonColor: "#3085d6",
            }).then(() => {
                navigate('/forgot-password');
            });
            return;
        }

        const validateToken = async () => {
            try {
                setIsCheckingToken(true);
                const response = await axios.get(`${BACKEND_URL_HTTP}/api/UserServices/validate-reset-token?token=${token}`);
                setIsTokenValid(response.data.valid);
                
                if (!response.data.valid) {
                    Swal.fire({
                        title: 'Token không hợp lệ',
                        text: 'Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ',
                        icon: 'error',
                        confirmButtonColor: "#3085d6",
                    }).then(() => {
                        navigate('/forgot-password');
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Lỗi xác thực',
                    text: 'Không thể xác thực token đặt lại mật khẩu',
                    icon: 'error',
                    confirmButtonColor: "#3085d6",
                }).then(() => {
                    navigate('/forgot-password');
                });
            } finally {
                setIsCheckingToken(false);
            }
        };

        validateToken();
    }, [token, navigate]);

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const resetPasswordHandler = async (e) => {
        e.preventDefault();
        
        if (!validatePassword(password)) {
            Swal.fire({
                title: 'Mật khẩu không hợp lệ',
                text: 'Mật khẩu phải có ít nhất 6 ký tự',
                icon: 'warning',
                confirmButtonColor: "#3085d6",
            });
            return;
        }

        if (password !== confirmPassword) {
            Swal.fire({
                title: 'Mật khẩu không khớp',
                text: 'Mật khẩu và xác nhận mật khẩu phải giống nhau',
                icon: 'warning',
                confirmButtonColor: "#3085d6",
            });
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await axios.post(`${BACKEND_URL_HTTP}/api/UserServices/reset-password`, {
                token: token,
                newPassword: password
            });
            
            setIsLoading(false);

            if (response.status === 200) {
                Swal.fire({
                    title: 'Đặt lại mật khẩu thành công!',
                    text: 'Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập bằng mật khẩu mới.',
                    icon: 'success',
                    confirmButtonColor: "#3085d6",
                }).then(() => {
                    navigate('/login');
                });
            }
        } catch (error) {
            setIsLoading(false);
            Swal.fire({
                title: 'Đặt lại mật khẩu thất bại',
                text: error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau!',
                icon: 'error',
                confirmButtonColor: "#3085d6",
            });
        }
    };

    if (isCheckingToken) {
        return (
            <div className="background-image">
                <div className='overlay'>
                    <div className='main-container content'>
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <div className="loading-text">Đang xác thực...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isTokenValid) {
        return null; // Đã chuyển hướng trong useEffect
    }
    
    return (
        <div className="background-image">
            <div className='overlay'>
                <div className='main-container content'>
                    {isLoading && (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <div className="loading-text">Đang xử lý...</div>
                        </div>
                    )}
                    <div className='img-container'>
                        <img src={imgHolder} alt='Login img holder'></img>
                    </div>
                    <div className="login-container">
                        <h2>Đặt lại mật khẩu</h2>
                        <form onSubmit={resetPasswordHandler}>
                            <div className="form-inputs">
                                <div className={`form-group ${isPasswordFocused ? 'focused' : ''}`}>
                                    <label>
                                        <FaLock/> 
                                    </label>
                                    <input
                                        type='password'
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setIsPasswordFocused(true)}
                                        onBlur={() => setIsPasswordFocused(false)}
                                        placeholder='Nhập mật khẩu mới'
                                    />
                                </div>
                                
                                <div className={`form-group ${isConfirmPasswordFocused ? 'focused' : ''}`}>
                                    <label>
                                        <FaLock/> 
                                    </label>
                                    <input
                                        type='password'
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onFocus={() => setIsConfirmPasswordFocused(true)}
                                        onBlur={() => setIsConfirmPasswordFocused(false)}
                                        placeholder='Xác nhận mật khẩu mới'
                                    />
                                </div>
                       
                                <button className='login-btn' type='submit' disabled={isLoading}>
                                    ĐẶT LẠI MẬT KHẨU
                                </button>
                            </div>
                            
                            <div className="social-section">
                                <div className='break-line'>hoặc</div>
                                
                                <p className='register-here'>
                                    <Link to="/login">Quay lại đăng nhập</Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword; 