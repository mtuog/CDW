import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authApi from '../../api/authApi';
import { toast } from 'react-toastify';

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        console.log('Checking authentication in PrivateRoute...');
        const { authenticated } = await authApi.checkAuth();
        console.log('Authentication result:', authenticated);
        
        setIsAuthenticated(authenticated);
        
        if (!authenticated) {
          console.log('Not authenticated, redirecting to login');
          toast.error('Vui lòng đăng nhập để tiếp tục');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang kiểm tra xác thực...</p>
        
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            min-height: 200px;
          }
          
          .loading-spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid #3498db;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    console.log('Redirecting to login from:', location.pathname);
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute; 