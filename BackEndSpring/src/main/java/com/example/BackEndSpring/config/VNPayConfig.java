package com.example.BackEndSpring.config;

import com.example.BackEndSpring.model.PaymentSettings;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Component
public class VNPayConfig {
    
    // Phương thức lấy địa chỉ IP của người dùng
    public static String getIpAddress(HttpServletRequest request) {
        String ipAddress;
        try {
            ipAddress = request.getHeader("X-FORWARDED-FOR");
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getRemoteAddr();
            }
        } catch (Exception e) {
            ipAddress = "Unknown";
        }
        return ipAddress;
    }

    // Phương thức tạo chuỗi ngẫu nhiên
    public static String getRandomNumber(int len) {
        Random random = new SecureRandom();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    // Phương thức mã hóa HMACSHA512
    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException("Cả khóa và dữ liệu phải khác null");
            }
            
            final Mac hmac = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.US_ASCII);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.US_ASCII);
            byte[] result = hmac.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            
            return sb.toString();
        } catch (Exception ex) {
            // Log toàn bộ lỗi và stack trace
            System.err.println("ERROR in hmacSHA512: " + ex.getMessage());
            ex.printStackTrace();
            return "";
        }
    }

    // Lấy thông tin từ request VNPAY
    public static Map<String, String> getVNPayParameters(HttpServletRequest request) {
        Map<String, String> fields = new HashMap<>();
        
        System.out.println("Get VNPay Parameters - Query String: " + request.getQueryString());
        
        try {
            // Lấy tất cả parameter từ request
            Enumeration<String> paramNames = request.getParameterNames();
            while (paramNames.hasMoreElements()) {
                String paramName = paramNames.nextElement();
                String paramValue = request.getParameter(paramName);
                
                if (paramName.startsWith("vnp_")) {
                    fields.put(paramName, paramValue);
                }
            }
            
            // Log số lượng tham số đã lấy
            System.out.println("VNPay Parameters count: " + fields.size());
            System.out.println("VNPay Parameters: " + fields);
            
        } catch (Exception e) {
            System.err.println("Error in getVNPayParameters: " + e.getMessage());
            e.printStackTrace();
        }
        
        return fields;
    }
} 