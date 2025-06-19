import React from 'react';
import { createBrowserRouter, RouterProvider, Route, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './store/Store';
import Footer from './user/components/Footer/Footer';
import Header from './user/components/Header/Header';
import AboutUs from './user/components/AboutUs/AboutUs';
import Home from './user/components/Home/Home';
import Product from './user/components/Product/Product';
import ProductDetail from './user/components/ProductDetail/ProductDetail';
import ShoppingCart from './user/components/ShoppingCart/ShoppingCart';
import Contact from './user/components/Contact/Contact';
import Register from './user/components/Register/Register';
import Login from './user/components/Login/Login';
import ChangePassword from './user/components/ChangePassword/ChangePassword';
import Profile from './user/components/Profile/Profile';
import SearchResults from './user/components/SearchResults/SearchResults';
import Payment from "./user/components/Payment/Payment";
import VerifyRegisterAccount from './user/components/VerifyRegisterAccount/VerifyRegisterAccount';
import ForgotPassword from './user/components/ForgotPassword/ForgotPassword';
import ResetPassword from './user/components/ResetPassword/ResetPassword';
import AdminLayout from './admin/layouts/AdminLayout';
import BankTransfer from './user/components/Payment/BankTransfer';
import CreditCardPayment from './user/components/Payment/CreditCardPayment';
import PaymentResult from './user/components/Payment/PaymentResult';
import OrderSuccess from './user/components/Payment/OrderSuccess';
import UserOrderDetail from './user/components/Profile/tabs/OrderDetail';
import ChatWidget from './user/components/Chat/ChatWidget';
import { LanguageProvider } from './i18n/LanguageContext'; // Import Context
import './i18n'; // Import cấu hình i18n
const Layout = () => {
    return (
        <div>
            <Header />
            <Outlet />
            <Footer />
            <ChatWidget />
        </div>
    );
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
            { path: 'account/orders/:orderId', element: <UserOrderDetail /> },
        ],
    },
    {
        path: '/admin/*',
        element: <AdminLayout />
    },
]);

function App() {
    return (
        <Provider store={store}>
            <GoogleOAuthProvider clientId="142819065684-4ulb5ra203pjp7vuop3m2sl0fcdmov5m.apps.googleusercontent.com">
                <div className="App">
                    <RouterProvider router={router} />
                    <ToastContainer 
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                    />
                </div>
            </GoogleOAuthProvider>
        </Provider>
    );
}

export default App;
