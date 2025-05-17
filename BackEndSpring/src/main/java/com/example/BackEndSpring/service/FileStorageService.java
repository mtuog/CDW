package com.example.BackEndSpring.service;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;
    
    /**
     * Khởi tạo thư mục uploads khi ứng dụng khởi động
     */
    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("Created base upload directory: " + uploadPath);
            }
            
            // Tạo thư mục con cho QR codes
            Path qrPath = Paths.get(uploadDir, "qr-codes");
            if (!Files.exists(qrPath)) {
                Files.createDirectories(qrPath);
                System.out.println("Created QR codes directory: " + qrPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directories", e);
        }
    }

    /**
     * Lưu file vào thư mục chỉ định
     * 
     * @param file File cần lưu
     * @param subFolder Thư mục con để lưu file
     * @return Tên file được tạo
     * @throws Exception
     */
    public String storeFile(MultipartFile file, String subFolder) throws Exception {
        // Normalize file name
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        
        // Tạo tên file ngẫu nhiên để tránh trùng lặp
        String fileExtension = "";
        if (originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String newFileName = UUID.randomUUID().toString() + fileExtension;
        
        try {
            // Tạo thư mục nếu chưa tồn tại
            Path uploadPath = Paths.get(uploadDir, subFolder);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("Created directory: " + uploadPath);
            }
            
            // Lưu file vào thư mục
            Path targetLocation = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            return newFileName;
        } catch (IOException ex) {
            throw new Exception("Không thể lưu file " + originalFileName, ex);
        }
    }
    
    /**
     * Lấy file dưới dạng Resource
     * 
     * @param subFolder Thư mục con chứa file
     * @param fileName Tên file cần tải
     * @return Resource của file
     * @throws Exception
     */
    public Resource loadFileAsResource(String subFolder, String fileName) throws Exception {
        try {
            Path filePath = Paths.get(uploadDir, subFolder).resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new Exception("File not found " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new Exception("File not found " + fileName, ex);
        }
    }
    
    /**
     * Lấy file dưới dạng mảng byte
     * 
     * @param subFolder Thư mục con chứa file
     * @param fileName Tên file cần tải
     * @return Mảng byte của file
     * @throws Exception
     */
    public byte[] loadFileAsBytes(String subFolder, String fileName) throws Exception {
        try {
            Path filePath = Paths.get(uploadDir, subFolder).resolve(fileName).normalize();
            File file = filePath.toFile();
            if (file.exists()) {
                return Files.readAllBytes(filePath);
            } else {
                throw new Exception("File not found " + fileName);
            }
        } catch (IOException ex) {
            throw new Exception("Could not read file " + fileName, ex);
        }
    }
} 