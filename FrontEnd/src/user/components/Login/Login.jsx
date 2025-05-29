import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { BsFacebook, BsTwitter } from 'react-icons/bs';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import '../css/login.css';
import '../css/Loading.css';
import {BACKEND_URL_HTTP, BACKEND_URL_HTTPS} from '../../../config';
import imgHolder from '../img/login-holder.jpg';
import Swal from 'sweetalert2';
import authService from '../../../services/authService';
function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setIsLoading(true);

                // 1. Lấy thông tin từ Google API
                const userInfo = await axios.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
                );

                const { email, name, picture } = userInfo.data;
                console.log("Google login info:", email, name, picture);


                // 2. Gửi thông tin đến backend thông qua authService
                const response = await authService.loginWithGoogle(tokenResponse.access_token, userInfo.data);

                // 3. Xử lý phản hồi
                Swal.fire({
                    title: 'Đăng nhập Google thành công!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    navigate('/');
                });

                // 3. Xử lý phản hồi từ backend
                if (response.status === 200) {
                    const { token, refreshToken, userId, userName, userRole } = response.data;

                    // Lưu thông tin vào localStorage
                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', refreshToken);
                    localStorage.setItem('userId', userId);
                    localStorage.setItem('userName', userName);
                    localStorage.setItem('userRole', userRole);

                    // Trigger event để cập nhật header
                    window.dispatchEvent(new Event('auth-change'));

                    // Thông báo thành công và chuyển hướng
                    Swal.fire({
                        title: 'Đăng nhập Google thành công!',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        navigate('/');
                    });
                }
            } catch (error) {
                console.error("Google login error:", error);

                // Hiển thị thông báo lỗi
                Swal.fire({
                    title: 'Đăng nhập Google thất bại!',
                    text: error.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập bằng Google',
                    icon: 'error',
                    confirmButtonColor: "#3085d6",
                });
            } finally {
                setIsLoading(false);
            }
        },
        onError: error => {
            console.error('Google Login Failed:', error);
            Swal.fire({
                title: 'Không thể kết nối với Google',
                text: 'Vui lòng thử lại sau',
                icon: 'error',
                confirmButtonColor: "#3085d6",
            });
        }
    });

    // Facebook SDK initialization
    useEffect(() => {
        // Load Facebook SDK
        window.fbAsyncInit = function() {
            window.FB.init({
                appId: '1068728925276648',
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
        };

        // Load Facebook SDK script
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }, []);

    // Facebook login function
    const handleFacebookLogin = () => {
        if (!window.FB) {
            console.error("Facebook SDK not loaded yet");
            Swal.fire({
                title: 'Lỗi kết nối',
                text: 'Không thể kết nối với Facebook, vui lòng thử lại sau',
                icon: 'error',
                confirmButtonColor: "#3085d6",
            });
            return;
        }

        setIsLoading(true);

        window.FB.login(async function(response) {
            if (response.authResponse) {
                console.log('Facebook login successful:', response);
                // Get user info
                window.FB.api('/me', { fields: 'id,name,email,picture' }, async function(userInfo) {
                    console.log('Facebook user info:', userInfo);

                    // Check if email is returned
                    if (!userInfo.email) {
                        setIsLoading(false);
                        Swal.fire({
                            title: 'Thiếu thông tin email',
                            text: 'Facebook không cung cấp email của bạn. Vui lòng sử dụng phương thức đăng nhập khác hoặc cập nhật email trong tài khoản Facebook.',
                            icon: 'error',
                            confirmButtonColor: "#3085d6",
                        });
                        return;
                    }

                    const userData = {
                        accessToken: response.authResponse.accessToken,
                        userId: response.authResponse.userID,
                        email: userInfo.email,
                        name: userInfo.name,
                        picture: userInfo.picture?.data?.url
                    };

                    console.log('Sending data to backend:', userData);

                    // Send to backend using authService (consistent with Google login)
                    try {
                        const response = await authService.loginWithFacebook(userData);
                        console.log('Backend response:', response);
                        setIsLoading(false);

                        // Show success message and redirect
                        Swal.fire({
                            title: 'Đăng nhập Facebook thành công!',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            navigate('/');
                        });
                    } catch (error) {
                        console.error('Error during Facebook login:', error);
                        console.error('Error details:', error.response?.data || error.message);
                        setIsLoading(false);

                        Swal.fire({
                            title: 'Đăng nhập thất bại',
                            text: error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập',
                            icon: 'error',
                            confirmButtonColor: "#3085d6",
                        });
                    }
                });
            } else {
                setIsLoading(false);
                console.log('Facebook login cancelled or failed');
            }
        }, { scope: 'public_profile,email' });
    };

    const loginHandler = async (e) => {
        e.preventDefault();

        if (email.length === 0 || password.length === 0) {
            Swal.fire({
                title: 'Please fill in all fields',
                icon: 'warning',
                confirmButtonColor: "#3085d6",
            });
            return;
        }

        if (!validateEmail(email)) {
            Swal.fire({
                title: 'Invalid email format',
                icon: 'warning',
                confirmButtonColor: "#3085d6",
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${BACKEND_URL_HTTP}/api/UserServices/login`, {
                email: email,
                password: password
            });

            setIsLoading(false);

            if (response.status === 200) {
                const { token, refreshToken, userId, userName, userRole } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('userId', userId);
                localStorage.setItem('userName', userName);
                localStorage.setItem('userRole', userRole);

                // Trigger event để cập nhật header
                window.dispatchEvent(new Event('auth-change'));

                Swal.fire({
                    title: 'Login successful!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    navigate('/');
                });
            }
        } catch (error) {
            setIsLoading(false);

            if (error.response?.status === 400 && error.response?.data?.message === "Tài khoản của bạn chưa được xác minh") {
                Swal.fire({
                    title: 'Account not verified',
                    text: 'Please verify your account before logging in',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Verify now',
                    cancelButtonText: 'Later',
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                }).then((result) => {
                    if (result.isConfirmed) {
                        localStorage.setItem('email', email);
                        navigate('/verify-account');
                    }
                });
            } else {
                Swal.fire({
                    title: 'Login failed!',
                    text: error.response?.data?.message || 'Invalid email or password',
                    icon: 'error',
                    confirmButtonColor: "#3085d6",
                });
            }
        }
    };

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
                        <h2>Đăng nhập</h2>
                        <form onSubmit={loginHandler}>
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
                                        placeholder='Email'
                                    />
                                </div>
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
                                        placeholder='Mật khẩu'
                                    />
                                </div>

                                <div className='forget-pass'>
                                    <Link to="/forgot-password">Quên mật khẩu?</Link>
                      </div>

                                <button className='login-btn' type='submit' disabled={isLoading}>
                                    ĐĂNG NHẬP
                        </button>
                      </div>

                            <div className="social-section">
                                <div className='break-line'>hoặc đăng nhập với</div>

                                <div className='icon-login'>
                                    <FcGoogle size={32} onClick={() => googleLogin()} style={{cursor: 'pointer', margin: '10px'}}/>
                                    <BsFacebook size={30} color="#1877F2" onClick={handleFacebookLogin} style={{cursor: 'pointer', margin: '10px'}}/>
                                    <BsTwitter size={30} color="#1DA1F2" style={{cursor: 'pointer', margin: '10px'}}/>
                                </div>

                                <p className='register-here'>Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
                            </div>
                    </form>
                  </div>
                </div>
              </div>
      </div>
    );
}

export default Login;
