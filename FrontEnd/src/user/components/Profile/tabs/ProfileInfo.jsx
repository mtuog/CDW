import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../../config';
import Swal from 'sweetalert2';
import { getUserById, updateUser } from '../../../../api/userApi';

const ProfileInfo = ({ user, setUser, refreshUserProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || user.phoneNumber || '',
        address: user.address || '',
        gender: user.gender || '1',
        dateOfBirth: user.dateOfBirth || user.dob || ''
    });

    // Update formData when user data changes
    useEffect(() => {
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || user.phoneNumber || '',
            address: user.address || '',
            gender: user.gender || '1',
            dateOfBirth: user.dateOfBirth || user.dob || ''
        });
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const syncAddressFromAddressBook = async () => {
        try {
            const token = localStorage.getItem('token');
            
            console.log('Starting address sync for user:', user.id);
            
            // Test API endpoint trước
            const testResponse = await axios.get(
                `${BACKEND_URL_HTTP}/api/address-book/debug/${user.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            ).catch(err => {
                console.log('Debug endpoint not available, proceeding with main endpoint');
                return null;
            });
            
            if (testResponse) {
                console.log('Debug response:', testResponse.data);
            }
            
            // Gọi API chính để lấy danh sách địa chỉ
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/address-book/user/${user.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            console.log('Address API response:', response.data);
            
            if (response.status === 200 && response.data && Array.isArray(response.data) && response.data.length > 0) {
                // Tìm địa chỉ mặc định hoặc lấy địa chỉ đầu tiên
                const defaultAddress = response.data.find(addr => addr.isDefault) || response.data[0];
                
                console.log('Selected address for sync:', defaultAddress);
                
                // Tạo địa chỉ đầy đủ
                const fullAddress = [
                    defaultAddress.addressLine1,
                    defaultAddress.addressLine2,
                    defaultAddress.city,
                    defaultAddress.state,
                    defaultAddress.postalCode,
                    defaultAddress.country
                ].filter(Boolean).join(', ');
                
                console.log('Generated full address:', fullAddress);
                
                // Cập nhật user profile với địa chỉ mới
                const updateResponse = await axios.put(
                    `${BACKEND_URL_HTTP}/api/users/${user.id}`,
                    {
                        username: user.username,
                        email: user.email,
                        fullName: user.fullName,
                        phone: user.phone,
                        address: fullAddress,
                        verified: user.verified || user.isVerified || true
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (updateResponse.status === 200) {
                    // Refresh toàn bộ thông tin user từ server
                    if (refreshUserProfile) {
                        await refreshUserProfile();
                    } else {
                        // Fallback nếu không có refreshUserProfile
                        const updatedUser = { ...user, address: fullAddress };
                        setUser(updatedUser);
                        setFormData(prev => ({ ...prev, address: fullAddress }));
                    }
                    
                    Swal.fire({
                        title: 'Thành công!',
                        text: 'Đã cập nhật địa chỉ từ sổ địa chỉ',
                        icon: 'success',
                        confirmButtonText: 'Đóng'
                    });
                }
            } else {
                Swal.fire({
                    title: 'Thông báo',
                    text: 'Không tìm thấy địa chỉ trong sổ địa chỉ. Hãy thêm địa chỉ mới trong tab "Sổ địa chỉ".',
                    icon: 'info',
                    confirmButtonText: 'Đóng'
                });
            }
        } catch (error) {
            console.error('Error syncing address:', error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                url: error.config?.url
            });
            
            let errorMessage = 'Không thể đồng bộ địa chỉ từ sổ địa chỉ';
            let showCreateTableOption = false;
            
            if (error.response?.status === 404) {
                errorMessage = 'Không tìm thấy sổ địa chỉ. Hãy thêm địa chỉ mới trước.';
            } else if (error.response?.status === 500) {
                const errorData = error.response?.data;
                if (errorData?.message && (
                    errorData.message.includes('Table') && errorData.message.includes('doesn\'t exist') ||
                    errorData.message.includes('address_book')
                )) {
                    errorMessage = 'Bảng sổ địa chỉ chưa được tạo trong cơ sở dữ liệu. Vui lòng liên hệ quản trị viên để tạo bảng.';
                    showCreateTableOption = true;
                } else {
                    errorMessage = 'Lỗi server khi truy xuất sổ địa chỉ. Vui lòng thử lại sau.';
                }
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
            }
            
            if (showCreateTableOption) {
                Swal.fire({
                    title: 'Cơ sở dữ liệu chưa sẵn sàng',
                    html: `
                        <p>${errorMessage}</p>
                        <br>
                        <p><strong>Giải pháp tạm thời:</strong> Bạn có thể nhập địa chỉ trực tiếp trong ô "Địa chỉ" bên dưới.</p>
                    `,
                    icon: 'warning',
                    confirmButtonText: 'Hiểu rồi'
                });
            } else {
                Swal.fire({
                    title: 'Lỗi!',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'Đóng'
                });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.put(
                `${BACKEND_URL_HTTP}/api/users/${user.id}`, 
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.status === 200) {
                // Refresh toàn bộ thông tin user từ server để đảm bảo đồng bộ
                if (refreshUserProfile) {
                    await refreshUserProfile();
                } else {
                    // Fallback nếu không có refreshUserProfile
                    setUser(prev => ({
                        ...prev,
                        fullName: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        phoneNumber: formData.phone,
                        address: formData.address,
                        gender: formData.gender,
                        dateOfBirth: formData.dateOfBirth,
                        dob: formData.dateOfBirth
                    }));
                }
                
                setIsEditing(false);
                
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Thông tin cá nhân đã được cập nhật',
                    icon: 'success',
                    confirmButtonText: 'Đóng'
                });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            
            Swal.fire({
                title: 'Lỗi!',
                text: error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật thông tin',
                icon: 'error',
                confirmButtonText: 'Đóng'
            });
        }
    };

    return (
        <div className="profile-info">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Thông tin cá nhân</h4>
                {!isEditing && (
                    <div>
                        <button 
                            className="btn btn-sm btn-outline-secondary me-2"
                            onClick={syncAddressFromAddressBook}
                        >
                            <i className="fa fa-sync me-1"></i> Đồng bộ địa chỉ từ sổ địa chỉ
                        </button>
                        <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setIsEditing(true)}
                        >
                            <i className="fa fa-edit"></i> Chỉnh sửa
                        </button>
                    </div>
                )}
            </div>
            
            {isEditing ? (
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="fullName">Họ và tên</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    readOnly
                                />
                                <small className="form-text text-muted">Email không thể thay đổi</small>
                            </div>
                        </div>
                    </div>
                    
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="phone">Số điện thoại</label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="dateOfBirth">Ngày sinh</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="address">Địa chỉ</label>
                        <input
                            type="text"
                            className="form-control"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Giới tính</label>
                        <div>
                            <div className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="gender"
                                    id="genderMale"
                                    value="1"
                                    checked={formData.gender === '1' || formData.gender === 1}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor="genderMale">Nam</label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="gender"
                                    id="genderFemale"
                                    value="2"
                                    checked={formData.gender === '2' || formData.gender === 2}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor="genderFemale">Nữ</label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="gender"
                                    id="genderOther"
                                    value="3"
                                    checked={formData.gender === '3' || formData.gender === 3}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor="genderOther">Khác</label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="d-flex mt-4">
                        <button type="submit" className="btn btn-primary me-2">
                            Lưu thay đổi
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => {
                                setFormData({
                                    fullName: user.fullName || '',
                                    email: user.email || '',
                                    phone: user.phone || user.phoneNumber || '',
                                    address: user.address || '',
                                    gender: user.gender || '1',
                                    dateOfBirth: user.dateOfBirth || user.dob || ''
                                });
                                setIsEditing(false);
                            }}
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            ) : (
                <div className="profile-details">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="profile-detail-item">
                                <label>Họ và tên</label>
                                <p style={{ color: '#333' }}>{user.fullName || 'Chưa cập nhật'}</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="profile-detail-item">
                                <label>Email</label>
                                <p style={{ color: '#333' }}>{user.email}</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="profile-detail-item">
                                <label>Số điện thoại</label>
                                <p style={{ color: '#333' }}>{user.phone || user.phoneNumber || 'Chưa cập nhật'}</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="profile-detail-item">
                                <label>Ngày sinh</label>
                                <p style={{ color: '#333' }}>{user.dateOfBirth || user.dob || 'Chưa cập nhật'}</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="profile-detail-item">
                                <label>Địa chỉ</label>
                                <p style={{ color: '#333' }}>{user.address || 'Chưa cập nhật'}</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="profile-detail-item">
                                <label>Giới tính</label>
                                <p style={{ color: '#333' }}>
                                    {user.gender === '1' || user.gender === 1 ? 'Nam' : 
                                     user.gender === '2' || user.gender === 2 ? 'Nữ' : 'Khác'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileInfo; 