import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { getSettingsByGroup, updateSettingByKey, bulkUpdateSettings } from '../../../api/settingApi';
import { uploadFile } from '../../../api/uploadApi';

const StoreSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [checkingPrefix, setCheckingPrefix] = useState(false);
  const logoFileInputRef = useRef(null);
  const faviconFileInputRef = useRef(null);
  
  // State for General Settings
  const [generalSettings, setGeneralSettings] = useState({
    storeName: '',
    storeLogo: '',
    storeFavicon: '',
    storeDescription: '',
    storeEmail: '',
    storePhone: '',
    storeAddress: '',
    storeCity: '',
    storeZipCode: '',
    currencyCode: 'VND',
    currencySymbol: '₫',
    orderPrefix: 'ORD-'
  });
  
  // State for Address Settings
  const [addressSettings, setAddressSettings] = useState({
    address: '',
    city: '',
    district: '',
    zipCode: '',
    country: 'Việt Nam'
  });
  
  // State for Shipping Settings
  const [shippingSettings, setShippingSettings] = useState({
    enableFreeShipping: false,
    freeShippingThreshold: 500000,
    flatRate: 30000,
    shippingFromAddress: true,
    enableLocalPickup: false
  });
  
  // State for Email Settings
  const [emailSettings, setEmailSettings] = useState({
    emailNotifications: true,
    adminEmail: '',
    sendOrderConfirmation: true,
    sendOrderStatusUpdates: true,
    emailFooter: ''
  });
  
  // State for Social Media Settings
  const [socialSettings, setSocialSettings] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: '',
    linkedin: '',
    enableSocialIcons: true,
    shareBtnsOnProduct: true
  });
  
  // Hiện thị cửa sổ xác nhận trước khi nhập file cài đặt
  const [showConfirmImport, setShowConfirmImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  
  // Load settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // Fetch all settings groups
        const [generalSettingsData, addressSettingsData, shippingSettingsData, emailSettingsData, socialSettingsData] = await Promise.all([
          getSettingsByGroup('general'),
          getSettingsByGroup('address'),
          getSettingsByGroup('shipping'),
          getSettingsByGroup('email'),
          getSettingsByGroup('social')
        ]);

        // Transform settings into objects
        const transformSettings = (settings) => {
          return settings.reduce((acc, setting) => {
            acc[setting.settingKey] = setting.settingValue;
            return acc;
          }, {});
        };

        const general = transformSettings(generalSettingsData);
        const address = transformSettings(addressSettingsData);
        const shipping = transformSettings(shippingSettingsData);
        const email = transformSettings(emailSettingsData);
        const social = transformSettings(socialSettingsData);

        // Update general settings
        setGeneralSettings(prev => ({
          ...prev,
          storeName: general.store_name || prev.storeName,
          storeDescription: general.store_description || prev.storeDescription,
          storeEmail: general.store_email || prev.storeEmail,
          storePhone: general.store_phone || prev.storePhone,
          storeLogo: general.logo_url || prev.storeLogo,
          storeFavicon: general.favicon_url || prev.storeFavicon,
          storeAddress: general.store_address || prev.storeAddress,
          storeCity: general.city || prev.storeCity,
          storeZipCode: general.zip_code || prev.storeZipCode,
          currencyCode: general.currency_code || prev.currencyCode,
          currencySymbol: general.currency_symbol || prev.currencySymbol,
          orderPrefix: general.order_prefix || prev.orderPrefix
        }));
        
        setAddressSettings(prev => ({
          ...prev,
          address: address.address || prev.address,
          city: address.city || prev.city,
          district: address.district || prev.district,
          zipCode: address.zip_code || prev.zipCode,
          country: address.country || prev.country
        }));
        
        setShippingSettings(prev => ({
          ...prev,
          enableFreeShipping: shipping.enable_free_shipping === 'true' || prev.enableFreeShipping,
          freeShippingThreshold: shipping.free_shipping_threshold ? parseInt(shipping.free_shipping_threshold, 10) : prev.freeShippingThreshold,
          flatRate: shipping.flat_rate ? parseInt(shipping.flat_rate, 10) : prev.flatRate,
          shippingFromAddress: shipping.shipping_from_address === 'true' || prev.shippingFromAddress,
          enableLocalPickup: shipping.enable_local_pickup === 'true' || prev.enableLocalPickup
        }));
        
        setEmailSettings(prev => ({
          ...prev,
          emailNotifications: email.email_notifications === 'true' || prev.emailNotifications,
          adminEmail: email.admin_email || prev.adminEmail,
          sendOrderConfirmation: email.send_order_confirmation === 'true' || prev.sendOrderConfirmation,
          sendOrderStatusUpdates: email.send_order_status_updates === 'true' || prev.sendOrderStatusUpdates,
          emailFooter: email.email_footer || prev.emailFooter
        }));
        
        setSocialSettings(prev => ({
          ...prev,
          facebook: social.facebook_url || prev.facebook,
          instagram: social.instagram_url || prev.instagram,
          twitter: social.twitter_url || prev.twitter,
          youtube: social.youtube_url || prev.youtube,
          tiktok: social.tiktok_url || prev.tiktok,
          linkedin: social.linkedin_url || prev.linkedin,
          enableSocialIcons: social.enable_social_icons === 'true' || prev.enableSocialIcons,
          shareBtnsOnProduct: social.share_btns_on_product === 'true' || prev.shareBtnsOnProduct
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching store settings:', error);
        setError('Không thể tải cài đặt cửa hàng');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);
  
  // Handle input changes
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleShippingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setShippingSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  const handleEmailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  // Handle input changes for social media settings
  const handleSocialChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSocialSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  // Import settings from JSON file - Cải thiện với xác nhận
  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/json') {
      toast.error('Vui lòng chọn file JSON');
      return;
    }

    setImportFile(file);
    setShowConfirmImport(true);
  };

  // Xác nhận và thực hiện import
  const confirmAndImport = () => {
    if (!importFile) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setSaving(true);
        const settings = JSON.parse(event.target.result);
        
        // Group settings by group name
        const settingsByGroup = {};
        settings.forEach(setting => {
          if (!settingsByGroup[setting.groupName]) {
            settingsByGroup[setting.groupName] = {};
          }
          settingsByGroup[setting.groupName][setting.settingKey] = setting.settingValue;
        });
        
        // Update settings for each group (import)
        const updatePromises = [];
        for (const [groupName, groupSettings] of Object.entries(settingsByGroup)) {
          for (const [key, value] of Object.entries(groupSettings)) {
            updatePromises.push(updateSettingByKey(key, value));
          }
        }
        
        await Promise.all(updatePromises);
        
        toast.success('Nhập cài đặt thành công! Trang đang tải lại...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Error importing settings:', error);
        toast.error('Không thể nhập cài đặt. File không hợp lệ hoặc có lỗi xảy ra!');
      } finally {
        setSaving(false);
        setShowConfirmImport(false);
        setImportFile(null);
      }
    };
    
    reader.readAsText(importFile);
  };
  
  // Hủy việc import
  const cancelImport = () => {
    setShowConfirmImport(false);
    setImportFile(null);
  };

  // Handle file upload for logo - Cải thiện xử lý lỗi
  const handleLogoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh');
        return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 2MB');
        return;
    }

    try {
        const result = await uploadFile(file, 'logo');
        setGeneralSettings(prev => ({
            ...prev,
            storeLogo: result.fileUrl
        }));
        toast.success('Upload logo thành công');
    } catch (error) {
        console.error('Error uploading logo:', error);
        toast.error('Không thể upload logo. Vui lòng thử lại sau.');
    }
  };

  // Handle file upload for favicon - Cải thiện xử lý lỗi
  const handleFaviconFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh');
        return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 1MB');
        return;
    }

    try {
        const result = await uploadFile(file, 'favicon');
        setGeneralSettings(prev => ({
            ...prev,
            storeFavicon: result.fileUrl
        }));
        toast.success('Upload favicon thành công');
    } catch (error) {
        console.error('Error uploading favicon:', error);
        toast.error('Không thể upload favicon. Vui lòng thử lại sau.');
    }
  };

  // Export settings as JSON file for backup
  const handleExportSettings = async () => {
    try {
      setSaving(true);
      const allSettings = await getSettingsByGroup('store');
      const settingsJson = JSON.stringify(allSettings, null, 2);
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link and trigger click
      const a = document.createElement('a');
      a.href = url;
      a.download = `store-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Sao lưu cài đặt thành công!');
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast.error(`Không thể xuất cài đặt: ${error.response?.data || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Kiểm tra tiền tố đơn hàng hiện tại
  const checkCurrentPrefix = async () => {
    try {
      setCheckingPrefix(true);
      const setting = await getSettingsByGroup('order_prefix');
      if (setting) {
        toast.info(`Tiền tố mã đơn hàng hiện tại: "${setting.value}"`);
      } else {
        // Nếu không tìm thấy, thử tạo mới
        try {
          await updateSettingByKey('order_prefix', generalSettings.orderPrefix);
          toast.success('Đã tạo mới tiền tố mã đơn hàng');
        } catch (createError) {
          console.error('Error creating setting:', createError);
          toast.error('Không thể tạo mới tiền tố đơn hàng');
        }
      }
    } catch (error) {
      console.error('Error checking prefix:', error);
      toast.error('Không thể kiểm tra tiền tố đơn hàng');
    } finally {
      setCheckingPrefix(false);
    }
  };
  
  // Lưu tiền tố đơn hàng
  const saveOrderPrefix = async () => {
    try {
      setSaving(true);
      console.log("Saving order prefix:", generalSettings.orderPrefix);
      
      // Sử dụng updateSettingByKey thay vì bulkUpdateSettings
      await updateSettingByKey('order_prefix', generalSettings.orderPrefix);
      
      setSaving(false);
      toast.success('Đã lưu tiền tố mã đơn hàng!');
    } catch (error) {
      console.error('Error saving order prefix:', error);
      setSaving(false);
      
      // Nếu lỗi 404, thử tạo mới cài đặt
      if (error.response && error.response.status === 404) {
        try {
          await updateSettingByKey('order_prefix', generalSettings.orderPrefix);
          toast.success('Đã tạo mới tiền tố mã đơn hàng!');
        } catch (createError) {
          console.error('Error creating setting:', createError);
          toast.error('Không thể tạo mới tiền tố đơn hàng');
        }
      } else {
        toast.error(`Lỗi khi lưu tiền tố mã đơn hàng: ${error.response?.data || error.message}`);
      }
    }
  };

  // Handle form submission - Cải thiện xử lý lỗi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Convert general settings to API format (snake_case keys)
      const generalSettingsData = {
        store_name: generalSettings.storeName,
        store_description: generalSettings.storeDescription,
        store_email: generalSettings.storeEmail,
        store_phone: generalSettings.storePhone,
        logo_url: generalSettings.storeLogo,
        favicon_url: generalSettings.storeFavicon,
        currency_code: generalSettings.currencyCode,
        currency_symbol: generalSettings.currencySymbol,
        order_prefix: generalSettings.orderPrefix
      };
      
      console.log("Saving order prefix:", generalSettings.orderPrefix);
      
      // Save general settings
      for (const [key, value] of Object.entries(generalSettingsData)) {
        await updateSettingByKey(key, value);
      }
      
      // Save other settings based on active tab
      if (activeTab === 'address') {
        const addressSettingsData = {
          address: addressSettings.address,
          city: addressSettings.city,
          district: addressSettings.district,
          zip_code: addressSettings.zipCode,
          country: addressSettings.country
        };
        for (const [key, value] of Object.entries(addressSettingsData)) {
          await updateSettingByKey(key, value);
        }
      } else if (activeTab === 'shipping') {
        const shippingSettingsData = {
          enable_free_shipping: shippingSettings.enableFreeShipping.toString(),
          free_shipping_threshold: shippingSettings.freeShippingThreshold.toString(),
          flat_rate: shippingSettings.flatRate.toString(),
          shipping_from_address: shippingSettings.shippingFromAddress.toString(),
          enable_local_pickup: shippingSettings.enableLocalPickup.toString()
        };
        for (const [key, value] of Object.entries(shippingSettingsData)) {
          await updateSettingByKey(key, value);
        }
      } else if (activeTab === 'email') {
        const emailSettingsData = {
          email_notifications: emailSettings.emailNotifications.toString(),
          admin_email: emailSettings.adminEmail,
          send_order_confirmation: emailSettings.sendOrderConfirmation.toString(),
          send_order_status_updates: emailSettings.sendOrderStatusUpdates.toString(),
          email_footer: emailSettings.emailFooter
        };
        for (const [key, value] of Object.entries(emailSettingsData)) {
          await updateSettingByKey(key, value);
        }
      } else if (activeTab === 'social') {
        const socialSettingsData = {
          facebook_url: socialSettings.facebook,
          instagram_url: socialSettings.instagram,
          twitter_url: socialSettings.twitter,
          youtube_url: socialSettings.youtube,
          tiktok_url: socialSettings.tiktok,
          linkedin_url: socialSettings.linkedin,
          enable_social_icons: socialSettings.enableSocialIcons.toString(),
          share_btns_on_product: socialSettings.shareBtnsOnProduct.toString()
        };
        for (const [key, value] of Object.entries(socialSettingsData)) {
          await updateSettingByKey(key, value);
        }
      }
      
      setSaving(false);
      toast.success('Lưu cài đặt thành công!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaving(false);
      toast.error(`Lỗi khi lưu cài đặt: ${error.response?.data || error.message}`);
    }
  };

  if (loading) {
    return <div className="loading-container">Đang tải cài đặt...</div>;
  }
  
  return (
    <div className="settings-container">
      <div className="page-header">
        <h1>Cài đặt cửa hàng</h1>
        <div className="header-actions">
          <button 
            type="button" 
            className="backup-btn" 
            onClick={() => setShowBackupModal(true)}
            title="Sao lưu / Khôi phục cài đặt"
          >
            <i className="fa fa-sync-alt"></i> Sao lưu / Khôi phục
          </button>
        </div>
      </div>
      
      {/* Backup/Restore Modal */}
      {showBackupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Sao lưu & Khôi phục cài đặt</h3>
              <button 
                type="button" 
                className="close-btn" 
                onClick={() => setShowBackupModal(false)}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="backup-option">
                <h4>Sao lưu cài đặt</h4>
                <p>Tải xuống một bản sao lưu tất cả cài đặt hiện tại của cửa hàng.</p>
                <button 
                  type="button" 
                  className="export-btn"
                  onClick={handleExportSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i> Đang xuất...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-download"></i> Tải xuống bản sao lưu
                    </>
                  )}
                </button>
              </div>
              <div className="backup-option">
                <h4>Khôi phục cài đặt</h4>
                <p>Tải lên file sao lưu để khôi phục cài đặt cửa hàng.</p>
                <p className="warning">
                  <i className="fa fa-exclamation-triangle"></i> Lưu ý: Thao tác này sẽ ghi đè tất cả cài đặt hiện tại!
                </p>
                <input
                  type="file"
                  id="import-file"
                  accept=".json"
                  onChange={handleImportFileChange}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  className="import-btn"
                  onClick={() => document.getElementById('import-file').click()}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i> Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-upload"></i> Chọn file sao lưu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Import Modal */}
      {showConfirmImport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Xác nhận khôi phục cài đặt</h3>
              <button 
                type="button" 
                className="close-btn" 
                onClick={cancelImport}
                disabled={saving}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p className="warning">
                <i className="fa fa-exclamation-triangle"></i> Cảnh báo: Tất cả cài đặt hiện tại sẽ bị ghi đè!
              </p>
              <p>
                Bạn có chắc chắn muốn khôi phục cài đặt từ file 
                <strong> {importFile?.name}</strong>?
              </p>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={cancelImport}
                  disabled={saving}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="button" 
                  className="confirm-btn"
                  onClick={confirmAndImport}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i> Đang khôi phục...
                    </>
                  ) : (
                    'Xác nhận khôi phục'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="settings-content">
        <div className="settings-tabs">
          <button 
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <i className="fa fa-store"></i> Thông tin chung
          </button>
          <button 
            className={`tab-button ${activeTab === 'address' ? 'active' : ''}`}
            onClick={() => setActiveTab('address')}
          >
            <i className="fa fa-map-marker-alt"></i> Địa chỉ
          </button>
          <button 
            className={`tab-button ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            <i className="fa fa-shipping-fast"></i> Vận chuyển
          </button>
          <button 
            className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <i className="fa fa-envelope"></i> Email
          </button>
          <button 
            className={`tab-button ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            <i className="fa fa-share-alt"></i> Mạng xã hội
          </button>
        </div>
        
        <div className="settings-form-container">
          <form onSubmit={handleSubmit}>
            {/* General Settings */}
            <div className={`tab-content ${activeTab === 'general' ? 'active' : ''}`}>
              <h2>Thông tin chung</h2>
              
              <div className="form-group">
                <label htmlFor="storeName">Tên cửa hàng</label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={generalSettings.storeName}
                  onChange={handleGeneralChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="storeDescription">Mô tả cửa hàng</label>
                <textarea
                  id="storeDescription"
                  name="storeDescription"
                  value={generalSettings.storeDescription}
                  onChange={handleGeneralChange}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="storeEmail">Email liên hệ</label>
                  <input
                    type="email"
                    id="storeEmail"
                    name="storeEmail"
                    value={generalSettings.storeEmail}
                    onChange={handleGeneralChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="storePhone">Số điện thoại</label>
                  <input
                    type="text"
                    id="storePhone"
                    name="storePhone"
                    value={generalSettings.storePhone}
                    onChange={handleGeneralChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="logoUrl">Logo</label>
                  <div className="image-upload-container">
                    <input
                      type="text"
                      id="logoUrl"
                      name="logoUrl"
                      value={generalSettings.storeLogo}
                      onChange={handleGeneralChange}
                      placeholder="URL hình ảnh logo"
                    />
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleLogoFileChange}
                    />
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={() => logoFileInputRef.current.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <i className="fa fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa fa-upload"></i>
                      )}
                      {uploadingLogo ? 'Đang tải...' : 'Tải lên'}
                    </button>
                  </div>
                  {generalSettings.storeLogo && (
                    <div className="image-preview">
                      <img src={generalSettings.storeLogo} alt="Logo preview" />
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="faviconUrl">Favicon</label>
                  <div className="image-upload-container">
                    <input
                      type="text"
                      id="faviconUrl"
                      name="faviconUrl"
                      value={generalSettings.storeFavicon}
                      onChange={handleGeneralChange}
                      placeholder="URL hình ảnh favicon"
                    />
                    <input
                      type="file"
                      ref={faviconFileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleFaviconFileChange}
                    />
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={() => faviconFileInputRef.current.click()}
                      disabled={uploadingFavicon}
                    >
                      {uploadingFavicon ? (
                        <i className="fa fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa fa-upload"></i>
                      )}
                      {uploadingFavicon ? 'Đang tải...' : 'Tải lên'}
                    </button>
                  </div>
                  {generalSettings.storeFavicon && (
                    <div className="image-preview small">
                      <img src={generalSettings.storeFavicon} alt="Favicon preview" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="currencyCode">Mã tiền tệ</label>
                  <input
                    type="text"
                    id="currencyCode"
                    name="currencyCode"
                    value={generalSettings.currencyCode}
                    onChange={handleGeneralChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="currencySymbol">Ký hiệu tiền tệ</label>
                  <input
                    type="text"
                    id="currencySymbol"
                    name="currencySymbol"
                    value={generalSettings.currencySymbol}
                    onChange={handleGeneralChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="orderPrefix">Tiền tố mã đơn hàng</label>
                  <div className="form-row-inline">
                    <input
                      type="text"
                      id="orderPrefix"
                      name="orderPrefix"
                      value={generalSettings.orderPrefix}
                      onChange={handleGeneralChange}
                    />
                    <button
                      type="button"
                      className="check-btn"
                      onClick={checkCurrentPrefix}
                      disabled={checkingPrefix}
                    >
                      {checkingPrefix ? (
                        <i className="fa fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa fa-check"></i>
                      )}
                      {checkingPrefix ? 'Đang kiểm tra...' : 'Kiểm tra'}
                    </button>
                    <button 
                      type="button"
                      className="save-btn small-btn"
                      onClick={saveOrderPrefix}
                      disabled={saving}
                    >
                      {saving ? (
                        <i className="fa fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa fa-save"></i>
                      )}
                      {saving ? 'Đang lưu...' : 'Lưu tiền tố'}
                    </button>
                  </div>
                  <small>Tiền tố được thêm vào trước mã đơn hàng (ví dụ: ORD-123456)</small>
                </div>
              </div>
            </div>
            
            {/* Address Settings */}
            <div className={`tab-content ${activeTab === 'address' ? 'active' : ''}`}>
              <h2>Địa chỉ</h2>
              
              <div className="form-group">
                <label htmlFor="address">Địa chỉ</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={addressSettings.address}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">Thành phố</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={addressSettings.city}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="district">Quận/Huyện</label>
                  <input
                    type="text"
                    id="district"
                    name="district"
                    value={addressSettings.district}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="zipCode">Mã bưu điện</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={addressSettings.zipCode}
                    onChange={handleAddressChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="country">Quốc gia</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={addressSettings.country}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Shipping Settings */}
            <div className={`tab-content ${activeTab === 'shipping' ? 'active' : ''}`}>
              <h2>Vận chuyển</h2>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="enableFreeShipping"
                    checked={shippingSettings.enableFreeShipping}
                    onChange={handleShippingChange}
                  />
                  Miễn phí vận chuyển khi đạt giá trị đơn hàng tối thiểu
                </label>
              </div>
              
              {shippingSettings.enableFreeShipping && (
                <div className="form-group">
                  <label htmlFor="freeShippingThreshold">Giá trị tối thiểu</label>
                  <input
                    type="number"
                    id="freeShippingThreshold"
                    name="freeShippingThreshold"
                    value={shippingSettings.freeShippingThreshold}
                    onChange={handleShippingChange}
                    required={shippingSettings.enableFreeShipping}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="flatRate">Phí vận chuyển mặc định</label>
                <input
                  type="number"
                  id="flatRate"
                  name="flatRate"
                  value={shippingSettings.flatRate}
                  onChange={handleShippingChange}
                  required
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="shippingFromAddress"
                    checked={shippingSettings.shippingFromAddress}
                    onChange={handleShippingChange}
                  />
                  Sử dụng địa chỉ cửa hàng làm địa chỉ gửi hàng
                </label>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="enableLocalPickup"
                    checked={shippingSettings.enableLocalPickup}
                    onChange={handleShippingChange}
                  />
                  Cho phép nhận hàng tại cửa hàng
                </label>
              </div>
            </div>
            
            {/* Email Settings */}
            <div className={`tab-content ${activeTab === 'email' ? 'active' : ''}`}>
              <h2>Email</h2>
              
              <div className="email-settings-description">
                <p>
                  <i className="fa fa-info-circle"></i> Cấu hình thông báo email tự động gửi đến khách hàng và admin. 
                  Đảm bảo cài đặt đúng để nâng cao trải nghiệm mua sắm.
                </p>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={emailSettings.emailNotifications}
                    onChange={handleEmailChange}
                  />
                  Bật thông báo email
                </label>
                <small>Gửi email tự động cho các sự kiện như đơn hàng mới, cập nhật trạng thái, v.v.</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="adminEmail">Email quản trị viên</label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  value={emailSettings.adminEmail}
                  onChange={handleEmailChange}
                  required={emailSettings.emailNotifications}
                />
                <small>Email nhận thông báo khi có đơn hàng mới, liên hệ từ khách hàng và các thông báo hệ thống khác</small>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="sendOrderConfirmation"
                    checked={emailSettings.sendOrderConfirmation}
                    onChange={handleEmailChange}
                  />
                  Gửi email xác nhận đơn hàng
                </label>
                <small>Gửi email tự động cho khách hàng khi họ đặt hàng thành công</small>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="sendOrderStatusUpdates"
                    checked={emailSettings.sendOrderStatusUpdates}
                    onChange={handleEmailChange}
                  />
                  Gửi cập nhật trạng thái đơn hàng
                </label>
                <small>Thông báo cho khách hàng khi trạng thái đơn hàng thay đổi (xử lý, đang giao, đã giao, v.v.)</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="emailFooter">Chân trang email</label>
                <textarea
                  id="emailFooter"
                  name="emailFooter"
                  value={emailSettings.emailFooter}
                  onChange={handleEmailChange}
                  rows="4"
                  placeholder="Thông tin liên hệ, địa chỉ cửa hàng, v.v."
                ></textarea>
                <small>Thông tin này sẽ hiển thị ở cuối tất cả các email gửi từ hệ thống</small>
              </div>

              <div className="example-box">
                <h4><i className="fa fa-envelope"></i> Thông báo email được gửi khi:</h4>
                <ul>
                  <li>Khách hàng đăng ký tài khoản mới</li>
                  <li>Khách hàng đặt đơn hàng mới</li>
                  <li>Trạng thái đơn hàng thay đổi</li>
                  <li>Hệ thống xác nhận thanh toán</li>
                  <li>Khách hàng yêu cầu đặt lại mật khẩu</li>
                </ul>
              </div>
            </div>
            
            {/* Social Media Settings */}
            <div className={`tab-content ${activeTab === 'social' ? 'active' : ''}`}>
              <h2>Cài đặt mạng xã hội</h2>
              
              <div className="form-group">
                <div className="form-check-inline">
                  <input
                    type="checkbox"
                    id="enableSocialIcons"
                    name="enableSocialIcons"
                    checked={socialSettings.enableSocialIcons}
                    onChange={handleSocialChange}
                  />
                  <label htmlFor="enableSocialIcons">Hiển thị biểu tượng mạng xã hội trên trang web</label>
                </div>
              </div>
              
              <div className="form-group">
                <div className="form-check-inline">
                  <input
                    type="checkbox"
                    id="shareBtnsOnProduct"
                    name="shareBtnsOnProduct"
                    checked={socialSettings.shareBtnsOnProduct}
                    onChange={handleSocialChange}
                  />
                  <label htmlFor="shareBtnsOnProduct">Hiển thị nút chia sẻ trên trang sản phẩm</label>
                </div>
              </div>
              
              <h3>Liên kết mạng xã hội</h3>
              
              <div className="form-group social-input">
                <label htmlFor="facebook">
                  <i className="fab fa-facebook"></i> Facebook
                </label>
                <input
                  type="url"
                  id="facebook"
                  name="facebook"
                  value={socialSettings.facebook}
                  onChange={handleSocialChange}
                  placeholder="https://facebook.com/your-page"
                />
              </div>
              
              <div className="form-group social-input">
                <label htmlFor="instagram">
                  <i className="fab fa-instagram"></i> Instagram
                </label>
                <input
                  type="url"
                  id="instagram"
                  name="instagram"
                  value={socialSettings.instagram}
                  onChange={handleSocialChange}
                  placeholder="https://instagram.com/your-username"
                />
              </div>
              
              <div className="form-group social-input">
                <label htmlFor="twitter">
                  <i className="fab fa-twitter"></i> Twitter
                </label>
                <input
                  type="url"
                  id="twitter"
                  name="twitter"
                  value={socialSettings.twitter}
                  onChange={handleSocialChange}
                  placeholder="https://twitter.com/your-username"
                />
              </div>
              
              <div className="form-group social-input">
                <label htmlFor="youtube">
                  <i className="fab fa-youtube"></i> YouTube
                </label>
                <input
                  type="url"
                  id="youtube"
                  name="youtube"
                  value={socialSettings.youtube}
                  onChange={handleSocialChange}
                  placeholder="https://youtube.com/channel/your-channel"
                />
              </div>
              
              <div className="form-group social-input">
                <label htmlFor="tiktok">
                  <i className="fab fa-tiktok"></i> TikTok
                </label>
                <input
                  type="url"
                  id="tiktok"
                  name="tiktok"
                  value={socialSettings.tiktok}
                  onChange={handleSocialChange}
                  placeholder="https://tiktok.com/@your-username"
                />
              </div>
              
              <div className="form-group social-input">
                <label htmlFor="linkedin">
                  <i className="fab fa-linkedin"></i> LinkedIn
                </label>
                <input
                  type="url"
                  id="linkedin"
                  name="linkedin"
                  value={socialSettings.linkedin}
                  onChange={handleSocialChange}
                  placeholder="https://linkedin.com/company/your-company"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="save-button" disabled={saving}>
                {saving ? (
                  <>
                    <i className="fa fa-spinner fa-spin"></i> Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="fa fa-save"></i> Lưu cài đặt
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style jsx>{`
        .settings-container {
          padding: 20px;
        }
        
        .page-header {
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .page-header h1 {
          font-size: 24px;
          margin: 0;
          color: #333;
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
        }
        
        .backup-btn {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        
        .backup-btn i {
          margin-right: 8px;
        }
        
        .backup-btn:hover {
          background-color: #5a6268;
        }
        
        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #6c757d;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .backup-option {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .backup-option:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        
        .backup-option h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #333;
        }
        
        .backup-option p {
          margin-bottom: 15px;
          color: #6c757d;
        }
        
        .warning {
          color: #dc3545 !important;
          font-weight: 500;
        }
        
        .warning i {
          margin-right: 8px;
        }
        
        .export-btn, .import-btn {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        
        .export-btn {
          background-color: #28a745;
          color: white;
        }
        
        .export-btn:hover {
          background-color: #218838;
        }
        
        .import-btn {
          background-color: #17a2b8;
          color: white;
        }
        
        .import-btn:hover {
          background-color: #138496;
        }
        
        .export-btn i, .import-btn i {
          margin-right: 8px;
        }
        
        /* Image upload styles */
        .image-upload-container {
          display: flex;
          gap: 10px;
        }
        
        .image-upload-container input[type="text"] {
          flex: 1;
        }
        
        .upload-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background-color 0.3s;
          min-width: 100px;
        }
        
        .upload-btn i {
          margin-right: 6px;
        }
        
        .upload-btn:hover:not(:disabled) {
          background-color: #5a6268;
        }
        
        .upload-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        
        .settings-content {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          display: flex;
          overflow: hidden;
        }
        
        .settings-tabs {
          width: 250px;
          background-color: #f8f9fa;
          padding: 20px 0;
          border-right: 1px solid #e9ecef;
        }
        
        .tab-button {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px 20px;
          text-align: left;
          background: none;
          border: none;
          font-size: 15px;
          color: #495057;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .tab-button i {
          margin-right: 12px;
          width: 20px;
          text-align: center;
        }
        
        .tab-button:hover {
          background-color: rgba(0,0,0,0.03);
        }
        
        .tab-button.active {
          background-color: #007bff;
          color: white;
        }
        
        .settings-form-container {
          flex: 1;
          padding: 30px;
        }
        
        .tab-content {
          display: none;
        }
        
        .tab-content.active {
          display: block;
        }
        
        .tab-content h2 {
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
        .form-group input[type="email"],
        .form-group input[type="number"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-group small {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #6c757d;
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
        
        .bank-details {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
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
        
        .image-preview.small {
          max-width: 50px;
        }
        
        .form-actions {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          text-align: right;
        }
        
        .save-button {
          padding: 10px 24px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .save-button:hover:not(:disabled) {
          background-color: #218838;
        }
        
        .save-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .settings-content {
            flex-direction: column;
          }
          
          .settings-tabs {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #e9ecef;
            padding: 10px 0;
          }
          
          .form-row {
            flex-direction: column;
            gap: 20px;
          }
          
          .form-row .form-group {
            margin-bottom: 0;
          }
        }
        
        /* Social Media Settings */
        .social-input {
          position: relative;
          margin-bottom: 20px;
        }
        
        .social-input label {
          display: flex;
          align-items: center;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .social-input label i {
          margin-right: 8px;
          font-size: 18px;
          width: 24px;
          text-align: center;
        }
        
        .social-input input {
          padding-left: 12px;
          width: 100%;
        }
        
        .fa-facebook {
          color: #3b5998;
        }
        
        .fa-instagram {
          color: #e1306c;
        }
        
        .fa-twitter {
          color: #1da1f2;
        }
        
        .fa-youtube {
          color: #ff0000;
        }
        
        .fa-tiktok {
          color: #000000;
        }
        
        .fa-linkedin {
          color: #0077b5;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        
        .cancel-btn {
          padding: 8px 16px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .cancel-btn:hover:not(:disabled) {
          background-color: #5a6268;
        }
        
        .confirm-btn {
          padding: 8px 16px;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .confirm-btn:hover:not(:disabled) {
          background-color: #c82333;
        }
        
        .export-btn:disabled,
        .import-btn:disabled,
        .cancel-btn:disabled,
        .confirm-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        
        .form-row-inline {
          display: flex;
          gap: 10px;
          margin-bottom: 5px;
        }
        
        .check-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background-color 0.3s;
          white-space: nowrap;
        }
        
        .check-btn i {
          margin-right: 6px;
        }
        
        .check-btn:hover:not(:disabled) {
          background-color: #5a6268;
        }
        
        .check-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        
        .save-btn.small-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background-color 0.3s;
          white-space: nowrap;
        }
        
        .save-btn.small-btn:hover:not(:disabled) {
          background-color: #218838;
        }
        
        .save-btn.small-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        
        .save-btn.small-btn i {
          margin-right: 6px;
        }
        
        /* Email settings */
        .email-settings-description {
          background-color: #f8f9fa;
          border-left: 4px solid #17a2b8;
          padding: 12px 15px;
          margin-bottom: 20px;
          border-radius: 0 4px 4px 0;
        }
        
        .email-settings-description p {
          margin: 0;
          color: #495057;
        }
        
        .form-group small {
          display: block;
          margin-top: 5px;
          color: #6c757d;
          font-size: 13px;
        }
        
        .example-box {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 15px;
          margin-top: 20px;
        }
        
        .example-box h4 {
          font-size: 16px;
          margin-top: 0;
          margin-bottom: 10px;
          color: #495057;
        }
        
        .example-box ul {
          padding-left: 20px;
          margin-bottom: 0;
        }
        
        .example-box li {
          margin-bottom: 5px;
          color: #495057;
        }
      `}</style>
    </div>
  );
};

export default StoreSettings; 