import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../../config';
import './OrderDetail.css';
import Swal from 'sweetalert2';
import { getOrderById } from '../../../../api/orderApi';

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orderActivities, setOrderActivities] = useState([]);
    const [user, setUser] = useState(null);
    const [reviewingProduct, setReviewingProduct] = useState(null);
    const [reviewData, setReviewData] = useState({
        rating: 5,
        comment: ''
    });

    useEffect(() => {
        // Fetch user data first, then order details
        fetchUserData().then(() => {
            fetchOrderDetails();
        });
    }, [orderId]);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.log('No auth token found, skipping user profile fetch');
                return; // Just continue without user data
            }
            
            console.log('Fetching user profile data...');
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/users/profile`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                console.log('User profile data retrieved successfully');
                setUser(response.data);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            console.log('Continuing without user profile data');
            // Don't set the error state here as we still want to try fetching the order
        }
    };

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
            }
            
            console.log(`Fetching order details for order ID: ${orderId}`);
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/orders/${orderId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                console.log('Order details retrieved successfully');
                const orderData = response.data;
                
                // Log the structure of the order data to help with debugging
                console.log('Order data structure:', {
                    hasShippingAddress: !!orderData.shippingAddress,
                    shippingAddressType: typeof orderData.shippingAddress,
                    shippingProps: orderData.shippingAddress ? Object.keys(orderData.shippingAddress) : [],
                    orderProps: Object.keys(orderData),
                    recipient: orderData.recipient,
                    user: orderData.user,
                    fullName: orderData.fullName,
                    name: orderData.name,
                    recipientName: orderData.recipientName
                });
                
                setOrder(orderData);
                // Generate activities based on order status
                generateOrderActivities(orderData);
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const generateOrderActivities = (orderData) => {
        if (!orderData) return;

        const activities = [];
        const orderDate = new Date(orderData.orderDate || orderData.createdAt);
        
        // Đặt hàng thành công
        activities.push({
            status: 'Đặt hàng thành công',
            time: orderDate,
            description: 'Đơn hàng của bạn đã được đặt thành công',
            completed: true,
            icon: 'fa-shopping-cart'
        });
        
        // Xác nhận đơn hàng
        const confirmationDate = new Date(orderDate);
        confirmationDate.setHours(confirmationDate.getHours() + 2);
        const confirmed = orderData.status !== 'PENDING' && orderData.status !== 'CANCELLED';
        activities.push({
            status: 'Xác nhận đơn hàng',
            time: confirmed ? confirmationDate : null,
            description: confirmed ? 'Đơn hàng của bạn đã được xác nhận' : 'Đang đợi xác nhận từ cửa hàng',
            completed: confirmed,
            icon: 'fa-check-circle'
        });
        
        // Đóng gói đơn hàng
        const packagingDate = new Date(confirmationDate);
        packagingDate.setHours(packagingDate.getHours() + 4);
        const packaged = orderData.status === 'PROCESSING' || orderData.status === 'SHIPPED' || orderData.status === 'DELIVERED';
        activities.push({
            status: 'Đóng gói sản phẩm',
            time: packaged ? packagingDate : null,
            description: packaged ? 'Đơn hàng của bạn đã được đóng gói' : 'Chưa đóng gói',
            completed: packaged,
            icon: 'fa-box'
        });
        
        // Giao cho đơn vị vận chuyển
        const shippingDate = new Date(packagingDate);
        shippingDate.setHours(shippingDate.getHours() + 6);
        const shipped = orderData.status === 'SHIPPED' || orderData.status === 'DELIVERED';
        activities.push({
            status: 'Giao cho đơn vị vận chuyển',
            time: shipped ? shippingDate : null,
            description: shipped ? 'Đơn hàng đã được giao cho đơn vị vận chuyển' : 'Chưa giao cho đơn vị vận chuyển',
            completed: shipped,
            icon: 'fa-truck'
        });
        
        // Đang giao hàng
        const deliveryDate = new Date(shippingDate);
        deliveryDate.setHours(deliveryDate.getHours() + 24);
        const delivering = orderData.status === 'SHIPPED';
        activities.push({
            status: 'Đang giao hàng',
            time: shipped ? deliveryDate : null,
            description: delivering ? 'Đơn hàng đang được giao đến bạn' : (orderData.status === 'DELIVERED' ? 'Đơn hàng đã được giao thành công' : 'Chưa bắt đầu giao hàng'),
            completed: shipped,
            current: delivering,
            icon: 'fa-shipping-fast'
        });
        
        // Giao hàng thành công
        const completedDate = new Date(deliveryDate);
        completedDate.setHours(completedDate.getHours() + 12);
        const delivered = orderData.status === 'DELIVERED';
        activities.push({
            status: 'Giao hàng thành công',
            time: delivered ? completedDate : null,
            description: delivered ? 'Đơn hàng đã được giao thành công' : 'Chưa giao hàng',
            completed: delivered,
            icon: 'fa-check-double'
        });
        
        setOrderActivities(activities);
    };

    const getProgressPercentage = () => {
        if (!order) return 0;
        
        switch (order.status) {
            case 'PENDING':
                return 10;
            case 'PROCESSING':
                return 40;
            case 'SHIPPED':
                return 70;
            case 'DELIVERED':
                return 100;
            case 'CANCELLED':
                return 100; // Canceled orders show full progress bar but in different color
            default:
                return 0;
        }
    };

    const getProgressVariant = () => {
        if (!order) return 'primary';
        
        return order.status === 'CANCELLED' ? 'danger' : 'success';
    };

    const getStatusClass = (status) => {
        if (!status) return 'secondary';
        
        switch(status) {
            case 'PENDING':
                return 'warning';
            case 'PROCESSING':
                return 'info';
            case 'SHIPPED':
                return 'primary';
            case 'DELIVERED':
                return 'success';
            case 'CANCELLED':
                return 'danger';
            default:
                return 'secondary';
        }
    };
    
    const getStatusText = (status) => {
        if (!status) return 'Không xác định';
        
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
        if (!amount) return '0 ₫';
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

    const handleCancelOrder = async () => {
        if (!order || (order.status !== 'PENDING' && order.status !== 'PROCESSING')) {
            return;
        }

        try {
            const result = await axios.put(
                `${BACKEND_URL_HTTP}/api/orders/${orderId}/status?status=CANCELLED`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (result.status === 200) {
                // Reload order details
                fetchOrderDetails();
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            setError('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
        }
    };

    const handleSendConfirmOrderEmail = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post(
                `${BACKEND_URL_HTTP}/api/orders/${orderId}/send-confirmation`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Show success message
            alert('Email xác nhận đơn hàng đã được gửi thành công!');
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            setError('Không thể gửi email xác nhận. Vui lòng thử lại sau.');
        }
    };

    // Helper function to get shipping information with fallbacks
    const getRecipientName = () => {
        if (!order) return 'N/A';
        
        // Try to get from different possible structures of shipping address
        if (order.shippingAddress?.fullName) return order.shippingAddress.fullName;
        if (order.shippingAddress?.name) return order.shippingAddress.name;
        
        // Try various property names that might contain the recipient name
        const nameProperties = [
            'recipientName', 
            'fullName', 
            'customerName', 
            'name',
            'recipient',
            'buyerName',
            'userName'
        ];
        
        for (const prop of nameProperties) {
            if (order[prop]) return order[prop];
        }
        
        // Check if there's a nested user object with name info
        if (order.user?.fullName) return order.user.fullName;
        if (order.user?.name) return order.user.name;
        if (order.user?.username) return order.user.username;
        
        // If we have phone and address but no name, use a default
        if (getRecipientPhone() !== 'N/A' && getShippingAddress() !== 'N/A') {
            return 'Khách hàng';
        }
        
        // Fall back to user information if available
        if (user?.fullName) return user.fullName;
        if (user?.name) return user.name;
        if (user?.username) return user.username;
        
        return 'N/A';
    };
    
    const getRecipientPhone = () => {
        if (!order) return 'N/A';
        
        if (order.shippingAddress?.phone) return order.shippingAddress.phone;
        if (order.phone) return order.phone;
        if (order.recipientPhone) return order.recipientPhone;
        
        // Fall back to user information
        if (user?.phone) return user.phone;
        if (user?.phoneNumber) return user.phoneNumber;
        
        return 'N/A';
    };
    
    const getShippingAddress = () => {
        if (!order) return 'N/A';
        
        if (order.shippingAddress?.addressLine) return order.shippingAddress.addressLine;
        if (typeof order.shippingAddress === 'string') return order.shippingAddress;
        if (order.address) return order.address;
        
        // Fall back to user information
        if (user?.address) return user.address;
        
        return 'N/A';
    };

    const handleReviewProduct = (productId, productName) => {
        // Add logging to debug
        console.log("Starting review for product:", { productId, productName });
        
        // Make sure product details are valid
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
                // Store the product info in local variables to avoid state timing issues
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
            
            // Add debug logging
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
            
            // Check product info
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
            
            // Get userId - try from user object or extract from token
            let userId = null;
            
            if (user && user.id) {
                userId = user.id;
            } else {
                // Try to get user ID from order
                if (order && order.user && order.user.id) {
                    userId = order.user.id;
                } else {
                    // If we can't get the userId, show an error
                    console.error("Cannot determine user ID for review");
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi!',
                        text: 'Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại và thử lại.',
                        confirmButtonText: 'Đóng'
                    });
                    return;
                }
            }
            
            // Log the data we're sending for debugging
            console.log('Sending review data:', {
                productId: productInfo.id,
                userId: userId,
                rating: rating,
                comment: comment
            });

            const response = await axios.post(
                `${BACKEND_URL_HTTP}/api/reviews`,
                {
                    productId: productInfo.id,
                    userId: userId,
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

    if (loading) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Đang tải...</span>
                </Spinner>
                <p className="mt-3">Đang tải thông tin đơn hàng...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="m-4">
                <Alert.Heading>Đã xảy ra lỗi!</Alert.Heading>
                <p>{error}</p>
                <hr />
                <div className="d-flex justify-content-end">
                    <Button variant="outline-danger" onClick={() => navigate(-1)}>
                        Quay lại
                    </Button>
                </div>
            </Alert>
        );
    }

    if (!order) {
        return (
            <Alert variant="warning" className="m-4">
                <Alert.Heading>Không tìm thấy đơn hàng!</Alert.Heading>
                <p>Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.</p>
                <hr />
                <div className="d-flex justify-content-end">
                    <Button variant="outline-warning" onClick={() => navigate(-1)}>
                        Quay lại
                    </Button>
                </div>
            </Alert>
        );
    }

    return (
        <Container className="order-detail-container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <button 
                    className="btn btn-link text-decoration-none" 
                    onClick={() => navigate(-1)}
                >
                    <i className="fas fa-arrow-left me-2"></i>
                    Quay lại
                </button>
                <h2 className="mb-0">Chi tiết đơn hàng {order.orderCode || `#${order.id}`}</h2>
                <div>
                    <Badge bg={getStatusClass(order.status)} className="fs-6 px-3 py-2">
                        {getStatusText(order.status)}
                    </Badge>
                </div>
            </div>

            {/* Order Progress */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                    <h4 className="mb-3">Trạng thái đơn hàng</h4>
                    
                    <ProgressBar 
                        now={getProgressPercentage()} 
                        variant={getProgressVariant()} 
                        className="mb-4 progress-taller"
                    />

                    <div className="order-timeline">
                        {orderActivities.map((activity, index) => (
                            <div 
                                key={index} 
                                className={`timeline-item ${activity.completed ? 'completed' : ''} ${activity.current ? 'current' : ''}`}
                            >
                                <div className="timeline-icon">
                                    <i className={`fas ${activity.icon}`}></i>
                                </div>
                                <div className="timeline-content">
                                    <h5>{activity.status}</h5>
                                    <p>{activity.description}</p>
                                    {activity.time && (
                                        <small className="text-muted">
                                            {formatDate(activity.time)}
                                        </small>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                        <div className="text-end mt-3">
                            <Button 
                                variant="outline-danger" 
                                onClick={handleCancelOrder}
                            >
                                <i className="fas fa-times-circle me-2"></i>
                                Hủy đơn hàng
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Row>
                {/* Order Information */}
                <Col md={6}>
                    <Card className="mb-4 border-0 shadow-sm h-100">
                        <Card.Body>
                            <h4 className="mb-3">Thông tin đơn hàng</h4>
                            <table className="table table-borderless">
                                <tbody>
                                    <tr>
                                        <td className="fw-bold">Mã đơn hàng:</td>
                                        <td>{order.orderCode || order.id}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Ngày đặt hàng:</td>
                                        <td>{formatDate(order.orderDate || order.createdAt)}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Phương thức thanh toán:</td>
                                        <td>{order.paymentMethod || 'Thanh toán khi nhận hàng (COD)'}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Phí vận chuyển:</td>
                                        <td>{formatCurrency(order.shippingFee || 0)}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Giảm giá:</td>
                                        <td>{formatCurrency(order.discount || 0)}</td>
                                    </tr>
                                    <tr className="border-top">
                                        <td className="fw-bold">Tổng thanh toán:</td>
                                        <td className="text-danger fw-bold" style={{ fontSize: '1rem' }}>{formatCurrency(order.totalAmount)}</td>
                                    </tr>
                                </tbody>
                            </table>


                        </Card.Body>
                    </Card>
                </Col>

                {/* Updated Shipping Information */}
                <Col md={6}>
                    <Card className="mb-4 border-0 shadow-sm h-100">
                        <Card.Body>
                            <h4 className="mb-3">Thông tin giao hàng</h4>
                            <table className="table table-borderless">
                                <tbody>
                                    <tr>
                                        <td className="fw-bold">Người nhận:</td>
                                        <td>{getRecipientName()}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Số điện thoại:</td>
                                        <td>{getRecipientPhone()}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Địa chỉ:</td>
                                        <td>{getShippingAddress()}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">Ghi chú:</td>
                                        <td>{order?.note || 'Không có ghi chú'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Order Items */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                    <h4 className="mb-3">Sản phẩm đã đặt</h4>
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th style={{width: '60px'}}></th>
                                    <th>Sản phẩm</th>
                                    <th>Đơn giá</th>
                                    <th>Số lượng</th>
                                    <th className="text-end">Thành tiền</th>
                                    {order.status === 'DELIVERED' && <th className="text-center">Đánh giá</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {order.orderItems?.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            {item.product?.img && (
                                                <img 
                                                    src={item.product.img} 
                                                    alt={item.product.name} 
                                                    className="img-fluid rounded"
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                />
                                            )}
                                        </td>
                                        <td>
                                            <Link to={`/product/${item.product.id}`} className="text-decoration-none">
                                                <strong>{item.product.name}</strong>
                                            </Link>
                                            {item.size && <div><small>Kích thước: {item.size}</small></div>}
                                        </td>
                                        <td>{formatCurrency(item.price)}</td>
                                        <td>{item.quantity}</td>
                                        <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                                        {order.status === 'DELIVERED' && (
                                            <td className="text-center">
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
                            <tfoot className="table-light">
                                <tr>
                                    <td colSpan={order.status === 'DELIVERED' ? "5" : "4"} className="text-end fw-bold">Tổng cộng:</td>
                                    <td className="text-end fw-bold text-danger">{formatCurrency(order.totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card.Body>
            </Card>

            {/* Add this hidden debug section for developers */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-5 p-3 border rounded bg-light d-none">
                    <h6 className="mb-3">Debug Information</h6>
                    <pre style={{ fontSize: '12px' }}>
                        {JSON.stringify({
                            orderData: order ? {
                                id: order.id,
                                structure: {
                                    hasShippingAddress: !!order.shippingAddress,
                                    shippingAddressType: typeof order.shippingAddress,
                                    mainKeys: Object.keys(order)
                                },
                                recipientInfo: {
                                    name: getRecipientName(),
                                    phone: getRecipientPhone(),
                                    address: getShippingAddress()
                                }
                            } : null,
                            userData: user ? {
                                id: user.id,
                                properties: Object.keys(user)
                            } : null
                        }, null, 2)}
                    </pre>
                </div>
            )}
        </Container>
    );
};

export default OrderDetail; 