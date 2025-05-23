import React, { useEffect } from 'react';
import { BACKEND_URL_HTTP } from '../../config';
import { useNavigate } from 'react-router-dom';

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
      return;
    }

    window.FB.login(function(response) {
      if (response.authResponse) {
        console.log('Facebook login successful:', response);
        // Get user info
        window.FB.api('/me', { fields: 'id,name,email,picture' }, function(userInfo) {
          const userData = {
            accessToken: response.authResponse.accessToken,
            userId: response.authResponse.userID,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture?.data?.url
          };
          
          // Send to backend
          fetch(`${BACKEND_URL_HTTP}/api/auth/facebook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
            credentials: 'include'
          })
          .then(response => response.json())
          .then(data => {
            if (data.token) {
              // Save token
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              
              // Notify parent component
              if (onLoginSuccess) {
                onLoginSuccess(data);
              }
              
              // Redirect to home page
              navigate('/');
            } else {
              console.error('Login failed:', data.message);
            }
          })
          .catch(error => {
            console.error('Error during login:', error);
          });
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