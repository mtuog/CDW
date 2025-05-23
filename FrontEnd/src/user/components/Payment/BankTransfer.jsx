import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Spinner } from 'react-bootstrap';
import axios from 'axios';
import './Payment.css';
import { BACKEND_URL_HTTP } from '../../../config';

const BankTransfer = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [selectedBank, setSelectedBank] = useState(null);
    const [transactionCode, setTransactionCode] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imgLoading, setImgLoading] = useState(true);
    const [dynamicQrUrl, setDynamicQrUrl] = useState(null);
    const [retrying, setRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;

    // Define fetchOrderDetails outside of useEffect so it can be referenced elsewhere
        const fetchOrderDetails = async () => {
            try {
                const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
            }
            
            console.log(`Đang gửi yêu cầu lấy thông tin đơn hàng ID: ${orderId}`);
            console.log(`URL API: ${BACKEND_URL_HTTP}/api/orders/${orderId}`);
            
            // Thử sử dụng HTTP trước
            try {
                const response = await axios.get(`${BACKEND_URL_HTTP}/api/orders/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Kết quả API (HTTP):', response.data);
                setOrder(response.data);
                return; // Kết thúc hàm nếu thành công
            } catch (httpError) {
                console.warn('Lỗi kết nối qua HTTP, thử dùng HTTPS:', httpError);
                // Tiếp tục thử HTTPS nếu HTTP thất bại
            }
            
            // Nếu HTTP thất bại, thử sử dụng HTTPS
            console.log(`Thử lại với HTTPS: https://${BACKEND_URL_HTTP.replace('http://', '')}/api/orders/${orderId}`);
            const response = await axios.get(`https://${BACKEND_URL_HTTP.replace('http://', '')}/api/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Kết quả API (HTTPS):', response.data);
                setOrder(response.data);
            } catch (err) {
            // Ghi lại chi tiết lỗi để debug
            console.error('Chi tiết lỗi khi lấy thông tin đơn hàng:', err);
            console.error('Response data:', err.response?.data);
            console.error('Response status:', err.response?.status);
            
            // Thông báo lỗi chi tiết hơn
            let errorMessage = 'Không thể lấy thông tin đơn hàng. ';
            
            if (err.response) {
                // Lỗi từ response của server
                if (err.response.status === 401) {
                    errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                } else if (err.response.status === 403) {
                    errorMessage += 'Bạn không có quyền truy cập đơn hàng này.';
                } else if (err.response.status === 404) {
                    errorMessage += 'Không tìm thấy thông tin đơn hàng.';
                } else {
                    errorMessage += err.response.data?.message || 'Vui lòng thử lại sau.';
                }
            } else if (err.request) {
                // Lỗi không nhận được response
                errorMessage += 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
            } else {
                // Lỗi khi thiết lập request
                errorMessage += err.message || 'Vui lòng thử lại sau.';
            }
            
            setError(errorMessage);
            }
        };

    // Lấy thông tin đơn hàng
    useEffect(() => {
        fetchOrderDetails();

        const fetchBankAccounts = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL_HTTP}/api/bank-payments/accounts`);
                setBankAccounts(response.data);
                if (response.data.length > 0) {
                    setSelectedBank(response.data[0]);
                }
            } catch (err) {
                setError('Không thể lấy thông tin tài khoản ngân hàng. Vui lòng thử lại sau.');
                console.error('Error fetching bank accounts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBankAccounts();
    }, [orderId]);

    // Xử lý khi chọn ngân hàng
    const handleBankSelection = (e) => {
        const bankId = parseInt(e.target.value);
        const selected = bankAccounts.find(bank => bank.id === bankId);
        setSelectedBank(selected);
        setImgLoading(true); // Reset image loading state when changing bank
    };

    // Xử lý khi gửi thông tin thanh toán
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!transactionCode) {
            setError('Vui lòng nhập mã giao dịch');
            return;
        }

        try {
            setLoading(true);
            setError(''); // Clear previous errors
            const token = localStorage.getItem('token');
            
            // Tạo dữ liệu thanh toán đầy đủ
            const paymentData = {
                bankName: selectedBank.bankName,
                accountNumber: selectedBank.accountNumber,
                accountName: selectedBank.accountName,
                transactionCode: transactionCode,
                amount: parseFloat(order.totalAmount), // Đảm bảo amount là số
                paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString()
                // Không gửi status vì server sẽ tự thiết lập trạng thái
            };
            
            console.log('Dữ liệu thanh toán gửi đi:', paymentData);

            // Thử xử lý đặc biệt nếu gặp CORS
            try {
                const response = await axios.post(
                    `${BACKEND_URL_HTTP}/api/bank-payments/orders/${orderId}`, 
                paymentData, 
                    { 
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
            );

                console.log('Kết quả API:', response.data);
            setSuccess('Đã gửi thông tin thanh toán thành công! Chúng tôi sẽ xác nhận và cập nhật trạng thái đơn hàng của bạn sớm nhất.');
            setTimeout(() => {
                navigate(`/order-success/${orderId}`);
            }, 3000);
                return;
            } catch (postError) {
                console.error('Lỗi khi gọi POST:', postError);
                
                // Nếu lỗi 400, hiển thị chi tiết lỗi
                if (postError.response && postError.response.status === 400) {
                    const errorData = postError.response.data;
                    if (errorData && errorData.error) {
                        throw new Error(errorData.error);
                    }
                }
                
                // Thử phương thức khác nếu có vấn đề với endpoint
                throw postError;
            }
        } catch (err) {
            console.error('Chi tiết lỗi gửi thanh toán:', err);
            console.error('Response data:', err.response?.data);
            console.error('Response status:', err.response?.status);
            
            let errorMsg = 'Đã xảy ra lỗi khi gửi thông tin thanh toán.';
            
            if (err.response) {
                if (err.response.data?.error) {
                    errorMsg = err.response.data.error;
                } else if (err.response.data?.message) {
                    errorMsg = err.response.data.message;
                }
            } else if (err.message) {
                errorMsg = err.message;
            }
            
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Chuẩn bị URL mã QR với các tham số tối ưu
    const getOptimizedQrUrl = (url) => {
        if (!url) return '';
        
        // Nếu đã là URL Cloudinary, thêm các tham số chuyển đổi
        if (url.includes('cloudinary.com')) {
            // Thay thế /upload/ với /upload/q_auto,f_auto,w_300/ để tối ưu hình ảnh
            return url.replace('/upload/', '/upload/q_auto,f_auto,w_300/');
        }
        
        return url;
    };

    // Thêm hàm xử lý để tạo mã VietQR động với số tiền
    const generateDynamicVietQR = async (bankAccount, order) => {
        if (!bankAccount.bankCode || !order) return null;
        
        try {
            const response = await axios.post(
                `${BACKEND_URL_HTTP}/api/bank-payments/generate-qr`,
                {
                    bankId: bankAccount.bankCode,
                    accountNo: bankAccount.accountNumber,
                    accountName: bankAccount.accountName,
                    amount: order.totalAmount,
                    description: `Thanh toan #${order.id}`
                }
            );
            
            if (response.data && response.data.qrUrl) {
                return response.data.qrUrl;
            }
            return bankAccount.qrCodeUrl; // Fallback to static QR
        } catch (error) {
            console.error('Error generating dynamic QR code:', error);
            return bankAccount.qrCodeUrl; // Fallback to static QR
        }
    };

    // Thêm useEffect để tạo mã QR động khi selectedBank hoặc order thay đổi
    useEffect(() => {
        const fetchDynamicQR = async () => {
            if (selectedBank && selectedBank.bankCode && order) {
                const qrUrl = await generateDynamicVietQR(selectedBank, order);
                setDynamicQrUrl(qrUrl);
            }
        };
        
        fetchDynamicQR();
    }, [selectedBank, order]);

    // Thêm component hiển thị phần VietQR
    const VietQRDisplay = ({ bankAccount }) => {
        // Ưu tiên sử dụng mã QR động với số tiền nếu có
        const qrCodeUrl = dynamicQrUrl || bankAccount.qrCodeUrl;
        
        if (!qrCodeUrl) return null;
        
        return (
            <div className="vietqr-container">
                <h5>Quét mã QR để thanh toán nhanh</h5>
                <div className="qr-image-container">
                    <img 
                        src={qrCodeUrl} 
                        alt="VietQR" 
                        className="qr-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/200?text=QR+Code+Error';
                            e.target.style.opacity = 0.5;
                        }}
                    />
                </div>
                <p className="qr-instructions">
                    Sử dụng App Mobile Banking của ngân hàng bất kỳ để quét mã
                </p>
                <div className="text-success mb-2">
                    <i className="fas fa-check-circle me-1"></i>
                    Đã bao gồm số tiền và nội dung thanh toán
                </div>
                <div className="bank-logos">
                    <img src="https://vietqr.net/img/banks-sm/vietcombank.png" alt="VCB" title="Vietcombank" />
                    <img src="https://vietqr.net/img/banks-sm/agribank.png" alt="Agribank" title="Agribank" />
                    <img src="https://vietqr.net/img/banks-sm/vietinbank.png" alt="Vietinbank" title="Vietinbank" />
                    <img src="https://vietqr.net/img/banks-sm/bidv.png" alt="BIDV" title="BIDV" />
                    <img src="https://vietqr.net/img/banks-sm/techcombank.png" alt="Techcombank" title="Techcombank" />
                </div>
            </div>
        );
    };

    // Hàm kiểm tra kết nối mạng
    const checkNetworkConnection = () => {
        return navigator.onLine;
    };

    // Hàm thử lại
    const retryFetchOrderDetails = () => {
        if (retryCount < MAX_RETRIES) {
            setRetrying(true);
            setRetryCount(prev => prev + 1);
            console.log(`Đang thử lại lần ${retryCount + 1}/${MAX_RETRIES}...`);
            
            // Thử lại sau 2 giây
            setTimeout(() => {
                fetchOrderDetails();
                setRetrying(false);
            }, 2000);
        } else {
            setError(`Đã thử lại ${MAX_RETRIES} lần nhưng không thành công. Vui lòng kiểm tra kết nối và thử lại sau.`);
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <div className="spinner-container">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Đang tải thông tin thanh toán...</p>
                </div>
            </Container>
        );
    }

    if (success) {
        return (
            <Container className="py-5">
                <div className="bank-transfer-success">
                    <div className="success-icon">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <h3>Thông tin thanh toán đã được ghi nhận</h3>
                    <p>{success}</p>
                    <p>Mã giao dịch: <span className="transaction-code">{transactionCode}</span></p>
                    <Button 
                        variant="primary" 
                        onClick={() => navigate('/')}
                        className="mt-3"
                    >
                        Quay về trang chủ
                    </Button>
                </div>
            </Container>
        );
    }

    if (!order || !selectedBank) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    {error || 'Không thể hiển thị thông tin thanh toán. Vui lòng thử lại sau.'}
                </Alert>
                <div className="text-center mt-3">
                    <Button 
                        variant="warning" 
                        onClick={retryFetchOrderDetails}
                        disabled={retrying}
                        className="mr-2"
                    >
                        {retrying ? 'Đang thử lại...' : 'Thử lại'}
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => navigate('/')}
                        className="ml-2"
                    >
                        Quay về trang chủ
                    </Button>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <div className="bread-crumb flex-w p-l-25 p-r-15 p-t-30 p-lr-0-lg mb-4">
                <a href="/" className="stext-109 cl8 hov-cl1 trans-04">
                    Trang Chủ
                    <i className="fa fa-angle-right m-l-9 m-r-10" aria-hidden="true"></i>
                </a>
                <a href="/cart" className="stext-109 cl8 hov-cl1 trans-04">
                    Giỏ Hàng
                    <i className="fa fa-angle-right m-l-9 m-r-10" aria-hidden="true"></i>
                </a>
                <span className="stext-109 cl4">
                    Thanh Toán Chuyển Khoản
                </span>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Row>
                <Col lg={7} className="mb-4">
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="p-4">
                            <div className="payment-header">
                                <h3 className="mb-4">Chuyển khoản ngân hàng</h3>
                                <p className="text-secondary mb-4">
                                    Vui lòng chuyển khoản đến một trong những tài khoản ngân hàng dưới đây và cung cấp thông tin giao dịch để chúng tôi xác nhận.
                                </p>
                            </div>

                            {bankAccounts.length > 1 && (
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-medium">Chọn ngân hàng</Form.Label>
                                    <Form.Select onChange={handleBankSelection} className="form-select-custom">
                                        {bankAccounts.map(bank => (
                                            <option key={bank.id} value={bank.id}>
                                                {bank.bankName} - {bank.accountNumber}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            )}

                            <div className="bank-info-card mb-4">
                                <Row>
                                    <Col md={selectedBank.qrCodeUrl ? 7 : 12}>
                                        <div className="bank-details">
                                            <div className="bank-logo-name mb-3">
                                                {selectedBank.bankLogo && (
                                                    <img 
                                                        src={selectedBank.bankLogo} 
                                                        alt={selectedBank.bankName} 
                                                        className="bank-logo me-2"
                                                        style={{ maxHeight: '30px', marginRight: '10px' }}
                                                    />
                                                )}
                                                <h5 className="mb-0">{selectedBank.bankName}</h5>
                                            </div>
                                            
                                            <Table className="table-borderless bank-info-table">
                                                <tbody>
                                                    <tr>
                                                        <th>Chủ tài khoản:</th>
                                                        <td>{selectedBank.accountName}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Số tài khoản:</th>
                                                        <td>
                                                            <div className="copy-field">
                                                                <span className="field-value">{selectedBank.accountNumber}</span>
                                                                <button 
                                                                    className="copy-btn"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(selectedBank.accountNumber);
                                                                        alert('Đã sao chép số tài khoản!');
                                                                    }}
                                                                >
                                                                    <i className="fas fa-copy"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th>Chi nhánh:</th>
                                                        <td>{selectedBank.branch || 'Tất cả chi nhánh'}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Số tiền:</th>
                                                        <td className="order-amount">
                                                            {new Intl.NumberFormat('vi-VN', { 
                                                                style: 'currency', 
                                                                currency: 'VND' 
                                                            }).format(order.totalAmount)}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th>Nội dung CK:</th>
                                                        <td>
                                                            <div className="copy-field">
                                                                <span className="field-value">Thanh toan #{orderId}</span>
                                                                <button 
                                                                    className="copy-btn"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(`Thanh toan #${orderId}`);
                                                                        alert('Đã sao chép nội dung chuyển khoản!');
                                                                    }}
                                                                >
                                                                    <i className="fas fa-copy"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Col>

                                    {selectedBank.qrCodeUrl && (
                                        <Col md={5} className="d-flex align-items-center justify-content-center">
                                            <VietQRDisplay bankAccount={selectedBank} />
                                        </Col>
                                    )}
                                </Row>
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <Card className="border-0 bg-light mb-4">
                                    <Card.Body className="p-4">
                                        <h5 className="mb-4">Xác nhận thanh toán</h5>
                                        
                                        <Form.Group className="mb-3">
                                            <Form.Label>Mã giao dịch / Số tham chiếu <span className="text-danger">*</span></Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                value={transactionCode}
                                                onChange={(e) => setTransactionCode(e.target.value)}
                                                placeholder="Nhập mã giao dịch từ ngân hàng của bạn"
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Bạn có thể tìm thấy mã này trong tin nhắn SMS hoặc email xác nhận từ ngân hàng
                                            </Form.Text>
                                        </Form.Group>
                                        
                                        <Form.Group className="mb-3">
                                            <Form.Label>Ngày thanh toán</Form.Label>
                                            <Form.Control 
                                                type="date" 
                                                value={paymentDate}
                                                onChange={(e) => setPaymentDate(e.target.value)}
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                        </Form.Group>
                                        
                                        <div className="d-grid">
                                            <Button 
                                                type="submit" 
                                                className="flex-c-m stext-101 cl0 size-116 bg3 bor14 hov-btn3 p-lr-15 trans-04 pointer"
                                                variant="primary"
                                            >
                                                Xác nhận đã thanh toán
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col lg={5}>
                    <Card className="order-summary-card border-0 shadow-sm">
                        <Card.Body className="p-4">
                            <h4 className="mb-4">Thông tin đơn hàng</h4>
                            
                            <div className="order-info mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Mã đơn hàng:</span>
                                    <span className="fw-bold">#{orderId}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Ngày đặt hàng:</span>
                                    <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Trạng thái:</span>
                                    <span className="badge bg-warning text-dark">Chờ thanh toán</span>
                                </div>
                            </div>
                            
                            <hr />
                            
                            <div className="order-items mb-3">
                                <h5 className="mb-3">Sản phẩm</h5>
                                
                                {order.orderItems && order.orderItems.map((item, index) => (
                                    <div key={index} className="order-item d-flex mb-3">
                                        <div className="item-details">
                                            <div className="item-name">
                                                {item.product.name}
                                                {item.size && <span className="item-variant"> - Size: {item.size}</span>}
                                                {item.color && <span className="item-variant"> - Màu: {item.color}</span>}
                                            </div>
                                            <div className="item-price-qty">
                                                {new Intl.NumberFormat('vi-VN', { 
                                                    style: 'currency', 
                                                    currency: 'VND' 
                                                }).format(item.price)} x {item.quantity}
                                            </div>
                                        </div>
                                        <div className="item-total ms-auto">
                                            {new Intl.NumberFormat('vi-VN', { 
                                                style: 'currency', 
                                                currency: 'VND' 
                                            }).format(item.price * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <hr />
                            
                            <div className="order-total">
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Tạm tính:</span>
                                    <span>{new Intl.NumberFormat('vi-VN', { 
                                        style: 'currency', 
                                        currency: 'VND' 
                                    }).format(order.totalAmount)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Phí vận chuyển:</span>
                                    <span>{order.shippingFee ? new Intl.NumberFormat('vi-VN', { 
                                        style: 'currency', 
                                        currency: 'VND' 
                                    }).format(order.shippingFee) : 'Miễn phí'}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <span className="fw-bold">Tổng cộng:</span>
                                    <span className="total-amount">
                                        {new Intl.NumberFormat('vi-VN', { 
                                            style: 'currency', 
                                            currency: 'VND' 
                                        }).format(order.totalAmount + (order.shippingFee || 0))}
                                    </span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                    
                    <div className="support-info mt-4">
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="p-4">
                                <h5>Cần hỗ trợ?</h5>
                                <p className="mb-3">
                                    Nếu bạn có bất kỳ câu hỏi nào về thanh toán, vui lòng liên hệ với chúng tôi.
                                </p>
                                <div className="support-contact">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="fas fa-phone-alt me-2 text-primary"></i>
                                        <span>Hotline: 1900 1234</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <i className="fas fa-envelope me-2 text-primary"></i>
                                        <span>Email: hotro@ecommerce.com</span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default BankTransfer;

<style jsx>{`
    /* Existing styles */
    
    /* VietQR Styles */
    .vietqr-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        border: 1px solid #e1e1e1;
        border-radius: 8px;
        background-color: #f9f9f9;
    }
    
    .qr-image-container {
        margin: 15px 0;
        padding: 10px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .qr-image {
        max-width: 200px;
        width: 100%;
        height: auto;
    }
    
    .qr-instructions {
        font-size: 14px;
        color: #555;
        text-align: center;
        margin-bottom: 15px;
    }
    
    .bank-logos {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
    }
    
    .bank-logos img {
        height: 25px;
        border-radius: 4px;
    }
`}</style> 