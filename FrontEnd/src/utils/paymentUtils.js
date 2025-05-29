/**
 * Utility functions cho việc quản lý phương thức thanh toán
 */
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../config';

const API_URL = `${BACKEND_URL_HTTP}/api`;

/**
 * Lấy danh sách phương thức thanh toán khả dụng từ API
 * @returns {Promise<Array>} Danh sách phương thức thanh toán đã được bật
 */
export const getAvailablePaymentMethods = async () => {
  try {
    const response = await axios.get(`${API_URL}/payment-settings/available-methods`);
    
    if (response.data && Array.isArray(response.data)) {
      console.log('✅ Loaded payment methods from API:', response.data);
      return response.data;
    } else {
      console.warn('⚠️ API returned empty data');
      return [];
    }
  } catch (error) {
    console.error('❌ API call failed:', error);
    
    // Trả về default methods nếu API fail
    return [
      {
        id: 'cod',
        name: 'Thanh toán khi nhận hàng (COD)',
        description: 'Khách hàng thanh toán cho người giao hàng khi nhận hàng',
        fee: 0,
        icon: 'fa-money-bill'
      },
      {
        id: 'bank_transfer',
        name: 'Chuyển khoản ngân hàng',
        description: 'Chuyển khoản trực tiếp vào tài khoản ngân hàng của cửa hàng',
        fee: 0,
        icon: 'fa-university'
      },
      {
        id: 'vnpay',
        name: 'Thanh toán qua VNPAY',
        description: 'Thanh toán an toàn với VNPAY (ATM/QRCode/Ví điện tử)',
        fee: 0,
        icon: 'fa-credit-card'
      }
    ];
  }
};

/**
 * Lấy cài đặt VNPAY từ API hoặc localStorage
 * @returns {Promise<Object>} Cài đặt VNPAY
 */
export const getVNPaySettings = async () => {
  try {
    // Thử lấy từ API trước
    const response = await axios.get(`${API_URL}/payment-settings/vnpay-config`);
    if (response.data) {
      console.log('Đã tải cài đặt VNPAY từ API:', response.data);
      return response.data;
    }
    
    // Nếu API không trả về dữ liệu, thử lấy từ localStorage
    return getVNPaySettingsFromLocalStorage();
  } catch (error) {
    console.error('Lỗi khi lấy cài đặt VNPAY từ API:', error);
    // Fallback về localStorage nếu API lỗi
    return getVNPaySettingsFromLocalStorage();
  }
};

// Hàm helper để lấy cài đặt VNPAY từ localStorage
const getVNPaySettingsFromLocalStorage = () => {
  try {
    const storedSettings = localStorage.getItem('vnpaySettings');
    
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error('Lỗi khi đọc cài đặt VNPAY từ localStorage:', error);
  }
  
  // Trả về cài đặt mặc định nếu không có trong localStorage
  return {
    vnpTmnCode: 'TX30V45K',
    vnpHashSecret: 'Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN',
    vnpPayUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    vnpReturnUrl: 'http://localhost:3000/payment/vnpay-return',
    vnpApiUrl: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    testMode: true,
    supportedCards: ['visa', 'mastercard'],
    currency: 'VND'
  };
};

/**
 * Lấy cài đặt chuyển khoản ngân hàng từ API hoặc localStorage
 * @returns {Promise<Object>} Cài đặt chuyển khoản
 */
export const getBankTransferSettings = async () => {
  try {
    // Thử lấy từ API trước
    const response = await axios.get(`${API_URL}/payment-settings/bank-transfer-config`);
    if (response.data) {
      console.log('Đã tải cài đặt chuyển khoản từ API:', response.data);
      return response.data;
    }
    
    // Nếu API không trả về dữ liệu, thử lấy từ localStorage
    return getBankTransferSettingsFromLocalStorage();
  } catch (error) {
    console.error('Lỗi khi lấy cài đặt chuyển khoản từ API:', error);
    // Fallback về localStorage nếu API lỗi
    return getBankTransferSettingsFromLocalStorage();
  }
};

// Hàm helper để lấy cài đặt chuyển khoản từ localStorage
const getBankTransferSettingsFromLocalStorage = () => {
  try {
    const storedSettings = localStorage.getItem('bankTransferSettings');
    
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error('Lỗi khi đọc cài đặt chuyển khoản từ localStorage:', error);
  }
  
  // Trả về cài đặt mặc định nếu không có trong localStorage
  return {
    accountName: 'FASHION STORE JSC',
    accountNumber: '1234567890',
    bankName: 'Vietcombank',
    bankBranch: 'Hồ Chí Minh',
    instructions: 'Vui lòng chuyển khoản với nội dung: [Mã đơn hàng]'
  };
};

/**
 * Lấy cài đặt chung về thanh toán từ API hoặc localStorage
 * @returns {Promise<Object>} Cài đặt chung
 */
export const getGeneralPaymentSettings = async () => {
  try {
    // Thử lấy từ API trước
    const response = await axios.get(`${API_URL}/payment-settings/general-config`);
    if (response.data) {
      console.log('Đã tải cài đặt chung từ API:', response.data);
      return response.data;
    }
    
    // Nếu API không trả về dữ liệu, thử lấy từ localStorage
    return getGeneralPaymentSettingsFromLocalStorage();
  } catch (error) {
    console.error('Lỗi khi lấy cài đặt chung từ API:', error);
    // Fallback về localStorage nếu API lỗi
    return getGeneralPaymentSettingsFromLocalStorage();
  }
};

// Hàm helper để lấy cài đặt chung từ localStorage
const getGeneralPaymentSettingsFromLocalStorage = () => {
  try {
    const storedSettings = localStorage.getItem('generalPaymentSettings');
    
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error('Lỗi khi đọc cài đặt chung từ localStorage:', error);
  }
  
  // Trả về cài đặt mặc định nếu không có trong localStorage
  return {
    defaultPaymentMethod: 'vnpay',
    showPaymentIcons: true,
    enablePaymentFees: false,
    orderConfirmationRequired: true,
    pendingOrderTimeout: 24 // hours
  };
}; 