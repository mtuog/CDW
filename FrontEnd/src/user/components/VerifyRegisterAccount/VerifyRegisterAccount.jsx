import React, { useState } from 'react';
import { FaCode } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import '../css/login.css';
import '../css/Loading.css';
import { BACKEND_URL_HTTP } from '../../../config';
import imgHolder from '../img/login-holder.jpg';
import Swal from 'sweetalert2';
import axios from 'axios';

function VerifyRegisterAccount() {
    const navigate = useNavigate();
    const [codeVerify, setCodeVerify] = useState('');
    const [isCodeVerifyFocused, setIsCodeVerifyFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateCodeVerify = (codeVerify) => {
        const regex = /^\d{6}$/;
        return regex.test(codeVerify);
    }

    const verifyHandler = async (e) => {
        e.preventDefault();
        
        if (!validateCodeVerify(codeVerify)) {
            Swal.fire({
                title: 'Mã xác thực không đúng định dạng',
                text: 'Mã xác thực phải là 6 chữ số',
                icon: 'warning',
                confirmButtonColor: "#3085d6",
            });
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await axios.post(`${BACKEND_URL_HTTP}/api/UserServices/verifyAccount`, {
                email: localStorage.getItem("email"),
                otp: codeVerify
            });
            
            setIsLoading(false);

            if(response.status === 200) {
                if(response.data.message === "Tài khoản xác thực thành công.") {
                    Swal.fire({
                        title: 'Xác thực thành công!',
                        text: 'Tài khoản của bạn đã được xác thực. Vui lòng đăng nhập.',
                        icon: 'success',
                        confirmButtonColor: "#3085d6",
                    }).then(() => {
                        navigate('/login');
                    });
                } else if(response.data.message === "Mã xác thực không đúng. Vui lòng nhập lại.") {
                    Swal.fire({
                        title: 'Xác thực thất bại!',
                        text: 'Mã xác thực không chính xác. Vui lòng kiểm tra lại.',
                        icon: 'error',
                        confirmButtonColor: "#3085d6",
                    });
                } else if(response.data.message === "Thời gian mã xác thực đã quá 30 phút. Vui lòng đăng ký lại tài khoản.") {
                    Swal.fire({
                        title: 'Xác thực thất bại!',
                        text: 'Mã xác thực đã hết hạn. Vui lòng đăng ký lại tài khoản.',
                        icon: 'error',
                        confirmButtonColor: "#3085d6",
                    }).then(() => {
                        navigate('/register');
                    });
                }
            }
        } catch (error) {
            setIsLoading(false);
            Swal.fire({
                title: 'Xác thực thất bại!',
                text: error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau!',
                icon: 'error',
                confirmButtonColor: "#3085d6",
            });
        }
    }
    
    const resendCode = () => {
        const email = localStorage.getItem("email");
        if (!email) {
            Swal.fire({
                title: 'Không tìm thấy email',
                text: 'Vui lòng quay lại trang đăng ký',
                icon: 'error',
                confirmButtonColor: "#3085d6",
            }).then(() => {
                navigate('/register');
            });
            return;
        }
        
        setIsLoading(true);
        
        axios.post(`${BACKEND_URL_HTTP}/api/UserServices/resend-verification`, { email })
            .then((response) => {
                setIsLoading(false);
                if (response.status === 200) {
                    Swal.fire({
                        title: 'Đã gửi lại mã xác thực',
                        text: 'Vui lòng kiểm tra email của bạn',
                        icon: 'success',
                        confirmButtonColor: "#3085d6",
                    });
                }
            })
            .catch((error) => {
                setIsLoading(false);
                Swal.fire({
                    title: 'Gửi lại mã thất bại',
                    text: error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau!',
                    icon: 'error',
                    confirmButtonColor: "#3085d6",
                });
            });
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
                        <h2>Xác thực tài khoản</h2>
                        <form onSubmit={verifyHandler}>
                            <div className="form-inputs">
                                <p className="verification-desc">
                                    Vui lòng nhập mã xác thực 6 chữ số được gửi đến email của bạn
                                </p>
                                <div className={`form-group ${isCodeVerifyFocused ? 'focused' : ''}`}>
                                    <label>
                                        <FaCode/> 
                                    </label>
                                    <input
                                        type='text'
                                        value={codeVerify}
                                        onChange={(e) => setCodeVerify(e.target.value)}
                                        onFocus={() => setIsCodeVerifyFocused(true)}
                                        onBlur={() => setIsCodeVerifyFocused(false)}
                                        placeholder='Nhập mã xác thực'
                                    />
                                </div>
                           
                                <button className='login-btn' type='submit' disabled={isLoading}>
                                    XÁC THỰC
                                </button>
                            </div>
                            
                            <div className="social-section">
                                <div className='break-line'>hoặc</div>
                                
                                <button type="button" onClick={resendCode} className="resend-btn">
                                    Gửi lại mã xác thực
                                </button>
                                
                                <p className='register-here'>
                                    <Link to="/register">Quay lại đăng ký</Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyRegisterAccount; 