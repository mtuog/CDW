import React, { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import '../css/login.css';
import '../css/Loading.css';
import { BACKEND_URL_HTTP } from '../../../config';
import imgHolder from '../img/login-holder.jpg';
import Swal from 'sweetalert2';
import axios from 'axios';

function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const recoverPasswordHandler = async (e) => {
        e.preventDefault();
        
        if (!validateEmail(email)) {
            Swal.fire({
                title: 'Email không đúng định dạng',
                text: 'Vui lòng kiểm tra lại địa chỉ email',
                icon: 'warning',
                confirmButtonColor: "#3085d6",
            });
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await axios.post(`${BACKEND_URL_HTTP}/api/UserServices/ForgotPassword?email=${encodeURIComponent(email)}`);
            
            setIsLoading(false);

            if(response.status === 200) {
                if(response.data.message === "Email này không đăng ký trên hệ thống. Vui lòng nhập lại email của bạn") {
                    Swal.fire({
                        title: 'Không tìm thấy tài khoản',
                        text: 'Email này chưa được đăng ký. Vui lòng kiểm tra lại.',
                        icon: 'error',
                        confirmButtonColor: "#3085d6",
                    });
                } else if(response.data.message === "Hệ thống đã gửi mật khẩu mới vào email của bạn. Vui lòng kiểm tra thư của bạn") {
                    Swal.fire({
                        title: 'Lấy lại mật khẩu thành công!',
                        text: 'Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
                        icon: 'success',
                        confirmButtonColor: "#3085d6",
                    }).then(() => {
                        navigate('/login');
                    });
                }
            }
        } catch (error) {
            setIsLoading(false);
            Swal.fire({
                title: 'Lấy lại mật khẩu thất bại',
                text: error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau!',
                icon: 'error',
                confirmButtonColor: "#3085d6",
            });
        }
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
                        <h2>Quên mật khẩu</h2>
                        <form onSubmit={recoverPasswordHandler}>
                            <div className="form-inputs">
                                <div className={`form-group ${isEmailFocused ? 'focused' : ''}`}>
                                    <label>
                                        <FaEnvelope/> 
                                    </label>
                                    <input
                                        type='text'
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setIsEmailFocused(true)}
                                        onBlur={() => setIsEmailFocused(false)}
                                        placeholder='Nhập email của bạn'
                                    />
                                </div>
                       
                                <button className='login-btn' type='submit' disabled={isLoading}>
                                    LẤY LẠI MẬT KHẨU
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

export default ForgotPassword; 