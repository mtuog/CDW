const axios = require('axios');

const BACKEND_URL = 'http://localhost:8080';

async function testNotificationAPI() {
    try {
        console.log('🔍 Testing Notification API...\n');

        // 1. Đăng nhập admin
        console.log('1. Đăng nhập admin...');
        const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/admin/login`, {
            username: 'admin',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Đăng nhập thành công\n');

        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. Test unread count
        console.log('2. Kiểm tra số lượng thông báo chưa đọc...');
        try {
            const countResponse = await axios.get(`${BACKEND_URL}/api/admin/notifications/unread/count`, { headers });
            console.log(`✅ Số thông báo chưa đọc: ${countResponse.data.count}\n`);
        } catch (error) {
            console.error(`❌ Lỗi unread count: ${error.response?.status} - ${error.response?.data?.message || error.message}\n`);
        }

        // 3. Test get all notifications
        console.log('3. Lấy tất cả thông báo...');
        try {
            const allResponse = await axios.get(`${BACKEND_URL}/api/admin/notifications?page=0&size=10`, { headers });
            console.log(`✅ Tìm thấy ${allResponse.data.content?.length || 0} thông báo`);
            console.log(`   Tổng số: ${allResponse.data.totalElements || 0}\n`);
        } catch (error) {
            console.error(`❌ Lỗi get all: ${error.response?.status} - ${error.response?.data?.message || error.message}\n`);
        }

        // 4. Test unread notifications
        console.log('4. Lấy thông báo chưa đọc...');
        try {
            const unreadResponse = await axios.get(`${BACKEND_URL}/api/admin/notifications/unread`, { headers });
            console.log(`✅ Tìm thấy ${unreadResponse.data.length} thông báo chưa đọc\n`);
        } catch (error) {
            console.error(`❌ Lỗi unread: ${error.response?.status} - ${error.response?.data?.message || error.message}\n`);
        }

        // 5. Test by type
        console.log('5. Lấy thông báo theo loại SYSTEM...');
        try {
            const typeResponse = await axios.get(`${BACKEND_URL}/api/admin/notifications/type/SYSTEM`, { headers });
            console.log(`✅ Tìm thấy ${typeResponse.data.length} thông báo SYSTEM\n`);
        } catch (error) {
            console.error(`❌ Lỗi by type: ${error.response?.status} - ${error.response?.data?.message || error.message}\n`);
        }

        console.log('🎉 Test hoàn thành!');

    } catch (error) {
        console.error('❌ Lỗi đăng nhập:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('\n💡 Backend có thể chưa chạy hoặc endpoint không tồn tại');
        }
        
        if (error.response?.status === 401) {
            console.log('\n💡 Lỗi xác thực - kiểm tra username/password');
        }
    }
}

testNotificationAPI(); 