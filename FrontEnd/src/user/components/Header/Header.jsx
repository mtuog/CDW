import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
	const location = useLocation();

	// Styles inline với màu đen
	const styles = {
		headerContainer: {
			background: 'white',
			boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
			position: 'sticky',
			top: 0,
			zIndex: 1000
		},
		topBar: {
			background: '#333',
			color: 'white',
			padding: '8px 0',
			fontSize: '13px'
		},
		topBarLink: {
			color: 'white',
			textDecoration: 'none',
			fontSize: '13px',
			padding: '4px 8px',
			transition: 'color 0.3s ease'
		},
		mainHeader: {
			padding: '20px 0',
			minHeight: '90px'
		},
		logo: {
			height: '90px',
			width: '90px',
			transition: 'transform 1.5s ease'
		},
		navMenu: {
			display: 'flex',
			listStyle: 'none',
			margin: 0,
			padding: 0,
			gap: '20px',
			alignItems: 'center'
		},
		navLink: {
			color: '#333',
			textDecoration: 'none',
			fontSize: '14px',
			fontWeight: '500',
			padding: '10px 15px',
			transition: 'color 0.3s ease',
			textTransform: 'uppercase',
			whiteSpace: 'nowrap'
		},
		activeNavLink: {
			color: '#717fe0',
			fontWeight: '600'
		},
		iconContainer: {
			display: 'flex',
			alignItems: 'center',
			gap: '10px'
		},
		iconItem: {
			position: 'relative',
			color: '#333',
			fontSize: '20px',
			padding: '8px',
			transition: 'color 0.3s ease',
			cursor: 'pointer',
			textDecoration: 'none',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		},
		badge: {
			position: 'absolute',
			top: '-5px',
			right: '-5px',
			background: '#717fe0',
			color: 'white',
			borderRadius: '50%',
			width: '18px',
			height: '18px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: '10px',
			fontWeight: 'bold',
			minWidth: '18px'
		},
		searchContainer: {
			display: 'flex',
			alignItems: 'center',
			background: 'transparent',
			padding: '0',
			marginLeft: '20px'
		},
		searchInput: {
			border: 'none',
			outline: 'none',
			background: 'transparent',
			padding: '8px 10px',
			fontSize: '14px',
			color: '#333',
			width: '200px'
		},
		searchIcon: {
			color: 'red',
			fontSize: '18px',
			cursor: 'pointer',
			marginRight: '5px'
		},
		userAccount: {
			display: 'flex',
			alignItems: 'center',
			cursor: 'pointer',
			padding: '5px 10px',
			transition: 'color 0.3s ease',
			maxWidth: '150px',
			overflow: 'hidden',
			whiteSpace: 'nowrap',
			marginLeft: '15px'
		},
		userIcon: {
			marginRight: '8px',
			fontSize: '18px',
			flexShrink: 0
		},
		userName: {
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			color: '#333'
		},
		logoutBtn: {
			marginLeft: '10px',
			fontSize: '16px',
			color: '#666',
			flexShrink: 0,
			cursor: 'pointer'
		},
		hotBadge: {
			background: '#717fe0',
			color: 'white',
			padding: '2px 6px',
			borderRadius: '8px',
			fontSize: '9px',
			fontWeight: 'bold',
			textTransform: 'uppercase',
			marginLeft: '5px'
		}
	};

	// Function để kiểm tra active menu
	const isActiveMenu = (path) => {
		return location.pathname === path;
	};

	useEffect(() => {
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

		checkLoginStatus();
		window.addEventListener('storage', checkLoginStatus);
		window.addEventListener('focus', checkLoginStatus);

		return () => {
			window.removeEventListener('storage', checkLoginStatus);
			window.removeEventListener('focus', checkLoginStatus);
		};
	}, []);

	useEffect(() => {
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

	useEffect(() => {
		if (loggedIn && id) {
			fetchWishlistCount();
		} else {
			setWishlistCount(0);
		}
	}, [loggedIn, id]);

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
				`${BACKEND_URL_HTTP}/api/wishlist/count/${id}`,
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
		}
	};

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('refreshToken');
		localStorage.removeItem('userId');
		localStorage.removeItem('userName');
		localStorage.removeItem('userRole');

		setLoggedIn(false);
		setUsername('');
		setId('');

		window.dispatchEvent(new Event('auth-change'));
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
		<header className="header-v4" style={styles.headerContainer}>
			<div className="container-menu-desktop">
				{/* Top Bar */}
				<div style={styles.topBar}>
					<div className="content-topbar flex-sb-m h-full container">
						<div className="left-top-bar">
							Miễn phí vận chuyển cho đơn hàng tiêu chuẩn trên $100
						</div>
						<div className="right-top-bar flex-w h-full">
							<Link
								to="/home"
								style={styles.topBarLink}
								onMouseEnter={(e) => e.target.style.color = '#ccc'}
								onMouseLeave={(e) => e.target.style.color = 'white'}
							>
								Trợ giúp và câu hỏi thường gặp
							</Link>

							{loggedIn ? (
								<Link
									to="/account"
									style={{
										...styles.topBarLink,
										maxWidth: '150px',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap'
									}}
									onMouseEnter={(e) => e.target.style.color = '#ccc'}
									onMouseLeave={(e) => e.target.style.color = 'white'}
								>
									<span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{username}</span>
								</Link>
							) : (
								<Link
									to="/login"
									style={styles.topBarLink}
									onMouseEnter={(e) => e.target.style.color = '#ccc'}
									onMouseLeave={(e) => e.target.style.color = 'white'}
								>
									<span>Đăng nhập</span>
								</Link>
							)}

							<Link
								to="/home"
								style={styles.topBarLink}
								onMouseEnter={(e) => e.target.style.color = '#ccc'}
								onMouseLeave={(e) => e.target.style.color = 'white'}
							>
								EN
							</Link>
							<Link
								to="/home"
								style={styles.topBarLink}
								onMouseEnter={(e) => e.target.style.color = '#ccc'}
								onMouseLeave={(e) => e.target.style.color = 'white'}
							>
								VN
							</Link>
						</div>
					</div>
				</div>

				{/* Main Header */}
				<div className="wrap-menu-desktop how-shadow1" style={styles.mainHeader}>
					<nav className="limiter-menu-desktop container" style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						flexWrap: 'nowrap'
					}}>
						{/* Logo */}
						<Link to="/home" className="logo">
							<img
								src={`${process.env.PUBLIC_URL}/assets/images/icons/logo-01.png`}
								alt="IMG-LOGO"
								style={styles.logo}
							/>
						</Link>

						{/* Navigation Menu */}
						<div className="menu-desktop" style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
							<ul style={styles.navMenu}>
								<li>
									<Link
										to="/home"
										style={{
											...styles.navLink,
											...(isActiveMenu('/home') ? styles.activeNavLink : {})
										}}
										onMouseEnter={(e) => {
											if (!isActiveMenu('/home')) {
												e.target.style.color = '#717fe0';
											}
										}}
										onMouseLeave={(e) => {
											if (!isActiveMenu('/home')) {
												e.target.style.color = '#333';
											}
										}}
									>
										Trang chủ
									</Link>
								</li>
								<li>
									<Link
										to="/product"
										style={{
											...styles.navLink,
											...(isActiveMenu('/product') ? styles.activeNavLink : {})
										}}
										onMouseEnter={(e) => {
											if (!isActiveMenu('/product')) {
												e.target.style.color = '#717fe0';
											}
										}}
										onMouseLeave={(e) => {
											if (!isActiveMenu('/product')) {
												e.target.style.color = '#333';
											}
										}}
									>
										Cửa hàng
									</Link>
								</li>
								<li>
									<Link
										to="/shoppingCart"
										style={{
											...styles.navLink,
											...(isActiveMenu('/shoppingCart') ? styles.activeNavLink : {}),
											display: 'flex',
											alignItems: 'center'
										}}
										onMouseEnter={(e) => {
											if (!isActiveMenu('/shoppingCart')) {
												e.target.style.color = '#717fe0';
											}
										}}
										onMouseLeave={(e) => {
											if (!isActiveMenu('/shoppingCart')) {
												e.target.style.color = '#333';
											}
										}}
									>
										Giỏ hàng
									</Link>
								</li>
								<li>
									<Link
										to="/aboutUs"
										style={{
											...styles.navLink,
											...(isActiveMenu('/aboutUs') ? styles.activeNavLink : {})
										}}
										onMouseEnter={(e) => {
											if (!isActiveMenu('/aboutUs')) {
												e.target.style.color = '#717fe0';
											}
										}}
										onMouseLeave={(e) => {
											if (!isActiveMenu('/aboutUs')) {
												e.target.style.color = '#333';
											}
										}}
									>
										Giới Thiệu
									</Link>
								</li>
								<li>
									<Link
										to="/contact"
										style={{
											...styles.navLink,
											...(isActiveMenu('/contact') ? styles.activeNavLink : {})
										}}
										onMouseEnter={(e) => {
											if (!isActiveMenu('/contact')) {
												e.target.style.color = '#717fe0';
											}
										}}
										onMouseLeave={(e) => {
											if (!isActiveMenu('/contact')) {
												e.target.style.color = '#333';
											}
										}}
									>
										Liên Hệ
									</Link>
								</li>
							</ul>
						</div>

						{/* Right Side Icons */}
						<div style={styles.iconContainer}>
							{/* Shopping Cart */}
							<Link
								to="/shoppingCart"
								style={styles.iconItem}
								onMouseEnter={(e) => e.target.style.color = '#717fe0'}
								onMouseLeave={(e) => e.target.style.color = '#333'}
							>
								<i className="zmdi zmdi-shopping-cart"></i>
								{cart.length > 0 && (
									<span style={styles.badge}>
										{cart.length}
									</span>
								)}
							</Link>

							{/* Wishlist */}
							<Link
								to="/account?tab=wishlist"
								style={styles.iconItem}
								onMouseEnter={(e) => e.target.style.color = '#717fe0'}
								onMouseLeave={(e) => e.target.style.color = '#333'}
							>
								<i className="zmdi zmdi-favorite-outline"></i>
								{wishlistCount > 0 && (
									<span style={styles.badge}>
										{wishlistCount}
									</span>
								)}
							</Link>

							{/* Search */}
							<div style={styles.searchContainer}>
								<i
									className="zmdi zmdi-search"
									style={styles.searchIcon}
									onClick={handleSearchButtonClick}
								></i>
								<input
									type="text"
									name="search-product"
									placeholder="Tìm kiếm"
									value={searchTerm}
									onChange={handleSearchChange}
									onKeyDown={handleSearchSubmit}
									style={styles.searchInput}
									aria-label="Search products"
								/>
							</div>

							{/* User Account */}
							{loggedIn ? (
								<div style={styles.userAccount}>
									<i className="zmdi zmdi-account" style={styles.userIcon}></i>
									<span
										style={styles.userName}
										onClick={() => navigate('/account')}
									>
										{username}
									</span>
									<i
										className="zmdi zmdi-power"
										style={styles.logoutBtn}
										onClick={(e) => {
											e.stopPropagation();
											handleLogout();
										}}
										onMouseEnter={(e) => e.target.style.color = '#717fe0'}
										onMouseLeave={(e) => e.target.style.color = '#666'}
									></i>
								</div>
							) : (
								<div
									style={styles.userAccount}
									onClick={() => navigate('/login')}
								>
									<i className="zmdi zmdi-account" style={styles.userIcon}></i>
									<span style={styles.userName}>Đăng nhập</span>
								</div>
							)}
						</div>
					</nav>
				</div>
			</div>

			{/* Mobile Header - giữ nguyên */}
			<div className="wrap-header-mobile">
				<div className="logo-mobile">
					<Link to="/home"><img src={`${process.env.PUBLIC_URL}/assets/images/icons/logo-01.png`} alt="IMG-LOGO" /></Link>
				</div>
				<div className="wrap-icon-header flex-w flex-r-m m-r-15">
					<button className="icon-header-item cl2 hov-cl1 trans-04 p-r-11 js-show-modal-search" aria-label="Search">
						<i className="zmdi zmdi-search" onClick={handleSearchButtonClick}></i>
					</button>
					<Link to="/shoppingCart" className="icon-header-item cl2 hov-cl1 trans-04 p-r-11 p-l-10 icon-header-noti" data-notify={cart.length}>
						<i className="zmdi zmdi-shopping-cart"></i>
					</Link>
					<Link to="/account?tab=wishlist" className="icon-header-item cl2 hov-cl1 trans-04 p-l-22 p-r-11 icon-header-noti" data-notify={wishlistCount}>
						<i className="zmdi zmdi-favorite-outline"></i>
					</Link>
					<div
						className="icon-header-item cl2 hov-cl1 trans-04 p-l-22 p-r-11"
						onClick={() => navigate(loggedIn ? '/account' : '/login')}
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

			{/* Mobile Menu - giữ nguyên */}
			<div className="menu-mobile">
				<ul className="topbar-mobile">
					<li>
						<div className="left-top-bar">
							Miễn phí vận chuyển cho tiêu chuẩn đơn hàng trên $100
						</div>
					</li>
					<li>
						<div className="right-top-bar flex-w h-full">
							<Link to="/home" className="flex-c-m p-lr-10 trans-04">Help & FAQs</Link>

							{loggedIn ? (
								<Link to="/account" className="flex-c-m p-lr-10 trans-04" style={{
									maxWidth: '150px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
								}}>
									<span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{username}</span>
								</Link>
							) : (
								<Link to="/login" className="flex-c-m p-lr-10 trans-04">
									<span>Đăng nhập</span>
								</Link>
							)}

							<Link to="/home" className="flex-c-m p-lr-10 trans-04">EN</Link>
							<Link to="/home" className="flex-c-m p-lr-10 trans-04">VNĐ</Link>
						</div>
					</li>
				</ul>
				<ul className="main-menu-m">
					<li><Link to="/home">Trang Chủ</Link></li>
					<li><Link to="/product">Cửa hàng</Link></li>
					<li><Link to="/shoppingCart">Giỏ hàng</Link></li>
					<li><Link to="/aboutUs">Giới Thiệu</Link></li>
					<li><Link to="/contact">Liên Hệ</Link></li>

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
