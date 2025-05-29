import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';
import Swal from 'sweetalert2';

const FacebookLogin = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '1068728925276648',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      
      window.FB.AppEvents.logPageView();
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

    window.FB.login(function(response) {
      if (response.authResponse) {
        console.log('Facebook login successful:', response);
        // Get user info
        window.FB.api('/me', { fields: 'id,name,email,picture' }, async function(userInfo) {
          console.log('Facebook user info:', userInfo);

          if (!userInfo.email) {
            Swal.fire({
              title: 'Thiếu thông tin email',
              text: 'Facebook không cung cấp email của bạn. Vui lòng sử dụng phương thức đăng nhập khác.',
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
          
          try {
            // Use authService for consistent API calls (returns AuthResponse now)
            const data = await authService.loginWithFacebook(userData);
            console.log('Facebook login successful, received data:', data);
            
            // Notify parent component
            if (onLoginSuccess) {
              onLoginSuccess(data);
            }
            
            // Show success message
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
            Swal.fire({
              title: 'Đăng nhập thất bại',
              text: error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập',
              icon: 'error',
              confirmButtonColor: "#3085d6",
            });
          }
        });
      } else {
        console.log('Facebook login cancelled or failed');
      }
    }, { scope: 'public_profile,email' });
  };

  return (
    <button 
      onClick={handleFacebookLogin}
      className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
      </svg>
      Đăng nhập với Facebook
    </button>
  );
};

export default FacebookLogin; 