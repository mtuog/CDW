import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../../config';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const Wishlist = ({ user }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.id) {
            fetchWishlist();
        }
    }, [user]);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userId = user?.id;
            
            console.log("Fetching wishlist for user:", userId);
            
            if (!userId) {
                console.error("User ID is missing");
                setError('Chưa xác định được người dùng. Vui lòng đăng nhập lại.');
                setLoading(false);
                return;
            }
            
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/wishlist/user/${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            console.log("Wishlist API response:", response.data);
            
            if (response.status === 200) {
                // Kiểm tra và xử lý dữ liệu
                if (Array.isArray(response.data)) {
                    setWishlistItems(response.data);
                    console.log(`Loaded ${response.data.length} wishlist items`);
                } else {
                    console.error("Wishlist data is not an array:", response.data);
                    setWishlistItems([]);
                }
            }
            setError(null);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            console.error('Error details:', error.response?.data || error.message);
            
            if (error.response?.status === 500) {
                setError('Lỗi server khi tải danh sách yêu thích. Vui lòng thử lại sau.');
            } else if (error.response?.status === 401) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                setError('Không thể tải danh sách yêu thích. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            const userId = user?.id;
            
            if (!userId) {
                console.error("User ID is missing");
                Swal.fire({
                    title: 'Lỗi!',
                    text: 'Không thể xác định người dùng',
                    icon: 'error',
                    confirmButtonText: 'Đóng'
                });
                return;
            }
            
            console.log(`Removing product ${productId} from wishlist for user ${userId}`);
            
            const response = await axios.delete(
                `${BACKEND_URL_HTTP}/api/wishlist/remove/${productId}?userId=${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            console.log("Remove from wishlist response:", response.data);
            
            if (response.status === 200) {
                // Cập nhật danh sách yêu thích
                setWishlistItems(prevItems => prevItems.filter(item => item.productId !== productId));
                
                // Dispatch wishlist update event
                window.dispatchEvent(new Event('wishlist-update'));
                
                Swal.fire({
                    title: 'Đã xóa!',
                    text: 'Sản phẩm đã được xóa khỏi danh sách yêu thích',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            console.error('Error details:', error.response?.data || error.message);
            
            Swal.fire({
                title: 'Lỗi!',
                text: 'Không thể xóa sản phẩm khỏi danh sách yêu thích',
                icon: 'error',
                confirmButtonText: 'Đóng'
            });
        }
    };

    const addToCart = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post(
                `${BACKEND_URL_HTTP}/api/cart/add`,
                {
                    productId,
                    quantity: 1
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Sản phẩm đã được thêm vào giỏ hàng',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            
            Swal.fire({
                title: 'Lỗi!',
                text: 'Không thể thêm sản phẩm vào giỏ hàng',
                icon: 'error',
                confirmButtonText: 'Đóng'
            });
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <div className="wishlist-tab">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Sản phẩm yêu thích</h4>
            </div>
            
            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải danh sách yêu thích...</p>
                </div>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : wishlistItems.length === 0 ? (
                <div className="text-center my-5">
                    <i className="fa fa-heart fa-3x text-muted mb-3"></i>
                    <h5>Danh sách yêu thích trống</h5>
                    <p className="text-muted">Hãy thêm sản phẩm yêu thích để xem tại đây</p>
                    <Link to="/shop" className="btn btn-primary mt-3">
                        Tiếp tục mua sắm
                    </Link>
                </div>
            ) : (
                <div className="row">
                    {wishlistItems.map(item => (
                        <div className="col-md-6 col-lg-4 mb-4" key={item.id}>
                            <div className="card wishlist-item">
                                <div className="wishlist-item-img">
                                    <img 
                                        src={item.product.imageUrl || 'https://via.placeholder.com/150'} 
                                        alt={item.product.name}
                                        className="img-fluid"
                                    />
                                    <div className="wishlist-item-actions">
                                        <button 
                                            className="btn btn-sm btn-danger btn-action"
                                            onClick={() => removeFromWishlist(item.productId)}
                                            title="Xóa khỏi danh sách yêu thích"
                                        >
                                            <i className="fa fa-trash"></i>
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-primary btn-action"
                                            onClick={() => addToCart(item.productId)}
                                            title="Thêm vào giỏ hàng"
                                        >
                                            <i className="fa fa-shopping-cart"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <Link to={`/product/${item.productId}`} className="product-title">
                                        <h5 className="card-title">{item.product.name}</h5>
                                    </Link>
                                    <p className="card-text text-primary fw-bold">
                                        {formatCurrency(item.product.price)}
                                        {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                            <small className="text-muted text-decoration-line-through ms-2">
                                                {formatCurrency(item.product.originalPrice)}
                                            </small>
                                        )}
                                    </p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="ratings">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <i 
                                                    key={star}
                                                    className={`fa fa-star ${star <= (item.product.rating || 0) ? 'text-warning' : 'text-muted'}`}
                                                ></i>
                                            ))}
                                            <small className="ms-1 text-muted">
                                                ({item.product.reviewCount || 0})
                                            </small>
                                        </div>
                                        <small className="text-muted">
                                            {item.dateAdded && new Date(item.dateAdded).toLocaleDateString()}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist; 
