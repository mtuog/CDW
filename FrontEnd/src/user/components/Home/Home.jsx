import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Home.css';
import { getAllProducts, getTopSellingProducts, getFeaturedProducts } from '../../../api/productApi';

const Home = () => {
	const slideImages = [
		'assets/images/img.png',
		'assets/images/img_1.png',
	];

	const navigate = useNavigate();

	const [bestSellerProducts, setBestSellerProducts] = useState([]);
	const [newProducts, setNewProducts] = useState([]);
	const [favoriteProducts, setFavoriteProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Fetch products from API
	useEffect(() => {
		const fetchProducts = async () => {
			try {
				setLoading(true);

				// Fetch all product categories in parallel for better performance
				const [bestSellers, newProds, favorites] = await Promise.all([
					getTopSellingProducts(),
					getFeaturedProducts(),
					getFeaturedProducts()
				]);

				setBestSellerProducts(bestSellers);
				setNewProducts(newProds);
				setFavoriteProducts(favorites);

				setLoading(false);
			} catch (error) {
				setError("Không thể tải sản phẩm. Vui lòng thử lại sau.");
				setLoading(false);
				console.error("Error fetching products:", error);
			}
		};

		fetchProducts();
	}, []);

	const settings = {
		dots: true,
		infinite: true,
		speed: 500,
		slidesToShow: 4,
		slidesToScroll: 1,
		draggable: true,
		autoplay: true,
		autoplaySpeed: 2000,
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1,
					infinite: true,
					dots: true,
					autoplay: true,
					autoplaySpeed: 3000,
				}
			},
			{
				breakpoint: 600,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1,
					autoplay: true,
					autoplaySpeed: 3000,
				}
			}
		],
		nextArrow: <SampleNextArrow />,
		prevArrow: <SamplePrevArrow />
	};

	function SampleNextArrow(props) {
		const { className, style, onClick } = props;
		return (
			<div
				className={className}
				style={{ ...style, display: "block", right: "-25px" }}
				onClick={onClick}
			/>
		);
	}

	function SamplePrevArrow(props) {
		const { className, style, onClick } = props;
		return (
			<div
				className={className}
				style={{ ...style, display: "block", left: "-25px" }}
				onClick={onClick}
			/>
		);
	}

	// Show loading state
	if (loading) {
		return <div className="container text-center p-t-80 p-b-80">Loading products...</div>;
	}

	// Show error state
	if (error) {
		return <div className="container text-center p-t-80 p-b-80">{error}</div>;
	}

	// Function to handle click on product
	const handleProductClick = (id) => {
		navigate(`/product/${id}`);
	};

	return (
		<div className="home-page">
			{/* Main Banner Section */}
			<section className="main-banner-section">
				<div className="container-fluid px-4">
					<div className="row g-4">
						{/* Banner chính bên trái */}
						<div className="col-lg-8 col-md-12">
							<div className="hero-main-banner" style={{backgroundImage: `url('assets/images/banner-10.jpg')`}}>
								<div className="banner-overlay">
									<div className="banner-content">
										<h1 className="main-banner-title">ATLANTIS COLLECTION</h1>
										<p className="main-banner-text">
											Khám phá bộ sưu tập đồng phục sang trọng với thiết kế tinh tế
										</p>
										<button className="main-banner-btn" onClick={() => navigate('/products')}>Mua Ngay</button>
									</div>
								</div>
							</div>
						</div>

						{/* Banner phụ bên phải */}
						<div className="col-lg-4 col-md-12">
							<div className="side-banner-container">
								<div className="side-banner-item">
									<div className="side-banner" style={{backgroundImage: `url('assets/images/img.png')`}}>
										<div className="side-banner-overlay">
											<div className="side-banner-content">
												<span className="side-discount">GIẢM THIỆU 20%</span>
												<h3 className="side-banner-title">KHÁM PHÁ</h3>
												<button className="side-banner-btn" onClick={() => navigate('/products')}>Đến Shop</button>
											</div>
										</div>
									</div>
								</div>
								<div className="side-banner-item">
									<div className="side-banner" style={{backgroundImage: `url('assets/images/img_1.png')`}}>
										<div className="side-banner-overlay">
											<div className="side-banner-content">
												<h3 className="side-banner-title">KHÁM PHÁ</h3>
												<button className="side-banner-btn"onClick={() => navigate('/products')}>Đến Shop</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="features-section">
				<div className="container">
					<div className="row justify-content-center g-4">
						<div className="col-lg-3 col-md-6">
							<div className="feature-box">
								<div className="feature-icon">
									<i className="fa fa-trophy"></i>
								</div>
								<h5 className="feature-title">Quality Product</h5>
								<p className="feature-desc">Sản phẩm chất lượng cao</p>
							</div>
						</div>
						<div className="col-lg-3 col-md-6">
							<div className="feature-box">
								<div className="feature-icon">
									<i className="fa fa-shipping-fast"></i>
								</div>
								<h5 className="feature-title">Free Shipping</h5>
								<p className="feature-desc">Miễn phí vận chuyển</p>
							</div>
						</div>
						<div className="col-lg-3 col-md-6">
							<div className="feature-box">
								<div className="feature-icon">
									<i className="fa fa-undo"></i>
								</div>
								<h5 className="feature-title">14-Day Return</h5>
								<p className="feature-desc">Đổi trả trong 14 ngày</p>
							</div>
						</div>
						<div className="col-lg-3 col-md-6">
							<div className="feature-box">
								<div className="feature-icon">
									<i className="fa fa-headset"></i>
								</div>
								<h5 className="feature-title">24/7 Support</h5>
								<p className="feature-desc">Hỗ trợ 24/7</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Featured Products Grid */}
			<section className="featured-grid-section">
				<div className="container">
					<div className="section-header text-center">
						<h2 className="section-title">SẢN PHẨM TIÊU BIỂU</h2>
						<p className="section-subtitle">Khám phá những sản phẩm trang sức được yêu thích nhất</p>
					</div>
					<div className="row justify-content-center g-4">
						{favoriteProducts.slice(0, 8).map((product, index) => (
							<div key={product.id} className="col-xl-3 col-lg-4 col-md-6">
								<div className="featured-product-card">
									{index < 4 && (
										<div className="discount-label">
											GIẢM {Math.floor(Math.random() * 20 + 10)}%
										</div>
									)}
									<div className="product-img-container">
										<img src={product.img} alt={product.name} className="product-img"/>
										<div className="product-hover-overlay">
											<button
												onClick={() => handleProductClick(product.id)}
												className="quick-view-btn"
											>
												<i className="fa fa-eye"></i>
												Xem chi tiết
											</button>
										</div>
									</div>
									<div className="product-details">
										<h5 className="product-title">{product.name}</h5>
										<div className="product-pricing">
											<span className="current-price">{product.price.toLocaleString()} ₫</span>
											{index < 4 && (
												<span className="old-price">{(product.price * 1.2).toLocaleString()} ₫</span>
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Best Seller Section */}
			<section className="bg0 p-t-23 p-b-140">
				<div className="container">
					<div className="p-b-10">
						<h3 className="ltext-103 cl5">
							Sản phẩm bán chạy
						</h3>
					</div>

					<div className="product-slider">
						<Slider {...settings}>
							{bestSellerProducts.map((product) => (
								<div key={product.id} className="item-slick2 p-l-15 p-r-15 p-t-15 p-b-15">
									<div className="block2">
										<div className="block2-pic hov-img0">
											<img src={product.img} alt={product.name}/>
											<button
												onClick={() => handleProductClick(product.id)}
												className="block2-btn flex-c-m stext-103 cl2 size-102 bg0 bor2 hov-btn1 p-lr-15 trans-04"
											>
												Chi tiết
											</button>
										</div>

										<div className="block2-txt flex-w flex-t p-t-14">
											<div className="block2-txt-child1 flex-col-l">
												<a
													href={`/product/${product.id}`}
													className="stext-104 cl4 hov-cl1 trans-04 js-name-b2 p-b-6"
												>
													{product.name}
												</a>
												<span className="stext-105 cl3">
													{product.price.toLocaleString()} VND
												</span>
											</div>
										</div>
									</div>
								</div>
							))}
						</Slider>
					</div>

					{/* New Products Section */}
					<div className="p-b-10 p-t-50">
						<h3 className="ltext-103 cl5">
							Sản phẩm mới
						</h3>
					</div>

					<div className="product-slider">
						<Slider {...settings}>
							{newProducts.map((product) => (
								<div key={product.id} className="item-slick2 p-l-15 p-r-15 p-t-15 p-b-15">
									<div className="block2">
										<div className="block2-pic hov-img0">
											<img src={product.img} alt={product.name}/>
											<button
												onClick={() => handleProductClick(product.id)}
												className="block2-btn flex-c-m stext-103 cl2 size-102 bg0 bor2 hov-btn1 p-lr-15 trans-04"
											>
												Chi tiết
											</button>
										</div>

										<div className="block2-txt flex-w flex-t p-t-14">
											<div className="block2-txt-child1 flex-col-l">
												<a
													href={`/product/${product.id}`}
													className="stext-104 cl4 hov-cl1 trans-04 js-name-b2 p-b-6"
												>
													{product.name}
												</a>
												<span className="stext-105 cl3">
													{product.price.toLocaleString()} VND
												</span>
											</div>
										</div>
									</div>
								</div>
							))}
						</Slider>
					</div>

					{/* Favorite Products Section */}
					<div className="p-b-10 p-t-50">
						<h3 className="ltext-103 cl5">
							Sản phẩm nổi bật
						</h3>
					</div>

					<div className="product-slider">
						<Slider {...settings}>
							{favoriteProducts.map((product) => (
								<div key={product.id} className="item-slick2 p-l-15 p-r-15 p-t-15 p-b-15">
									<div className="block2">
										<div className="block2-pic hov-img0">
											<img src={product.img} alt={product.name}/>
											<button
												onClick={() => handleProductClick(product.id)}
												className="block2-btn flex-c-m stext-103 cl2 size-102 bg0 bor2 hov-btn1 p-lr-15 trans-04"
											>
												Chi tiết
											</button>
										</div>

										<div className="block2-txt flex-w flex-t p-t-14">
											<div className="block2-txt-child1 flex-col-l">
												<a
													href={`/product/${product.id}`}
													className="stext-104 cl4 hov-cl1 trans-04 js-name-b2 p-b-6"
												>
													{product.name}
												</a>
												<span className="stext-105 cl3">
													{product.price.toLocaleString()} VND
												</span>
											</div>
										</div>
									</div>
								</div>
							))}
						</Slider>
					</div>
				</div>
			</section>
		</div>
	);
};

export default Home;
