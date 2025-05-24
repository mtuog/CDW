import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentResult.css';
import { BACKEND_URL_HTTP } from '../../../config';
import { verifyPayment, getPaymentStatus, getVNPaySettings } from '../../../utils/paymentUtils';

const PaymentResult = () => {
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    
    useEffect(() => {
        const processPaymentResult = async () => {
            try {
                setLoading(true);
                const queryParams = new URLSearchParams(location.search);
                
                console.log("URL params:", Object.fromEntries(queryParams.entries()));
                console.log("Raw URL search string:", location.search);
                
                // Tải cài đặt VNPAY nếu cần
                const vnpaySettings = await getVNPaySettings();
                console.log("Cài đặt VNPAY:", vnpaySettings);
                
                // Kiểm tra loại thanh toán và xử lý tương ứng
                if (location.pathname.includes('vnpay-return')) {
                    console.log("Đang xử lý kết quả thanh toán VNPAY");
                    
                    // Check if we have any VNPAY params
                    const hasVnpayParams = Array.from(queryParams.keys()).some(key => key.startsWith('vnp_'));
                    console.log("Has VNPAY params:", hasVnpayParams);
                    
                    // Nếu đã có kết quả từ URL
                    const vnpResponseCode = queryParams.get('vnp_ResponseCode');
                    const vnpOrderInfo = queryParams.get('vnp_OrderInfo');
                    const vnpAmount = queryParams.get('vnp_Amount');
                    const vnpTxnRef = queryParams.get('vnp_TxnRef');
                    const vnpTransactionNo = queryParams.get('vnp_TransactionNo');
                    
                    if (vnpResponseCode && vnpTxnRef) {
                        console.log("Kết quả trả về từ VNPAY:", {
                            responseCode: vnpResponseCode,
                            orderInfo: vnpOrderInfo,
                            amount: vnpAmount,
                            txnRef: vnpTxnRef,
                            transactionNo: vnpTransactionNo
                        });
                        
                        // Đối với phản hồi từ URL
                        const isSuccess = vnpResponseCode === '00';
                        const orderId = vnpTxnRef.split('_')[0]; // Lấy ID đơn hàng từ vnp_TxnRef
                        
                        // Hiển thị kết quả ban đầu dựa trên tham số URL
                        setResult({
                            success: isSuccess,
                            message: isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại: ' + getVnpResponseMessage(vnpResponseCode),
                            orderId: orderId,
                            amount: vnpAmount ? parseInt(vnpAmount) / 100 : null,
                            transactionNo: vnpTransactionNo,
                            paymentMethod: 'VNPAY'
                        });
                        
                        // Luôn gọi API để xử lý kết quả thanh toán ở phía backend
                        try {
                            console.log("Gửi request đến endpoint payment-return", location.search);
                            
                            // Tạo URL với query parameters
                            const apiUrl = `${BACKEND_URL_HTTP}/api/vnpay/payment-return${location.search}`;
                            console.log("API URL hoàn chỉnh:", apiUrl);
                            
                            // Gọi API GET với query parameters trong URL
                            const response = await axios.get(apiUrl);
                            console.log("Kết quả từ API:", response.data);
                            
                            if (response.data) {
                                // Cập nhật kết quả từ phản hồi của API
                                setResult({
                                    success: response.data.success,
                                    message: response.data.message,
                                    orderId: response.data.orderId,
                                    amount: vnpAmount ? parseInt(vnpAmount) / 100 : null,
                                    transactionNo: vnpTransactionNo,
                                    paymentMethod: 'VNPAY'
                                });
                            }
                        } catch (apiError) {
                            console.error("Lỗi khi gọi API payment-return:", apiError);
                            // Giữ nguyên kết quả hiển thị từ tham số URL nếu API gặp lỗi
                        }
                    } else {
                        // Gọi API để lấy thông tin chi tiết
                        try {
                            console.log("Gửi request đến endpoint payment-return", location.search);
                            
                            // Tạo URL với query parameters
                            const apiUrl = `${BACKEND_URL_HTTP}/api/vnpay/payment-return${location.search}`;
                            console.log("API URL hoàn chỉnh:", apiUrl);
                            
                            // Gọi API GET với query parameters trong URL
                            const response = await axios.get(apiUrl);
                            console.log("Kết quả từ API:", response.data);
                            
                            if (response.data) {
                                setResult({
                                    success: response.data.success,
                                    message: response.data.message,
                                    orderId: response.data.orderId,
                                    amount: response.data.vnp_Amount,
                                    transactionNo: response.data.vnp_TransactionNo,
                                    paymentMethod: 'VNPAY'
                                });
                            } else {
                                throw new Error("API không trả về dữ liệu");
                            }
                        } catch (apiError) {
                            console.error("Lỗi khi gọi API payment-return:", apiError);
                            
                            // Kiểm tra nếu không có tham số nào từ VNPAY
                            if (!hasVnpayParams) {
                                setResult({
                                    success: false,
                                    message: "Không có thông tin thanh toán từ VNPAY. Vui lòng kiểm tra đơn hàng của bạn.",
                                    paymentMethod: 'VNPAY'
                                });
                            } else {
                                // Fallback khi API bị lỗi nhưng có param từ VNPAY
                                setResult({
                                    success: false,
                                    message: "Không thể xác nhận kết quả thanh toán, vui lòng liên hệ quản trị viên",
                                    paymentMethod: 'VNPAY'
                                });
                            }
                        }
                    }
                } else {
                    // Xử lý các loại thanh toán khác
                    setResult({
                        success: queryParams.get('success') === 'true',
                        message: queryParams.get('message') || 'Không có thông tin giao dịch',
                        orderId: queryParams.get('orderId'),
                        paymentMethod: queryParams.get('paymentMethod') || 'Unknown'
                    });
                }
            } catch (error) {
                console.error('Error processing payment result:', error);
                setResult({
                    success: false,
                    message: error.response?.data?.message || 'Đã xảy ra lỗi khi xử lý kết quả thanh toán',
                    paymentMethod: 'Unknown'
                });
            } finally {
                setLoading(false);
            }
        };
        
        processPaymentResult();
    }, [location]);
    
    // Helper function to get VNPAY response messages
    const getVnpResponseMessage = (responseCode) => {
        const messages = {
            '00': 'Giao dịch thành công',
            '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
            '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
            '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
            '11': 'Đã hết hạn chờ thanh toán',
            '12': 'Thẻ/Tài khoản bị khóa',
            '13': 'Sai mật khẩu xác thực giao dịch (OTP)',
            '24': 'Giao dịch bị hủy',
            '51': 'Tài khoản không đủ số dư',
            '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
            '75': 'Ngân hàng đang bảo trì',
            '79': 'Sai mật khẩu thanh toán quá số lần quy định'
        };
        return messages[responseCode] || 'Giao dịch không thành công';
    };
    
    const handleContinueShopping = () => {
        navigate('/');
    };
    
    const handleViewOrder = () => {
        if (result.orderId) {
            navigate(`/account/orders/${result.orderId}`);
        } else {
            navigate('/account/orders');
        }
    };
    
    if (loading) {
        return (
            <div className="payment-result-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Đang xử lý kết quả thanh toán...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="payment-result-container">
            <div className="payment-result-card">
                <div className={`payment-status ${result.success ? 'success' : 'error'}`}>
                    {result.success ? (
                        <>
                            <div className="payment-icon success-icon">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h2>Thanh toán thành công!</h2>
                        </>
                    ) : (
                        <>
                            <div className="payment-icon error-icon">
                                <i className="fas fa-times-circle"></i>
                            </div>
                            <h2>Thanh toán thất bại</h2>
                        </>
                    )}
                </div>
                
                <div className="payment-details">
                    <p className="payment-message">{result.message}</p>
                    
                    {result.orderId && (
                        <div className="detail-row">
                            <span className="detail-label">Mã đơn hàng:</span>
                            <span className="detail-value">{result.orderId}</span>
                        </div>
                    )}
                    
                    {result.amount && (
                        <div className="detail-row">
                            <span className="detail-label">Số tiền:</span>
                            <span className="detail-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(result.amount)}</span>
                        </div>
                    )}
                    
                    {result.transactionNo && (
                        <div className="detail-row">
                            <span className="detail-label">Mã giao dịch:</span>
                            <span className="detail-value">{result.transactionNo}</span>
                        </div>
                    )}
                    
                    <div className="detail-row">
                        <span className="detail-label">Phương thức thanh toán:</span>
                        <span className="detail-value">{result.paymentMethod}</span>
                    </div>
                </div>
                
                <div className="payment-actions">
                    <button 
                        className="action-button primary" 
                        onClick={handleContinueShopping}
                    >
                        Tiếp tục mua sắm
                    </button>
                    
                    {result.success && result.orderId && (
                        <button 
                            className="action-button secondary" 
                            onClick={handleViewOrder}
                        >
                            Xem đơn hàng
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentResult; 