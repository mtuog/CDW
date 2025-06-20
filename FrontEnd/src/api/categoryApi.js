import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Tạo axios instance với timeout cao cho translation
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 giây
  headers: {
    'Content-Type': 'application/json'
  }
});

// Hàm lấy tất cả danh mục
export const getAllCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Hàm lấy tất cả danh mục với dịch
export const getAllCategoriesTranslated = async (language = 'vi') => {
  try {
    const response = await apiClient.get(`/categories/translated?lang=${language}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching translated categories:', error);
    throw error;
  }
};

// Hàm lấy danh mục theo ID
export const getCategoryById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category with ID ${id}:`, error);
    throw error;
  }
};

// Hàm lấy danh mục theo tên
export const getCategoryByName = async (name) => {
  try {
    const response = await axios.get(`${API_URL}/categories/name/${name}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category with name ${name}:`, error);
    throw error;
  }
};

// Hàm tạo danh mục mới
export const createCategory = async (categoryData) => {
  try {
    const response = await axios.post(`${API_URL}/categories`, categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Hàm cập nhật danh mục
export const updateCategory = async (id, categoryData) => {
  try {
    const response = await axios.put(`${API_URL}/categories/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error(`Error updating category with ID ${id}:`, error);
    throw error;
  }
};

// Hàm xóa danh mục
export const deleteCategory = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error);
    throw error;
  }
};

// Hàm lấy danh mục với dịch dựa trên ngôn ngữ
export const getCategoriesWithTranslation = async (language = 'vi') => {
  try {
    if (language === 'vi') {
      return await getAllCategories();
    } else {
      return await getAllCategoriesTranslated(language);
    }
  } catch (error) {
    console.error('Error fetching categories with translation:', error);
    throw error;
  }
};

export default {
  getAllCategories,
  getAllCategoriesTranslated,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesWithTranslation
}; 