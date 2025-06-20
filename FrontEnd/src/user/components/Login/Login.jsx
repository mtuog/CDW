import React, { useState, useEffect, useMemo } from 'react';
import { FaEnvelope, FaLock, FaUserShield } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { BsFacebook, BsTwitter } from 'react-icons/bs';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Detect admin intent from URL or referrer
    const isAdminIntent = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const fromAdmin = location.state?.from?.pathname?.includes('/admin');
        const adminParam = params.get('admin') === 'true';
        const adminMode = params.get('mode') === 'admin';

        return fromAdmin || adminParam || adminMode;
    }, [location]);

    // Auto-fill admin credentials when admin intent is detected
    useEffect(() => {
        if (isAdminIntent) {
            // Check if credentials were passed from redirect
            const prefillEmail = location.state?.prefillEmail;
            const prefillPassword = location.state?.prefillPassword;
            
            if (prefillEmail && prefillPassword) {
                console.log('🔄 Using prefilled credentials from redirect');
                setEmail(prefillEmail);
                setPassword(prefillPassword);
                
                // Auto login after a short delay to ensure state is set
                setTimeout(async () => {
                    console.log('🚀 Auto-logging in with admin credentials');
                    try {
                        setIsLoading(true);
                        const response = await axios.post(`${BACKEND_URL_HTTP}/api/UserServices/login`, {
                            email: prefillEmail,
                            password: prefillPassword
                        });
                        
                        if (response.status === 200) {
                            console.log('✅ Auto-login successful');
                            handleSuccessfulLogin(response.data);
                        }
                        setIsLoading(false);
                    } catch (error) {
                        console.error('❌ Auto-login failed:', error);
                        setIsLoading(false);
                        Swal.fire({
                            title: 'Đăng nhập tự động thất bại',
                            text: 'Vui lòng đăng nhập thủ công',
                            icon: 'warning',
                            confirmButtonColor: "#3085d6",
                        });
                    }
                }, 1000);
            } else {
                // Default admin credentials
                setEmail('admin@cdweb.com');
                setPassword('admin123');
            }
        }
    }, [isAdminIntent, location.state]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Smart redirect logic based on user roles and intent
    const handleSuccessfulLogin = (userData) => {
        console.log('🔍 DEBUG - Full userData:', JSON.stringify(userData, null, 2));

        const { userRoles } = userData;
        console.log('🔍 DEBUG - userRoles raw:', userRoles, 'Type:', typeof userRoles, 'isArray:', Array.isArray(userRoles));

        // Convert userRoles to array if it's a Set or other format
        let rolesArray = userRoles || [];
        if (typeof rolesArray === 'object' && !Array.isArray(rolesArray)) {
            // If it's a Set or similar object, convert to array
            rolesArray = Object.values(rolesArray);
        }

        console.log('🔍 DEBUG - rolesArray after conversion:', rolesArray);

        const hasAdminRole = rolesArray && rolesArray.includes('ADMIN');
        const hasUserRole = rolesArray && rolesArray.includes('USER');

        console.log('🔍 DEBUG - hasAdminRole:', hasAdminRole, 'hasUserRole:', hasUserRole, 'isAdminIntent:', isAdminIntent);

        // If admin intent but no admin role
        if (isAdminIntent && !hasAdminRole) {
            Swal.fire({
                title: 'Quyền truy cập bị từ chối',
                text: 'Tài khoản này không có quyền truy cập trang quản trị',
                icon: 'error',
                confirmButtonColor: '#dc3545',
            });
            return;
        }

        // If admin intent and has admin role
        if (isAdminIntent && hasAdminRole) {
            storeAdminCredentials(userData);
            const redirectPath = location.state?.from?.pathname || '/admin/dashboard';
            navigate(redirectPath);
            return;
        }

        // If user has both roles but no specific intent, ask them to choose
        if (hasAdminRole && hasUserRole && !isAdminIntent) {
            console.log('🎯 Showing role selection popup - user has both roles!');
            Swal.fire({
                title: 'Chọn chế độ đăng nhập',
                text: 'Bạn có quyền truy cập cả User và Admin. Bạn muốn đăng nhập với vai trò nào?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '🔧 Admin Dashboard',
                cancelButtonText: '🌐 User Website',
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#007bff',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    storeAdminCredentials(userData);
                    navigate('/admin/dashboard');
                } else {
                    storeUserCredentials(userData);
                    navigate('/');
                }
            });
            return;
        }

        // If user only has admin role (no user role) and not admin intent, redirect to admin login form
        if (hasAdminRole && !hasUserRole && !isAdminIntent) {
            console.log('🔄 Admin-only user detected, redirecting to admin login form');
            Swal.fire({
                title: 'Tài khoản quản trị viên',
                text: 'Tài khoản này là tài khoản quản trị viên. Bạn sẽ được chuyển đến trang đăng nhập quản trị.',
                icon: 'info',
                confirmButtonText: 'Chuyển đến admin login',
                confirmButtonColor: '#28a745',
            }).then(() => {
                // Redirect to admin login form with pre-filled credentials
                navigate('/login?admin=true', { state: { prefillEmail: email, prefillPassword: password } });
            });
            return;
        }

        // If admin intent and admin only role, proceed normally
        if (hasAdminRole && !hasUserRole && isAdminIntent) {
            console.log('🎯 Admin-only user logging in via admin form - success');
            storeAdminCredentials(userData);
            navigate('/admin/dashboard');
            return;
        }

        // If user has both roles but no specific intent, ask them to choose
        if (false) { // This block is now handled above
            console.log('🎯 Showing role selection popup!');
            Swal.fire({
                title: 'Chọn chế độ đăng nhập',
                text: 'Bạn có quyền truy cập cả User và Admin. Bạn muốn đăng nhập với vai trò nào?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '🔧 Admin Dashboard',
                cancelButtonText: '🌐 User Website',
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#007bff',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    storeAdminCredentials(userData);
                    navigate('/admin/dashboard');
                } else {
                    storeUserCredentials(userData);
                    navigate('/');
                }
            });
            return;
        }

        // Default: store as user and redirect
        storeUserCredentials(userData);
        const redirectPath = location.state?.from?.pathname || '/';
        navigate(redirectPath);
    };

    const storeUserCredentials = (userData) => {
        const { token, refreshToken, userId, userName, userRole, userRoles, isSuperAdmin } = userData;

        // Store user credentials
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', userId);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userRoles', JSON.stringify(userRoles || []));
        localStorage.setItem('isSuperAdmin', isSuperAdmin);

        // Clear admin credentials to avoid conflicts
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminRoles');
        localStorage.removeItem('adminIsSuperAdmin');

        // Trigger auth change event
        window.dispatchEvent(new Event('auth-change'));

        console.log('Stored user credentials for:', userName, 'isSuperAdmin:', isSuperAdmin);
    };

    const storeAdminCredentials = (userData) => {
        const { token, refreshToken, userId, userName, userRole, userRoles, isSuperAdmin } = userData;

        // Store admin credentials
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminRefreshToken', refreshToken);
        localStorage.setItem('adminId', userId);
        localStorage.setItem('adminName', userName);
        localStorage.setItem('adminRole', userRole);
        localStorage.setItem('adminRoles', JSON.stringify(userRoles || []));
        localStorage.setItem('adminIsSuperAdmin', isSuperAdmin);

        // Clear user credentials to avoid conflicts
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userRoles');
        localStorage.removeItem('isSuperAdmin');

        // Trigger auth change event
        window.dispatchEvent(new Event('auth-change'));

        console.log('Stored admin credentials for:', userName, 'isSuperAdmin:', isSuperAdmin);
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
                console.log('Google login response:', response);
                setIsLoading(false);

                // 3. Show success and smart redirect
                Swal.fire({
                    title: 'Đăng nhập Google thành công!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    handleSuccessfulLogin(response);
                });

            } catch (error) {
                console.error('Google login error:', error);
                setIsLoading(false);
                Swal.fire({
                    title: 'Đăng nhập Google thất bại!',
                    text: error.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập bằng Google',
                    icon: 'error',
                    confirmButtonColor: "#3085d6",
                });
            }
        },
        onError: error => {
            console.error('Google Login Failed:', error);
            setIsLoading(false);
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

        window.FB.login(function(response) {
            if (response.authResponse) {
                console.log('Facebook login successful:', response);
                // Get user info
                window.FB.api('/me', { fields: 'id,name,email,picture' }, function(userInfo) {
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

                    // Process Facebook login
                    processFacebookLogin(userData);
                });
            } else {
                setIsLoading(false);
                console.log('Facebook login cancelled or failed');
            }
        }, { scope: 'public_profile,email' });
    };

    // Separate async function to handle Facebook login processing
    const processFacebookLogin = async (userData) => {
        try {
            const response = await authService.loginWithFacebook(userData);
            console.log('Facebook login response:', response);
            setIsLoading(false);

            // Show success message and smart redirect
            Swal.fire({
                title: 'Đăng nhập Facebook thành công!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                handleSuccessfulLogin(response);
            });
        } catch (error) {
            console.error('Error during Facebook login:', error);
            setIsLoading(false);
            Swal.fire({
                title: 'Đăng nhập thất bại',
                text: error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập',
                icon: 'error',
                confirmButtonColor: "#3085d6",
            });
        }
    };

    const loginHandler = async (e) => {
        e.preventDefault();

        if (email.length === 0 || password.length === 0) {
            Swal.fire({
                title: 'Vui lòng điền đầy đủ thông tin',
                icon: 'warning',
                confirmButtonColor: "#3085d6",
            });
            return;
        }

        if (!validateEmail(email)) {
            Swal.fire({
                title: 'Email không đúng định dạng',
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
                const userData = response.data;
                console.log('Login response:', userData);

                Swal.fire({
                    title: 'Đăng nhập thành công!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    handleSuccessfulLogin(userData);
                });
            }
        } catch (error) {
            setIsLoading(false);

            if (error.response?.status === 400 && error.response?.data?.message === "Tài khoản của bạn chưa được xác minh") {
                Swal.fire({
                    title: 'Tài khoản chưa được xác minh',
                    text: 'Vui lòng xác minh tài khoản trước khi đăng nhập',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Xác minh ngay',
                    cancelButtonText: 'Để sau',
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
                    title: 'Đăng nhập thất bại!',
                    text: error.response?.data?.message || 'Email hoặc mật khẩu không chính xác',
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
                        {isAdminIntent && (
                            <div className="admin-mode-indicator">
                                <FaUserShield size={20} />
                                <span>Chế độ quản trị viên</span>
                            </div>
                        )}

                        <h2>{isAdminIntent ? 'Đăng nhập quản trị' : 'Đăng nhập'}</h2>

                        {isAdminIntent && (
                            <div className="admin-notice">
                                <p>🔐 Bạn đang truy cập khu vực quản trị</p>
                                {location.state?.prefillEmail && (
                                    <p className="auto-login-notice">
                                        ⚡ Đang tự động đăng nhập với tài khoản admin...
                                    </p>
                                )}
                            </div>
                        )}

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

                                <button
                                    className={`login-btn ${isAdminIntent ? 'admin-btn' : ''}`}
                                    type='submit'
                                    disabled={isLoading}
                                >
                                    {isAdminIntent ? 'ĐĂNG NHẬP QUẢN TRỊ' : 'ĐĂNG NHẬP'}
                                </button>
                            </div>

                            {!isAdminIntent && (
                                <div className="social-section">
                                    <div className='break-line'>hoặc đăng nhập với</div>

                                    <div className='icon-login'>
                                        <FcGoogle size={32} onClick={() => googleLogin()} style={{cursor: 'pointer', margin: '10px'}}/>
                                        <BsFacebook size={30} color="#1877F2" onClick={handleFacebookLogin} style={{cursor: 'pointer', margin: '10px'}}/>
                                        <BsTwitter size={30} color="#1DA1F2" style={{cursor: 'pointer', margin: '10px'}}/>
                                    </div>

                                    <p className='register-here'>Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
                                </div>
                            )}

                            {isAdminIntent && (
                                <div className="back-to-user">
                                    <Link to="/login" className="back-link">
                                        ← Quay lại đăng nhập thường
                                    </Link>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
