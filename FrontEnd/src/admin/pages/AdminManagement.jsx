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
  const [pagination, setPagination] = useState({ current: 1, pageSize: PAGE_SIZE, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form] = Form.useForm();

  // Fetch admins from backend
  const fetchAdmins = async (params = {}) => {
    setLoading(true);
    try {
      // Gọi API backend, có thể cần chỉnh lại endpoint và query param cho phân trang/tìm kiếm
      const res = await axios.get('/api/admin/users');
      let data = res.data;
      // Lọc/tìm kiếm phía client (nếu backend chưa hỗ trợ)
      if (search) {
        data = data.filter(a => a.username.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));
      }
      if (filterActive !== null) {
        data = data.filter(a => a.active === filterActive);
      }
      setPagination(p => ({ ...p, total: data.length }));
      setAdmins(data.slice((pagination.current - 1) * pagination.pageSize, pagination.current * pagination.pageSize));
    } catch (err) {
      message.error('Không thể tải danh sách admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line
  }, [search, filterActive, pagination.current]);

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

  const openModal = (admin = null) => {
    setEditingAdmin(admin);
    setModalVisible(true);
    if (admin) {
      form.setFieldsValue({ ...admin, password: '' });
    } else {
      form.resetFields();
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingAdmin) {
        // Update admin
        await axios.put(`/api/admin/users/${editingAdmin.id}`, values);
        message.success('Cập nhật admin thành công');
      } else {
        // Create admin
        await axios.post('/api/admin/users', values);
        message.success('Tạo admin mới thành công');
      }
      setModalVisible(false);
      fetchAdmins();
    } catch (err) {
      message.error('Lỗi khi lưu admin');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/users/${id}`);
      message.success('Đã xoá admin');
      fetchAdmins();
    } catch {
      message.error('Lỗi khi xoá admin');
    }
  };

  const handleToggleActive = async (admin) => {
    try {
      await axios.patch(`/api/admin/users/${admin.id}/toggle-active`);
      message.success(admin.active ? 'Đã khoá admin' : 'Đã mở khoá admin');
      fetchAdmins();
    } catch {
      message.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { title: 'Vai trò', dataIndex: 'roles', key: 'roles', render: roles => roles.join(', ') },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: v => v ? new Date(v).toLocaleString() : '' },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      filters: [
        { text: 'Kích hoạt', value: true },
        { text: 'Khoá', value: false },
      ],
      filteredValue: filterActive !== null ? [filterActive] : null,
      onFilter: (value, record) => record.active === value,
      render: active => active ? <span style={{ color: 'green' }}>Kích hoạt</span> : <span style={{ color: 'red' }}>Khoá</span>
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, admin) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(admin)} />
          <Popconfirm title="Xoá admin này?" onConfirm={() => handleDelete(admin.id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
          <Button icon={admin.active ? <LockOutlined /> : <UnlockOutlined />} onClick={() => handleToggleActive(admin)} />
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
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ active: true }}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}> <Input disabled={!!editingAdmin} /> </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}> <Input /> </Form.Item>
          {!editingAdmin && <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}> <Input.Password /> </Form.Item>}
          <Form.Item name="fullName" label="Họ tên"> <Input /> </Form.Item>
          <Form.Item name="phone" label="Số điện thoại"> <Input /> </Form.Item>
          <Form.Item name="active" label="Kích hoạt" valuePropName="checked"> <Switch /> </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminManagement; 