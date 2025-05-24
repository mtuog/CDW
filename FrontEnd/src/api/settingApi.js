import axios from 'axios';
import { BACKEND_URL_HTTP, CORS_CONFIG } from '../config';

const API_URL = `${BACKEND_URL_HTTP}/api/settings`;

/**
 * Lấy tất cả các thiết lập
 * @returns {Promise<Array>} Danh sách thiết lập
 */
export const getAllSettings = async () => {
  try {
    const response = await axios.get(API_URL, CORS_CONFIG);
    return response.data;
  } catch (error) {
    console.error('Error in getAllSettings:', error);
    throw error;
  }
};

/**
 * Lấy thiết lập theo nhóm
 * @param {string} groupName Tên nhóm thiết lập
 * @returns {Promise<Array>} Danh sách thiết lập thuộc nhóm
 */
export const getSettingsByGroup = async (groupName) => {
  try {
    const response = await axios.get(`${API_URL}/group/${groupName}`, CORS_CONFIG);
    return response.data;
  } catch (error) {
    console.error(`Error in getSettingsByGroup(${groupName}):`, error);
    throw error;
  }
};

/**
 * Lấy thiết lập theo key
 * @param {string} key Khóa thiết lập
 * @returns {Promise<Object>} Thiết lập
 */
export const getSettingByKey = async (key) => {
  try {
    const response = await axios.get(`${API_URL}/key/${key}`, CORS_CONFIG);
    return response.data;
  } catch (error) {
    console.error(`Error in getSettingByKey(${key}):`, error);
    throw error;
  }
};

/**
 * Cập nhật giá trị thiết lập theo key
 * @param {string} key Khóa thiết lập
 * @param {string} value Giá trị mới
 * @returns {Promise<Object>} Thiết lập đã cập nhật
 */
export const updateSettingByKey = async (key, value) => {
  try {
    const response = await axios.put(`${API_URL}/key/${key}`, { value }, CORS_CONFIG);
    return response.data;
  } catch (error) {
    console.error(`Error in updateSettingByKey(${key}):`, error);
    throw error;
  }
};

/**
 * Tạo thiết lập mới
 * @param {Object} setting Thiết lập cần tạo
 * @returns {Promise<Object>} Thiết lập đã tạo
 */
export const createSetting = async (setting) => {
  try {
    const response = await axios.post(API_URL, setting, CORS_CONFIG);
    return response.data;
  } catch (error) {
    console.error('Error in createSetting:', error);
    throw error;
  }
};

/**
 * Cập nhật nhiều thiết lập cùng lúc
 * @param {Object} settingsData Dữ liệu thiết lập theo cặp key:value
 * @param {string} groupName Tên nhóm thiết lập
 * @returns {Promise<Array>} Kết quả cập nhật
 */
export const bulkUpdateSettings = async (settingsData, groupName) => {
  console.log('bulkUpdateSettings - data:', settingsData, 'group:', groupName);
  
  const promises = Object.entries(settingsData).map(([key, value]) => {
    console.log(`Updating setting: ${key} = ${value}`);
    return axios.put(`${API_URL}/key/${key}`, { value }, CORS_CONFIG)
    .catch(error => {
      // Nếu không tìm thấy, tạo mới
      if (error.response && error.response.status === 404) {
        console.log(`Setting ${key} not found, creating new...`);
        return createSetting({
          settingKey: key,
          settingValue: value,
          groupName: groupName
        });
      }
      console.error(`Error updating setting ${key}:`, error);
      throw error;
    });
  });
  
  try {
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error in bulkUpdateSettings:', error);
    throw error;
  }
}; 