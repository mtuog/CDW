import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { BACKEND_URL_HTTP } from '../../../config';

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  useEffect(() => {
    fetchReviews();
  }, [productId]);
  
  const fetchReviews = async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL_HTTP}/api/reviews/product/${productId}`);
      const data = response.data;
      
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.totalReviews || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Không thể tải đánh giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date to display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  // Render stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="text-warning" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-muted" />);
      }
    }
    return <div className="d-flex">{stars}</div>;
  };

  // Get filtered reviews
  const getFilteredReviews = () => {
    if (activeFilter === 'all') return reviews;
    return reviews.filter(review => Math.round(review.rating) === parseInt(activeFilter));
  };
  
  const filteredReviews = getFilteredReviews();
  
  if (loading) {
    return (
      <div className="py-4">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-2">Đang tải đánh giá...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-4 bg-white border-top">
      <div className="container">
        {/* Rating Overview */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
          <div className="d-flex align-items-center mb-2 mb-md-0">
            <div className="bg-warning text-white px-3 py-2 rounded me-3">
              <span className="fs-3 fw-bold">{averageRating.toFixed(1)}</span>
            </div>
            <div>
              <div className="mb-1">{renderStars(averageRating)}</div>
              <span className="text-muted">({totalReviews} đánh giá)</span>
            </div>
          </div>
          
          {/* Review Filters */}
          {totalReviews > 0 && (
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`btn btn-sm ${
                  activeFilter === 'all' 
                    ? 'btn-primary' 
                    : 'btn-outline-secondary'
                }`}
              >
                Tất cả
              </button>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = reviews.filter(r => Math.round(r.rating) === rating).length;
                if (count === 0) return null;
                
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setActiveFilter(rating.toString())}
                    className={`btn btn-sm ${
                      activeFilter === rating.toString() 
                        ? 'btn-primary' 
                        : 'btn-outline-secondary'
                    }`}
                  >
                    {rating} sao
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Divider */}
        <hr className="mb-4" />
        
        {/* Reviews list */}
        {error ? (
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="reviews-list">
            {filteredReviews.map((review) => {
              const userName = review.user ? review.user.fullName || review.user.username : 'Khách hàng';
              
              return (
                <div className="card mb-3" key={review.id}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex">
                        <div className="me-3">
                          <div className="bg-light rounded-circle p-2 mb-1" style={{width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <span className="fw-bold text-primary fs-5">{userName.charAt(0).toUpperCase()}</span>
                          </div>
                        </div>
                        
                        <div>
                          <h6 className="mb-1 fw-bold">{userName}</h6>
                          <div className="mb-1">
                            {renderStars(review.rating)}
                          </div>
                          <small className="text-muted d-block">
                            Đánh giá vào {formatDate(review.createdAt || review.dateCreated)}
                          </small>
                          {review.orderId && (
                            <small className="text-muted d-block">
                              Đơn hàng #{review.orderId}
                            </small>
                          )}
                        </div>
                      </div>
                      
                      {review.product && (
                        <div className="text-end">
                          <div className="d-flex align-items-center">
                            {review.product.imageUrl && (
                              <img 
                                src={review.product.imageUrl} 
                                alt={review.product.name} 
                                className="me-2"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              />
                            )}
                            <div>
                              <Link to={`/product/${review.product.id}`} className="text-decoration-none">
                                {review.product.name}
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {review.comment && (
                      <div className="review-comment mt-2 px-3 py-3 bg-light rounded border">
                        <p className="mb-0">{review.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="fa fa-comment fa-3x text-muted mb-3"></i>
            <h5>Chưa có đánh giá nào</h5>
            <p className="text-muted">Sản phẩm này chưa có đánh giá từ khách hàng.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews; 