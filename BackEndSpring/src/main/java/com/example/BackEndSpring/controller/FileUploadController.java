package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true",
        allowedHeaders = {"authorization", "content-type", "x-auth-token", "origin", "x-requested-with", "accept"},
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api")
public class FileUploadController {

    @Autowired
    private CloudinaryService cloudinaryService;

    /**
     * Upload ảnh QR cho tài khoản ngân hàng
     */
    @PostMapping("/files/upload/qr-code")
    public ResponseEntity<?> uploadQRCodeImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Không có file nào được chọn"
                ));
            }

            // Kiểm tra loại file
            if (!file.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Chỉ hỗ trợ upload file hình ảnh"
                ));
            }

            // Upload file lên Cloudinary
            Map uploadResult = cloudinaryService.uploadQRCode(file);
            
            // Lấy URL từ kết quả
            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("publicId", publicId);
            response.put("fileDownloadUri", secureUrl);
            response.put("fileType", file.getContentType());
            response.put("size", file.getSize());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Không thể upload file: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Upload ảnh sản phẩm
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadProductImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Không có file nào được chọn"
                ));
            }

            // Kiểm tra loại file
            if (!file.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Chỉ hỗ trợ upload file hình ảnh"
                ));
            }

            // Upload file lên Cloudinary
            Map uploadResult = cloudinaryService.uploadFile(file, "products");
            
            // Lấy URL từ kết quả
            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("publicId", publicId);
            response.put("url", secureUrl);
            response.put("fileType", file.getContentType());
            response.put("size", file.getSize());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Không thể upload file: " + e.getMessage()
            ));
        }
    }
} 