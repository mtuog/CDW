import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../../config';

const LoyaltyPoints = ({ user }) => {
    const [loyaltyData, setLoyaltyData] = useState({
        points: 0,
        rank: 'Bronze',
        nextRank: 'Silver',
        pointsToNextRank: 100,
        transactions: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        fetchLoyaltyData();
    }, [user]);
    
    const fetchLoyaltyData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            console.log('Fetching loyalty data for user:', user.id);
            console.log('Token exists:', !!token);
            
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/loyalty/${user.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            console.log('Loyalty API response:', response);
            
            if (response.status === 200) {
                setLoyaltyData(response.data);
                setError(null);
            }
        } catch (error) {
            console.error('Error fetching loyalty data:', error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                url: error.config?.url
            });
            
            let errorMessage = 'Không thể tải dữ liệu điểm tích lũy.';
            
            if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Không tìm thấy thông tin người dùng.';
            } else if (error.response?.status === 500) {
                const errorData = error.response?.data;
                if (errorData?.error) {
                    errorMessage = `Lỗi server: ${errorData.error}`;
                } else {
                    errorMessage = 'Lỗi server nội bộ. Vui lòng thử lại sau.';
                }
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    const getRankDetails = (rank) => {
        switch(rank) {
            case 'Bronze':
                return {
                    color: '#cd7f32',
                    benefits: ['Tích 1 điểm cho mỗi 10.000đ chi tiêu', 'Ưu đãi sinh nhật']
                };
            case 'Silver':
                return {
                    color: '#c0c0c0',
                    benefits: ['Tích 1.2 điểm cho mỗi 10.000đ chi tiêu', 'Ưu đãi sinh nhật', 'Quà tặng hạng Silver']
                };
            case 'Gold':
                return {
                    color: '#ffd700',
                    benefits: ['Tích 1.5 điểm cho mỗi 10.000đ chi tiêu', 'Ưu đãi sinh nhật', 'Quà tặng hạng Gold', 'Ưu tiên xử lý đơn hàng']
                };
            case 'Platinum':
                return {
                    color: '#e5e4e2',
                    benefits: ['Tích 2 điểm cho mỗi 10.000đ chi tiêu', 'Ưu đãi sinh nhật', 'Quà tặng hạng Platinum', 'Ưu tiên xử lý đơn hàng', 'Giao hàng miễn phí']
                };
            default:
                return {
                    color: '#cd7f32',
                    benefits: ['Tích 1 điểm cho mỗi 10.000đ chi tiêu']
                };
        }
    };
    
    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    };
    
    const currentRankDetails = getRankDetails(loyaltyData.rank);
    const nextRankDetails = getRankDetails(loyaltyData.nextRank);
    
    // Calculate progress percentage
    const progressPercentage = () => {
        const totalPointsForNextRank = loyaltyData.points + loyaltyData.pointsToNextRank;
        return (loyaltyData.points / totalPointsForNextRank) * 100;
    };
    
    // Function to format transaction description
    const formatTransactionDescription = (transaction) => {
        if (transaction.type === 'EARN' && transaction.orderCode) {
            return `Đơn hàng #${transaction.orderCode}${transaction.discountCodeValue ? ` (Mã giảm giá: ${transaction.discountCodeValue})` : ''}`;
        }
        return transaction.description;
    };
    
    // Hiển thị giá trị đơn hàng gốc hoặc sau giảm giá
    const displayTransactionAmount = (transaction) => {
        if (transaction.type === 'EARN' && transaction.orderAmount) {
            const originalAmount = transaction.subtotalAmount || transaction.orderAmount;
            
            if (transaction.subtotalAmount && transaction.subtotalAmount > transaction.orderAmount) {
                return (
                    <>
                        <span className="original-price">{formatPrice(originalAmount)}</span>
                        <span className="discounted-price">{formatPrice(transaction.orderAmount)}</span>
                    </>
                );
            }
            
            return formatPrice(transaction.orderAmount);
        }
        return null;
    };
    
    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
        }).format(price);
    };
    
    return (
        <div className="loyalty-points">
            <h4 className="mb-4">Điểm tích lũy & Hạng thành viên</h4>
            
            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải dữ liệu điểm tích lũy...</p>
                </div>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    <h6><i className="fa fa-exclamation-triangle"></i> Không thể tải dữ liệu</h6>
                    <p className="mb-2">{error}</p>
                    <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => fetchLoyaltyData()}
                    >
                        <i className="fa fa-refresh"></i> Thử lại
                    </button>
                </div>
            ) : (
                <>
                    <div className="row">
                        <div className="col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="loyalty-rank-badge me-3" style={{ backgroundColor: currentRankDetails.color }}>
                                            {loyaltyData.rank.charAt(0)}
                                        </div>
                                        <div>
                                            <h5 className="mb-0">Hạng thành viên: <span style={{ color: currentRankDetails.color }}>{loyaltyData.rank}</span></h5>
                                            <p className="text-muted mb-0">Thành viên từ: {formatDate(user.dateRegistered || '2023-01-01')}</p>
                                        </div>
                                    </div>
                                    
                                    <h6 className="mb-2">Quyền lợi hạng {loyaltyData.rank}:</h6>
                                    <ul className="mb-3">
                                        {currentRankDetails.benefits.map((benefit, index) => (
                                            <li key={index}>{benefit}</li>
                                        ))}
                                    </ul>
                                    
                                    {loyaltyData.nextRank && (
                                        <>
                                            <p className="mb-2">
                                                Cần thêm <strong>{loyaltyData.pointsToNextRank} điểm</strong> nữa để lên hạng {loyaltyData.nextRank}
                                            </p>
                                            <div className="progress mb-2" style={{ height: '10px' }}>
                                                <div 
                                                    className="progress-bar" 
                                                    role="progressbar" 
                                                    style={{ width: `${progressPercentage()}%`, backgroundColor: nextRankDetails.color }}
                                                    aria-valuenow={progressPercentage()} 
                                                    aria-valuemin="0" 
                                                    aria-valuemax="100"
                                                ></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6 mb-4">
                            <div className="card h-100 loyalty-points-card">
                                <div className="card-body text-center">
                                    <h5 className="card-title mb-3">Điểm tích lũy hiện tại</h5>
                                    <div className="loyalty-points-circle mb-3">
                                        <span className="points-number">{loyaltyData.points}</span>
                                        <span className="points-label">điểm</span>
                                    </div>
                                    <p className="mb-3">1 điểm = 1.000đ khi đổi</p>
                                    <button className="btn btn-primary">Đổi điểm ngay</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Lịch sử điểm</h5>
                        </div>
                        <div className="card-body">
                            {loyaltyData.transactions.length === 0 ? (
                                <div className="text-center my-4">
                                    <i className="fa fa-star-half-alt fa-3x text-muted mb-3"></i>
                                    <h5>Chưa có giao dịch điểm</h5>
                                    <p className="text-muted">Hãy mua sắm để bắt đầu tích điểm</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Ngày</th>
                                                <th>Mô tả</th>
                                                <th>Giá trị</th>
                                                <th className="text-end">Điểm</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loyaltyData.transactions.map(transaction => (
                                                <tr key={transaction.id}>
                                                    <td>{formatDate(transaction.date)}</td>
                                                    <td>{formatTransactionDescription(transaction)}</td>
                                                    <td>{displayTransactionAmount(transaction)}</td>
                                                    <td className={`text-end ${transaction.type === 'EARN' ? 'text-success' : 'text-danger'}`}>
                                                        {transaction.type === 'EARN' ? '+' : ''}{transaction.points}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="row">
                        <div className="col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">Cách tích điểm</h5>
                                </div>
                                <div className="card-body">
                                    <ul className="list-unstyled">
                                        <li className="mb-3">
                                            <i className="fa fa-shopping-cart text-primary me-2"></i> 
                                            <strong>Mua hàng:</strong> Tích điểm theo hạng thành viên
                                        </li>
                                        <li className="mb-3">
                                            <i className="fa fa-star text-primary me-2"></i> 
                                            <strong>Đánh giá sản phẩm:</strong> +5 điểm cho mỗi đánh giá
                                        </li>
                                        <li className="mb-3">
                                            <i className="fa fa-user-plus text-primary me-2"></i> 
                                            <strong>Giới thiệu bạn bè:</strong> +20 điểm khi bạn bè đăng ký và mua hàng
                                        </li>
                                        <li>
                                            <i className="fa fa-birthday-cake text-primary me-2"></i> 
                                            <strong>Sinh nhật:</strong> Nhận x2 điểm trong tháng sinh nhật
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">Cách sử dụng điểm</h5>
                                </div>
                                <div className="card-body">
                                    <ul className="list-unstyled">
                                        <li className="mb-3">
                                            <i className="fa fa-tag text-primary me-2"></i> 
                                            <strong>Đổi voucher giảm giá:</strong> Từ 20 điểm
                                        </li>
                                        <li className="mb-3">
                                            <i className="fa fa-truck text-primary me-2"></i> 
                                            <strong>Đổi phiếu vận chuyển miễn phí:</strong> 15 điểm
                                        </li>
                                        <li className="mb-3">
                                            <i className="fa fa-gift text-primary me-2"></i> 
                                            <strong>Đổi quà tặng:</strong> Từ 50 điểm
                                        </li>
                                        <li>
                                            <i className="fa fa-percent text-primary me-2"></i> 
                                            <strong>Thanh toán đơn hàng:</strong> Trừ điểm trực tiếp khi thanh toán
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
            
            <style jsx>{`
                .loyalty-rank-badge {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 20px;
                }
                
                .loyalty-points-circle {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background-color: #f8f9fa;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                    border: 5px solid #e9ecef;
                }
                
                .points-number {
                    font-size: 32px;
                    font-weight: bold;
                    color: #28a745;
                }
                
                .points-label {
                    font-size: 14px;
                    color: #6c757d;
                }
                
                .original-price {
                    text-decoration: line-through;
                    color: #6c757d;
                    font-size: 0.9em;
                    margin-right: 8px;
                }
                
                .discounted-price {
                    color: #28a745;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default LoyaltyPoints; 
