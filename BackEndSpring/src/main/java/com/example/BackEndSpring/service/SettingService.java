package com.example.BackEndSpring.service;

import com.example.BackEndSpring.model.Setting;
import com.example.BackEndSpring.repository.SettingRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

@Service
public class SettingService {

    private final SettingRepository settingRepository;

    @Autowired
    public SettingService(SettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }
    
    /**
     * Khởi tạo các cài đặt mặc định nếu chưa tồn tại
     * Phương thức này chạy sau khi bean được khởi tạo
     */
    @PostConstruct
    @Transactional
    public void initDefaultSettings() {
        System.out.println("Initializing default settings...");
        
        // Định nghĩa cài đặt mặc định theo nhóm
        Map<String, Map<String, String>> defaultSettings = new HashMap<>();
        
        // General settings
        Map<String, String> generalSettings = new HashMap<>();
        generalSettings.put("store_name", "Fashion Store");
        generalSettings.put("store_description", "Cửa hàng thời trang cao cấp");
        generalSettings.put("store_email", "contact@fashionstore.com");
        generalSettings.put("store_phone", "0912345678");
        generalSettings.put("logo_url", "");
        generalSettings.put("favicon_url", "");
        generalSettings.put("currency_code", "VND");
        generalSettings.put("currency_symbol", "₫");
        generalSettings.put("order_prefix", "ORD-");
        defaultSettings.put("general", generalSettings);
        
        // Address settings
        Map<String, String> addressSettings = new HashMap<>();
        addressSettings.put("address", "123 Đường Lê Lợi");
        addressSettings.put("city", "TP. Hồ Chí Minh");
        addressSettings.put("district", "Quận 1");
        addressSettings.put("zip_code", "70000");
        addressSettings.put("country", "Việt Nam");
        defaultSettings.put("address", addressSettings);
        
        // Payment settings
        Map<String, String> paymentSettings = new HashMap<>();
        paymentSettings.put("enable_cod", "true");
        paymentSettings.put("enable_bank_transfer", "true");
        paymentSettings.put("bank_name", "Vietcombank");
        paymentSettings.put("account_number", "");
        paymentSettings.put("account_name", "");
        paymentSettings.put("payment_instructions", "");
        defaultSettings.put("payment", paymentSettings);
        
        // Shipping settings
        Map<String, String> shippingSettings = new HashMap<>();
        shippingSettings.put("enable_free_shipping", "false");
        shippingSettings.put("free_shipping_threshold", "500000");
        shippingSettings.put("flat_rate", "30000");
        shippingSettings.put("shipping_from_address", "true");
        shippingSettings.put("enable_local_pickup", "false");
        defaultSettings.put("shipping", shippingSettings);
        
        // Email settings
        Map<String, String> emailSettings = new HashMap<>();
        emailSettings.put("email_notifications", "true");
        emailSettings.put("admin_email", "admin@fashionstore.com");
        emailSettings.put("send_order_confirmation", "true");
        emailSettings.put("send_order_status_updates", "true");
        emailSettings.put("email_footer", "");
        defaultSettings.put("email", emailSettings);
        
        // Social settings
        Map<String, String> socialSettings = new HashMap<>();
        socialSettings.put("facebook_url", "");
        socialSettings.put("instagram_url", "");
        socialSettings.put("twitter_url", "");
        socialSettings.put("youtube_url", "");
        socialSettings.put("tiktok_url", "");
        socialSettings.put("linkedin_url", "");
        socialSettings.put("enable_social_icons", "true");
        socialSettings.put("share_btns_on_product", "true");
        defaultSettings.put("social", socialSettings);
        
        // Duyệt qua từng nhóm và kiểm tra/tạo cài đặt
        for (Map.Entry<String, Map<String, String>> groupEntry : defaultSettings.entrySet()) {
            String groupName = groupEntry.getKey();
            Map<String, String> settings = groupEntry.getValue();
            
            for (Map.Entry<String, String> settingEntry : settings.entrySet()) {
                String key = settingEntry.getKey();
                String defaultValue = settingEntry.getValue();
                
                // Kiểm tra xem cài đặt đã tồn tại chưa
                Optional<Setting> existingSetting = settingRepository.findBySettingKey(key);
                if (existingSetting.isEmpty()) {
                    System.out.println("Creating default setting: " + key + " = " + defaultValue);
                    Setting setting = new Setting();
                    setting.setSettingKey(key);
                    setting.setSettingValue(defaultValue);
                    setting.setGroupName(groupName);
                    setting.setCreatedAt(LocalDateTime.now());
                    setting.setUpdatedAt(LocalDateTime.now());
                    settingRepository.save(setting);
                }
            }
        }
        
        System.out.println("Default settings initialization completed.");
    }

    public List<Setting> getAllSettings() {
        return settingRepository.findAll();
    }

    public Optional<Setting> getSettingById(Long id) {
        return settingRepository.findById(id);
    }

    public Optional<Setting> getSettingByKey(String key) {
        return settingRepository.findBySettingKey(key);
    }

    public List<Setting> getSettingsByGroup(String groupName) {
        return settingRepository.findByGroupName(groupName);
    }

    public String getSettingValue(String key, String defaultValue) {
        Optional<Setting> setting = settingRepository.findBySettingKey(key);
        return setting.map(Setting::getSettingValue).orElse(defaultValue);
    }

    @Transactional
    public Setting createSetting(Setting setting) {
        if (settingRepository.existsBySettingKey(setting.getSettingKey())) {
            throw new RuntimeException("Setting key already exists: " + setting.getSettingKey());
        }
        
        setting.setCreatedAt(LocalDateTime.now());
        setting.setUpdatedAt(LocalDateTime.now());
        return settingRepository.save(setting);
    }

    @Transactional
    public Setting updateSetting(String key, String value) {
        Optional<Setting> settingOpt = settingRepository.findBySettingKey(key);
        if (settingOpt.isPresent()) {
            Setting setting = settingOpt.get();
            setting.setSettingValue(value);
            setting.setUpdatedAt(LocalDateTime.now());
            return settingRepository.save(setting);
        }
        throw new RuntimeException("Setting not found with key: " + key);
    }

    @Transactional
    public Setting updateSetting(Long id, Setting settingDetails) {
        Setting setting = settingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Setting not found with id: " + id));
        
        // Check if key is being changed and if it already exists
        if (!setting.getSettingKey().equals(settingDetails.getSettingKey()) 
                && settingRepository.existsBySettingKey(settingDetails.getSettingKey())) {
            throw new RuntimeException("Setting key already exists: " + settingDetails.getSettingKey());
        }
        
        setting.setSettingKey(settingDetails.getSettingKey());
        setting.setSettingValue(settingDetails.getSettingValue());
        setting.setGroupName(settingDetails.getGroupName());
        setting.setUpdatedAt(LocalDateTime.now());
        
        return settingRepository.save(setting);
    }

    @Transactional
    public void deleteSetting(Long id) {
        settingRepository.deleteById(id);
    }
} 