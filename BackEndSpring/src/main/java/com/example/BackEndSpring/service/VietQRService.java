package com.example.BackEndSpring.service;

import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class VietQRService {

    /**
     * Tạo URL mã QR VietQR từ thông tin tài khoản ngân hàng
     * 
     * @param bankId ID ngân hàng theo chuẩn Napas (VD: 970436 cho Vietcombank)
     * @param accountNo Số tài khoản
     * @param accountName Tên chủ tài khoản
     * @param amount Số tiền (có thể null nếu không cần chỉ định)
     * @param description Nội dung chuyển khoản (có thể null)
     * @return URL để tạo mã QR
     */
    public String generateVietQRUrl(String bankId, String accountNo, String accountName, 
                                    Long amount, String description) {
        try {
            StringBuilder url = new StringBuilder("https://img.vietqr.io/image/");
            url.append(bankId);
            url.append("-");
            url.append(accountNo);
            url.append("-compact");
            
            if (amount != null || description != null) {
                url.append(".png?");
                
                if (amount != null) {
                    url.append("amount=").append(amount);
                }
                
                if (description != null && !description.isEmpty()) {
                    if (amount != null) {
                        url.append("&");
                    }
                    url.append("addInfo=").append(URLEncoder.encode(description, StandardCharsets.UTF_8));
                }
            }
            
            return url.toString();
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo mã VietQR: " + e.getMessage(), e);
        }
    }
    
    /**
     * Danh sách mã ngân hàng theo chuẩn Napas
     * @return Map với key là tên ngân hàng viết tắt, value là mã Napas
     */
    public Map<String, String> getBankCodes() {
        Map<String, String> bankCodes = new HashMap<>();
        
        // Thêm các ngân hàng phổ biến
        bankCodes.put("VCB", "970436"); // Vietcombank
        bankCodes.put("TCB", "970407"); // Techcombank
        bankCodes.put("VIB", "970441"); // VIB
        bankCodes.put("VPB", "970432"); // VPBank
        bankCodes.put("BIDV", "970418"); // BIDV
        bankCodes.put("MB", "970422"); // MBBank
        bankCodes.put("ACB", "970416"); // ACB
        bankCodes.put("TPB", "970423"); // TPBank
        bankCodes.put("STB", "970403"); // Sacombank
        
        return bankCodes;
    }
} 