import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../../services/authService';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@cdweb.com'); // Giá trị mặc định
  const [password, setPassword] = useState('admin123'); // Giá trị mặc định
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in as admin
    if (authService.isAdminAuthenticated()) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (!email || !password) {
        setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu');
        toast.error('Vui lòng nhập đầy đủ email và mật khẩu');
        return;
      }

      console.log('Đang đăng nhập admin với email:', email);
      await authService.adminLogin(email, password);

      toast.success('Đăng nhập thành công!');

      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <div className="login-header">
          <h2>Đăng nhập quản trị</h2>
          <p>Vui lòng đăng nhập để tiếp tục</p>
        </div>

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div className="login-hint">
            <p>Tài khoản mặc định: admin@cdweb.com / admin123</p>
          </div>
        </form>
      </div>

      <style jsx>{`
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .login-hint {
          margin-top: 20px;
          text-align: center;
          font-size: 14px;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
