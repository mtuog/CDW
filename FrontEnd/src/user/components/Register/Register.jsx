import React, { createContext, useState, useContext } from 'react';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import '../css/login.css';
import '../css/Loading.css';
import { BACKEND_URL_HTTP } from '../../../config';
import imgHolder from '../img/login-holder.jpg';
import Swal from 'sweetalert2';
import axios from 'axios';

function Register() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isUsernameFocused, setIsUsernameFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // States cho validation UI
    const [errors, setErrors] = useState({});
    const [validFields, setValidFields] = useState({});

    const AuthContext = createContext();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const validateUserName = (username) => {
        return username.length >= 3;
    }

    const validatePassword = (password) => {
        return password.length >= 6;
    }

    // Real-time validation cho UI
    const handleInputChange = (field, value) => {
        const newErrors = { ...errors };
        const newValidFields = { ...validFields };

        switch (field) {
            case 'username':
                setUsername(value);
                if (value.trim() === '') {
                    delete newErrors.username;
                    delete newValidFields.username;
                } else if (!validateUserName(value)) {
                    newErrors.username = 'Tên người dùng phải có ít nhất 3 ký tự';
                    delete newValidFields.username;
                } else {
                    delete newErrors.username;
                    newValidFields.username = true;
                }
                break;
            case 'email':
                setEmail(value);
                if (value.trim() === '') {
                    delete newErrors.email;
                    delete newValidFields.email;
                } else if (!validateEmail(value)) {
                    newErrors.email = "'email' không phải là email hợp lệ";
                    delete newValidFields.email;
                } else {
                    delete newErrors.email;
                    newValidFields.email = true;
                }
                break;
            case 'password':
                setPassword(value);
                if (value.trim() === '') {
                    delete newErrors.password;
                    delete newValidFields.password;
                } else if (!validatePassword(value)) {
                    newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
                    delete newValidFields.password;
                } else {
                    delete newErrors.password;
                    newValidFields.password = true;
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
        setValidFields(newValidFields);
    };

    // Hàm để xác định class cho form-group
    const getFormGroupClass = (field, isFocused) => {
        let className = 'form-group';
        if (isFocused) className += ' focused';
        if (errors[field]) className += ' error';
        else if (validFields[field]) className += ' success';
        return className;
    };

    const registerHandler = async (e) => {
        e.preventDefault();

        // Validation cho UI trước khi gửi
        const newErrors = {};

        if (!username.trim()) newErrors.username = 'Vui lòng nhập tên người dùng';
        else if (!validateUserName(username)) newErrors.username = 'Tên người dùng phải có ít nhất 3 ký tự';

        if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
        else if (!validateEmail(email)) newErrors.email = "'email' không phải là email hợp lệ";

        if (!password.trim()) newErrors.password = 'Vui lòng nhập mật khẩu';
        else if (!validatePassword(password)) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to first error
            const firstErrorField = Object.keys(newErrors)[0];
            const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                errorElement.focus();
            }
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${BACKEND_URL_HTTP}/api/UserServices/register`, {
                userName: username,
                email: email,
                password: password
            });

            setIsLoading(false);

            if (response.status === 200 && response.data.message === "Đăng ký tài khoản thành công ! Vui lòng xác minh tài khoản") {
                Swal.fire({
                    title: 'Đăng ký thành công!',
                    text: 'Vui lòng kiểm tra email để xác minh tài khoản.',
                    icon: 'success',
                    confirmButtonColor: "#3085d6",
                }).then(() => {
                    localStorage.setItem('email', email);
                    navigate('/verify-account');
                });
            }
            if (response.status === 200 && response.data.message === "Email này đã được sử dụng") {
                setErrors({ email: 'Email này đã được sử dụng' });
                Swal.fire({
                    title: 'Đăng ký thất bại!',
                    text: 'Tài khoản này đã được đăng ký. Vui lòng sử dụng tài khoản khác.',
                    icon: 'error',
                    confirmButtonColor: "#3085d6",
                });
            }

        } catch (error) {
            setIsLoading(false);
            Swal.fire({
                title: 'Đăng ký thất bại!',
                text: error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại!',
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
                        <h2>Đăng ký tài khoản</h2>
                        <form onSubmit={registerHandler}>
                            <div className="form-inputs">
                                {/* Username */}
                                <div className="input-field">
                                    <div className={getFormGroupClass('username', isUsernameFocused)}>
                                        <input
                                            type='text'
                                            value={username}
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                            onFocus={() => setIsUsernameFocused(true)}
                                            onBlur={() => setIsUsernameFocused(false)}
                                            placeholder='Tên người dùng'
                                            disabled={isLoading}
                                            data-field="username"
                                        />
                                        <label>
                                            <FaUser/>
                                        </label>
                                    </div>
                                    {errors.username && <div className="error-text">{errors.username}</div>}
                                    {validFields.username && !errors.username && <div className="success-text">Tên người dùng hợp lệ</div>}
                                </div>

                                {/* Email */}
                                <div className="input-field">
                                    <div className={getFormGroupClass('email', isEmailFocused)}>
                                        <input
                                            type='text'
                                            value={email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            onFocus={() => setIsEmailFocused(true)}
                                            onBlur={() => setIsEmailFocused(false)}
                                            placeholder='Email'
                                            disabled={isLoading}
                                            data-field="email"
                                        />
                                        <label>
                                            <FaEnvelope/>
                                        </label>
                                    </div>
                                    {errors.email && <div className="error-text">{errors.email}</div>}
                                    {validFields.email && !errors.email && <div className="success-text">Email hợp lệ</div>}
                                </div>

                                {/* Password */}
                                <div className="input-field">
                                    <div className={getFormGroupClass('password', isPasswordFocused)}>
                                        <input
                                            type='password'
                                            value={password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            onFocus={() => setIsPasswordFocused(true)}
                                            onBlur={() => setIsPasswordFocused(false)}
                                            placeholder='Mật khẩu'
                                            disabled={isLoading}
                                            data-field="password"
                                        />
                                        <label>
                                            <FaLock/>
                                        </label>
                                    </div>
                                    {errors.password && <div className="error-text">{errors.password}</div>}
                                    {validFields.password && !errors.password && <div className="success-text">Mật khẩu đủ mạnh</div>}
                                </div>

                                <button
                                    className='login-btn'
                                    type='submit'
                                    disabled={isLoading || Object.keys(errors).length > 0}
                                >
                                    {isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ'}
                                </button>
                            </div>

                            <div className="social-section">
                                <div className='break-line'>hoặc</div>
                                <p className='register-here'>Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
