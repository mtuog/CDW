import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Home.css'; // Ensure you have a CSS file for additional styles
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
		draggable: true, // Enable dragging with the mouse
		autoplay: true, // Enable autoplay
		autoplaySpeed: 2000, // Autoplay speed in milliseconds
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1,
					infinite: true,
					dots: true,
					autoplay: true, // Ensure autoplay is enabled on all breakpoints
					autoplaySpeed: 3000,
				}
			},
			{
				breakpoint: 600,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1,
					autoplay: true, // Ensure autoplay is enabled on all breakpoints
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
		<>
			{/* Banner Section */}
			<div className="sec-banner bg0 p-t-80 p-b-50">
				<div className="container">
					<div className="row">
						{/* Display banners or featured categories here */}
					</div>
				</div>
			</div>

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
											<img src={product.img} alt={product.name} />
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
											<img src={product.img} alt={product.name} />
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
											<img src={product.img} alt={product.name} />
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
		</>
	);
};

export default Home;
