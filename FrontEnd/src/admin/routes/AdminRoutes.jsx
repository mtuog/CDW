import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';

// Admin pages
import Dashboard from '../pages/dashboard/Dashboard';
import ProductList from '../pages/products/ProductList';
import ProductForm from '../pages/products/ProductForm';
import ProductStockManager from '../pages/products/ProductStockManager';
import ProductBulkUpload from '../pages/products/ProductBulkUpload';
import OrderList from '../pages/orders/OrderList';
import OrderDetail from '../pages/orders/OrderDetail';
import CategoryList from '../pages/categories/CategoryList';
import CustomerAnalytics from '../pages/customers/CustomerAnalytics';
import CustomerList from '../pages/customers/CustomerList';
import CustomerDetail from '../pages/customers/CustomerDetail';
import StoreSettings from '../pages/settings/StoreSettings';
import PaymentSettings from '../pages/settings/PaymentSettings';
import DiscountList from '../pages/discount';
import AddDiscount from '../pages/discount/add';
import EditDiscount from '../pages/discount/edit';
import LoyaltyManagement from '../pages/loyalty/LoyaltyManagement';
import NotificationPage from '../pages/notifications/NotificationPage';
import AdminAccount from '../pages/account/AdminAccount';
import AdminManagement from '../pages/account/AdminManagement';
import ChatManagement from '../pages/chat/ChatManagement';

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Redirect admin login to unified login with admin mode */}
      <Route path="login" element={<Navigate to="/login?admin=true" replace />} />
      
      {/* Protected Admin Routes */}
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      {/* Product Management */}
      <Route path="products" element={
        <PrivateRoute>
          <ProductList />
        </PrivateRoute>
      } />
      
      <Route path="products/add" element={
        <PrivateRoute>
          <ProductForm />
        </PrivateRoute>
      } />
      
      <Route path="products/:id/edit" element={
        <PrivateRoute>
          <ProductForm />
        </PrivateRoute>
      } />
      
      <Route path="products/stock" element={
        <PrivateRoute>
          <ProductStockManager />
        </PrivateRoute>
      } />
      
      <Route path="products/bulk-upload" element={
        <PrivateRoute>
          <ProductBulkUpload />
        </PrivateRoute>
      } />
      
      {/* Category Management */}
      <Route path="categories" element={
        <PrivateRoute>
          <CategoryList />
        </PrivateRoute>
      } />
      
      {/* Order Management */}
      <Route path="orders" element={
        <PrivateRoute>
          <OrderList />
        </PrivateRoute>
      } />
      
      <Route path="orders/:id" element={
        <PrivateRoute>
          <OrderDetail />
        </PrivateRoute>
      } />
      
      {/* Customer Analytics */}
      <Route path="customers" element={
        <PrivateRoute>
          <CustomerAnalytics />
        </PrivateRoute>
      } />
      
      {/* Customer List (CRUD) */}
      <Route path="customers/list" element={
        <PrivateRoute>
          <CustomerList />
        </PrivateRoute>
      } />
      
      {/* Customer Detail */}
      <Route path="customers/:id" element={
        <PrivateRoute>
          <CustomerDetail />
        </PrivateRoute>
      } />
      
      {/* Discount Codes */}
      <Route path="discount" element={
        <PrivateRoute>
          <DiscountList />
        </PrivateRoute>
      } />
      
      <Route path="discount/add" element={
        <PrivateRoute>
          <AddDiscount />
        </PrivateRoute>
      } />
      
      <Route path="discount/edit/:id" element={
        <PrivateRoute>
          <EditDiscount />
        </PrivateRoute>
      } />
      
      {/* Settings */}
      <Route path="settings/store" element={
        <PrivateRoute>
          <StoreSettings />
        </PrivateRoute>
      } />
      
      <Route path="settings/payment" element={
        <PrivateRoute>
          <PaymentSettings />
        </PrivateRoute>
      } />
      
      {/* Loyalty Management */}
      <Route path="loyalty" element={
        <PrivateRoute>
          <LoyaltyManagement />
        </PrivateRoute>
      } />
      
      {/* Notifications */}
      <Route path="notifications" element={
        <PrivateRoute>
          <NotificationPage />
        </PrivateRoute>
      } />
      
      {/* Admin Account */}
      <Route path="account" element={
        <PrivateRoute>
          <AdminAccount />
        </PrivateRoute>
      } />
      
      {/* Admin Management */}
      <Route path="admins" element={
        <PrivateRoute>
          <AdminManagement />
        </PrivateRoute>
      } />
      
      {/* Chat Management */}
      <Route path="chat" element={
        <PrivateRoute>
          <ChatManagement />
        </PrivateRoute>
      } />

    </Routes>
  );
};

export default AdminRoutes; 
