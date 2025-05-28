import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../../config';
import Swal from 'sweetalert2';

const AddressBook = ({ user, refreshUserProfile }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        addressLine: '',
        city: '',
        district: '',
        ward: '',
        isDefault: false
    });
    
    useEffect(() => {
        fetchAddresses();
    }, [user]);
    
    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userId = user.id;
            
            if (!token || !userId) {
                throw new Error('Bạn cần đăng nhập để xem địa chỉ');
            }
            
            // Gọi API mới
            const response = await axios.get(
                `${BACKEND_URL_HTTP}/api/address-book/user/${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                // Map từ response format mới sang format đang sử dụng trong frontend
                const formattedAddresses = response.data.map(addr => ({
                    id: addr.id,
                    fullName: addr.recipientName,
                    phone: addr.phone,
                    addressLine: addr.addressLine1 + (addr.addressLine2 ? ', ' + addr.addressLine2 : ''),
                    city: addr.city || '',
                    district: addr.state || '',
                    ward: addr.postalCode || '',
                    country: addr.country || 'Việt Nam',
                    isDefault: addr.isDefault
                }));
                
                // Nếu không có địa chỉ, tự động thêm địa chỉ mặc định từ thông tin profile
                if (formattedAddresses.length === 0 && user.address) {
                    const defaultAddress = {
                        id: 'default-profile',
                        fullName: user.fullName,
                        phone: user.phone || user.phoneNumber,
                        addressLine: user.address,
                        isDefault: true
                    };
                    setAddresses([defaultAddress]);
                } else {
                    setAddresses(formattedAddresses);
                }
            }
            
            setError(null);
        } catch (error) {
            console.error('Error fetching addresses:', error);
            setError('Không thể tải địa chỉ. Vui lòng thử lại sau.');
            
            // Nếu không có API địa chỉ, sử dụng địa chỉ từ profile
            if (user.address) {
                const defaultAddress = {
                    id: 'default',
                    fullName: user.fullName,
                    phone: user.phone || user.phoneNumber,
                    addressLine: user.address,
                    isDefault: true
                };
                setAddresses([defaultAddress]);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    const resetForm = () => {
        setFormData({
            fullName: '',
            phone: '',
            addressLine: '',
            city: '',
            district: '',
            ward: '',
            isDefault: false
        });
    };
    
    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            const userId = user.id;
            
            if (!token || !userId) {
                throw new Error('Bạn cần đăng nhập để thêm địa chỉ');
            }
            
            let response;
            
            // Phân tách thông tin địa chỉ cho API mới
            const addressParts = formData.addressLine.split(',').map(part => part.trim());
            
            // Convert từ format form sang format API mới
            const addressData = {
                user: {
                    id: userId
                },
                recipientName: formData.fullName,
                phone: formData.phone,
                addressLine1: addressParts[0] || formData.addressLine, 
                addressLine2: addressParts.length > 1 ? addressParts.slice(1).join(', ') : '',
                city: formData.city || '',
                state: formData.district || '',
                postalCode: formData.ward || '',
                country: 'Việt Nam',
                isDefault: formData.isDefault
            };
            
            if (isEditingAddress) {
                // Update existing address
                response = await axios.put(
                    `${BACKEND_URL_HTTP}/api/address-book/update/${isEditingAddress}`,
                    addressData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Địa chỉ đã được cập nhật',
                    icon: 'success',
                    confirmButtonText: 'Đóng'
                });
            } else {
                // Create new address
                response = await axios.post(
                    `${BACKEND_URL_HTTP}/api/address-book/add`,
                    addressData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Địa chỉ mới đã được thêm',
                    icon: 'success',
                    confirmButtonText: 'Đóng'
                });
            }
            
            if (response.status === 200 || response.status === 201) {
                resetForm();
                setIsAddingAddress(false);
                setIsEditingAddress(null);
                fetchAddresses();
                refreshUserProfile();
            }
        } catch (error) {
            console.error('Error saving address:', error);
            
            Swal.fire({
                title: 'Lỗi!',
                text: error.response?.data?.message || 'Đã xảy ra lỗi khi lưu địa chỉ',
                icon: 'error',
                confirmButtonText: 'Đóng'
            });
        }
    };
    
    const handleEditAddress = (address) => {
        // Parse address parts if it's a combined string
        let addressLine = address.addressLine;
        let city = '';
        let district = '';
        let ward = '';
        
        // Try to parse the address
        if (addressLine && addressLine.includes(',')) {
            const parts = addressLine.split(',').map(part => part.trim());
            if (parts.length >= 4) {
                addressLine = parts[0];
                ward = parts[1].replace('Phường/Xã ', '');
                district = parts[2].replace('Quận/Huyện ', '');
                city = parts[3].replace('Tỉnh/TP ', '');
            }
        }
        
        setFormData({
            fullName: address.fullName || '',
            phone: address.phone || '',
            addressLine: addressLine || '',
            city: city || '',
            district: district || '',
            ward: ward || '',
            isDefault: address.isDefault || false
        });
        
        setIsEditingAddress(address.id);
        setIsAddingAddress(true);
    };
    
    const handleDeleteAddress = async (addressId) => {
        try {
            const result = await Swal.fire({
                title: 'Xác nhận xóa',
                text: 'Bạn có chắc chắn muốn xóa địa chỉ này?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Xác nhận xóa',
                cancelButtonText: 'Hủy',
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
            });
            
            if (result.isConfirmed) {
                const token = localStorage.getItem('token');
                
                // Sử dụng API mới
                const response = await axios.delete(
                    `${BACKEND_URL_HTTP}/api/address-book/delete/${addressId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                
                if (response.status === 200 || response.status === 204) {
                    Swal.fire({
                        title: 'Thành công!',
                        text: 'Địa chỉ đã được xóa',
                        icon: 'success',
                        confirmButtonText: 'Đóng'
                    });
                    
                    // Cập nhật lại danh sách địa chỉ
                    fetchAddresses();
                    refreshUserProfile();
                }
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            
            Swal.fire({
                title: 'Lỗi!',
                text: error.response?.data?.message || 'Không thể xóa địa chỉ. Vui lòng thử lại sau.',
                icon: 'error',
                confirmButtonText: 'Đóng'
            });
        }
    };
    
    const handleSetDefaultAddress = async (addressId) => {
        try {
            const token = localStorage.getItem('token');
            
            // Sử dụng API mới
            const response = await axios.put(
                `${BACKEND_URL_HTTP}/api/address-book/set-default/${addressId}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 200) {
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Đã đặt địa chỉ mặc định',
                    icon: 'success',
                    confirmButtonText: 'Đóng'
                });
                
                // Cập nhật lại danh sách địa chỉ
                fetchAddresses();
                refreshUserProfile();
            }
        } catch (error) {
            console.error('Error setting default address:', error);
            
            Swal.fire({
                title: 'Lỗi!',
                text: error.response?.data?.message || 'Không thể đặt địa chỉ mặc định. Vui lòng thử lại sau.',
                icon: 'error',
                confirmButtonText: 'Đóng'
            });
        }
    };
    
    return (
        <div className="address-book">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Sổ địa chỉ</h4>
                {!isAddingAddress && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            resetForm();
                            setIsAddingAddress(true);
                            setIsEditingAddress(null);
                        }}
                    >
                        <i className="fa fa-plus me-1"></i> Thêm địa chỉ mới
                    </button>
                )}
            </div>
            
            {isAddingAddress ? (
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">{isEditingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleAddressSubmit}>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="fullName" className="form-label">Họ và tên</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="fullName"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="phone" className="form-label">Số điện thoại</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group mb-3">
                                        <label htmlFor="city" className="form-label">Tỉnh/Thành phố</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group mb-3">
                                        <label htmlFor="district" className="form-label">Quận/Huyện</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="district"
                                            name="district"
                                            value={formData.district}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group mb-3">
                                        <label htmlFor="ward" className="form-label">Phường/Xã</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="ward"
                                            name="ward"
                                            value={formData.ward}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-group mb-3">
                                <label htmlFor="addressLine" className="form-label">Địa chỉ cụ thể</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="addressLine"
                                    name="addressLine"
                                    value={formData.addressLine}
                                    onChange={handleChange}
                                    required
                                    placeholder="Số nhà, tên đường, tòa nhà,..."
                                />
                            </div>
                            
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="isDefault"
                                    name="isDefault"
                                    checked={formData.isDefault}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor="isDefault">
                                    Đặt làm địa chỉ mặc định
                                </label>
                            </div>
                            
                            <div className="d-flex">
                                <button type="submit" className="btn btn-primary me-2">
                                    {isEditingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setIsAddingAddress(false);
                                        setIsEditingAddress(null);
                                        resetForm();
                                    }}
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải địa chỉ...</p>
                </div>
            ) : error && addresses.length === 0 ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : addresses.length === 0 ? (
                <div className="text-center my-5">
                    <i className="fa fa-map-marker-alt fa-3x text-muted mb-3"></i>
                    <h5>Bạn chưa có địa chỉ nào</h5>
                    <p className="text-muted">Thêm địa chỉ để thuận tiện cho việc giao hàng</p>
                    <button 
                        className="btn btn-primary mt-3"
                        onClick={() => {
                            resetForm();
                            setIsAddingAddress(true);
                        }}
                    >
                        <i className="fa fa-plus me-1"></i> Thêm địa chỉ mới
                    </button>
                </div>
            ) : (
                <div className="addresses-container">
                    <div className="row">
                        {addresses.map((address, index) => (
                            <div className="col-md-6 mb-3" key={address.id || index}>
                                <div className={`card h-100 ${address.isDefault ? 'border-primary' : ''}`}>
                                    <div className="card-header d-flex justify-content-between align-items-center">
                                        <div>
                                            <span className="fw-bold">{address.fullName}</span>
                                            {address.isDefault && (
                                                <span className="badge bg-primary ms-2">Mặc định</span>
                                            )}
                                        </div>
                                        <div>
                                            <button 
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => handleEditAddress(address)}
                                            >
                                                <i className="fa fa-edit"></i>
                                            </button>
                                            {!address.isDefault && (
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteAddress(address.id)}
                                                >
                                                    <i className="fa fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <p className="mb-1">
                                            <i className="fa fa-phone me-2 text-muted"></i>
                                            {address.phone}
                                        </p>
                                        <p className="mb-2">
                                            <i className="fa fa-map-marker-alt me-2 text-muted"></i>
                                            {address.addressLine}
                                        </p>
                                        
                                        {!address.isDefault && (
                                            <button 
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleSetDefaultAddress(address.id)}
                                            >
                                                Đặt làm mặc định
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressBook; 
