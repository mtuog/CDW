import React from 'react';
import { createBrowserRouter, RouterProvider, Route, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import store from './store/Store';
import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';
import AboutUs from './components/AboutUs/AboutUs';
import Home from './components/Home/Home';
import Product from './components/Product/Product';
import ProductDetail from './components/ProductDetail/ProductDetail';
import ShoppingCart from './components/ShoppingCart/ShoppingCart';
import Contact from './components/Contact/Contact';
import Register from './components/Register/Register';
import Login from './components/Login/Login';
import ChangePassword from './components/ChangePassword/ChangePassword';
import Profile from './components/Profile/Profile';
import SearchResults from './components/SearchResults/SearchResults';
import Payment from "./components/Payment/Payment";
import VerifyRegisterAccount from './components/VerifyRegisterAccount/VerifyRegisterAccount';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import ResetPassword from './components/ResetPassword/ResetPassword';
import AdminLayout from './admin/layouts/AdminLayout';
import Dashboard from './admin/pages/dashboard/Dashboard';
import ProductList from './admin/pages/products/ProductList';
import ProductForm from './admin/pages/products/ProductForm';
import ProductStockManager from './admin/pages/products/ProductStockManager';
import ProductBulkUpload from './admin/pages/products/ProductBulkUpload';
import OrderList from './admin/pages/orders/OrderList';
import OrderDetail from './admin/pages/orders/OrderDetail';
import CategoryList from './admin/pages/categories/CategoryList';
import CustomerAnalytics from './admin/pages/customers/CustomerAnalytics';
import StoreSettings from './admin/pages/settings/StoreSettings';
import PaymentSettings from './admin/pages/settings/PaymentSettings';
import BankTransfer from './components/Payment/BankTransfer';
import CreditCardPayment from './components/Payment/CreditCardPayment';
import PaymentResult from './components/Payment/PaymentResult';
import OrderSuccess from './components/Payment/OrderSuccess';

const Layout = () => {
    return (
        <div>
            <Header />
            <Outlet />
            <Footer />
        </div>
    );
}

// Admin không cần header và footer của FrontEnd
const AdminRoute = () => {
    return <AdminLayout />;
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'home', element: <Home /> },
            { path: 'aboutus', element: <AboutUs /> },
            { path: 'product', element: <Product /> },
            { path: 'products', element: <Product /> },
            { path: 'product/:id', element: <ProductDetail /> },
            { path: 'shoppingCart', element: <ShoppingCart /> },
            { path: 'cart', element: <ShoppingCart /> },
            { path: 'checkout', element: <Payment /> },
            { path: 'contact', element: <Contact /> },
            { path: 'register', element: <Register /> },
            { path: 'login', element: <Login /> },
            { path: 'changePassword', element: <ChangePassword /> },
            { path: 'account', element: <Profile /> },
            { path: 'search', element: <SearchResults /> },
            { path: 'payment', element: <Payment /> },
            { path: 'bank-transfer/:orderId', element: <BankTransfer /> },
            { path: 'credit-card-payment/:orderId', element: <CreditCardPayment /> },
            { path: 'payment/vnpay-return', element: <PaymentResult /> },
            { path: 'payment/result', element: <PaymentResult /> },
            { path: 'order-success/:orderId', element: <OrderSuccess /> },
            { path: 'verify-account', element: <VerifyRegisterAccount /> },
            { path: 'forgot-password', element: <ForgotPassword /> },
            { path: 'reset-password', element: <ResetPassword /> },
        ],
    },
    {
        path: '/admin',
        element: <AdminRoute />,
        children: [
            { index: true, element: <Dashboard /> },
            { path: 'dashboard', element: <Dashboard /> },
            
            // Product Management
            { path: 'products', element: <ProductList /> },
            { path: 'products/add', element: <ProductForm /> },
            { path: 'products/:id/edit', element: <ProductForm /> },
            { path: 'products/stock', element: <ProductStockManager /> },
            { path: 'products/bulk-upload', element: <ProductBulkUpload /> },
            
            // Category Management
            { path: 'categories', element: <CategoryList /> },
            
            // Order Management
            { path: 'orders', element: <OrderList /> },
            { path: 'orders/:id', element: <OrderDetail /> },
            
            // Customer Analytics
            { path: 'customers', element: <CustomerAnalytics /> },
            
            // Settings
            { path: 'settings/store', element: <StoreSettings /> },
            { path: 'settings/payment', element: <PaymentSettings /> },
        ],
    },
]);

function App() {
    return (
        <Provider store={store}>
            <GoogleOAuthProvider clientId="142819065684-4ulb5ra203pjp7vuop3m2sl0fcdmov5m.apps.googleusercontent.com">
                <div className="App">
                    <RouterProvider router={router} />
                </div>
            </GoogleOAuthProvider>
        </Provider>
    );
}

export default App;
