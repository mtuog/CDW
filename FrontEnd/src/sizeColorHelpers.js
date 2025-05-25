import axios from 'axios';
import { BACKEND_URL_HTTP } from './config';

// Các size có sẵn
const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

// Các màu có sẵn
const colors = ['Trắng', 'Đen', 'Xanh dương', 'Xanh lá', 'Đỏ', 'Vàng'];

// Cache để lưu trữ danh sách sizes đã lấy từ API
const sizeCache = {};

// Hàm trả về các size có sẵn cho sản phẩm dựa vào ID
export const findProductSizesById = async (id) => {
    // Nếu đã có trong cache thì trả về luôn
    if (sizeCache[id]) {
        return sizeCache[id];
    }
    
    try {
        // Gọi API để lấy danh sách sizes từ backend
        const response = await axios.get(`${BACKEND_URL_HTTP}/api/products/${id}/sizes`);
        
        if (response.status === 200) {
            // Lưu vào cache
            sizeCache[id] = response.data;
            return response.data;
        }
    } catch (error) {
        console.error(`Error fetching sizes for product ${id}:`, error);
        // Trả về danh sách mặc định nếu có lỗi
        return [];
    }
    
    // Trả về mảng rỗng nếu không tìm thấy
    return [];
};

// Hàm trả về các màu có sẵn cho sản phẩm dựa vào ID
export const findProductColorsById = (id) => {
    // Giả lập dữ liệu màu cho tất cả sản phẩm
    // Trong thực tế, bạn nên lấy dữ liệu này từ API
    return colors;
}; 