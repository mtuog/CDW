import React, { useEffect, useState } from 'react';
import authApi from '../../api/authApi';
import { useNavigate } from 'react-router-dom';

const AdminAccount = () => {
  const [admin, setAdmin] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await authApi.getAdminInfo();
        setAdmin(data);
        setForm({
          fullName: data.fullName || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      } catch (err) {
        setError(err?.message || 'Không thể tải thông tin admin.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      setError('');
      await authApi.updateAdminInfo(form);
      setMessage('Cập nhật thành công!');
      setEditMode(false);
      // Reload info
      const data = await authApi.getAdminInfo();
      setAdmin(data);
    } catch (err) {
      setError(err?.message || 'Cập nhật thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/admin/login');
  };

  if (loading && !admin) return <div style={{textAlign:'center',marginTop:40}}>Đang tải thông tin tài khoản...</div>;

  if (error && !admin) {
    return (
      <div className="admin-account-page" style={{ maxWidth: 500, margin: '40px auto', background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
        <h2 style={{color:'#f44336'}}>Lỗi tải thông tin tài khoản</h2>
        <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>
        <button onClick={handleLogout} style={{ background: '#f44336', color: '#fff', padding: '8px 20px', border: 'none', borderRadius: 4 }}>Đăng xuất</button>
        <div style={{ marginTop: 16, color: '#888', fontSize: 15 }}>
          Nếu bạn gặp lỗi xác thực, hãy đăng xuất và đăng nhập lại.<br/>
          Nếu vẫn lỗi, liên hệ quản trị viên hệ thống.<br/>
          <span style={{color:'#888',fontSize:13}}>API: <b>/api/admin/me</b></span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-account-page" style={{ maxWidth: 500, margin: '40px auto', background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2 style={{marginBottom:24}}>Thông tin tài khoản quản trị</h2>
      {message && <div style={{ color: 'green', marginBottom: 12 }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {admin && !editMode && (
        <div style={{fontSize:16}}>
          <div><b>Tên đăng nhập:</b> {admin.username}</div>
          <div><b>Email:</b> {admin.email}</div>
          <div><b>Họ tên:</b> {admin.fullName || <span style={{color:'#888'}}>Chưa cập nhật</span>}</div>
          <div><b>Số điện thoại:</b> {admin.phone || <span style={{color:'#888'}}>Chưa cập nhật</span>}</div>
          <div><b>Địa chỉ:</b> {admin.address || <span style={{color:'#888'}}>Chưa cập nhật</span>}</div>
          <div><b>Quyền:</b> {Array.isArray(admin.roles) ? admin.roles.join(', ') : (admin.roles || 'ADMIN')}</div>
          <div style={{ margin: '20px 0' }}>
            <button onClick={() => setEditMode(true)} style={{ marginRight: 8, padding: '8px 20px', borderRadius: 4 }}>Chỉnh sửa</button>
            <button onClick={handleLogout} style={{ background: '#f44336', color: '#fff', padding: '8px 20px', border: 'none', borderRadius: 4 }}>Đăng xuất</button>
          </div>
        </div>
      )}
      {admin && editMode && (
        <form onSubmit={handleSave} style={{fontSize:16}}>
          <div style={{ marginBottom: 12 }}>
            <label>Họ tên:</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} className="form-control" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Số điện thoại:</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="form-control" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Địa chỉ:</label>
            <input name="address" value={form.address} onChange={handleChange} className="form-control" />
          </div>
          <button type="submit" style={{ marginRight: 8, padding: '8px 20px', borderRadius: 4 }}>Lưu</button>
          <button type="button" onClick={() => setEditMode(false)} style={{padding: '8px 20px', borderRadius: 4}}>Hủy</button>
        </form>
      )}
    </div>
  );
};

export default AdminAccount; 