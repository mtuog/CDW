import React, {useEffect, useState} from 'react';
import Select from 'react-select';
import { updateCart, clearCart } from '../../../store/Actions';
import {useDispatch, useSelector} from "react-redux";
import {Link, useNavigate} from "react-router-dom";
import { getProductById } from '../../../api/productApi';
import discountCodeApi from '../../../api/discountCodeApi';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../config';
import Swal from 'sweetalert2';
import { getAvailablePaymentMethods, getVNPaySettings, getBankTransferSettings, getGeneralPaymentSettings } from '../../../utils/paymentUtils';
import { calculateOrderTotal, formatCurrency, validatePaymentData } from '../../../utils/paymentUtils';

export async function loadcart() {
    const cart = JSON.parse(localStorage.getItem('cart')) ?? [];
    return cart;
}

const Payment = () => {
    const cartItems = useSelector(state => state.cart);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [productDetails, setProductDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [discountCode, setDiscountCode] = useState(localStorage.getItem('discountCode') || '');
    const [discountAmount, setDiscountAmount] = useState(
        localStorage.getItem('discountAmount') ? parseInt(localStorage.getItem('discountAmount')) : 0
    );
    const [processing, setProcessing] = useState(false);

    // Customer information
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        paymentMethod: ''
    });

    // Payment methods from API
    const [paymentMethods, setPaymentMethods] = useState([]);

    // Phí vận chuyển cố định
    const shippingFee = 30000;

    // Fetch payment methods
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                // Thử đọc từ API và localStorage (sử dụng utility mới)
                const methods = await getAvailablePaymentMethods();
                
                if (methods && methods.length > 0) {
                    setPaymentMethods(methods);
                    console.log('Đã tải phương thức thanh toán:', methods);
                    
                    // Lấy phương thức mặc định từ cài đặt
                    const generalSettings = await getGeneralPaymentSettings();
                    const defaultMethod = generalSettings.defaultPaymentMethod;
                    
                    // Set default payment method if available
                    if (methods.find(m => m.id === defaultMethod)) {
                        setFormData(prev => ({
                            ...prev,
                            paymentMethod: defaultMethod
                        }));
                    } else if (methods.length > 0) {
                        setFormData(prev => ({
                            ...prev,
                            paymentMethod: methods[0].id
                        }));
                    }
                    return;
                }
                
                // Fallback nếu không có phương thức thanh toán
                const defaultMethods = [
                    { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', enabled: true, icon: 'fa-money-bill-wave', description: 'Thanh toán bằng tiền mặt khi nhận hàng' },
                    { id: 'bank_transfer', name: 'Chuyển khoản ngân hàng', enabled: true, icon: 'fa-university', description: 'Chuyển khoản trực tiếp đến tài khoản ngân hàng của chúng tôi' },
                    { id: 'vnpay', name: 'Thanh toán qua VNPAY', enabled: true, icon: 'fa-wallet', description: 'Thanh toán qua VNPay - Hỗ trợ nhiều ngân hàng và ví điện tử' }
                ];
                
                setPaymentMethods(defaultMethods);
                setFormData(prev => ({
                    ...prev,
                    paymentMethod: 'cod'
                }));
            } catch (error) {
                console.error("Error fetching payment methods:", error);
                // Fallback to default payment methods if API fails
                const defaultMethods = [
                    { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', enabled: true, icon: 'fa-money-bill-wave', description: 'Thanh toán bằng tiền mặt khi nhận hàng' },
                    { id: 'bank_transfer', name: 'Chuyển khoản ngân hàng', enabled: true, icon: 'fa-university', description: 'Chuyển khoản trực tiếp đến tài khoản ngân hàng của chúng tôi' },
                    { id: 'vnpay', name: 'Thanh toán qua VNPAY', enabled: true, icon: 'fa-wallet', description: 'Thanh toán qua VNPay - Hỗ trợ nhiều ngân hàng và ví điện tử' }
                ];
                
                setPaymentMethods(defaultMethods);
                
                setFormData(prev => ({
                    ...prev,
                    paymentMethod: 'cod'
                }));
            }
        };
        
        fetchPaymentMethods();
    }, []);

    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                setLoading(true);
                const detailsPromises = cartItems.map(item => 
                    getProductById(item.id).then(product => ({
                        id: item.id,
                        name: product.name,
                        img: product.img,
                        price: product.price
                    }))
                );
                
                const details = await Promise.all(detailsPromises);
                const detailsObject = details.reduce((acc, product) => {
                    acc[product.id] = product;
                    return acc;
                }, {});
                
                setProductDetails(detailsObject);
                setLoading(false);
            } catch (error) {
                setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
                setLoading(false);
                console.error("Error fetching product details:", error);
            }
        };

        if (cartItems.length > 0) {
            fetchProductDetails();
        } else {
            setLoading(false);
        }
    }, [cartItems]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handlePaymentMethodChange = (e) => {
        setFormData({
            ...formData,
            paymentMethod: e.target.value
        });
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => {
            const product = productDetails[item.id];
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    };

    // Calculate total with discount
    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        return subtotal + shippingFee - discountAmount;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.city) {
            Swal.fire({
                title: 'Thiếu thông tin',
                text: 'Vui lòng điền đầy đủ thông tin thanh toán',
                icon: 'warning',
                confirmButtonColor: '#e65540'
            });
            return;
        }

        try {
            setLoading(true);
            
            // Lấy thông tin người dùng từ localStorage
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken') || '';
            
            console.log('User ID:', userId);
            console.log('Auth token:', token ? token.substring(0, 15) + '...' : 'No token');
            
            // Chuẩn bị thông tin đơn hàng
            const orderItems = cartItems.map(item => {
                const product = productDetails[item.id];
                return {
                    product: { id: item.id },
                    quantity: item.quantity,
                    price: product.price,
                    size: item.size || "Standard",
                    color: item.color || "Default"
                };
            });
            
            const subtotal = calculateSubtotal();
            const totalAmount = calculateTotal();
            
            // Tạo đối tượng đơn hàng
            const orderData = {
                user: userId ? { id: userId } : null,
                totalAmount: totalAmount,
                subtotalAmount: subtotal,
                status: "PENDING",
                shippingAddress: `${formData.address}, ${formData.city}${formData.zipCode ? ', ' + formData.zipCode : ''}`,
                phone: formData.phone,
                paymentMethod: formData.paymentMethod,
                orderItems: orderItems
            };
            
            // Add discount code information if available
            if (discountCode) {
                orderData.discountCodeValue = discountCode;
                // Attempt to get the discount code ID if a user is logged in
                try {
                    const discountCodeDetails = await discountCodeApi.getDiscountCodeByCode(discountCode);
                    if (discountCodeDetails && discountCodeDetails.id) {
                        orderData.discountCodeId = discountCodeDetails.id;
                    }
                } catch (error) {
                    console.error('Error fetching discount code details:', error);
                    // Continue without the discount code ID
                }
            }
            
            console.log('Sending order data:', orderData);
            
            // Gửi đơn hàng đến API
            const response = await axios.post(`${BACKEND_URL_HTTP}/api/orders`, orderData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            console.log('Order created:', response.data);
            
            if (response.status === 201) {
                // Clear cart after successful order
                dispatch(clearCart());
                
                // Điều hướng dựa trên phương thức thanh toán
                if (formData.paymentMethod === 'bank_transfer') {
                    navigate(`/bank-transfer/${response.data.id}`);
                    return;
                }
                
                if (formData.paymentMethod === 'vnpay') {
                    setProcessing(true);
                    try {
                        console.log("Đang thực hiện thanh toán VNPAY cho đơn hàng #" + response.data.id);
                        
                        // Định dạng số tiền đúng cách (chỉ số, không dấu phẩy/chấm)
                        const formattedAmount = Math.round(totalAmount).toString().replace(/[,.]/g, '');
                        console.log("Số tiền định dạng:", formattedAmount);
                        
                        // Lấy cài đặt VNPAY từ API/localStorage
                        const vnpaySettings = await getVNPaySettings();
                        console.log("Sử dụng cài đặt VNPAY:", vnpaySettings);
                        
                        // Kiểm tra xem có returnUrl không
                        if (!vnpaySettings.vnpReturnUrl) {
                            console.warn("Không tìm thấy vnpReturnUrl trong cài đặt, sử dụng giá trị mặc định");
                        }
                        
                        // Đơn giản hóa dữ liệu thanh toán (chỉ giữ các trường bắt buộc)
                        const vnpayData = {
                            orderId: response.data.id.toString(),
                            orderInfo: `Thanh toan don hang #${response.data.id}`,
                            amount: formattedAmount,
                            locale: 'vn',
                            // Thêm các tham số từ cài đặt lưu trong localStorage
                            returnUrl: vnpaySettings.vnpReturnUrl || 'http://localhost:3000/payment/vnpay-return'
                        };
                        
                        // Gọi API tạo URL thanh toán VNPAY với phương thức POST
                        const vnpayResponse = await axios({
                            method: 'post',
                            url: `${BACKEND_URL_HTTP}/api/vnpay/create-payment`,
                            data: vnpayData,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token ? `Bearer ${token}` : ''
                            },
                            timeout: 30000 // 30 giây timeout
                        });
                        
                        console.log("Kết quả từ API VNPAY:", vnpayResponse.data);
                        
                        if (vnpayResponse.data.code === '00') {
                            console.log("Chuyển hướng đến URL thanh toán VNPAY:", vnpayResponse.data.paymentUrl);
                            // Chuyển hướng đến trang thanh toán của VNPAY
                            window.location.href = vnpayResponse.data.paymentUrl;
                            return;
                        } else {
                            throw new Error(vnpayResponse.data.message || 'Không thể tạo giao dịch thanh toán VNPAY');
                        }
                    } catch (vnpayError) {
                        console.error('VNPAY payment error:', vnpayError);
                        
                        let errorMessage = 'Đã xảy ra lỗi khi xử lý thanh toán VNPAY';
                        
                        if (vnpayError.response) {
                            if (vnpayError.response.status === 500) {
                                errorMessage = 'Lỗi máy chủ khi xử lý thanh toán. Vui lòng thử lại sau.';
                            } else if (vnpayError.response.status === 405) {
                                errorMessage = 'Lỗi phương thức HTTP không được hỗ trợ. Vui lòng liên hệ quản trị viên.';
                            } else {
                                errorMessage = vnpayError.response.data?.message || vnpayError.message || errorMessage;
                            }
                        } else if (vnpayError.request) {
                            errorMessage = 'Không thể kết nối đến máy chủ thanh toán. Vui lòng kiểm tra kết nối mạng.';
                        }
                        
                        Swal.fire({
                            title: 'Lỗi thanh toán VNPAY',
                            text: errorMessage,
                            icon: 'error',
                            confirmButtonColor: '#e65540'
                        });
                        return;
                    }
                }
                
                // After successful order, record the discount code usage if applicable
                if (response.status === 201 && discountCode) {
                    try {
                        await discountCodeApi.applyDiscountCode(
                            discountCode, 
                            localStorage.getItem('userId')
                        );
                        console.log('Discount code usage recorded');
                    } catch (error) {
                        console.error('Error recording discount code usage:', error);
                        // Continue with the order process even if this fails
                    }
                    
                    // Clear discount code from localStorage
                    localStorage.removeItem('discountCode');
                    localStorage.removeItem('discountAmount');
                }
                
                // Điều hướng đến trang xác nhận đơn hàng
                navigate(`/order-success/${response.data.id}`);
            } else {
                throw new Error('Lỗi khi tạo đơn hàng');
            }
            
        } catch (error) {
            console.error('Order submission error:', error);
            
            Swal.fire({
                title: 'Lỗi đặt hàng',
                text: error.response?.data?.message || 'Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng thử lại sau.',
                icon: 'error',
                confirmButtonColor: '#e65540'
            });
        } finally {
            setLoading(false);
        }
    };

    // Show loading state
    if (loading) {
        return <div className="container text-center p-t-80 p-b-80">Loading payment information...</div>;
    }

    // Show error state
    if (error) {
        return <div className="container text-center p-t-80 p-b-80">{error}</div>;
    }

    // Redirect to products page if cart is empty
    if (cartItems.length === 0) {
        return (
            <div className="container text-center p-t-80 p-b-80">
                <h2>Giỏ hàng của bạn đang trống</h2>
                <p className="p-t-20">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
                <button 
                    className="flex-c-m stext-101 cl0 size-116 bg3 bor14 hov-btn3 p-lr-15 trans-04 pointer m-t-20"
                    onClick={() => navigate('/product')}
                >
                    Đến trang sản phẩm
                </button>
                                </div>
        );
    }

    return (
        <div className="container p-t-100 p-b-85">
            <div className="bread-crumb flex-w p-l-25 p-r-15 p-t-30 p-lr-0-lg">
                <a href="/" className="stext-109 cl8 hov-cl1 trans-04">
                    Trang Chủ
                    <i className="fa fa-angle-right m-l-9 m-r-10" aria-hidden="true"></i>
                </a>
                <a href="/cart" className="stext-109 cl8 hov-cl1 trans-04">
                    Giỏ Hàng
                    <i className="fa fa-angle-right m-l-9 m-r-10" aria-hidden="true"></i>
                </a>
                <span className="stext-109 cl4">
                    Thanh Toán
							</span>
                                </div>

            <div className="row p-t-30">
                <div className="col-md-7 p-b-30">
                    <div className="payment-form p-lr-40 p-t-30 p-b-40 m-l-0-xl p-lr-15-sm">
                        <h4 className="mtext-109 cl2 p-b-30">
                            Thông Tin Thanh Toán
                        </h4>
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-md-6 p-b-20">
                                    <label className="stext-102 cl3 m-b-5">Họ *</label>
                                    <input 
                                        className="stext-111 cl8 plh3 size-111 p-lr-15 bor8" 
                                        type="text" 
                                        name="lastName" 
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6 p-b-20">
                                    <label className="stext-102 cl3 m-b-5">Tên *</label>
                                    <input 
                                        className="stext-111 cl8 plh3 size-111 p-lr-15 bor8" 
                                        type="text" 
                                        name="firstName" 
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="p-b-20">
                                <label className="stext-102 cl3 m-b-5">Email *</label>
                                <input 
                                    className="stext-111 cl8 plh3 size-111 p-lr-15 bor8" 
                                    type="email" 
                                    name="email" 
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="p-b-20">
                                <label className="stext-102 cl3 m-b-5">Số điện thoại *</label>
                                <input 
                                    className="stext-111 cl8 plh3 size-111 p-lr-15 bor8" 
                                    type="tel" 
                                    name="phone" 
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
            </div>

                            <div className="p-b-20">
                                <label className="stext-102 cl3 m-b-5">Địa chỉ *</label>
                                <input 
                                    className="stext-111 cl8 plh3 size-111 p-lr-15 bor8" 
                                    type="text" 
                                    name="address" 
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                />
            </div>

                            <div className="row">
                                <div className="col-md-6 p-b-20">
                                    <label className="stext-102 cl3 m-b-5">Thành phố / Tỉnh *</label>
                                    <input 
                                        className="stext-111 cl8 plh3 size-111 p-lr-15 bor8" 
                                        type="text" 
                                        name="city" 
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6 p-b-20">
                                    <label className="stext-102 cl3 m-b-5">Mã bưu điện / ZIP</label>
                                    <input 
                                        className="stext-111 cl8 plh3 size-111 p-lr-15 bor8" 
                                               type="text"
                                        name="zipCode" 
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                    />
                            </div>
                        </div>

                            <div className="p-t-20">
                                <h4 className="mtext-109 cl2 p-b-15">
                                    Phương Thức Thanh Toán
                                </h4>
                                <div className="payment-methods-container">
                                    {paymentMethods.map(method => (
                                        <div 
                                            className={`payment-method-card ${formData.paymentMethod === method.id ? 'active' : ''}`} 
                                            key={method.id}
                                            onClick={() => setFormData({...formData, paymentMethod: method.id})}
                                        >
                                            <input 
                                                type="radio" 
                                                id={`payment-${method.id}`}
                                                name="paymentMethod" 
                                                value={method.id} 
                                                checked={formData.paymentMethod === method.id}
                                                onChange={handlePaymentMethodChange}
                                                className="payment-radio"
                                            />
                                            <label htmlFor={`payment-${method.id}`} className="payment-method-label">
                                                <div className="payment-method-icon">
                                                    <i className={`fas ${method.icon}`}></i>
                                                </div>
                                                <div className="payment-method-info">
                                                    <div className="payment-method-name">{method.name}</div>
                                                    <div className="payment-method-description">{method.description}</div>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                    </div>

                            <div className="p-t-30">
                                <button 
                                    type="submit" 
                                    className="flex-c-m stext-101 cl0 size-116 bg3 bor14 hov-btn3 p-lr-15 trans-04 pointer"
                                    disabled={processing}
                                >
                                    {processing ? 'Đang xử lý...' : 'Đặt Hàng'}
                                </button>
                            </div>
                        </form>
                                    </div>
                                </div>

                <div className="col-md-5 p-b-30">
                    <div className="order-summary bor10 p-lr-40 p-t-30 p-b-40 m-l-0 m-r-0 m-lr-0-xl p-lr-15-sm">
                        <h4 className="mtext-109 cl2 p-b-30">
                            Đơn Hàng Của Bạn
                        </h4>

                        <div className="order-products">
                            {cartItems.map(item => {
                                const product = productDetails[item.id];
                                if (!product) return null;
                                
                                return (
                                    <div className="flex-w flex-t p-b-13" key={item.id}>
                                        <div className="size-208">
                                            <img src={product.img} alt={product.name} className="order-product-img" />
                                            </div>
                                        <div className="size-209">
                                            <div className="product-details">
                                                <div className="product-name">{product.name}</div>
                                                <div className="product-variants">
                                                    {item.size && <span className="product-size">Size: {item.size}</span>}
                                                    {item.color && <span className="product-color">Màu: {item.color}</span>}
                                                </div>
                                                <div className="product-quantity">x{item.quantity}</div>
                                                <div className="product-price">{(product.price * item.quantity).toLocaleString()} VND</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                                </div>

                        <div className="flex-w flex-t p-t-27 p-b-33">
                            <div className="size-208">
                                <span className="mtext-101 cl2">
                                    Tổng:
								</span>
                                    </div>
                            <div className="size-209 p-t-1">
                                <span className="mtext-110 cl2">
                                    {calculateTotal().toLocaleString()} VND
								</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
