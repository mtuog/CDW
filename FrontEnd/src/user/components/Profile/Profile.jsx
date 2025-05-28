import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../config';
import './Profile.css';

// Import các tab components
import ProfileInfo from './tabs/ProfileInfo';
import OrderHistory from './tabs/OrderHistory';
import AddressBook from './tabs/AddressBook';
import ChangePassword from './tabs/ChangePassword';
import LoyaltyPoints from './tabs/LoyaltyPoints';
import Wishlist from './tabs/Wishlist';
import Reviews from './tabs/Reviews';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            navigate('/login');
            return;
        }
        
        fetchUserProfile(token, userId);
        
        // Kiểm tra URL để xác định tab active
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam && ['profile', 'orders', 'addresses', 'password', 'points', 'wishlist', 'reviews'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [navigate]);
    
    const fetchUserProfile = async (token, userId) => {
        try {
            setLoading(true);
            
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/users/${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                const userData = response.data;
                console.log("Đã tải thông tin user:", userData);
                console.log("Địa chỉ của user:", userData.address);
                setUser(userData);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            
            if (error.response && error.response.status === 401) {
                // Token hết hạn hoặc không hợp lệ
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');
                navigate('/login');
            } else {
                setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Function to refresh user profile data
    const refreshUserProfile = async () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (token && userId) {
            await fetchUserProfile(token, userId);
        }
    };
    
    const handleLogout = () => {
        // Xóa thông tin đăng nhập
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        
        // Kích hoạt sự kiện cập nhật trạng thái đăng nhập
        window.dispatchEvent(new Event('auth-change'));
        
        // Chuyển hướng về trang chủ
        navigate('/');
    };
    
    const renderTabContent = () => {
        if (!user) return null;
        
        switch (activeTab) {
            case 'profile':
                return <ProfileInfo user={user} setUser={setUser} refreshUserProfile={refreshUserProfile} />;
            case 'orders':
                return <OrderHistory user={user} />;
            case 'addresses':
                return <AddressBook user={user} refreshUserProfile={refreshUserProfile} />;
            case 'password':
                return <ChangePassword user={user} />;
            case 'points':
                return <LoyaltyPoints user={user} />;
            case 'wishlist':
                return <Wishlist user={user} />;
            case 'reviews':
                return <Reviews user={user} />;
            default:
                return <ProfileInfo user={user} setUser={setUser} refreshUserProfile={refreshUserProfile} />;
        }
    };
    
    if (loading) {
        return (
            <div className="container py-5">
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-3">Đang tải thông tin người dùng...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="container py-5">
                <div className="text-center my-5">
                    <div className="alert alert-warning" role="alert">
                        Vui lòng đăng nhập để xem thông tin tài khoản.
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/login')}
                    >
                        Đăng nhập ngay
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="profile-container container py-5">
            <div className="row">
                <div className="col-lg-3">
                    <div className="profile-sidebar mb-4">
                        <div className="text-center mb-4">
                            <div className="profile-userpic mx-auto">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.fullName || user.username} />
                                ) : (
                                    <div className="profile-userpic-default">
                                        {(user.fullName || user.username || 'User').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="profile-usertitle mt-3">
                                <div className="profile-usertitle-name">
                                    {user.fullName || user.username}
                                </div>
                                <div className="profile-usertitle-email">
                                    {user.email}
                                </div>
                            </div>
                        </div>
                        
                        <div className="profile-usermenu">
                            <ul className="nav flex-column">
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('profile')}
                                    >
                                        <i className="fa fa-user"></i> Thông tin cá nhân
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('orders')}
                                    >
                                        <i className="fa fa-shopping-bag"></i> Đơn hàng của tôi
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'addresses' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('addresses')}
                                    >
                                        <i className="fa fa-map-marker-alt"></i> Sổ địa chỉ
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'wishlist' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('wishlist')}
                                    >
                                        <i className="fa fa-heart"></i> Sản phẩm yêu thích
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('reviews')}
                                    >
                                        <i className="fa fa-star"></i> Đánh giá sản phẩm
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'points' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('points')}
                                    >
                                        <i className="fa fa-award"></i> Điểm tích lũy
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('password')}
                                    >
                                        <i className="fa fa-lock"></i> Đổi mật khẩu
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className="nav-link text-danger"
                                        onClick={handleLogout}
                                    >
                                        <i className="fa fa-sign-out-alt"></i> Đăng xuất
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="col-lg-9">
                    <div className="profile-content">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile; 
