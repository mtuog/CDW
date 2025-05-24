import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../config';
import './Payment.css';
import { sendConfirmOrderEmail, getOrderById } from '../../../api/orderApi';

const OrderSuccess = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${BACKEND_URL_HTTP}/api/orders/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrder(response.data);
                setError(null);
            } catch (err) {
                setError('Không thể lấy thông tin đơn hàng. Vui lòng thử lại sau.');
                console.error('Error fetching order:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    useEffect(() => {
        // Send thank you email when order details are loaded
        if (order && !emailSent) {
            const sendEmail = async () => {
                try {
                    await sendConfirmOrderEmail(orderId);
                    setEmailSent(true);
                    console.log('Order confirmation email sent successfully');
                } catch (err) {
                    console.error('Error sending order confirmation email:', err);
                }
            };
            
            sendEmail();
        }
    }, [order, orderId, emailSent]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <div className="spinner-container">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Đang tải thông tin đơn hàng...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Card className="text-center border-0 shadow-sm">
                    <Card.Body className="p-5">
                        <div className="mb-4">
                            <i className="fas fa-exclamation-circle text-danger" style={{ fontSize: '48px' }}></i>
                        </div>
                        <h3>Có lỗi xảy ra</h3>
                        <p className="text-muted">{error}</p>
                        <Button 
                            variant="primary" 
                            onClick={() => navigate('/')}
                            className="mt-3"
                        >
                            Quay về trang chủ
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="p-5 text-center">
                            <div className="success-icon">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h2 className="mb-4">Đặt hàng thành công!</h2>
                            <p className="lead mb-4">
                                Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận.
                            </p>
                            
                            {order && (
                                <div className="order-details text-start mb-4">
                                    <div className="order-info-card p-4 mb-4 bg-light rounded">
                                        <h5 className="mb-3">Thông tin đơn hàng</h5>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Mã đơn hàng:</span>
                                            <span className="fw-bold">{order.orderCode || `#${orderId}`}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Ngày đặt hàng:</span>
                                            <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'N/A'}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Trạng thái:</span>
                                            <span className="badge bg-warning text-dark">Chờ xác nhận</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Phương thức thanh toán:</span>
                                            <span>{order.paymentMethod === 'Bank Transfer' ? 'Chuyển khoản ngân hàng' : 
                                                  order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 
                                                  'Thanh toán online'}</span>
                                        </div>
                                        <div className="d-flex justify-content-between border-top pt-2">
                                            <span className="fw-bold">Tổng tiền:</span>
                                            <span className="fw-bold text-danger" style={{ fontSize: '1rem' }}>
                                                {new Intl.NumberFormat('vi-VN', { 
                                                    style: 'currency', 
                                                    currency: 'VND' 
                                                }).format(order.totalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="shipping-info p-4 bg-light rounded">
                                        <h5 className="mb-3">Thông tin giao hàng</h5>
                                        <p className="mb-2"><strong>Địa chỉ:</strong> {order.shippingAddress}</p>
                                        <p className="mb-0"><strong>Số điện thoại:</strong> {order.phone}</p>
                                    </div>
                                </div>
                            )}
                            
                            <p className="text-muted mb-4">
                                Chúng tôi sẽ gửi email xác nhận đơn hàng và thông báo khi đơn hàng được giao.
                            </p>
                            
                            <div className="d-flex justify-content-center gap-3">
                                <Button 
                                    variant="primary" 
                                    onClick={() => navigate('/account?tab=orders')}
                                    className="px-4"
                                >
                                    Theo dõi đơn hàng
                                </Button>
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={() => navigate('/product')}
                                    className="px-4"
                                >
                                    Tiếp tục mua sắm
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default OrderSuccess; 