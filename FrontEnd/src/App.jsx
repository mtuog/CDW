import React from 'react';
import { createBrowserRouter, RouterProvider, Route, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import BankTransfer from './components/Payment/BankTransfer';
import CreditCardPayment from './components/Payment/CreditCardPayment';
import PaymentResult from './components/Payment/PaymentResult';
import OrderSuccess from './components/Payment/OrderSuccess';
import UserOrderDetail from './components/Profile/tabs/OrderDetail';

const Layout = () => {
    return (
        <div>
            <Header />
            <Outlet />
            <Footer />
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
