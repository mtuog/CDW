import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCartLocalStorage } from "../../../store/Actions.js";
import axios from 'axios';
import { BACKEND_URL_HTTP } from '../../../config.js';

const Header = () => {
	const [loggedIn, setLoggedIn] = useState(false);
	const [username, setUsername] = useState('');
	const [id, setId] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [wishlistCount, setWishlistCount] = useState(0);

	const navigate = useNavigate();
	const dispatch = useDispatch();
	const cart = useSelector(state => state.cart);

	useEffect(() => {
		// Thay thế fetch('/session') bằng kiểm tra localStorage
		const checkLoginStatus = () => {
			const token = localStorage.getItem('token');
			const userName = localStorage.getItem('userName');
			const userId = localStorage.getItem('userId');
			
			console.log("Login check - UserId:", userId);
			
			if (token && userName) {
				setLoggedIn(true);
				setUsername(userName);
				setId(userId);
			} else {
				setLoggedIn(false);
				setUsername('');
				setId('');
			}
		};

		// Kiểm tra khi component mount
		checkLoginStatus();

		// Kiểm tra mỗi khi có thay đổi trong localStorage
		window.addEventListener('storage', checkLoginStatus);

		// Kiểm tra mỗi khi user quay lại tab
		window.addEventListener('focus', checkLoginStatus);

		// Cleanup listeners
		return () => {
			window.removeEventListener('storage', checkLoginStatus);
			window.removeEventListener('focus', checkLoginStatus);
		};
	}, []);

	// Tạo event để components khác có thể thông báo đăng nhập/đăng xuất
	useEffect(() => {
		// Tạo custom event để cập nhật header khi đăng nhập/đăng xuất
		const handleAuthChange = () => {
			const token = localStorage.getItem('token');
			const userName = localStorage.getItem('userName');
			const userId = localStorage.getItem('userId');
			
			if (token && userName) {
				setLoggedIn(true);
				setUsername(userName);
				setId(userId);
			} else {
				setLoggedIn(false);
				setUsername('');
				setId('');
			}
		};

		window.addEventListener('auth-change', handleAuthChange);
		
		return () => {
			window.removeEventListener('auth-change', handleAuthChange);
		};
	}, []);

	// Fetch wishlist count when user is logged in
	useEffect(() => {
		if (loggedIn && id) {
			fetchWishlistCount();
		} else {
			setWishlistCount(0);
		}
	}, [loggedIn, id]);

	// Add listener for wishlist updates
	useEffect(() => {
		const handleWishlistUpdate = () => {
			if (loggedIn && id) {
				fetchWishlistCount();
			}
		};

		window.addEventListener('wishlist-update', handleWishlistUpdate);
		
		return () => {
			window.removeEventListener('wishlist-update', handleWishlistUpdate);
		};
	}, [loggedIn, id]);

	const fetchWishlistCount = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token || !id) return;

			const response = await axios.get(
				`http://${BACKEND_URL_HTTP}/api/wishlist/count/${id}`,
				{
					headers: {
						'Authorization': `Bearer ${token}`
					}
				}
			);

			if (response.status === 200 && response.data && response.data.count !== undefined) {
				setWishlistCount(response.data.count);
			}
		} catch (error) {
			console.error('Error fetching wishlist count:', error);
			// If there's an error, don't update the count
		}
	};

	const handleLogout = () => {
		// Xóa dữ liệu người dùng khỏi localStorage
		localStorage.removeItem('token');
		localStorage.removeItem('refreshToken');
		localStorage.removeItem('userId');
		localStorage.removeItem('userName');
		localStorage.removeItem('userRole');
		
		// Cập nhật state
		setLoggedIn(false);
		setUsername('');
		setId('');
		
		// Trigger event để cập nhật header
		window.dispatchEvent(new Event('auth-change'));
		
		// Chuyển hướng về trang chủ
		navigate('/');
	};

	const handleSearchChange = (event) => {
		setSearchTerm(event.target.value);
	};

	const handleSearchSubmit = (event) => {
		if (event.key === 'Enter') {
			navigate(`/search?query=${searchTerm}`);
		}
	};

	const handleSearchButtonClick = () => {
		navigate(`/search?query=${searchTerm}`);
	};

	const handleClearCart = () => {
		dispatch(clearCartLocalStorage());
		localStorage.removeItem('cart');
	};

	return (
		<header className="header-v4">
			<div className="container-menu-desktop">
				<div className="top-bar">
					<div className="content-topbar flex-sb-m h-full container">
						<div className="left-top-bar">
						Miễn phí vận chuyển cho đơn hàng tiêu chuẩn trên $100
						</div>
						<div className="right-top-bar flex-w h-full">
							<a href="/home" className="flex-c-m trans-04 p-lr-25">
								Trợ giúp và câu hỏi thường gặp
							</a>
							
							{loggedIn ? (
								<a href="/account" className="flex-c-m trans-04 p-lr-25" style={{
									maxWidth: '150px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
								}}>
									<span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{username}</span>
								</a>
							) : (
								<a href="/login" className="flex-c-m trans-04 p-lr-25">
									<span>Đăng nhập</span>
								</a>
							)}
			
							<a href="/home" className="flex-c-m trans-04 p-lr-25">
								EN
							</a>
							<a href="/home" className="flex-c-m trans-04 p-lr-25">
								VNĐ
							</a>
						</div>
					</div>
				</div>
				<div className="wrap-menu-desktop how-shadow1">
					<nav className="limiter-menu-desktop container">
						<a href="/home" className="logo">
							<img src={`${process.env.PUBLIC_URL}/assets/images/icons/logo-01.png`} alt="IMG-LOGO" />
						</a>
						<div className="menu-desktop">
							<ul className="main-menu">
								<li><a href="/home">Trang chủ</a></li>
								<li className="active-menu"><a href="/product">
								Cửa hàng</a></li>
								<li className="label1" data-label1="hot"><a href="/shoppingCart">Giỏ hàng</a></li>
								<li><a href="/aboutUs">Giới Thiệu</a></li>
								<li><a href="/contact">Liên Hệ</a></li>
							</ul>
						</div>
						<div className="wrap-icon-header flex-w flex-r-m">
							<div className="icon-header-item cl2 hov-cl1 trans-04 p-l-22 p-r-11 icon-header-noti js-show-cart" data-notify={cart.length}>
								<a href="/shoppingCart"><i className="zmdi zmdi-shopping-cart"></i></a>
							</div>
							<a href="/account?tab=wishlist" className="icon-header-item cl2 hov-cl1 trans-04 p-l-22 p-r-11 icon-header-noti" data-notify={wishlistCount}>
								<i className="zmdi zmdi-favorite-outline"></i>
							</a>
							<div style={{ display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
								<i className="zmdi zmdi-search" style={{ color: 'red' }} onClick={handleSearchButtonClick}></i>
								<input
									style={{ border: 'none', outline: 'none', paddingLeft: '10px' }}
									type="text"
									name="search-product"
									placeholder="Tìm kiếm"
									value={searchTerm}
									onChange={handleSearchChange}
									onKeyDown={handleSearchSubmit}
									aria-label="Search products"
								/>
							</div>
							{loggedIn ? (
								<div 
									style={{ 
										display: 'flex', 
										alignItems: 'center', 
										marginLeft: '15px',
										cursor: 'pointer',
										maxWidth: '150px',
										overflow: 'hidden',
										whiteSpace: 'nowrap'
									}}
									onClick={() => navigate('/account')}
								>
									<i className="zmdi zmdi-account" style={{ marginRight: '8px', flexShrink: 0 }}></i>
									<span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{username}</span>
									
									<i 
										className="zmdi zmdi-power" 
										style={{ marginLeft: '10px', fontSize: '16px', color: '#666', flexShrink: 0 }}
										onClick={(e) => {
											e.stopPropagation();
											handleLogout();
										}}
									></i>
								</div>
							) : (
								<div 
									style={{ 
										display: 'flex', 
										alignItems: 'center', 
										marginLeft: '15px',
										cursor: 'pointer' 
									}}
									onClick={() => navigate('/login')}
								>
									<i className="zmdi zmdi-account" style={{ marginRight: '8px' }}></i>
									<span>Đăng nhập</span>
								</div>
							)}
						</div>
					</nav>
				</div>
			</div>
			<div className="wrap-header-mobile">
				<div className="logo-mobile">
					<a href="/home"><img src={`${process.env.PUBLIC_URL}/assets/images/icons/logo-01.png`} alt="IMG-LOGO" /></a>
				</div>
				<div className="wrap-icon-header flex-w flex-r-m m-r-15">
					<button className="icon-header-item cl2 hov-cl1 trans-04 p-r-11 js-show-modal-search" aria-label="Search">
						<i className="zmdi zmdi-search" onClick={handleSearchButtonClick}></i>
					</button>
					<div className="icon-header-item cl2 hov-cl1 trans-04 p-r-11 p-l-10 icon-header-noti js-show-cart" data-notify={cart.length}>
						<i className="zmdi zmdi-shopping-cart"></i>
					</div>
					<a href="/account?tab=wishlist" className="icon-header-item cl2 hov-cl1 trans-04 p-l-22 p-r-11 icon-header-noti" data-notify={wishlistCount}>
						<i className="zmdi zmdi-favorite-outline"></i>
					</a>
					<div 
						className="icon-header-item cl2 hov-cl1 trans-04 p-l-22 p-r-11" 
						onClick={() => navigate('/login')}
					>
						<i className="zmdi zmdi-account"></i>
					</div>
				</div>
				<button className="btn-show-menu-mobile hamburger hamburger--squeeze" aria-label="Menu">
                    <span className="hamburger-box">
                        <span className="hamburger-inner"></span>
                    </span>
				</button>
			</div>
			<div className="menu-mobile">
				<ul className="topbar-mobile">
					<li>
						<div className="left-top-bar">
						Miễn phí vận chuyển cho tiêu chuẩn đơn hàng trên $100						</div>
					</li>
					<li>
						<div className="right-top-bar flex-w h-full">
							<a href="/home" className="flex-c-m p-lr-10 trans-04">Help & FAQs</a>
							
							{loggedIn ? (
								<a href="/account" className="flex-c-m p-lr-10 trans-04" style={{
									maxWidth: '150px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
								}}>
									<span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{username}</span>
								</a>
							) : (
								<a href="/login" className="flex-c-m p-lr-10 trans-04">
									<span>Đăng nhập</span>
								</a>
							)}
							
							<a href="/home" className="flex-c-m p-lr-10 trans-04">EN</a>
							<a href="/home" className="flex-c-m p-lr-10 trans-04">VNĐ</a>
						</div>
					</li>
				</ul>
				<ul className="main-menu-m">
					<li><a href="/home">Trang Chủ</a></li>
					<li><a href="/product">Cửa hàng</a></li>
					<li><a href="/shoppingCart" className="label1 rs1" data-label1="hot">Giỏ hàng</a></li>
					<li><a href="/aboutUs">Giới Thiệu</a></li>
					<li><a href="/contact">Liên Hệ</a></li>
					
					{loggedIn ? (
						<>
							<li><div 
								style={{cursor: 'pointer', padding: '10px 20px'}}
								onClick={() => navigate('/account')}
							>
								<i className="zmdi zmdi-account mr-2"></i> Hồ sơ
							</div></li>
							<li><div 
								style={{cursor: 'pointer', padding: '10px 20px'}}
								onClick={(e) => {
									e.preventDefault();
									handleLogout();
								}}>
								<i className="zmdi zmdi-power mr-2"></i> Đăng xuất
							</div></li>
						</>
					) : (
						<>
							<li><div 
								style={{cursor: 'pointer', padding: '10px 20px'}}
								onClick={() => navigate('/login')}>
								<i className="zmdi zmdi-account-circle mr-2"></i> Đăng nhập
							</div></li>
						</>
					)}
				</ul>
			</div>
		</header>
	);
};

export default Header;

