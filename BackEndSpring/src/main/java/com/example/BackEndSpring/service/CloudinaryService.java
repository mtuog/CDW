package com.example.BackEndSpring.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Upload file lên Cloudinary
     * 
     * @param file File cần upload
     * @param folder Thư mục trên Cloudinary để lưu file (VD: qr-codes)
     * @return Thông tin file đã upload (bao gồm URL)
     * @throws IOException
     */
    public Map uploadFile(MultipartFile file, String folder) throws IOException {
        // Tạo tên file ngẫu nhiên
        String publicId = folder + "/" + UUID.randomUUID().toString();
        
        // Upload file lên Cloudinary
        Map uploadResult = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "public_id", publicId,
                "resource_type", "auto",
                "folder", folder
            )
        );
        
        return uploadResult;
    }
    
    /**
     * Upload hình ảnh QR code lên Cloudinary
     * 
     * @param file File QR code cần upload
     * @return Thông tin file đã upload (bao gồm URL)
     * @throws IOException
     */
    public Map uploadQRCode(MultipartFile file) throws IOException {
        return uploadFile(file, "qr-codes");
    }
    
    /**
     * Xóa file trên Cloudinary
     * 
     * @param publicId ID công khai của file
     * @return Kết quả xóa file
     * @throws IOException
     */
    public Map deleteFile(String publicId) throws IOException {
        return cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
} 