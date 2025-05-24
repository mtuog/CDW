import axios from 'axios';
import { BACKEND_URL_HTTP, CORS_CONFIG } from '../config';

const API_URL = `${BACKEND_URL_HTTP}/api`;

/**
 * Upload một file (hình ảnh, tài liệu, v.v.)
 * @param {File} file File cần upload
 * @param {string} type Loại file (logo, favicon, product, general, v.v.)
 * @returns {Promise<Object>} Thông tin file đã upload
 */
export const uploadFile = async (file, type = 'general') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Sử dụng API endpoint khác nhau dựa vào loại file
    let endpoint = '/upload'; // Endpoint mặc định cho hình ảnh sản phẩm
    
    if (type === 'qr-code') {
      endpoint = '/files/upload/qr-code';
    }
    
    const headers = {
      ...CORS_CONFIG.headers,
      'Content-Type': 'multipart/form-data'
    };
    
    const response = await axios.post(`${API_URL}${endpoint}`, formData, {
      ...CORS_CONFIG,
      headers
    });
    
    const data = response.data;
    
    // Chuẩn hóa đầu ra để bảo đảm tính nhất quán
    return {
      fileUrl: data.url || data.fileDownloadUri,
      filename: data.publicId,
      originalFilename: file.name,
      size: file.size,
      contentType: file.type
    };
  } catch (error) {
    console.error(`Error uploading file:`, error);
    throw error;
  }
};

/**
 * Xóa một file đã upload
 * @param {string} fileUrl URL của file cần xóa
 * @returns {Promise<Object>} Kết quả xóa file
 */
export const deleteFile = async (fileUrl) => {
  try {
    const response = await axios.delete(`${API_URL}/files/delete`, {
      params: { url: fileUrl },
      ...CORS_CONFIG
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error deleting file:`, error);
    throw error;
  }
}; 