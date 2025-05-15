import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Spinner, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import './Payment.css';

const CreditCardPayment = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [order, setOrder] = useState(null);
    const [provider, setProvider] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Credit card form state
    const [cardData, setCardData] = useState({
        cardNumber: '',
        cardHolder: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        saveCard: false
    });

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // Lấy thông tin đơn hàng
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:8080/api/orders/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrder(response.data);
            } catch (err) {
                setError('Không thể lấy thông tin đơn hàng. Vui lòng thử lại sau.');
                console.error('Error fetching order:', err);
            }
        };

        const fetchPaymentProvider = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/payment-settings/credit-card');
                setProvider(response.data);
            } catch (err) {
                console.error('Error fetching payment provider:', err);
                // Tạo provider mặc định nếu không lấy được từ API
                setProvider({ 
                    enabled: true,
                    providerName: 'Stripe' 
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
        fetchPaymentProvider();
    }, [orderId]);

    // Handle card data input
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCardData({
            ...cardData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Format card number with spaces
    const formatCardNumber = (value) => {
        if (!value) return '';
        return value
            .replace(/\s/g, '')
            .replace(/(.{4})/g, '$1 ')
            .trim();
    };

    // Handle card number change with formatting
    const handleCardNumberChange = (e) => {
        const input = e.target.value.replace(/\D/g, '').substring(0, 16);
        setCardData({
            ...cardData,
            cardNumber: formatCardNumber(input)
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (cardData.cardNumber.replace(/\s/g, '').length < 16) {
            setError('Số thẻ không hợp lệ');
            return;
        }
        
        if (!cardData.cardHolder) {
            setError('Vui lòng nhập tên chủ thẻ');
            return;
        }
        
        if (!cardData.expiryMonth || !cardData.expiryYear) {
            setError('Vui lòng chọn ngày hết hạn');
            return;
        }
        
        if (cardData.cvv.length < 3) {
            setError('Mã CVV không hợp lệ');
            return;
        }

        try {
            setProcessing(true);
            setError('');
            
            // Trong môi trường thực tế, ở đây bạn sẽ gọi đến gateway thanh toán
            // Ví dụ với Stripe hoặc VNPAY
            
            // Demo: Giả lập thanh toán
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const token = localStorage.getItem('token');
            
            // Sau khi thanh toán thành công, cập nhật đơn hàng
            await axios.put(`http://localhost:8080/api/orders/${orderId}/payment-status`, 
                { status: 'PAID', paymentMethod: 'CREDIT_CARD' }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setSuccess('Thanh toán thành công! Đơn hàng của bạn đang được xử lý.');
            
            // Chuyển hướng sau khi thanh toán thành công
            setTimeout(() => {
                navigate(`/order-success/${orderId}`);
            }, 2000);
            
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.response?.data?.message || 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Đang tải thông tin thanh toán...</p>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <Row>
                <Col lg={8} className="mx-auto">
                    <Card>
                        <Card.Header as="h4" className="text-center bg-primary text-white">
                            Thanh toán bằng thẻ tín dụng / thẻ ghi nợ
                        </Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            {order && (
                                <div className="order-summary mb-4">
                                    <h5 className="mb-3">Thông tin đơn hàng #{order.id}</h5>
                                    <Table bordered striped className="mb-4">
                                        <tbody>
                                            <tr>
                                                <td className="fw-bold" width="40%">Tổng tiền thanh toán:</td>
                                                <td className="text-danger fw-bold">{order.totalAmount.toLocaleString('vi-VN')} VNĐ</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">Địa chỉ giao hàng:</td>
                                                <td>{order.shippingAddress}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">Ngày đặt hàng:</td>
                                                <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </div>
                            )}

                            {provider ? (
                                <div className="credit-card-form">
                                    <h5 className="mb-3">Thông tin thẻ thanh toán</h5>
                                    
                                    <div className="text-center mb-4">
                                        <img src="https://cdn.iconscout.com/icon/free/png-256/free-visa-3-226460.png" alt="Visa" className="card-brand-logo mx-2" style={{width: '60px'}} />
                                        <img src="https://cdn.iconscout.com/icon/free/png-256/free-mastercard-3521564-2944982.png" alt="Mastercard" className="card-brand-logo mx-2" style={{width: '60px'}} />
                                    </div>
                                    
                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Số thẻ <span className="text-danger">*</span></Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    type="text"
                                                    name="cardNumber"
                                                    value={cardData.cardNumber}
                                                    onChange={handleCardNumberChange}
                                                    placeholder="1234 5678 9012 3456"
                                                    required
                                                    maxLength={19}
                                                />
                                                <InputGroup.Text>
                                                    <i className="fa fa-credit-card"></i>
                                                </InputGroup.Text>
                                            </InputGroup>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Tên chủ thẻ <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="cardHolder"
                                                value={cardData.cardHolder}
                                                onChange={handleInputChange}
                                                placeholder="NGUYEN VAN A"
                                                required
                                            />
                                        </Form.Group>

                                        <Row>
                                            <Col sm={8}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Ngày hết hạn <span className="text-danger">*</span></Form.Label>
                                                    <Row>
                                                        <Col>
                                                            <Form.Select
                                                                name="expiryMonth"
                                                                value={cardData.expiryMonth}
                                                                onChange={handleInputChange}
                                                                required
                                                            >
                                                                <option value="">Tháng</option>
                                                                {months.map(month => (
                                                                    <option key={month} value={month}>
                                                                        {month.toString().padStart(2, '0')}
                                                                    </option>
                                                                ))}
                                                            </Form.Select>
                                                        </Col>
                                                        <Col>
                                                            <Form.Select
                                                                name="expiryYear"
                                                                value={cardData.expiryYear}
                                                                onChange={handleInputChange}
                                                                required
                                                            >
                                                                <option value="">Năm</option>
                                                                {years.map(year => (
                                                                    <option key={year} value={year}>
                                                                        {year}
                                                                    </option>
                                                                ))}
                                                            </Form.Select>
                                                        </Col>
                                                    </Row>
                                                </Form.Group>
                                            </Col>
                                            <Col sm={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Mã CVV <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="cvv"
                                                        value={cardData.cvv}
                                                        onChange={(e) => {
                                                            const input = e.target.value.replace(/\D/g, '').substring(0, 4);
                                                            setCardData({...cardData, cvv: input});
                                                        }}
                                                        placeholder="123"
                                                        required
                                                        maxLength={4}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Form.Group className="mb-4">
                                            <Form.Check
                                                type="checkbox"
                                                name="saveCard"
                                                label="Lưu thông tin thẻ cho lần sau"
                                                checked={cardData.saveCard}
                                                onChange={handleInputChange}
                                            />
                                        </Form.Group>
                                        
                                        <Alert variant="info" className="mb-4">
                                            <i className="fa fa-lock me-2"></i>
                                            Thông tin thẻ của bạn được bảo mật theo tiêu chuẩn PCI DSS. Chúng tôi không lưu trữ thông tin thẻ trên máy chủ.
                                        </Alert>

                                        <div className="d-grid gap-2">
                                            <Button 
                                                variant="primary" 
                                                type="submit" 
                                                size="lg"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <Spinner
                                                            as="span"
                                                            animation="border"
                                                            size="sm"
                                                            role="status"
                                                            aria-hidden="true"
                                                            className="me-2"
                                                        />
                                                        Đang xử lý thanh toán...
                                                    </>
                                                ) : (
                                                    <>Thanh toán {order?.totalAmount.toLocaleString('vi-VN')} VNĐ</>
                                                )}
                                            </Button>
                                            <Button 
                                                variant="outline-secondary" 
                                                onClick={() => navigate(-1)}
                                                disabled={processing}
                                            >
                                                Quay lại
                                            </Button>
                                        </div>
                                    </Form>
                                </div>
                            ) : (
                                <Alert variant="warning">
                                    <h5>Thanh toán qua thẻ tín dụng/thẻ ghi nợ hiện không khả dụng</h5>
                                    <p className="mb-0">Vui lòng chọn phương thức thanh toán khác hoặc liên hệ với chúng tôi để được hỗ trợ.</p>
                                    <div className="d-grid gap-2 mt-3">
                                        <Button 
                                            variant="primary" 
                                            onClick={() => navigate(-1)}
                                        >
                                            Quay lại chọn phương thức thanh toán
                                        </Button>
                                    </div>
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CreditCardPayment; 