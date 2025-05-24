import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Tabs, Tab, Badge, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { getPaymentSettings, updatePaymentSettings } from '../../../api/settingApi';
import authApi from '../../../api/authApi';

const PaymentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [uploadingQR, setUploadingQR] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankBranch: '',
    swiftCode: '',
    qrCodeUrl: '',
    isActive: true
  });
  const [qrPreview, setQrPreview] = useState(null);
  
  // State for bank payments management
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsFilter, setPaymentsFilter] = useState('PENDING');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verificationNote, setVerificationNote] = useState('');
  
  // State for payment methods
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 'cod',
      name: 'Thanh toán khi nhận hàng (COD)',
      enabled: true,
      description: 'Khách hàng thanh toán cho người giao hàng khi nhận hàng',
      fee: 0,
      icon: 'fa-money-bill',
      position: 1
    },
    {
      id: 'bank_transfer',
      name: 'Chuyển khoản ngân hàng',
      enabled: true,
      description: 'Chuyển khoản trực tiếp vào tài khoản ngân hàng của cửa hàng',
      fee: 0,
      icon: 'fa-university',
      position: 2
    },
    {
      id: 'vnpay',
      name: 'Thanh toán qua VNPAY',
      enabled: true,
      description: 'Thanh toán an toàn với VNPAY (ATM/QRCode/Ví điện tử)',
      fee: 0,
      icon: 'fa-credit-card',
      position: 3
    }
  ]);

  // State for bank details
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    bankBranch: '',
    instructions: ''
  });

  // State for credit card settings
  const [creditCardSettings, setCreditCardSettings] = useState({
    providerName: 'VNPAY',
    publicKey: '',
    secretKey: '',
    testMode: true,
    supportedCards: ['visa', 'mastercard'],
    currency: 'VND',
    autoCapture: true,
    vnpTmnCode: '',
    vnpHashSecret: '',
    vnpPayUrl: '',
    vnpReturnUrl: '',
    vnpApiUrl: '',
    vnpProduction: false
  });

  // State for general payment settings
  const [generalSettings, setGeneralSettings] = useState({
    defaultPaymentMethod: 'vnpay',
    showPaymentIcons: true,
    enablePaymentFees: false,
    orderConfirmationRequired: true,
    pendingOrderTimeout: 24 // hours
  });

  // Thêm state cho danh sách mã ngân hàng
  const [bankCodes, setBankCodes] = useState({});
  const [loadingBankCodes, setLoadingBankCodes] = useState(false);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Gọi API để lấy cài đặt thanh toán
        try {
          // Check for admin authentication
          const token = authApi.getToken();
          
          if (!token) {
            console.warn('Chưa đăng nhập với tài khoản admin, không thể lấy cài đặt thanh toán');
            loadMockData();
            return;
          }
          
          const response = await axios.get('http://localhost:8080/api/payment-settings', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const settings = response.data;
          console.log('Đã tải cài đặt thanh toán từ API:', settings);
          
          // Cập nhật state từ dữ liệu API
          if (settings.paymentMethods) {
            setPaymentMethods(settings.paymentMethods);
          }
          
          // Cập nhật cài đặt chung
          setGeneralSettings({
            defaultPaymentMethod: settings.defaultPaymentMethod || 'vnpay',
            showPaymentIcons: settings.showPaymentIcons,
            enablePaymentFees: settings.enablePaymentFees,
            orderConfirmationRequired: settings.orderConfirmationRequired,
            pendingOrderTimeout: settings.pendingOrderTimeout || 24
          });
          
          // Cập nhật cài đặt thẻ tín dụng
          const supportedCards = settings.supportedCards || ['visa', 'mastercard'];
          
          setCreditCardSettings({
            providerName: settings.creditCardProvider || 'VNPAY',
            publicKey: settings.publicKey || '',
            secretKey: settings.secretKey || '',
            testMode: settings.testMode,
            supportedCards: supportedCards,
            currency: settings.currency || 'VND',
            autoCapture: settings.autoCapture,
            vnpTmnCode: settings.vnpTmnCode || '',
            vnpHashSecret: settings.vnpHashSecret || '',
            vnpPayUrl: settings.vnpPayUrl || '',
            vnpReturnUrl: settings.vnpReturnUrl || '',
            vnpApiUrl: settings.vnpApiUrl || '',
            vnpProduction: settings.vnpProduction || false
          });
          
          // Xử lý additionalConfig nếu có
          if (settings.additionalConfig) {
            try {
              const additionalConfig = JSON.parse(settings.additionalConfig);
              
              // Cập nhật state với cấu hình bổ sung theo nhà cung cấp
              if (settings.creditCardProvider === 'VNPAY' && additionalConfig.vnpayEndpoint) {
                setCreditCardSettings(prev => ({
                  ...prev,
                  vnpayEndpoint: additionalConfig.vnpayEndpoint
                }));
              }
              
              if (settings.creditCardProvider === 'PayPal' && additionalConfig.paypalMode) {
                setCreditCardSettings(prev => ({
                  ...prev,
                  paypalMode: additionalConfig.paypalMode
                }));
              }
              
              if (settings.creditCardProvider === 'Stripe' && additionalConfig.stripeWebhookSecret) {
                setCreditCardSettings(prev => ({
                  ...prev,
                  stripeWebhookSecret: additionalConfig.stripeWebhookSecret
                }));
              }
            } catch (e) {
              console.error('Lỗi phân tích additionalConfig:', e);
            }
          }
          
          // Cập nhật cài đặt bank transfer
          setBankDetails({
            accountName: settings.bankName || 'FASHION STORE JSC',
            accountNumber: settings.accountNumber || '1234567890',
            bankName: settings.bankName || 'Vietcombank',
            bankBranch: settings.bankBranch || 'Hồ Chí Minh',
            instructions: settings.bankTransferInstructions || 'Vui lòng chuyển khoản với nội dung: [Mã đơn hàng]'
          });
          
          setLoading(false);
        } catch (apiError) {
          console.error('Lỗi khi tải cài đặt từ API:', apiError);
          // Tải dữ liệu mẫu nếu API đều lỗi
          loadMockData();
        }
      } catch (error) {
        console.error('Lỗi khi tải cài đặt thanh toán:', error);
        
        // Tải dữ liệu mẫu nếu có lỗi
        loadMockData();
      } finally {
        // Load the payments data after settings are loaded
        fetchPayments();
      }
    };
    
    // Hàm tải dữ liệu mẫu
    const loadMockData = () => {
      // Mock data for bank details
      setBankDetails({
        accountName: 'FASHION STORE JSC',
        accountNumber: '1234567890',
        bankName: 'Vietcombank',
        bankBranch: 'Hồ Chí Minh',
        instructions: 'Vui lòng chuyển khoản với nội dung: [Mã đơn hàng]'
      });

      // Mock data for credit card settings
      setCreditCardSettings({
        providerName: 'VNPAY',
        publicKey: '',
        secretKey: '',
        testMode: true,
        supportedCards: ['visa', 'mastercard'],
        currency: 'VND',
        autoCapture: true,
        vnpTmnCode: '',
        vnpHashSecret: '',
        vnpPayUrl: '',
        vnpReturnUrl: '',
        vnpApiUrl: '',
        vnpProduction: false
      });

      // Fetch actual bank accounts from API
      fetchBankAccounts();
      setLoading(false);
    };

    fetchData();
    fetchBankAccounts();
    fetchBankCodes();
  }, []);

  // Add a separate useEffect to fetch payments when paymentsFilter changes
  useEffect(() => {
      fetchPayments();
  }, [paymentsFilter]);

  const fetchBankAccounts = async () => {
    try {
      // DEV MODE: Skip token in development
      const response = await axios.get('http://localhost:8080/api/bank-payments/accounts');
      setBankAccounts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Không thể tải danh sách tài khoản ngân hàng');
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      
      console.log(`Đang tải danh sách thanh toán với trạng thái: ${paymentsFilter}`);
      console.log(`API endpoint: http://localhost:8080/api/bank-payments/status/${paymentsFilter}`);
      
      // DEV MODE: Skip token in development
      const response = await axios.get(`http://localhost:8080/api/bank-payments/status/${paymentsFilter}`);
      
      console.log('Danh sách thanh toán:', response.data);
      setPayments(Array.isArray(response.data) ? response.data : []);
      
      if (response.data.length === 0) {
        console.log(`Không có thanh toán nào với trạng thái: ${paymentsFilter}`);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      toast.error(`Không thể tải danh sách thanh toán: ${error.response?.data?.error || error.message}`);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handlePaymentMethodToggle = (id) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === id ? { ...method, enabled: !method.enabled } : method
      )
    );
  };

  const handleMethodReorder = (id, direction) => {
    setPaymentMethods(prev => {
      const methods = [...prev];
      const index = methods.findIndex(m => m.id === id);
      
      if (index === -1) return prev;
      
      // Calculate new position
      const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(methods.length - 1, index + 1);
      
      // No change if already at extremes
      if (newIndex === index) return prev;
      
      // Swap positions
      const temp = methods[index];
      methods[index] = methods[newIndex];
      methods[newIndex] = temp;
      
      // Update position values
      return methods.map((method, idx) => ({
        ...method,
        position: idx + 1
      }));
    });
  };

  const handleInputChange = (e, setter) => {
    const { name, value, type, checked } = e.target;
    setter(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMethodInputChange = (e, id) => {
    const { name, value, type, checked } = e.target;
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === id 
          ? { ...method, [name]: type === 'checkbox' ? checked : value } 
          : method
      )
    );
  };

  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploadingQR(true);
        
        // Display preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setQrPreview(e.target.result);
        };
        reader.readAsDataURL(file);
        
        console.log("Đang tải lên ảnh QR:", file.name, "loại:", file.type, "kích thước:", file.size);
        
        // Upload to server
        const formData = new FormData();
        formData.append('file', file);
        
        // DEV MODE: Skip token validation for development
        
        console.log("Đang gửi request đến API để upload QR");
        
        const response = await axios.post(
          'http://localhost:8080/api/files/upload/qr-code',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        console.log("Kết quả từ server:", response.data);
        
        if (response.data && response.data.success) {
          const cloudinaryUrl = response.data.fileDownloadUri;
          console.log("URL Cloudinary nhận được:", cloudinaryUrl);
          
          setNewAccount(prev => ({
            ...prev,
            qrCodeUrl: cloudinaryUrl
          }));
          
          toast.success('Tải lên mã QR thành công');
        } else {
          console.error("Response không thành công:", response.data);
          toast.error(response.data.message || 'Không thể tải lên mã QR');
        }
      } catch (error) {
        console.error('Error uploading QR code:', error);
        console.error('Response error:', error.response?.data);
        toast.error(`Không thể tải lên mã QR: ${error.response?.data?.message || error.message}`);
      } finally {
        setUploadingQR(false);
      }
    }
  };

  const handleCreateAccount = async () => {
    try {
      if (!newAccount.bankName || !newAccount.accountNumber || !newAccount.accountName) {
        toast.error('Vui lòng điền đầy đủ thông tin ngân hàng, số tài khoản và tên chủ tài khoản');
        return;
      }

      // DEV MODE: Skip token validation for development

      console.log("Đang gửi dữ liệu tài khoản:", newAccount);

      // Nếu đây là cập nhật tài khoản hiện có
      if (selectedAccount) {
        await handleUpdateAccount();
        return;
      }

      // Tạo tài khoản mới
      const response = await axios.post(
        'http://localhost:8080/api/bank-payments/accounts',
        newAccount
      );

      console.log("Kết quả tạo tài khoản:", response.data);
      toast.success('Tạo tài khoản ngân hàng thành công');
      setShowAccountForm(false);
      setNewAccount({
        bankName: '',
        accountNumber: '',
        accountName: '',
        bankBranch: '',
        swiftCode: '',
        qrCodeUrl: '',
        isActive: true
      });
      setQrPreview(null);
      fetchBankAccounts();
    } catch (error) {
      console.error('Error creating bank account:', error);
      console.error('Response error:', error.response?.data);
      toast.error(`Không thể tạo tài khoản ngân hàng: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateAccount = async () => {
    try {
      if (!selectedAccount || !selectedAccount.id) {
        toast.error('Không tìm thấy thông tin tài khoản cần cập nhật');
        return;
      }

      // DEV MODE: Skip token validation for development

      console.log("Đang cập nhật tài khoản:", newAccount);

      const response = await axios.put(
        `http://localhost:8080/api/bank-payments/accounts/${selectedAccount.id}`,
        newAccount
      );

      console.log("Kết quả cập nhật tài khoản:", response.data);
      toast.success('Cập nhật tài khoản ngân hàng thành công');
      setShowAccountForm(false);
      setNewAccount({
        bankName: '',
        accountNumber: '',
        accountName: '',
        bankBranch: '',
        swiftCode: '',
        qrCodeUrl: '',
        isActive: true
      });
      setQrPreview(null);
      setSelectedAccount(null);
      fetchBankAccounts();
    } catch (error) {
      console.error('Error updating bank account:', error);
      console.error('Response error:', error.response?.data);
      toast.error(`Không thể cập nhật tài khoản ngân hàng: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDisableAccount = async (accountId) => {
    if (!window.confirm('Bạn có chắc muốn vô hiệu hóa tài khoản ngân hàng này?')) {
      return;
    }

    try {
      // DEV MODE: Skip token validation for development
      await axios.delete(
        `http://localhost:8080/api/bank-payments/accounts/${accountId}`
      );
      toast.success('Vô hiệu hóa tài khoản thành công');
      fetchBankAccounts();
    } catch (error) {
      console.error('Error disabling account:', error);
      toast.error('Không thể vô hiệu hóa tài khoản');
    }
  };

  // Thêm hàm kiểm tra token
  const checkToken = async () => {
    try {
      const { authenticated } = await authApi.checkAuth();
      
      if (!authenticated) {
        toast.error('Chưa đăng nhập. Vui lòng đăng nhập với tài khoản admin.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Lỗi kiểm tra token:', error);
      toast.error('Lỗi xác thực. Vui lòng đăng nhập lại.');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Kiểm tra token
      const isTokenValid = await checkToken();
      if (!isTokenValid) {
        toast.error('Vui lòng đăng nhập lại để tiếp tục.');
        setSaving(false);
        return;
      }
      
      // Lấy token từ localStorage
      const token = authApi.getToken();
      
      // Chuẩn bị dữ liệu để gửi lên server
      const settingsData = {
        paymentMethods,
        defaultPaymentMethod: generalSettings.defaultPaymentMethod,
        showPaymentIcons: generalSettings.showPaymentIcons,
        enablePaymentFees: generalSettings.enablePaymentFees,
        orderConfirmationRequired: generalSettings.orderConfirmationRequired,
        pendingOrderTimeout: generalSettings.pendingOrderTimeout,
        
        // Cài đặt VNPAY
        creditCardProvider: 'VNPAY',
        publicKey: creditCardSettings.publicKey || 'TX30V45K',
        secretKey: creditCardSettings.secretKey || 'Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN',
        vnpTmnCode: creditCardSettings.vnpTmnCode || 'TX30V45K',
        vnpHashSecret: creditCardSettings.vnpHashSecret || 'Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN',
        vnpPayUrl: creditCardSettings.vnpPayUrl || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        vnpReturnUrl: creditCardSettings.vnpReturnUrl || 'http://localhost:3000/payment/vnpay-return',
        vnpApiUrl: creditCardSettings.vnpApiUrl || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
        testMode: creditCardSettings.testMode,
        supportedCards: creditCardSettings.supportedCards || ['visa', 'mastercard'],
        currency: creditCardSettings.currency || 'VND',
        
        // Cài đặt chuyển khoản
        bankTransferInstructions: bankDetails.instructions || 'Vui lòng chuyển khoản với nội dung: [Mã đơn hàng]'
      };
      
      console.log('Gửi cài đặt thanh toán lên server:', settingsData);
      
      // Gửi dữ liệu lên server
      const response = await axios.post('http://localhost:8080/api/payment-settings', settingsData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Kết quả lưu cài đặt từ server:', response.data);
      toast.success('Lưu cài đặt thanh toán thành công!');
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt:', error);
      
      if (error.response) {
        console.error('Phản hồi từ server:', error.response.data);
        toast.error(`Không thể lưu cài đặt: ${error.response.data?.message || error.response.statusText}`);
      } else {
        toast.error('Không thể lưu cài đặt. Vui lòng thử lại sau.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Bank payment verification functions
  const handleShowVerifyModal = (payment) => {
    setSelectedPayment(payment);
    setVerificationNote('');
    setShowVerifyModal(true);
  };

  const handleVerifyPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      setSaving(true);
      
      console.log(`Đang xác nhận thanh toán ID: ${selectedPayment.id}, Ghi chú: ${verificationNote}`);
      
      // DEV MODE: Skip token in development
      const response = await axios.put(
        `http://localhost:8080/api/bank-payments/${selectedPayment.id}/verify`,
        null,
        {
          params: { 
            transactionCode: selectedPayment.transactionCode,
            note: verificationNote 
          }
        }
      );
      
      console.log('Kết quả xác nhận thanh toán:', response.data);
      toast.success('Xác nhận thanh toán thành công');
      setShowVerifyModal(false);
      
      // Cập nhật lại danh sách thanh toán
      fetchPayments();
    } catch (error) {
      console.error('Error verifying payment:', error);
      console.error('Response error:', error.response?.data);
      toast.error(`Không thể xác nhận thanh toán: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      setSaving(true);
      
      console.log(`Đang từ chối thanh toán ID: ${selectedPayment.id}, Ghi chú: ${verificationNote}`);
      
      // DEV MODE: Skip token in development
      const response = await axios.put(
        `http://localhost:8080/api/bank-payments/${selectedPayment.id}/reject`,
        null,
        {
          params: { note: verificationNote }
        }
      );
      
      console.log('Kết quả từ chối thanh toán:', response.data);
      toast.success('Từ chối thanh toán thành công');
      setShowVerifyModal(false);
      
      // Cập nhật lại danh sách thanh toán
      fetchPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      console.error('Response error:', error.response?.data);
      toast.error(`Không thể từ chối thanh toán: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Format date time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge bg="warning">Chờ xác nhận</Badge>;
      case 'VERIFIED':
        return <Badge bg="success">Đã xác nhận</Badge>;
      case 'FAILED':
        return <Badge bg="danger">Thất bại</Badge>;
      case 'CANCELED':
        return <Badge bg="secondary">Đã hủy</Badge>;
      default:
        return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  // Function to optimize Cloudinary URL for better loading
  const optimizeImageUrl = (url) => {
    if (!url) return '';
    
    // If it's a Cloudinary URL, optimize it
    if (url.includes('cloudinary.com')) {
      // Add optimization parameters for better loading
      return url.replace('/upload/', '/upload/q_auto,f_auto,w_200,h_200,c_limit/');
    }
    
    return url;
  };

  // Function to check if an image URL is valid or exists
  const checkImageUrl = async (url) => {
    if (!url) return false;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error checking image URL:', error);
      return false;
    }
  };

  // Thêm function để lấy danh sách mã ngân hàng
  const fetchBankCodes = async () => {
    try {
      setLoadingBankCodes(true);
      // DEV MODE: Skip token validation for development
      
      const response = await axios.get('http://localhost:8080/api/bank-payments/bank-codes');
      
      console.log('Mã ngân hàng:', response.data);
      setBankCodes(response.data);
    } catch (error) {
      console.error('Error fetching bank codes:', error);
    } finally {
      setLoadingBankCodes(false);
    }
  };
  
  // Thêm function để tạo mã QR từ thông tin ngân hàng
  const generateVietQR = async () => {
    if (!newAccount.bankCode || !newAccount.accountNumber) {
      toast.error('Vui lòng chọn ngân hàng và nhập số tài khoản để tạo mã QR');
      return;
    }
    
    try {
      setUploadingQR(true);
      // DEV MODE: Skip token validation for development
      
      const response = await axios.post(
        'http://localhost:8080/api/bank-payments/generate-qr',
        {
          bankId: newAccount.bankCode,
          accountNo: newAccount.accountNumber,
          accountName: newAccount.accountName,
          description: `Chuyen khoan cho ${newAccount.accountName}`
        }
      );
      
      if (response.data && response.data.qrUrl) {
        setQrPreview(response.data.qrUrl);
        setNewAccount(prev => ({
          ...prev,
          qrCodeUrl: response.data.qrUrl
        }));
        toast.success('Tạo mã QR thành công');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error(`Không thể tạo mã QR: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploadingQR(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Đang tải cài đặt thanh toán...</div>;
  }

  return (
    <div className="payment-settings-container">
      <div className="page-header mb-4">
        <h1>Cài đặt thanh toán</h1>
      </div>

      <Tabs defaultActiveKey="settings" id="payment-settings-tabs" className="mb-4">
        <Tab eventKey="settings" title="Cài đặt chung">
          <form onSubmit={handleSubmit}>
            {/* General Payment Settings */}
            <div className="settings-card">
              <h2>Cài đặt chung</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="defaultPaymentMethod">Phương thức thanh toán mặc định</label>
                  <select
                    id="defaultPaymentMethod"
                    name="defaultPaymentMethod"
                    value={generalSettings.defaultPaymentMethod}
                    onChange={(e) => handleInputChange(e, setGeneralSettings)}
                  >
                    {paymentMethods.filter(m => m.enabled).map(method => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="pendingOrderTimeout">Thời hạn đơn hàng chờ thanh toán (giờ)</label>
                  <input
                    type="number"
                    id="pendingOrderTimeout"
                    name="pendingOrderTimeout"
                    value={generalSettings.pendingOrderTimeout}
                    onChange={(e) => handleInputChange(e, setGeneralSettings)}
                    min="1"
                    max="168"
                  />
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="showPaymentIcons"
                    checked={generalSettings.showPaymentIcons}
                    onChange={(e) => handleInputChange(e, setGeneralSettings)}
                  />
                  Hiển thị biểu tượng phương thức thanh toán
                </label>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="enablePaymentFees"
                    checked={generalSettings.enablePaymentFees}
                    onChange={(e) => handleInputChange(e, setGeneralSettings)}
                  />
                  Áp dụng phí thanh toán cho khách hàng
                </label>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="orderConfirmationRequired"
                    checked={generalSettings.orderConfirmationRequired}
                    onChange={(e) => handleInputChange(e, setGeneralSettings)}
                  />
                  Yêu cầu xác nhận đơn hàng từ quản trị viên
                </label>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="settings-card">
              <h2>Phương thức thanh toán</h2>
              
              <div className="methods-list">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="method-item">
                    <div className="payment-method-header">
                      <div className="payment-method-toggle">
                        <input
                          type="checkbox"
                          id={`toggle-${method.id}`}
                          checked={method.enabled}
                          onChange={() => handlePaymentMethodToggle(method.id)}
                        />
                        <label htmlFor={`toggle-${method.id}`} className="toggle-label">
                          <span className="toggle-inner"></span>
                          <span className="toggle-switch"></span>
                        </label>
                      </div>
                      
                      <div className="payment-method-title">
                        <i className={`fas ${method.icon}`}></i>
                        <h3>{method.name}</h3>
                      </div>
                      
                      <div className="payment-method-actions">
                        <button 
                          type="button" 
                          className="move-btn"
                          onClick={() => handleMethodReorder(method.id, 'up')}
                          disabled={method.position === 1}
                        >
                          <i className="fas fa-arrow-up"></i>
                        </button>
                        <button 
                          type="button" 
                          className="move-btn"
                          onClick={() => handleMethodReorder(method.id, 'down')}
                          disabled={method.position === paymentMethods.length}
                        >
                          <i className="fas fa-arrow-down"></i>
                        </button>
                      </div>
                    </div>
                    
                    {method.enabled && (
                      <div className="payment-method-details">
                        <div className="form-group">
                          <label htmlFor={`name-${method.id}`}>Tên hiển thị</label>
                          <input
                            type="text"
                            id={`name-${method.id}`}
                            name="name"
                            value={method.name}
                            onChange={(e) => handleMethodInputChange(e, method.id)}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`description-${method.id}`}>Mô tả</label>
                          <textarea
                            id={`description-${method.id}`}
                            name="description"
                            value={method.description}
                            onChange={(e) => handleMethodInputChange(e, method.id)}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`icon-${method.id}`}>Biểu tượng (Font Awesome)</label>
                          <input
                            type="text"
                            id={`icon-${method.id}`}
                            name="icon"
                            value={method.icon}
                            onChange={(e) => handleMethodInputChange(e, method.id)}
                          />
                          <small className="form-text text-muted">
                            Ví dụ: fa-credit-card, fa-money-bill, fa-university
                          </small>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`fee-${method.id}`}>Phí thanh toán (VNĐ)</label>
                          <input
                            type="number"
                            id={`fee-${method.id}`}
                            name="fee"
                            value={method.fee}
                            onChange={(e) => handleMethodInputChange(e, method.id)}
                            min="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
              </button>
            </div>
          </form>
        </Tab>
        
        <Tab eventKey="bank-payments" title={
          <div>
            Thanh toán chuyển khoản 
            {payments.length > 0 && <Badge bg="danger" className="ms-2">{payments.length}</Badge>}
          </div>
        }>
          <div className="settings-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Quản lý thanh toán chuyển khoản</h2>
              <div className="d-flex gap-2">
                <Button 
                  variant={paymentsFilter === 'PENDING' ? 'primary' : 'outline-primary'} 
                  onClick={() => setPaymentsFilter('PENDING')}
                >
                  Chờ xác nhận
                </Button>
                <Button 
                  variant={paymentsFilter === 'VERIFIED' ? 'success' : 'outline-success'} 
                  onClick={() => setPaymentsFilter('VERIFIED')}
                >
                  Đã xác nhận
                </Button>
                <Button 
                  variant={paymentsFilter === 'FAILED' ? 'danger' : 'outline-danger'} 
                  onClick={() => setPaymentsFilter('FAILED')}
                >
                  Đã từ chối
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={fetchPayments}
                >
                  <i className="fas fa-sync-alt"></i> Làm mới
                </Button>
              </div>
            </div>
            
            {paymentsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-3">Đang tải danh sách thanh toán...</p>
              </div>
            ) : payments.length > 0 ? (
              <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Mã giao dịch</th>
                    <th>Mã đơn hàng</th>
                      <th>Ngày tạo</th>
                    <th>Ngân hàng</th>
                    <th>Số tài khoản</th>
                    <th>Tên tài khoản</th>
                    <th>Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                      <td>{payment.transactionCode}</td>
                      <td>
                        <Badge bg="info">#{payment.order?.id}</Badge>
                      </td>
                        <td>{formatDateTime(payment.createdAt)}</td>
                      <td>{payment.bankName}</td>
                      <td>{payment.accountNumber}</td>
                      <td>{payment.accountName}</td>
                      <td>
                        <span className="fw-bold">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(payment.amount)}
                        </span>
                      </td>
                        <td>{getStatusBadge(payment.status)}</td>
                        <td>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleShowVerifyModal(payment)}
                          className="me-2"
                          >
                          <i className="fas fa-eye"></i>
                          </Button>
                        {payment.status === 'PENDING' && (
                          <>
                            <Button 
                              variant="success" 
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setVerificationNote('');
                                setShowVerifyModal(true);
                              }}
                              className="me-2"
                            >
                              <i className="fas fa-check"></i>
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setVerificationNote('');
                                setShowVerifyModal(true);
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </>
                        )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
            ) : (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Không có giao dịch thanh toán nào {paymentsFilter === 'PENDING' ? 'chờ xác nhận' : 
                                                paymentsFilter === 'VERIFIED' ? 'đã xác nhận' : 'đã từ chối'}.
              </div>
            )}
          </div>
        </Tab>
        
        <Tab eventKey="bank-accounts" title="Tài khoản ngân hàng">
          <div className="settings-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Quản lý tài khoản ngân hàng</h2>
              <Button 
                variant="primary"
                onClick={() => {
                  setShowAccountForm(true);
                  setSelectedAccount(null);
                  setNewAccount({
                    bankName: '',
                    accountNumber: '',
                    accountName: '',
                    bankBranch: '',
                    swiftCode: '',
                    qrCodeUrl: '',
                    isActive: true
                  });
                  setQrPreview(null);
                }}
              >
                <i className="fas fa-plus me-1"></i> Thêm tài khoản
              </Button>
            </div>
            
            {bankAccounts.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Ngân hàng</th>
                      <th>Tên TK</th>
                      <th>Số TK</th>
                      <th>Chi nhánh</th>
                      <th>Mã QR</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankAccounts.map(account => (
                      <tr key={account.id}>
                        <td>{account.bankName}</td>
                        <td>{account.accountName}</td>
                        <td>{account.accountNumber}</td>
                        <td>{account.bankBranch || 'N/A'}</td>
                        <td>
                          {account.qrCodeUrl ? (
                            <a href={account.qrCodeUrl} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={optimizeImageUrl(account.qrCodeUrl)} 
                                alt="QR Code" 
                                style={{ width: '50px', height: '50px' }}
                                className="img-thumbnail"
                                onError={(e) => {
                                  console.error("Error loading QR image:", account.qrCodeUrl);
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/50?text=Error';
                                  e.target.title = 'Không thể tải hình ảnh QR';
                                }}
                              />
                            </a>
                          ) : (
                            'Không có'
                          )}
                        </td>
                        <td>
                          <Badge bg={account.isActive ? 'success' : 'danger'}>
                            {account.isActive ? 'Hoạt động' : 'Bị khóa'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => {
                                setSelectedAccount(account);
                                setNewAccount(account);
                                setQrPreview(account.qrCodeUrl);
                                setShowAccountForm(true);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDisableAccount(account.id)}
                              disabled={!account.isActive}
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="alert alert-info">
                Chưa có tài khoản ngân hàng nào. Hãy thêm tài khoản để khách hàng có thể thanh toán.
              </div>
            )}
          </div>
          
          {showAccountForm && (
            <div className="settings-card mt-4">
              <h3>{selectedAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h3>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên ngân hàng <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={newAccount.bankName}
                      onChange={(e) => setNewAccount({...newAccount, bankName: e.target.value})}
                      placeholder="VD: Vietcombank, Techcombank, ..."
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mã ngân hàng</Form.Label>
                    <Form.Select
                      value={newAccount.bankCode || ''}
                      onChange={(e) => setNewAccount({...newAccount, bankCode: e.target.value})}
                    >
                      <option value="">-- Chọn mã ngân hàng --</option>
                      {Object.entries(bankCodes).map(([key, value]) => (
                        <option key={value} value={value}>
                          {key} - {value}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Mã ngân hàng dùng để tạo mã QR theo chuẩn VietQR
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số tài khoản <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={newAccount.accountNumber}
                      onChange={(e) => setNewAccount({...newAccount, accountNumber: e.target.value})}
                      placeholder="Nhập số tài khoản"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên chủ tài khoản <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={newAccount.accountName}
                      onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                      placeholder="Nhập tên chủ tài khoản"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Swift Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAccount.swiftCode}
                      onChange={(e) => setNewAccount({...newAccount, swiftCode: e.target.value})}
                      placeholder="Nhập Swift Code (nếu có)"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Chi nhánh</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAccount.bankBranch}
                      onChange={(e) => setNewAccount({...newAccount, bankBranch: e.target.value})}
                      placeholder="VD: Chi nhánh Hà Nội"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>URL mã QR</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAccount.qrCodeUrl}
                      onChange={(e) => setNewAccount({...newAccount, qrCodeUrl: e.target.value})}
                      placeholder="URL hình ảnh mã QR (nếu có)"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="d-flex align-items-end mb-3">
                  <Button
                    variant="outline-primary"
                    onClick={generateVietQR}
                    disabled={!newAccount.bankCode || !newAccount.accountNumber || uploadingQR}
                    className="me-2"
                  >
                    {uploadingQR ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-qrcode me-2"></i> Tạo mã VietQR
                      </>
                    )}
                  </Button>
                  <div className="text-muted small">
                    Tạo mã QR tự động theo chuẩn VietQR
                  </div>
                </Col>
              </Row>
              
              <Form.Check
                type="checkbox"
                id="isActive"
                label="Kích hoạt tài khoản này"
                checked={newAccount.isActive}
                onChange={(e) => setNewAccount({...newAccount, isActive: e.target.checked})}
                className="mb-3"
              />
              
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowAccountForm(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateAccount}
                >
                  {selectedAccount ? 'Cập nhật' : 'Thêm tài khoản'}
                </Button>
              </div>
            </div>
          )}
        </Tab>
      </Tabs>

      {/* Modal xác nhận thanh toán */}
      <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedPayment?.status === 'PENDING' ? 'Xác nhận thanh toán' : 'Chi tiết thanh toán'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <h5 className="border-bottom pb-2 mb-3">Thông tin giao dịch</h5>
                  <p><strong>Mã giao dịch:</strong> {selectedPayment.id}</p>
                  <p><strong>Mã đơn hàng:</strong> {selectedPayment.order?.id}</p>
                  <p><strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN', { 
                    style: 'currency', 
                    currency: 'VND' 
                  }).format(selectedPayment.amount)}</p>
                  <p><strong>Mã giao dịch ngân hàng:</strong> {selectedPayment.transactionCode || 'Chưa có'}</p>
                  <p><strong>Ngày tạo:</strong> {formatDateTime(selectedPayment.createdAt)}</p>
                  <p><strong>Trạng thái:</strong> {getStatusBadge(selectedPayment.status)}</p>
                  
                  {selectedPayment.verifiedAt && (
                    <p><strong>Ngày xác nhận:</strong> {formatDateTime(selectedPayment.verifiedAt)}</p>
                  )}
                  
                  {selectedPayment.verificationNote && (
                    <p><strong>Ghi chú xác nhận:</strong> {selectedPayment.verificationNote}</p>
                  )}
                </Col>
                
                <Col md={6}>
                  <h5 className="border-bottom pb-2 mb-3">Thông tin ngân hàng</h5>
                  <p><strong>Ngân hàng:</strong> {selectedPayment.bankName}</p>
                  <p><strong>Số tài khoản:</strong> {selectedPayment.accountNumber}</p>
                  <p><strong>Tên chủ tài khoản:</strong> {selectedPayment.accountName}</p>
                </Col>
              </Row>

              {selectedPayment.status === 'PENDING' && (
                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú xác nhận</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    placeholder="Nhập ghi chú cho giao dịch này (không bắt buộc)"
                  />
                </Form.Group>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVerifyModal(false)}>
            Đóng
          </Button>
          
          {selectedPayment?.status === 'PENDING' && (
            <>
              <Button 
                variant="success" 
                onClick={handleVerifyPayment}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check me-2"></i> Xác nhận thanh toán
                  </>
                )}
              </Button>
              
              <Button 
                variant="danger" 
                onClick={handleRejectPayment}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="fas fa-times me-2"></i> Từ chối
                  </>
                )}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
      
      <style jsx>{`
        .payment-settings-container {
          padding: 20px;
        }
        
        .page-header {
          margin-bottom: 24px;
        }
        
        .page-header h1 {
          font-size: 24px;
          margin: 0;
          color: #333;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          font-size: 16px;
          color: #6c757d;
        }
        
        .settings-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .settings-card h2 {
          font-size: 20px;
          margin: 0 0 24px 0;
          color: #333;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-row {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .form-row .form-group {
          flex: 1;
          margin-bottom: 0;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }
        
        .form-group input[type="text"],
        .form-group input[type="password"],
        .form-group input[type="number"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
        }
        
        .checkbox-group label {
          display: flex;
          align-items: center;
          margin-bottom: 0;
          cursor: pointer;
        }
        
        .checkbox-group input[type="checkbox"] {
          margin-right: 8px;
          width: 16px;
          height: 16px;
        }
        
        .methods-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .method-item {
          border: 1px solid #e9ecef;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .payment-method-header {
          display: flex;
          align-items: center;
          padding: 16px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }
        
        .payment-method-title {
          display: flex;
          align-items: center;
          flex: 1;
        }
        
        .payment-method-title i {
          margin-right: 12px;
          font-size: 18px;
          width: 24px;
          text-align: center;
          color: #495057;
        }
        
        .payment-method-title h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }
        
        .payment-method-toggle {
          margin-right: 16px;
        }
        
        /* Toggle switch styling */
        .payment-method-toggle input {
          height: 0;
          width: 0;
          visibility: hidden;
          position: absolute;
        }
        
        .toggle-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          width: 50px;
          height: 25px;
          background: #ced4da;
          border-radius: 25px;
          position: relative;
          transition: background-color 0.2s;
        }
        
        .toggle-label .toggle-inner {
          width: 21px;
          height: 21px;
          background: #fff;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: 0.2s;
          box-shadow: 0 0 2px 0 rgba(10, 10, 10, 0.29);
        }
        
        .payment-method-toggle input:checked + .toggle-label {
          background: #28a745;
        }
        
        .payment-method-toggle input:checked + .toggle-label .toggle-inner {
          left: calc(100% - 2px);
          transform: translateX(-100%);
        }
        
        .payment-method-details {
          padding: 16px;
        }
        
        .payment-method-actions {
          display: flex;
          gap: 8px;
        }
        
        .move-btn {
          background: none;
          border: 1px solid #ced4da;
          border-radius: 4px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #495057;
        }
        
        .move-btn:hover {
          background-color: #e9ecef;
        }
        
        .move-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .method-specific-config {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
        }
        
        .method-specific-config h4 {
          font-size: 16px;
          margin: 0 0 16px 0;
          color: #495057;
        }
        
        .image-preview {
          margin-top: 8px;
          max-width: 200px;
          border: 1px solid #e9ecef;
          padding: 4px;
          border-radius: 4px;
        }
        
        .image-preview img {
          max-width: 100%;
          height: auto;
        }
        
        .form-actions {
          margin-top: 30px;
          text-align: right;
        }
        
        .save-button {
          padding: 10px 20px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .save-button:hover {
          background-color: #218838;
        }
        
        .save-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 20px;
          }
          
          .form-row .form-group {
            margin-bottom: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentSettings; 