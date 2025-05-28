import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const PAGE_SIZE = 10;

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState(null);
  const [filterSuperAdmin, setFilterSuperAdmin] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: PAGE_SIZE, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form] = Form.useForm();

  // Fetch admins from backend
  const fetchAdmins = async (params = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        return;
      }
      
      // Sử dụng API endpoint dành riêng cho admin
      const res = await axios.get('http://localhost:8080/api/admin/admins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let data = res.data;
      
      // Lọc/tìm kiếm phía client
      if (search) {
        data = data.filter(a => a.username.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));
      }
      if (filterActive !== null) {
        data = data.filter(a => a.enabled === filterActive);
      }
      if (filterSuperAdmin !== null) {
        data = data.filter(a => a.isSuperAdmin === filterSuperAdmin);
      }
      
      setPagination(p => ({ ...p, total: data.length }));
      setAdmins(data.slice((pagination.current - 1) * pagination.pageSize, pagination.current * pagination.pageSize));
    } catch (err) {
      console.error('Error fetching admins:', err);
      message.error('Không thể tải danh sách admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line
  }, [search, filterActive, filterSuperAdmin, pagination.current]);

  const handleTableChange = (pag) => {
    setPagination(p => ({ ...p, current: pag.current }));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination(p => ({ ...p, current: 1 }));
  };

  const handleFilterActive = (value) => {
    setFilterActive(value);
    setPagination(p => ({ ...p, current: 1 }));
  };

  const handleFilterSuperAdmin = (value) => {
    setFilterSuperAdmin(value);
    setPagination(p => ({ ...p, current: 1 }));
  };

  useEffect(() => {
    if (modalVisible && editingAdmin) {
      const fetchAdmin = async () => {
        const token = localStorage.getItem('adminToken');
        try {
          const res = await axios.get(`http://localhost:8080/api/admin/admins/${editingAdmin.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          form.setFieldsValue({
            username: res.data.username || '',
            email: res.data.email || '',
            fullName: res.data.fullName || '',
            phone: res.data.phone || '',
            enabled: res.data.enabled === undefined ? false : res.data.enabled,
            password: ''
          });
        } catch (err) {
          form.setFieldsValue({
            username: editingAdmin.username || '',
            email: editingAdmin.email || '',
            fullName: editingAdmin.fullName || '',
            phone: editingAdmin.phone || '',
            enabled: editingAdmin.enabled === undefined ? false : editingAdmin.enabled,
            password: ''
          });
        }
      };
      fetchAdmin();
    }
    if (modalVisible && !editingAdmin) {
      form.resetFields();
      form.setFieldsValue({
        enabled: true  // Default to enabled for new admins
      });
    }
  }, [modalVisible, editingAdmin, form]);

  const openModal = (admin = null) => {
    setEditingAdmin(admin);
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const values = await form.validateFields();
      if (editingAdmin) {
        // Update admin
        await axios.put(`http://localhost:8080/api/admin/admins/${editingAdmin.id}`, values, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        message.success('Cập nhật admin thành công');
      } else {
        // Map đúng key cho backend khi tạo mới
        const payload = {
          userName: values.username,
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          phone: values.phone,
          enabled: values.enabled !== undefined ? values.enabled : true
        };
        await axios.post('http://localhost:8080/api/admin/admins', payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        message.success('Tạo admin mới thành công');
      }
      setModalVisible(false);
      fetchAdmins();
    } catch (err) {
      console.error('Error saving admin:', err);
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (err.response?.data) {
        message.error(typeof err.response.data === 'string' ? err.response.data : 'Lỗi khi lưu admin');
      } else {
        message.error('Lỗi khi lưu admin');
      }
    }
  };

  const handleDelete = async (id) => {
    if (admins.length <= 1) {
      message.warning('Không thể xoá admin cuối cùng!');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:8080/api/admin/admins/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('Đã xoá admin');
      fetchAdmins();
    } catch (err) {
      if (err?.response?.data?.message?.includes('Super Admin')) {
        message.warning('Không thể xoá Super Admin!');
      } else {
        console.error('Error deleting admin:', err);
        message.error('Lỗi khi xoá admin');
      }
    }
  };

  const handleToggleActive = async (admin) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`http://localhost:8080/api/admin/admins/${admin.id}/toggle-active`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success(admin.enabled ? 'Đã khoá admin' : 'Đã mở khoá admin');
      fetchAdmins();
    } catch (err) {
      console.error('Error toggling admin status:', err);
      message.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { title: 'Vai trò', dataIndex: 'roles', key: 'roles', render: (roles, admin) => (
      <>
        {roles.join(', ')}
        {admin.isSuperAdmin && <span style={{ color: 'orange', marginLeft: 8, fontWeight: 600 }}>[Super Admin]</span>}
      </>
    ) },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: v => v ? new Date(v).toLocaleString() : '' },
    {
      title: 'Trạng thái',
      dataIndex: 'enabled',
      key: 'enabled',
      filters: [
        { text: 'Kích hoạt', value: true },
        { text: 'Khoá', value: false },
      ],
      filteredValue: filterActive !== null ? [filterActive] : null,
      onFilter: (value, record) => record.enabled === value,
      render: enabled => enabled ? <span style={{ color: 'green' }}>Kích hoạt</span> : <span style={{ color: 'red' }}>Khoá</span>
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, admin) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(admin)} />
          <Popconfirm title={admin.isSuperAdmin ? "Không thể xoá Super Admin" : "Xoá admin này?"} onConfirm={() => handleDelete(admin.id)} disabled={admin.isSuperAdmin}>
            <Button icon={<DeleteOutlined />} danger disabled={admin.isSuperAdmin} />
          </Popconfirm>
          <Button icon={admin.enabled ? <LockOutlined /> : <UnlockOutlined />} onClick={() => handleToggleActive(admin)} />
        </Space>
      )
    }
  ];

  return (
    <div>
      <h2>Quản lý Admin</h2>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Tìm kiếm username/email" value={search} onChange={handleSearch} allowClear style={{ width: 220 }} />
        <Select
          placeholder="Lọc trạng thái"
          allowClear
          style={{ width: 140 }}
          value={filterActive}
          onChange={handleFilterActive}
        >
          <Option value={true}>Kích hoạt</Option>
          <Option value={false}>Khoá</Option>
        </Select>
        <Select
          placeholder="Lọc Super Admin"
          allowClear
          style={{ width: 160 }}
          value={filterSuperAdmin}
          onChange={handleFilterSuperAdmin}
        >
          <Option value={true}>Super Admin</Option>
          <Option value={false}>Admin thường</Option>
        </Select>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal(null)}>Thêm admin</Button>
        <Button icon={<ReloadOutlined />} onClick={() => fetchAdmins()}>Làm mới</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={admins}
        rowKey="id"
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: false }}
        onChange={handleTableChange}
      />
      <Modal
        title={editingAdmin ? 'Cập nhật admin' : 'Thêm admin mới'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="Username" rules={[{ required: true }]}> 
            <Input disabled={!!editingAdmin} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}> 
            <Input />
          </Form.Item>
          {editingAdmin ? null : (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}> 
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="fullName" label="Họ tên"> 
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại"> 
            <Input />
          </Form.Item>
          <Form.Item name="enabled" label="Kích hoạt" valuePropName="checked"> 
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminManagement; 