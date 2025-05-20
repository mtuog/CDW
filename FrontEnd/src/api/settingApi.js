import axios from 'axios';
import { BACKEND_URL_HTTP } from '../config';

const API_URL = `http://${BACKEND_URL_HTTP}/api/settings`;

/**
 * Lấy tất cả các thiết lập
 * @returns {Promise<Array>} Danh sách thiết lập
 */
export const getAllSettings = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

/**
 * Lấy thiết lập theo nhóm
 * @param {string} groupName Tên nhóm thiết lập
 * @returns {Promise<Array>} Danh sách thiết lập thuộc nhóm
 */
export const getSettingsByGroup = async (groupName) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/group/${groupName}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

/**
 * Lấy thiết lập theo key
 * @param {string} key Khóa thiết lập
 * @returns {Promise<Object>} Thiết lập
 */
export const getSettingByKey = async (key) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/key/${key}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

/**
 * Cập nhật giá trị thiết lập theo key
 * @param {string} key Khóa thiết lập
 * @param {string} value Giá trị mới
 * @returns {Promise<Object>} Thiết lập đã cập nhật
 */
export const updateSettingByKey = async (key, value) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/key/${key}`, { value }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

/**
 * Tạo thiết lập mới
 * @param {Object} setting Thiết lập cần tạo
 * @returns {Promise<Object>} Thiết lập đã tạo
 */
export const createSetting = async (setting) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(API_URL, setting, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

/**
 * Cập nhật nhiều thiết lập cùng lúc
 * @param {Object} settingsData Dữ liệu thiết lập theo cặp key:value
 * @param {string} groupName Tên nhóm thiết lập
 * @returns {Promise<Array>} Kết quả cập nhật
 */
export const bulkUpdateSettings = async (settingsData, groupName) => {
  const token = localStorage.getItem('token');
  console.log('bulkUpdateSettings - data:', settingsData, 'group:', groupName);
  
  const promises = Object.entries(settingsData).map(([key, value]) => {
    console.log(`Updating setting: ${key} = ${value}`);
    return axios.put(`${API_URL}/key/${key}`, { value }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
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
  
  return Promise.all(promises);
}; 