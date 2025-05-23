import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import paymentSettingsApi from '../api/paymentSettingsApi';

const VNPaySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    vnpTmnCode: '',
    vnpHashSecret: '',
    vnpPayUrl: '',
    vnpReturnUrl: '',
    vnpApiUrl: '',
    testMode: true,
    vnpProduction: false
  });
  const [hasSecretKey, setHasSecretKey] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await paymentSettingsApi.getVnpaySettings();
        console.log('Đã tải cài đặt VNPAY:', response);
        
        setSettings({
          vnpTmnCode: response.vnpTmnCode || '',
          vnpHashSecret: '', // Không hiển thị secret key
          vnpPayUrl: response.vnpPayUrl || '',
          vnpReturnUrl: response.vnpReturnUrl || '',
          vnpApiUrl: response.vnpApiUrl || '',
          testMode: response.testMode,
          vnpProduction: response.vnpProduction
        });
        
        setHasSecretKey(response.hasSecretKey);
      } catch (error) {
        console.error('Error fetching VNPAY settings:', error);
        toast.error('Không thể tải cài đặt VNPAY');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Gửi cài đặt đến API
      await paymentSettingsApi.saveVnpaySettings(settings);
      
      toast.success('Đã lưu cài đặt VNPAY thành công');
      
      // Cập nhật trạng thái có secret key hay không
      if (settings.vnpHashSecret && settings.vnpHashSecret.trim()) {
        setHasSecretKey(true);
      }
      
      // Xóa mật khẩu khỏi state
      setSettings(prev => ({
        ...prev,
        vnpHashSecret: ''
      }));
    } catch (error) {
      console.error('Error saving VNPAY settings:', error);
      toast.error('Lỗi khi lưu cài đặt VNPAY');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Đang tải cài đặt VNPAY...</div>;
  }

  return (
    <div className="vnpay-settings-container">
      <h2>Cài đặt VNPAY</h2>
      
      <div className="alert alert-info mb-4">
        <p><strong>Lưu ý bảo mật:</strong> Thông tin cấu hình VNPAY, đặc biệt là Secret Key, chỉ được lưu trữ và sử dụng ở backend.</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="vnpTmnCode">
            Terminal ID / Merchant ID
            <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="vnpTmnCode"
            name="vnpTmnCode"
            value={settings.vnpTmnCode}
            onChange={handleInputChange}
            placeholder="Terminal ID / Merchant ID từ VNPAY"
            required
            className="form-control"
          />
          <small className="form-text text-muted">Mã merchant được cung cấp bởi VNPAY</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="vnpHashSecret">
            Secret Key / Chuỗi bí mật tạo checksum
            {!hasSecretKey && <span className="text-danger">*</span>}
          </label>
          <input
            type="password"
            id="vnpHashSecret"
            name="vnpHashSecret"
            value={settings.vnpHashSecret}
            onChange={handleInputChange}
            placeholder={hasSecretKey ? "••••••••••••••••" : "Nhập Secret Key / Hash Secret từ VNPAY"}
            required={!hasSecretKey}
            className="form-control"
          />
          <small className="form-text text-muted">
            {hasSecretKey 
              ? "Secret Key đã được lưu. Nhập lại chỉ khi bạn muốn thay đổi." 
              : "Secret Key cần được lưu trữ an toàn và không được tiết lộ."
            }
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="vnpPayUrl">URL Thanh toán VNPAY</label>
          <input
            type="text"
            id="vnpPayUrl"
            name="vnpPayUrl"
            value={settings.vnpPayUrl}
            onChange={handleInputChange}
            placeholder="URL thanh toán của VNPAY"
            className="form-control"
          />
          <small className="form-text text-muted">
            Sandbox: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html<br />
            Production: https://pay.vnpay.vn/vpcpay.html
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="vnpReturnUrl">URL Return (Quay về)</label>
          <input
            type="text"
            id="vnpReturnUrl"
            name="vnpReturnUrl"
            value={settings.vnpReturnUrl}
            onChange={handleInputChange}
            placeholder="URL quay về sau khi thanh toán"
            className="form-control"
          />
          <small className="form-text text-muted">
            URL quay về sau khi thanh toán, ví dụ: https://yourdomain.com/payment/vnpay-return
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="vnpApiUrl">API URL</label>
          <input
            type="text"
            id="vnpApiUrl"
            name="vnpApiUrl"
            value={settings.vnpApiUrl}
            onChange={handleInputChange}
            placeholder="URL API truy vấn giao dịch"
            className="form-control"
          />
          <small className="form-text text-muted">
            Sandbox: https://sandbox.vnpayment.vn/merchant_webapi/api/transaction<br />
            Production: https://pay.vnpay.vn/merchant_webapi/api/transaction
          </small>
        </div>

        <div className="form-group mb-4">
          <div className="custom-control custom-switch">
            <input
              type="checkbox"
              className="custom-control-input"
              id="vnpProduction"
              name="vnpProduction"
              checked={settings.vnpProduction}
              onChange={handleInputChange}
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
              checked={settings.testMode}
              onChange={handleInputChange}
            />
            Sử dụng môi trường thử nghiệm (Sandbox)
          </label>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu cài đặt VNPAY'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VNPaySettings; 