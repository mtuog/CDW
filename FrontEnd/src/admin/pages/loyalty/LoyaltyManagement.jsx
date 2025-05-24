import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faSearch, faPlus, faMinus, faUserTag, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Swal from 'sweetalert2';
import loyaltyApi from '../../../api/loyaltyApi';
import LoyaltyUsersList from './LoyaltyUsersList';
import LoyaltyTransactionsList from './LoyaltyTransactionsList';
import LoyaltySettings from './LoyaltySettings';

const LoyaltyManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    if (selectedUser) {
      fetchUserTransactions(selectedUser.id);
    }
  }, [selectedUser]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await loyaltyApi.getAllUsersWithLoyaltyInfo();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải danh sách người dùng'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserTransactions = async (userId) => {
    try {
      const transactions = await loyaltyApi.getUserTransactions(userId);
      setUserTransactions(transactions);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      setUserTransactions([]);
    }
  };
  
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setTabIndex(1); // Switch to transactions tab
  };
  
  const handleAddPoints = async (userId, points, description) => {
    try {
      const response = await loyaltyApi.addPoints(userId, points, description);
      
      // Cập nhật thông tin người dùng trong danh sách
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          const updatedUser = { ...user };
          if (response.transaction) {
            updatedUser.loyaltyPoints = (user.loyaltyPoints || 0) + points;
            if (response.transaction.user?.membershipRank) {
              updatedUser.membershipRank = response.transaction.user.membershipRank;
            }
          }
          return updatedUser;
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      if (selectedUser && selectedUser.id === userId) {
        const updatedSelectedUser = { 
          ...selectedUser,
          loyaltyPoints: (selectedUser.loyaltyPoints || 0) + points
        };
        
        if (response.transaction?.user?.membershipRank) {
          updatedSelectedUser.membershipRank = response.transaction.user.membershipRank;
        }
        
        setSelectedUser(updatedSelectedUser);
        fetchUserTransactions(userId);
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: `Đã thêm ${points} điểm cho người dùng`,
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error adding points:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.response?.data?.error || 'Không thể thêm điểm'
      });
    }
  };
  
  const handleRedeemPoints = async (userId, points, description) => {
    try {
      const response = await loyaltyApi.redeemPoints(userId, points, description);
      
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          const updatedUser = { ...user };
          if (response.transaction) {
            updatedUser.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - points);
            if (response.transaction.user?.membershipRank) {
              updatedUser.membershipRank = response.transaction.user.membershipRank;
            }
          }
          return updatedUser;
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      if (selectedUser && selectedUser.id === userId) {
        const updatedSelectedUser = { 
          ...selectedUser,
          loyaltyPoints: Math.max(0, (selectedUser.loyaltyPoints || 0) - points)
        };
        
        if (response.transaction?.user?.membershipRank) {
          updatedSelectedUser.membershipRank = response.transaction.user.membershipRank;
        }
        
        setSelectedUser(updatedSelectedUser);
        fetchUserTransactions(userId);
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: `Đã trừ ${points} điểm của người dùng`,
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error redeeming points:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.response?.data?.error || 'Không thể trừ điểm'
      });
    }
  };
  
  const handleProcessDeliveredOrders = async () => {
    try {
      Swal.fire({
        title: 'Đang xử lý...',
        text: 'Vui lòng đợi trong giây lát',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const result = await loyaltyApi.processDeliveredOrders();
      
      await fetchUsers();
      
      if (selectedUser) {
        await fetchUserTransactions(selectedUser.id);
        const updatedUser = users.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: result.message,
        showConfirmButton: true
      });
    } catch (error) {
      console.error('Error processing delivered orders:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.response?.data?.error || 'Không thể xử lý các đơn hàng đã giao'
      });
    }
  };
  
  return (
    <div className="loyalty-management-container">
      <div className="page-header">
        <div>
          <h1>Quản lý tích điểm</h1>
          <p>Quản lý điểm tích lũy và hạng thành viên của khách hàng</p>
        </div>
        <div className="action-buttons">
          <button 
            className="btn btn-primary sync-btn"
            onClick={handleProcessDeliveredOrders}
            title="Xử lý tích điểm cho tất cả đơn hàng đã giao chưa được tích điểm"
          >
            <FontAwesomeIcon icon={faSync} /> Xử lý đơn đã giao
          </button>
        </div>
      </div>
      
      <Tabs selectedIndex={tabIndex} onSelect={index => setTabIndex(index)}>
        <TabList>
          <Tab>Danh sách khách hàng</Tab>
          <Tab disabled={!selectedUser}>
            {selectedUser ? `Giao dịch của ${selectedUser.username}` : 'Chọn người dùng để xem giao dịch'}
          </Tab>
          <Tab>Cài đặt tích điểm</Tab>
        </TabList>
        
        <TabPanel>
          <LoyaltyUsersList 
            users={users} 
            loading={loading} 
            onUserSelect={handleUserSelect} 
            onAddPoints={handleAddPoints}
            onRedeemPoints={handleRedeemPoints}
          />
        </TabPanel>
        
        <TabPanel>
          {selectedUser && (
            <LoyaltyTransactionsList 
              transactions={userTransactions} 
              user={selectedUser}
              onAddPoints={handleAddPoints}
              onRedeemPoints={handleRedeemPoints} 
            />
          )}
        </TabPanel>
        
        <TabPanel>
          <LoyaltySettings />
        </TabPanel>
      </Tabs>
      
      <style jsx>{`
        .loyalty-management-container {
          background-color: #fff;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          padding: 20px;
          height: calc(100vh - 120px);
          overflow: auto;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }
        
        .page-header h1 {
          font-size: 24px;
          margin: 0;
          margin-bottom: 5px;
        }
        
        .page-header p {
          color: #666;
          margin: 0;
        }
        
        .action-buttons {
          display: flex;
          gap: 10px;
        }
        
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary {
          background-color: #2c7be5;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #1a68d1;
        }
        
        .sync-btn {
          background-color: #10b981;
        }
        
        .sync-btn:hover {
          background-color: #0e9f6e;
        }
        
        :global(.react-tabs) {
          margin-top: 20px;
        }
        
        :global(.react-tabs__tab-list) {
          border-bottom: 1px solid #ddd;
          margin: 0 0 20px;
          padding: 0;
        }
        
        :global(.react-tabs__tab) {
          display: inline-block;
          border: 1px solid transparent;
          border-bottom: none;
          position: relative;
          list-style: none;
          padding: 10px 15px;
          cursor: pointer;
          margin-right: 5px;
        }
        
        :global(.react-tabs__tab--selected) {
          background: #fff;
          border-color: #ddd;
          color: #2c7be5;
          border-radius: 5px 5px 0 0;
          border-bottom: 2px solid #2c7be5;
        }
        
        :global(.react-tabs__tab--disabled) {
          color: #999;
          cursor: not-allowed;
        }
        
        :global(.react-tabs__tab:focus) {
          outline: none;
        }
        
        :global(.react-tabs__tab-panel) {
          display: none;
        }
        
        :global(.react-tabs__tab-panel--selected) {
          display: block;
        }
      `}</style>
    </div>
  );
};

export default LoyaltyManagement; 