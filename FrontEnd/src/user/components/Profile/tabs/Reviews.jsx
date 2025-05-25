import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../../config';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const Reviews = ({ user }) => {
    const [reviews, setReviews] = useState([]);
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentReview, setCurrentReview] = useState(null);
    
    useEffect(() => {
        if (user && user.id) {
            fetchReviews();
            fetchPendingReviews();
        }
    }, [user]);
    
    const fetchReviews = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/reviews/user/${user.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                console.log("===== Reviews data RAW =====");
                console.log(JSON.stringify(response.data, null, 2));
                
                // Nếu có thể, lấy thêm thông tin sản phẩm để đảm bảo có tên
                const reviewsWithProductInfo = await Promise.all(response.data.map(async (review) => {
                    console.log("Review item:", review);
                    console.log("- productName:", review.productName);
                    console.log("- product object:", review.product);
                    console.log("- productId:", review.productId);
                    console.log("- product?.id:", review.product?.id);
                    
                    // Nếu không có productName nhưng có product object và có product.name
                    if (!review.productName && review.product && review.product.name) {
                        return {
                            ...review,
                            productName: review.product.name,
                            productId: review.productId || review.product.id
                        };
                    } 
                    // Nếu không có productName và cũng không có product.name
                    else if (!review.productName && (!review.product || !review.product.name)) {
                        // Cố gắng lấy thông tin sản phẩm từ API nếu có productId
                        const productId = review.productId || review.product?.id;
                        if (productId) {
                            try {
                                const productResponse = await axios.get(
                                    `${BACKEND_URL_HTTP}/api/products/${productId}`
                                );
                                
                                if (productResponse.status === 200 && productResponse.data) {
                                    console.log(`Fetched product info for ID ${productId}:`, productResponse.data);
                                    return {
                                        ...review,
                                        productName: productResponse.data.name,
                                        productId: productId,
                                        productImage: productResponse.data.img || productResponse.data.image || productResponse.data.imageUrl || 'https://via.placeholder.com/80'
                                    };
                                }
                            } catch (productError) {
                                console.error(`Failed to fetch product info for ID ${productId}:`, productError);
                            }
                        }
                        
                        // Fallback nếu không lấy được thông tin sản phẩm
                        return {
                            ...review,
                            productName: "Sản phẩm #" + (productId || '?'),
                            productId: productId || 0
                        };
                    }
                    return review;
                }));
                
                setReviews(reviewsWithProductInfo);
            } else {
                // Nếu không có dữ liệu hoặc lỗi
                setReviews([]);
                setError('Không có đánh giá nào');
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError('Không thể tải đánh giá sản phẩm. Vui lòng thử lại sau.');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchPendingReviews = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/orders/pending-reviews/${user.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                console.log("===== Pending reviews RAW =====");
                console.log(JSON.stringify(response.data, null, 2));
                
                const pendingWithProductInfo = await Promise.all(response.data.map(async (item) => {
                    console.log("Pending review item:", item);
                    console.log("- productName:", item.productName);
                    console.log("- product object:", item.product);
                    console.log("- productId:", item.productId);
                    console.log("- product?.id:", item.product?.id);
                    
                    // Nếu không có productName nhưng có product object và có product.name
                    if (!item.productName && item.product && item.product.name) {
                        return {
                            ...item,
                            productName: item.product.name,
                            productId: item.productId || item.product.id,
                            productImage: item.productImage || item.product.img || item.product.image || item.product.imageUrl
                        };
                    }
                    // Nếu không có productName và cũng không có product.name
                    else if (!item.productName && (!item.product || !item.product.name)) {
                        // Cố gắng lấy thông tin sản phẩm từ API nếu có productId
                        const productId = item.productId || item.product?.id;
                        if (productId) {
                            try {
                                const productResponse = await axios.get(
                                    `${BACKEND_URL_HTTP}/api/products/${productId}`
                                );
                                
                                if (productResponse.status === 200 && productResponse.data) {
                                    console.log(`Fetched product info for ID ${productId}:`, productResponse.data);
                                    return {
                                        ...item,
                                        productName: productResponse.data.name,
                                        productId: productId,
                                        productImage: productResponse.data.img || productResponse.data.image || productResponse.data.imageUrl || 'https://via.placeholder.com/60'
                                    };
                                }
                            } catch (productError) {
                                console.error(`Failed to fetch product info for ID ${productId}:`, productError);
                            }
                        }
                        
                        // Fallback nếu không lấy được thông tin sản phẩm
                        return {
                            ...item,
                            productName: "Sản phẩm #" + (productId || '?'),
                            productId: productId || 0
                        };
                    }
                    return item;
                }));
                
                setPendingReviews(pendingWithProductInfo);
            } else {
                // Nếu không có dữ liệu hoặc lỗi
                setPendingReviews([]);
                console.log('Không có sản phẩm chờ đánh giá');
            }
        } catch (error) {
            console.error('Error fetching pending reviews:', error);
            setPendingReviews([]);
        }
    };
    
    const handleEditReview = (review) => {
        setCurrentReview({
            id: review.id,
            productId: review.productId,
            productName: review.productName,
            productImage: review.productImage || review.product?.img || review.product?.image || review.product?.imageUrl,
            rating: review.rating,
            comment: review.comment,
            orderId: review.orderId,
            orderDate: review.orderDate || review.dateCreated
        });
    };
    
    const handleDeleteReview = async (reviewId) => {
        try {
            const result = await Swal.fire({
                title: 'Xác nhận xóa',
                text: 'Bạn có chắc chắn muốn xóa đánh giá này?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Xác nhận xóa',
                cancelButtonText: 'Hủy',
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
            });
            
            if (result.isConfirmed) {
                const token = localStorage.getItem('token');
                
                try {
                    const response = await axios.delete(
                        `${BACKEND_URL_HTTP}/api/reviews/${reviewId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );
                    
                    if (response.status === 200 || response.status === 204) {
                        // Cập nhật lại state để loại bỏ đánh giá đã xóa
                        setReviews(prev => prev.filter(review => review.id !== reviewId));
                        
                        Swal.fire({
                            title: 'Thành công!',
                            text: 'Đã xóa đánh giá sản phẩm',
                            icon: 'success',
                            confirmButtonText: 'Đóng'
                        });
                    }
                } catch (apiError) {
                    console.error('Error deleting review:', apiError);
                    Swal.fire({
                        title: 'Lỗi!',
                        text: apiError.response?.data?.message || 'Không thể xóa đánh giá. Vui lòng thử lại sau.',
                        icon: 'error',
                        confirmButtonText: 'Đóng'
                    });
                }
            }
        } catch (error) {
            console.error('Error in delete flow:', error);
        }
    };
    
    const handleNewReview = (product) => {
        setCurrentReview({
            id: null,
            productId: product.productId || product.product?.id,
            productName: product.productName || product.product?.name,
            productImage: product.productImage || product.product?.img || product.product?.image || product.product?.imageUrl,
            orderId: product.orderId,
            orderDate: product.orderDate,
            rating: 5,
            comment: ''
        });
    };
    
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentReview.rating || !currentReview.comment.trim()) {
            Swal.fire({
                title: 'Thông tin thiếu',
                text: 'Vui lòng nhập đầy đủ thông tin đánh giá',
                icon: 'warning',
                confirmButtonText: 'Đóng'
            });
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            let response;
            
            const reviewData = {
                userId: user.id,
                productId: currentReview.productId,
                rating: currentReview.rating,
                comment: currentReview.comment,
                orderId: currentReview.orderId
            };
            
            if (currentReview.id) {
                // Update existing review
                response = await axios.put(
                    `${BACKEND_URL_HTTP}/api/reviews/${currentReview.id}`,
                    reviewData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.status === 200) {
                    // Update the reviews list
                    setReviews(prev => prev.map(review => 
                        review.id === currentReview.id 
                            ? { ...review, rating: currentReview.rating, comment: currentReview.comment } 
                            : review
                    ));
                    
                    Swal.fire({
                        title: 'Thành công!',
                        text: 'Đã cập nhật đánh giá sản phẩm',
                        icon: 'success',
                        confirmButtonText: 'Đóng'
                    });
                    
                    // Reset current review
                    setCurrentReview(null);
                }
            } else {
                // Create new review
                response = await axios.post(
                    `${BACKEND_URL_HTTP}/api/reviews`,
                    reviewData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.status === 201) {
                    // Add the new review to the list
                    const newReview = response.data;
                    setReviews(prev => [...prev, newReview]);
                    
                    // Remove from pending reviews
                    setPendingReviews(prev => prev.filter(item => 
                        (item.productId !== currentReview.productId) || 
                        (item.product?.id !== currentReview.productId)
                    ));
                    
                    Swal.fire({
                        title: 'Thành công!',
                        text: 'Đã thêm đánh giá sản phẩm',
                        icon: 'success',
                        confirmButtonText: 'Đóng'
                    });
                    
                    // Reset current review
                    setCurrentReview(null);
                }
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            
            Swal.fire({
                title: 'Lỗi!',
                text: error.response?.data?.message || 'Không thể lưu đánh giá. Vui lòng thử lại sau.',
                icon: 'error',
                confirmButtonText: 'Đóng'
            });
        }
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        
        const options = { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    };
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    };
    
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push(<i key={i} className="fa fa-star text-warning"></i>);
            } else {
                stars.push(<i key={i} className="fa fa-star text-muted"></i>);
            }
        }
        return <div className="d-flex">{stars}</div>;
    };
    
    // Chỉ hiển thị badge khi cần thiết
    const getStatusBadge = (status) => {
        if (!status) return null;
        const statusClass = status === 'PENDING' ? 'bg-warning' : 'bg-success';
        const statusText = status === 'PENDING' ? 'Chờ duyệt' : 'Đã duyệt';
        
        return <span className={`badge ${statusClass} ms-2`}>{statusText}</span>;
    };
    
    return (
        <div className="reviews">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Đánh giá sản phẩm</h4>
            </div>
            
            {currentReview ? (
                <div className="card mb-4">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">{currentReview.id ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá mới'}</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleReviewSubmit}>
                            <div className="d-flex align-items-center mb-4">
                                <img 
                                    src={currentReview.productImage || 'https://via.placeholder.com/80'} 
                                    alt={currentReview.productName} 
                                    className="me-3 rounded shadow-sm"
                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                />
                                <div>
                                    <h5 className="mb-1 fw-bold">{currentReview.productName}</h5>
                                    <Link to={`/product/${currentReview.productId}`} className="text-primary text-decoration-none">
                                        <i className="fa fa-external-link-alt me-1"></i> Xem sản phẩm
                                    </Link>
                                    {currentReview.orderId && (
                                        <div className="mt-1">
                                            <small className="text-muted">
                                                Đơn hàng #{currentReview.orderId} - {formatDate(currentReview.orderDate)}
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="form-group mb-4">
                                <label className="form-label fw-medium">Đánh giá của bạn</label>
                                <div className="rating-stars mb-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <i 
                                            key={star}
                                            className={`fa fa-star fs-4 me-2 ${star <= currentReview.rating ? 'text-warning' : 'text-muted'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setCurrentReview({...currentReview, rating: star})}
                                        ></i>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="form-group mb-4">
                                <label htmlFor="comment" className="form-label fw-medium">Nhận xét của bạn</label>
                                <textarea
                                    className="form-control"
                                    id="comment"
                                    rows="5"
                                    value={currentReview.comment}
                                    onChange={(e) => setCurrentReview({...currentReview, comment: e.target.value})}
                                    placeholder="Hãy chia sẻ trải nghiệm của bạn về sản phẩm này..."
                                    required
                                ></textarea>
                            </div>
                            
                            <div className="d-flex">
                                <button type="submit" className="btn btn-primary me-2">
                                    <i className="fa fa-save me-1"></i> {currentReview.id ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary"
                                    onClick={() => setCurrentReview(null)}
                                >
                                    <i className="fa fa-times me-1"></i> Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <>
                    {pendingReviews.length > 0 && (
                        <div className="card mb-4">
                            <div className="card-header bg-light">
                                <h5 className="mb-0">Sản phẩm chờ đánh giá</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    {pendingReviews.map((product, index) => (
                                        <div className="col-md-6 col-lg-4 mb-3" key={index}>
                                            <div className="card h-100 border-light shadow-sm">
                                                <div className="d-flex p-3">
                                                    <img 
                                                        src={product.productImage || product.product?.img || product.product?.image || product.product?.imageUrl || 'https://via.placeholder.com/60'} 
                                                        alt={product.productName || product.product?.name || `Sản phẩm ${product.productId || ''}`}
                                                        className="me-3 rounded"
                                                        style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                                                    />
                                                    <div>
                                                        <h6 className="mb-1">
                                                            <Link to={`/product/${product.productId || 0}`} className="text-decoration-none">
                                                                {product.productName || `Sản phẩm #${product.productId || '?'}`}
                                                            </Link>
                                                        </h6>
                                                        <small className="text-muted d-block mb-2">
                                                            Đơn hàng #{product.orderId} - {formatDate(product.orderDate)}
                                                        </small>
                                                        <button 
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleNewReview(product)}
                                                        >
                                                            <i className="fa fa-star me-1"></i> Viết đánh giá
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="mb-4">
                        <h5 className="mb-3">Đánh giá của bạn ({reviews.length})</h5>
                    </div>
                    
                    {loading ? (
                        <div className="text-center my-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                            <p className="mt-2">Đang tải đánh giá sản phẩm...</p>
                        </div>
                    ) : error && reviews.length === 0 ? (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center my-5">
                            <i className="fa fa-comment fa-3x text-muted mb-3"></i>
                            <h5>Chưa có đánh giá nào</h5>
                            <p className="text-muted">Hãy mua sắm và đánh giá sản phẩm để chia sẻ ý kiến của bạn</p>
                            <Link to="/product" className="btn btn-primary mt-3">
                                Mua sắm ngay
                            </Link>
                        </div>
                    ) : (
                        <div className="reviews-list">
                            {reviews.map(review => (
                                <div className="card mb-3" key={review.id}>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="d-flex">
                                                <div className="me-3">
                                                    <img 
                                                        src={review.productImage || review.product?.img || review.product?.image || review.product?.imageUrl || 'https://via.placeholder.com/80'}
                                                        alt={review.productName || review.product?.name || `Sản phẩm ${review.productId || ''}`}
                                                        className="rounded"
                                                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <h5 className="mb-1">
                                                        <Link to={`/product/${review.productId || 0}`} className="text-decoration-none">
                                                            {review.productName || `Sản phẩm #${review.productId || '?'}`}
                                                        </Link>
                                                    </h5>
                                                    <div className="mb-1">
                                                        {renderStars(review.rating)}
                                                    </div>
                                                    <div className="d-flex align-items-center text-muted">
                                                        <small>
                                                            Đánh giá vào ngày {formatDate(review.createdAt || review.dateCreated)}
                                                            {review.status && getStatusBadge(review.status)}
                                                        </small>
                                                    </div>
                                                    {review.orderId && (
                                                        <small className="text-muted d-block mt-1">
                                                            Đơn hàng #{review.orderId}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <button 
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    onClick={() => handleEditReview(review)}
                                                >
                                                    <i className="fa fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteReview(review.id)}
                                                >
                                                    <i className="fa fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {review.comment && (
                                            <div className="review-comment mt-2 px-3 py-3 bg-light rounded border">
                                                <p className="mb-0">{review.comment}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Reviews; 
