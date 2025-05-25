import React, {createContext, useState, useContext } from 'react';
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

    const AuthContext = createContext();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    const validateUserName = (username) => {
        if (username.length >= 3) {
            return true;  
          } else {
            return false; 
          }
    }

    const registerHandler = async (e) => {
    e.preventDefault();
        let timerInterval;
        if (username.length === 0 || password.length === 0 || email.length ===0) {
            Swal.fire({
                title: 'Please fill in the registration information !',
                icon: 'warning',
                confirmButtonColor: "#3085d6",
            });
      return;
  }
        if (!validateEmail(email)) {
            Swal.fire({
                title: 'The email is not in the correct format!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
            })
        }
        if(!validateUserName(username)){
            Swal.fire({
                title: 'Usernames must be at least 3 characters !',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
            })
        }

        setIsLoading(true); // Bắt đầu hiển thị loading spinner

            try {
                const response = await axios.post(`${BACKEND_URL_HTTP}/api/UserServices/register`, {
                    userName: username,
                    email: email,
                    password: password
                });
                 console.log(response);
    
                setIsLoading(false); // Ẩn loading spinner
    
                if (response.status === 200 && response.data.message === "Đăng ký tài khoản thành công ! Vui lòng xác minh tài khoản") {
                    Swal.fire({
                        title: 'Registration Successful!',
                        text: 'Please check your email to verify your account.',
                        icon: 'success',
                        confirmButtonColor: "#3085d6",
                    }).then(() => {
                        localStorage.setItem('email', email);
                        navigate('/verify-account');
                    });
                }
                if (response.status === 200 && response.data.message === "Email này đã được sử dụng") {
                    Swal.fire({
                        title: 'Registration failed !',
                        text: 'This account has been registered. Please use a different account.',

                        icon: 'error',
                        confirmButtonColor: "#3085d6",
                    })
                }
               
                
            } catch (error) {
                setIsLoading(false); // Ẩn loading spinner

                Swal.fire({
                    title: 'Registration failed !',
                    text: error.response?.data?.message || 'An error occurred. Please try again!',
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
                                <div className={`form-group ${isUsernameFocused ? 'focused' : ''}`}>
                                    <label>
                                        <FaUser/>
                                    </label>
                                    <input
                                        type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
                                        onFocus={() => setIsUsernameFocused(true)}
                                        onBlur={() => setIsUsernameFocused(false)}
                                        placeholder='Tên người dùng'
                                    />
					</div>
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
                                
                                <button className='login-btn' type='submit' disabled={isLoading}>
                                    ĐĂNG KÝ
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