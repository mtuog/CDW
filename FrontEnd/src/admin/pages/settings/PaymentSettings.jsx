import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Tabs, Tab, Badge, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap';

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
    publicKey: 'TX30V45K',
    secretKey: 'Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN',
    testMode: true,
    supportedCards: ['visa', 'mastercard'],
    currency: 'VND',
    autoCapture: true,
    vnpTmnCode: 'TX30V45K',
    vnpHashSecret: 'Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN',
    vnpPayUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    vnpReturnUrl: 'http://localhost:3000/payment/vnpay-return',
    vnpApiUrl: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    vnpProduction: true
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
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        // Gọi API để lấy cài đặt thanh toán
        const response = await axios.get('http://localhost:8080/api/payment-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const settings = response.data;
        console.log('Đã tải cài đặt thanh toán:', settings);
        
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
          publicKey: settings.publicKey || 'TX30V45K',
          secretKey: settings.secretKey || 'Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN',
          testMode: settings.testMode,
          supportedCards: supportedCards,
          currency: settings.currency || 'VND',
          autoCapture: settings.autoCapture,
          vnpTmnCode: settings.vnpTmnCode || 'TX30V45K',
          vnpHashSecret: settings.vnpHashSecret || 'Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN',
          vnpPayUrl: settings.vnpPayUrl || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
          vnpReturnUrl: settings.vnpReturnUrl || 'http://localhost:3000/payment/vnpay-return',
          vnpApiUrl: settings.vnpApiUrl || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
          vnpProduction: settings.vnpProduction || true
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
      } catch (error) {
        console.error('Lỗi khi tải cài đặt thanh toán:', error);
        
        // Nếu API lỗi, tải dữ liệu mẫu
        setTimeout(() => {
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
            publicKey: 'TX30V45K',
            secretKey: 'Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN',
            testMode: true,
            supportedCards: ['visa', 'mastercard'],
            currency: 'VND',
            autoCapture: true,
            vnpTmnCode: 'TX30V45K',
            vnpHashSecret: 'Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN',
            vnpPayUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            vnpReturnUrl: 'http://localhost:3000/payment/vnpay-return',
            vnpApiUrl: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
            vnpProduction: true
          });

          // Fetch actual bank accounts from API
          fetchBankAccounts();
          setLoading(false);
        }, 800);
      }
    };

    fetchSettings();
  }, []);

  // Fetch bank payments when filter changes
  useEffect(() => {
    if (paymentsFilter) {
      fetchPayments();
    }
  }, [paymentsFilter]);

  const fetchBankAccounts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:8080/api/bank-payments/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`http://localhost:8080/api/bank-payments/status/${paymentsFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Không thể tải danh sách thanh toán');
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
        
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        
        if (!token) {
          console.error("Không tìm thấy token xác thực");
          toast.error("Vui lòng đăng nhập lại để tiếp tục");
          return;
        }
        
        console.log("Đang gửi request đến API với token:", token.substring(0, 15) + "...");
        
        const response = await axios.post(
          'http://localhost:8080/api/files/upload/qr-code',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
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

      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (!token) {
        toast.error("Vui lòng đăng nhập lại để tiếp tục");
        return;
      }

      console.log("Đang gửi dữ liệu tài khoản:", newAccount);

      // Nếu đây là cập nhật tài khoản hiện có
      if (selectedAccount) {
        await handleUpdateAccount();
        return;
      }

      // Tạo tài khoản mới
      const response = await axios.post(
        'http://localhost:8080/api/bank-payments/accounts',
        newAccount,
        { headers: { Authorization: `Bearer ${token}` } }
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

      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (!token) {
        toast.error("Vui lòng đăng nhập lại để tiếp tục");
        return;
      }

      console.log("Đang cập nhật tài khoản:", newAccount);

      const response = await axios.put(
        `http://localhost:8080/api/bank-payments/accounts/${selectedAccount.id}`,
        newAccount,
        { headers: { Authorization: `Bearer ${token}` } }
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
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `http://localhost:8080/api/bank-payments/accounts/${accountId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Vô hiệu hóa tài khoản thành công');
      fetchBankAccounts();
    } catch (error) {
      console.error('Error disabling account:', error);
      toast.error('Không thể vô hiệu hóa tài khoản');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      // Chuẩn bị dữ liệu để gửi đến API
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
        testMode: creditCardSettings.testMode,
        supportedCards: creditCardSettings.supportedCards,
        currency: creditCardSettings.currency,
        autoCapture: creditCardSettings.autoCapture,
        
        // Cài đặt VNPAY
        vnpTmnCode: creditCardSettings.publicKey || 'TX30V45K',
        vnpHashSecret: creditCardSettings.secretKey || 'Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN',
        vnpPayUrl: creditCardSettings.vnpPayUrl || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        vnpReturnUrl: creditCardSettings.vnpReturnUrl || 'http://localhost:3000/payment/vnpay-return',
        vnpApiUrl: creditCardSettings.vnpApiUrl || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
        
        // Cài đặt bank transfer
        bankTransferInstructions: bankDetails.instructions
      };
      
      // Gửi request đến API
      const response = await axios.post(
        'http://localhost:8080/api/payment-settings',
        settingsData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Cài đặt đã được lưu:', response.data);
      toast.success('Lưu cài đặt thanh toán thành công!');
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt:', error);
      toast.error('Không thể lưu cài đặt. Vui lòng thử lại sau.');
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
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:8080/api/bank-payments/${selectedPayment.id}/verify`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { note: verificationNote }
        }
      );
      toast.success('Xác nhận thanh toán thành công');
      setShowVerifyModal(false);
      fetchPayments();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Không thể xác nhận thanh toán');
    }
  };

  const handleRejectPayment = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:8080/api/bank-payments/${selectedPayment.id}/reject`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { note: verificationNote }
        }
      );
      toast.success('Đã từ chối thanh toán');
      setShowVerifyModal(false);
      fetchPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Không thể từ chối thanh toán');
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
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:8080/api/bank-payments/bank-codes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBankCodes(response.data);
    } catch (error) {
      console.error('Error fetching bank codes:', error);
      toast.error('Không thể tải danh sách mã ngân hàng');
    } finally {
      setLoadingBankCodes(false);
    }
  };
  
  // Thêm vào useEffect
  useEffect(() => {
    fetchBankCodes();
  }, []);
  
  // Thêm function để tạo mã QR từ thông tin ngân hàng
  const generateVietQR = async () => {
    if (!newAccount.bankCode || !newAccount.accountNumber) {
      toast.error('Vui lòng chọn ngân hàng và nhập số tài khoản để tạo mã QR');
      return;
    }
    
    try {
      setUploadingQR(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:8080/api/bank-payments/generate-qr',
        {
          bankId: newAccount.bankCode,
          accountNo: newAccount.accountNumber,
          accountName: newAccount.accountName,
          description: `Chuyen khoan cho ${newAccount.accountName}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
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
                            rows="2"
                          ></textarea>
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor={`fee-${method.id}`}>Phí giao dịch (%)</label>
                            <input
                              type="number"
                              id={`fee-${method.id}`}
                              name="fee"
                              value={method.fee}
                              onChange={(e) => handleMethodInputChange(e, method.id)}
                              step="0.1"
                              min="0"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor={`icon-${method.id}`}>Biểu tượng</label>
                            <input
                              type="text"
                              id={`icon-${method.id}`}
                              name="icon"
                              value={method.icon}
                              onChange={(e) => handleMethodInputChange(e, method.id)}
                            />
                          </div>
                        </div>

                        {/* Method-specific configuration */}
                        {method.id === 'bank_transfer' && (
                          <div className="method-specific-config">
                            <h4>Cấu hình chuyển khoản ngân hàng</h4>
                            
                            <div className="form-row">
                              <div className="form-group">
                                <label htmlFor="bankName">Tên ngân hàng</label>
                                <input
                                  type="text"
                                  id="bankName"
                                  name="bankName"
                                  value={bankDetails.bankName}
                                  onChange={(e) => handleInputChange(e, setBankDetails)}
                                  required
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="bankBranch">Chi nhánh</label>
                                <input
                                  type="text"
                                  id="bankBranch"
                                  name="bankBranch"
                                  value={bankDetails.bankBranch}
                                  onChange={(e) => handleInputChange(e, setBankDetails)}
                                />
                              </div>
                            </div>
                            
                            <div className="form-row">
                              <div className="form-group">
                                <label htmlFor="accountName">Tên chủ tài khoản</label>
                                <input
                                  type="text"
                                  id="accountName"
                                  name="accountName"
                                  value={bankDetails.accountName}
                                  onChange={(e) => handleInputChange(e, setBankDetails)}
                                  required
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="accountNumber">Số tài khoản</label>
                                <input
                                  type="text"
                                  id="accountNumber"
                                  name="accountNumber"
                                  value={bankDetails.accountNumber}
                                  onChange={(e) => handleInputChange(e, setBankDetails)}
                                  required
                                />
                              </div>
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor="instructions">Hướng dẫn thanh toán</label>
                              <textarea
                                id="instructions"
                                name="instructions"
                                value={bankDetails.instructions}
                                onChange={(e) => handleInputChange(e, setBankDetails)}
                                rows="3"
                              ></textarea>
                            </div>
                          </div>
                        )}

                        {method.id === 'vnpay' && (
                          <div className="method-specific-config">
                            <h4>Cấu hình thanh toán thẻ tín dụng / thẻ ghi nợ</h4>
                            
                            <div className="form-row">
                              <div className="form-group">
                                <label htmlFor="providerName">Nhà cung cấp dịch vụ</label>
                                <select
                                  id="providerName"
                                  name="providerName"
                                  value={creditCardSettings.providerName}
                                  onChange={(e) => {
                                    // Reset cấu hình hiện tại và cập nhật tên nhà cung cấp
                                    setCreditCardSettings({
                                      ...creditCardSettings,
                                      providerName: e.target.value,
                                      // Giữ lại một số cài đặt chung
                                      currency: creditCardSettings.currency,
                                      testMode: creditCardSettings.testMode,
                                      autoCapture: creditCardSettings.autoCapture
                                    });
                                  }}
                                  required
                                >
                                  <option value="VNPAY">VNPAY (Vietnam)</option>
                                </select>
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="currency">Tiền tệ mặc định</label>
                                <select
                                  id="currency"
                                  name="currency"
                                  value={creditCardSettings.currency}
                                  onChange={(e) => handleInputChange(e, setCreditCardSettings)}
                                >
                                  <option value="VND">VND - Việt Nam Đồng</option>
                                  <option value="USD">USD - Đô la Mỹ</option>
                                  <option value="EUR">EUR - Euro</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="form-row">
                              <div className="form-group">
                                <label htmlFor="publicKey">
                                  Terminal ID / Merchant ID
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  id="publicKey"
                                  name="publicKey"
                                  value={creditCardSettings.publicKey}
                                  onChange={(e) => handleInputChange(e, setCreditCardSettings)}
                                  placeholder="Terminal ID / Merchant ID từ VNPAY"
                                  required
                                />
                                <small className="form-text text-muted">VNPAY Terminal ID: TX30V45K</small>
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="secretKey">
                                  Secret Key / Chuỗi bí mật tạo checksum
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="password"
                                  id="secretKey"
                                  name="secretKey"
                                  value={creditCardSettings.secretKey}
                                  onChange={(e) => handleInputChange(e, setCreditCardSettings)}
                                  placeholder="Secret Key / Chuỗi bí mật tạo checksum"
                                  required
                                />
                                <small className="form-text text-muted">VNPAY Secret Key: Y8WNT38V7MHWL0NZNRHYMTUCBDAELILN</small>
                              </div>
                            </div>

                            <div className="form-group">
                              <label htmlFor="vnpPayUrl">URL Thanh toán VNPAY</label>
                              <input
                                type="text"
                                id="vnpPayUrl"
                                name="vnpPayUrl"
                                value={creditCardSettings.vnpPayUrl}
                                onChange={(e) => handleInputChange(e, setCreditCardSettings)}
                                placeholder="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
                                className="form-control"
                              />
                              <small className="form-text text-muted">VNPAY Payment URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html</small>
                            </div>

                            <div className="form-group">
                              <label htmlFor="vnpReturnUrl">URL Return (Quay về)</label>
                              <input
                                type="text"
                                id="vnpReturnUrl"
                                name="vnpReturnUrl"
                                value={creditCardSettings.vnpReturnUrl}
                                onChange={(e) => handleInputChange(e, setCreditCardSettings)}
                                placeholder="http://localhost:3000/payment/vnpay-return"
                                className="form-control"
                              />
                              <small className="form-text text-muted">URL quay về sau khi thanh toán</small>
                            </div>

                            <div className="form-group">
                              <label htmlFor="vnpApiUrl">API URL</label>
                              <input
                                type="text"
                                id="vnpApiUrl"
                                name="vnpApiUrl"
                                value={creditCardSettings.vnpApiUrl}
                                onChange={(e) => handleInputChange(e, setCreditCardSettings)}
                                placeholder="https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
                                className="form-control"
                              />
                              <small className="form-text text-muted">URL API cho gọi thông tin giao dịch VNPAY</small>
                            </div>

                            <div className="form-group mb-4">
                              <div className="custom-control custom-switch">
                                <input
                                  type="checkbox"
                                  className="custom-control-input"
                                  id="vnpProduction"
                                  name="vnpProduction"
                                  checked={creditCardSettings.vnpProduction}
                                  onChange={(e) => handleInputChange(e, setCreditCardSettings)}
                                />
                                <label className="custom-control-label" htmlFor="vnpProduction">
                                  Môi trường thực tế (Production)
                                </label>
                                <small className="form-text text-muted d-block">
                                  Bật khi bạn muốn sử dụng môi trường thực tế của VNPAY. Tắt để sử dụng môi trường Sandbox (test).
                                </small>
                              </div>
                            </div>

                            <div className="form-group checkbox-group">
                              <label>
                                <input
                                  type="checkbox"
                                  name="testMode"
                                  checked={creditCardSettings.testMode}
                                  onChange={(e) => handleInputChange(e, setCreditCardSettings)}
                                />
                                Sử dụng môi trường thử nghiệm (Sandbox)
                              </label>
                            </div>
                            
                            <div className="form-group checkbox-group">
                              <label>
                                <input
                                  type="checkbox"
                                  name="autoCapture"
                                  checked={creditCardSettings.autoCapture}
                                  onChange={(e) => handleInputChange(e, setCreditCardSettings)}
                                />
                                Tự động thu tiền (nếu không chọn, cần xác nhận thủ công)
                              </label>
                            </div>
                            
                            <div className="alert alert-info mt-3">
                              <strong>Lưu ý:</strong> Để tích hợp cổng thanh toán thẻ, bạn cần đăng ký tài khoản với nhà cung cấp dịch vụ 
                              (Stripe, OnePay, ...) và lấy các khóa API.
                              <a href="https://stripe.com/docs" target="_blank" rel="noopener noreferrer" className="ms-1">
                                Xem hướng dẫn
                              </a>
                            </div>
                          </div>
                        )}
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
        
        <Tab eventKey="bank-payments" title="Thanh toán chuyển khoản">
          <div className="settings-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Quản lý thanh toán qua ngân hàng</h2>
              <div className="d-flex gap-2">
                <Button 
                  variant={paymentsFilter === 'PENDING' ? 'primary' : 'outline-secondary'} 
                  onClick={() => setPaymentsFilter('PENDING')}
                >
                  Chờ xác nhận
                </Button>
                <Button 
                  variant={paymentsFilter === 'VERIFIED' ? 'primary' : 'outline-secondary'} 
                  onClick={() => setPaymentsFilter('VERIFIED')}
                >
                  Đã xác nhận
                </Button>
                <Button 
                  variant={paymentsFilter === 'FAILED' ? 'primary' : 'outline-secondary'} 
                  onClick={() => setPaymentsFilter('FAILED')}
                >
                  Thất bại
                </Button>
              </div>
            </div>
            
            {paymentsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-2">Đang tải dữ liệu thanh toán...</p>
              </div>
            ) : payments.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Đơn hàng</th>
                      <th>Ngân hàng</th>
                      <th>Số tiền</th>
                      <th>Mã giao dịch</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td>{payment.id}</td>
                        <td>#{payment.order.id}</td>
                        <td>{payment.bankName}</td>
                        <td>{payment.amount?.toLocaleString('vi-VN')} VNĐ</td>
                        <td>{payment.transactionCode || 'N/A'}</td>
                        <td>{formatDateTime(payment.createdAt)}</td>
                        <td>{getStatusBadge(payment.status)}</td>
                        <td>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleShowVerifyModal(payment)}
                          >
                            {payment.status === 'PENDING' ? 'Xác nhận' : 'Chi tiết'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-5">
                <p>Không có giao dịch nào {paymentsFilter === 'PENDING' ? 'đang chờ xác nhận' : paymentsFilter === 'VERIFIED' ? 'đã xác nhận' : 'bị từ chối'}.</p>
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
              <Row>
                <Col md={6}>
                  <p><strong>ID giao dịch:</strong> {selectedPayment.id}</p>
                  <p><strong>ID đơn hàng:</strong> {selectedPayment.order.id}</p>
                  <p><strong>Số tiền:</strong> {selectedPayment.amount?.toLocaleString('vi-VN')} VNĐ</p>
                  <p><strong>Trạng thái:</strong> {getStatusBadge(selectedPayment.status)}</p>
                  <p><strong>Ngày tạo:</strong> {formatDateTime(selectedPayment.createdAt)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Ngân hàng:</strong> {selectedPayment.bankName}</p>
                  <p><strong>Số tài khoản:</strong> {selectedPayment.accountNumber}</p>
                  <p><strong>Chủ tài khoản:</strong> {selectedPayment.accountName}</p>
                  <p><strong>Mã giao dịch:</strong> {selectedPayment.transactionCode || 'N/A'}</p>
                  <p><strong>Ngày thanh toán:</strong> {formatDateTime(selectedPayment.paymentDate)}</p>
                </Col>
              </Row>

              {selectedPayment.verificationNote && (
                <div className="alert alert-info mt-3">
                  <strong>Ghi chú xác nhận:</strong> {selectedPayment.verificationNote}
                </div>
              )}

              {selectedPayment.status === 'PENDING' && (
                <Form.Group className="mt-3">
                  <Form.Label>Ghi chú xác nhận</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    placeholder="Nhập ghi chú xác nhận (nếu có)"
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
              <Button variant="danger" onClick={handleRejectPayment}>
                <i className="fas fa-times me-1"></i> Từ chối
              </Button>
              <Button variant="success" onClick={handleVerifyPayment}>
                <i className="fas fa-check me-1"></i> Xác nhận
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