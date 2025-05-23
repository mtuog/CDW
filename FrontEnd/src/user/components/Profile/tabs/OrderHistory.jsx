import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../../config';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const OrderHistory = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [reviewingProduct, setReviewingProduct] = useState(null);
    const [reviewData, setReviewData] = useState({
        rating: 5,
        comment: ''
    });
    
    useEffect(() => {
        if (user && user.id) {
            fetchOrders();
        }
    }, [user]);
    
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            console.log("Fetching orders for user ID:", user.id);
            
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/orders/user/${user.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            console.log("Orders response:", response.data);
            
            if (response.status === 200) {
                setOrders(response.data);
            }
            setError(null);
        } catch (error) {
            console.error('Error fetching orders:', error);
            console.error('Error details:', error.response?.data || error.message);
            setError('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleReviewProduct = (productId, productName) => {
        console.log("Starting review for product:", { productId, productName });
        
        if (!productId || !productName) {
            console.error("Invalid product data for review:", { productId, productName });
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Không thể xác định thông tin sản phẩm cần đánh giá.',
                confirmButtonText: 'Đóng'
            });
            return;
        }
        
        setReviewingProduct({
            id: productId,
            name: productName 
        });
        setReviewData({ rating: 5, comment: '' });
        
        Swal.fire({
            title: `Đánh giá sản phẩm: ${productName}`,
            html: `
                <div class="text-left">
                    <label class="block mb-2">Đánh giá của bạn:</label>
                    <div class="flex mb-4 justify-center" id="ratingStars">
                        <span class="cursor-pointer text-2xl mx-1" data-rating="1">⭐</span>
                        <span class="cursor-pointer text-2xl mx-1" data-rating="2">⭐</span>
                        <span class="cursor-pointer text-2xl mx-1" data-rating="3">⭐</span>
                        <span class="cursor-pointer text-2xl mx-1" data-rating="4">⭐</span>
                        <span class="cursor-pointer text-2xl mx-1" data-rating="5">⭐</span>
                    </div>
                    <label class="block mb-2">Nhận xét của bạn:</label>
                    <textarea id="reviewComment" class="w-full border p-2 rounded" rows="4" 
                        placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này"></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Gửi đánh giá',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            didOpen: () => {
                const ratingStars = document.querySelectorAll('#ratingStars span');
                let selectedRating = 5;
                
                // Highlight all stars initially
                ratingStars.forEach(star => {
                    star.style.opacity = '1';
                });
                
                // Add click event to stars
                ratingStars.forEach(star => {
                    star.addEventListener('click', (e) => {
                        const rating = parseInt(e.target.getAttribute('data-rating'));
                        selectedRating = rating;
                        
                        // Update star highlights
                        ratingStars.forEach((s, index) => {
                            s.style.opacity = index < rating ? '1' : '0.5';
                        });
                    });
                    
                    // Add hover effect
                    star.addEventListener('mouseenter', (e) => {
                        const rating = parseInt(e.target.getAttribute('data-rating'));
                        
                        // Highlight stars on hover
                        ratingStars.forEach((s, index) => {
                            s.style.opacity = index < rating ? '1' : '0.5';
                        });
                    });
                });
                
                // Reset to selected rating when mouse leaves
                document.getElementById('ratingStars').addEventListener('mouseleave', () => {
                    ratingStars.forEach((s, index) => {
                        s.style.opacity = index < selectedRating ? '1' : '0.5';
                    });
                });
            },
            preConfirm: () => {
                const comment = document.getElementById('reviewComment').value;
                const stars = document.querySelectorAll('#ratingStars span');
                let rating = 0;
                
                // Count highlighted stars to get rating
                stars.forEach((star, index) => {
                    if (star.style.opacity === '1') {
                        rating = index + 1;
                    }
                });
                
                if (rating === 0) {
                    Swal.showValidationMessage('Vui lòng chọn số sao đánh giá');
                    return false;
                }
                
                return { rating, comment };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const productToReview = {
                    id: productId,
                    name: productName
                };
                submitReview(productToReview, result.value.rating, result.value.comment);
            }
            setReviewingProduct(null);
        });
    };
    
    const submitReview = async (productInfo, rating, comment) => {
        try {
            const token = localStorage.getItem('token');
            
            console.log("Submit review called with:", { 
                productInfo, 
                rating, 
                comment,
                userAvailable: !!user,
                userId: user?.id
            });
            
            if (!token) {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: 'Bạn cần đăng nhập để đánh giá sản phẩm.',
                    confirmButtonText: 'Đóng'
                });
                return;
            }
            
            if (!productInfo || !productInfo.id) {
                console.error("Missing product info in submitReview:", productInfo);
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: 'Không thể xác định thông tin sản phẩm cần đánh giá.',
                    confirmButtonText: 'Đóng'
                });
                return;
            }
            
            if (!user || !user.id) {
                console.error("User not available for review:", user);
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: 'Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại và thử lại.',
                    confirmButtonText: 'Đóng'
                });
                return;
            }
            
            console.log('Sending review data:', {
                productId: productInfo.id,
                userId: user.id,
                rating: rating,
                comment: comment
            });
            
            const response = await axios.post(
                `${BACKEND_URL_HTTP}/api/reviews`,
                {
                    productId: productInfo.id,
                    userId: user.id,
                    rating: rating,
                    comment: comment
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.status === 201 || response.status === 200) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: 'Cảm ơn bạn đã đánh giá sản phẩm',
                    confirmButtonText: 'Đóng'
                });
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            
            let errorMessage = 'Không thể gửi đánh giá. Vui lòng thử lại sau.';
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: errorMessage,
                confirmButtonText: 'Đóng'
            });
        }
    };
    
    const getStatusClass = (status) => {
        switch(status) {
            case 'PENDING':
                return 'badge bg-warning';
            case 'PROCESSING':
                return 'badge bg-info';
            case 'SHIPPED':
                return 'badge bg-primary';
            case 'DELIVERED':
                return 'badge bg-success';
            case 'CANCELLED':
                return 'badge bg-danger';
            default:
                return 'badge bg-secondary';
        }
    };
    
    const getStatusText = (status) => {
        switch(status) {
            case 'PENDING':
                return 'Chờ xác nhận';
            case 'PROCESSING':
                return 'Đang xử lý';
            case 'SHIPPED':
                return 'Đang giao hàng';
            case 'DELIVERED':
                return 'Đã giao hàng';
            case 'CANCELLED':
                return 'Đã hủy';
            default:
                return status;
        }
    };
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        
        try {
            const options = { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            };
            return new Date(dateString).toLocaleDateString('vi-VN', options);
        } catch (error) {
            console.error('Error formatting date:', error, dateString);
            return dateString || 'N/A';
        }
    };
    
    const handleCancelOrder = async (orderId) => {
        try {
            const result = await Swal.fire({
                title: 'Xác nhận hủy đơn hàng',
                text: 'Bạn có chắc chắn muốn hủy đơn hàng này?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Xác nhận hủy',
                cancelButtonText: 'Giữ lại',
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
            });
            
            if (result.isConfirmed) {
                const token = localStorage.getItem('token');
                
                const response = await axios.put(
                    `${BACKEND_URL_HTTP}/api/orders/${orderId}/status?status=CANCELLED&sendEmail=true`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                
                if (response.status === 200) {
                    Swal.fire({
                        title: 'Thành công!',
                        text: 'Đơn hàng đã được hủy',
                        icon: 'success',
                        confirmButtonText: 'Đóng'
                    });
                    
                    // Cập nhật lại danh sách đơn hàng
                    fetchOrders();
                }
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            
            Swal.fire({
                title: 'Lỗi!',
                text: error.response?.data?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại sau.',
                icon: 'error',
                confirmButtonText: 'Đóng'
            });
        }
    };
    
    return (
        <div className="order-history">
            <h4 className="mb-4">Lịch sử đơn hàng</h4>
            
            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải đơn hàng...</p>
                </div>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center my-5">
                    <i className="fa fa-shopping-bag fa-3x text-muted mb-3"></i>
                    <h5>Bạn chưa có đơn hàng nào</h5>
                    <p className="text-muted">Hãy mua sắm ngay để trải nghiệm sản phẩm của chúng tôi</p>
                    <Link to="/product" className="btn btn-primary mt-3">
                        Mua sắm ngay
                    </Link>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead className="table-light">
                            <tr>
                                <th>Mã đơn hàng</th>
                                <th>Ngày đặt</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <React.Fragment key={order.id}>
                                    <tr>
                                        <td>{order.orderCode || order.id}</td>
                                        <td>{formatDate(order.orderDate || order.createdAt)}</td>
                                        <td>{formatCurrency(order.totalAmount)}</td>
                                        <td>
                                            <span className={getStatusClass(order.status)}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-outline-primary me-2" 
                                                onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                                            >
                                                {selectedOrder === order.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                            </button>
                                            
                                            <Link 
                                                to={`/account/orders/${order.id}`} 
                                                className="btn btn-sm btn-outline-info me-2"
                                            >
                                                <i className="fas fa-truck me-1"></i> Theo dõi đơn hàng
                                            </Link>
                                            
                                            {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleCancelOrder(order.id)}
                                                >
                                                    Hủy đơn
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    
                                    {selectedOrder === order.id && (
                                        <tr className="order-details">
                                            <td colSpan="5" className="p-0">
                                                <div className="order-detail-content p-3">
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <h6>Thông tin giao hàng</h6>
                                                            <p>Họ tên: {order.shippingAddress?.fullName || user.fullName}</p>
                                                            <p>Địa chỉ: {order.shippingAddress?.addressLine || order.shippingAddress || user.address}</p>
                                                            <p>Số điện thoại: {order.shippingAddress?.phone || user.phone || user.phoneNumber}</p>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <h6>Thông tin thanh toán</h6>
                                                            <p>Phương thức: {order.paymentMethod || 'Thanh toán khi nhận hàng'}</p>
                                                            <p>Trạng thái: {order.paymentStatus || 'Chưa thanh toán'}</p>
                                                            <p>Phí vận chuyển: {formatCurrency(order.shippingFee || 0)}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-3">
                                                        <Link 
                                                            to={`/account/orders/${order.id}`} 
                                                            className="btn btn-sm btn-outline-info"
                                                        >
                                                            <i className="fas fa-search me-1"></i> Xem chi tiết đầy đủ
                                                        </Link>
                                                    </div>
                                                    
                                                    <h6 className="mt-3">Sản phẩm đã đặt</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>Sản phẩm</th>
                                                                    <th>Đơn giá</th>
                                                                    <th>Số lượng</th>
                                                                    <th>Thành tiền</th>
                                                                    {order.status === 'DELIVERED' && <th>Đánh giá</th>}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {order.orderItems?.map((item, index) => (
                                                                    <tr key={index}>
                                                                        <td>
                                                                            <div className="d-flex align-items-center">
                                                                                {item.product?.img && (
                                                                                    <img 
                                                                                        src={item.product.img} 
                                                                                        alt={item.product.name} 
                                                                                        className="me-2"
                                                                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                                    />
                                                                                )}
                                                                                <div>
                                                                                    <Link to={`/product/${item.product.id}`}>
                                                                                        {item.product.name}
                                                                                    </Link>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td>{formatCurrency(item.price)}</td>
                                                                        <td>{item.quantity}</td>
                                                                        <td>{formatCurrency(item.price * item.quantity)}</td>
                                                                        {order.status === 'DELIVERED' && (
                                                                            <td>
                                                                                <button
                                                                                    className="btn btn-sm btn-outline-warning"
                                                                                    onClick={() => handleReviewProduct(
                                                                                        item.product.id,
                                                                                        item.product.name
                                                                                    )}
                                                                                >
                                                                                    <i className="fa fa-star me-1"></i> Đánh giá
                                                                                </button>
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    
                                                    <div className="text-end mt-3">
                                                        <p className="mb-1"><strong>Tổng sản phẩm:</strong> {formatCurrency(order.subtotal || (order.totalAmount - (order.shippingFee || 0)))}</p>
                                                        <p className="mb-1"><strong>Phí vận chuyển:</strong> {formatCurrency(order.shippingFee || 0)}</p>
                                                        <p className="mb-1"><strong>Giảm giá:</strong> {formatCurrency(order.discount || 0)}</p>
                                                        <div className="border-top pt-2">
                                                            <h5 className="text-danger" style={{ fontSize: '1rem' }}><strong>Tổng thanh toán:</strong> {formatCurrency(order.totalAmount)}</h5>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrderHistory; 
