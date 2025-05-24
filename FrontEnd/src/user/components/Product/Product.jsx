import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../Pagination/Pagination';
import ReactSlider from 'react-slider';
import './Product.css';
import './Slider.css';
import { remove as removeDiacritics } from 'diacritics';
import { getAllProducts, getProductsByCategory } from '../../../api/productApi';
import { getAllCategories } from '../../../api/categoryApi';

// Function to format categories for display
const formatCategories = (categories) => {
	return ['All Products', ...categories.map(cat => cat.name)];
};

const Product = () => {
	const [products, setProducts] = useState([]);
	const [categories, setCategories] = useState(['All Products']);
	const [sortOrder, setSortOrder] = useState('');
	const [priceRange, setPriceRange] = useState([0, 10000000]);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedCategory, setSelectedCategory] = useState('All Products');
	const [searchTerm, setSearchTerm] = useState('');
	const [isFilterVisible, setIsFilterVisible] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const itemsPerPage = 20;

	const navigate = useNavigate();

	// Fetch products and categories from API
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				// Fetch products
				const productsData = await getAllProducts();
				setProducts(productsData);
				
				// Fetch categories from API
				const categoriesData = await getAllCategories();
				setCategories(formatCategories(categoriesData));
				
				setLoading(false);
			} catch (error) {
				setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
				setLoading(false);
				console.error("Error fetching data:", error);
			}
		};

		fetchData();
	}, []);

	const handleSort = (order) => {
		setSortOrder(order);
	};

	const handlePriceRangeChange = (newRange) => {
		setPriceRange(newRange);
	};

	const handleDetail = (id) => {
		window.scrollTo(0, 0);  // Scroll to the top
		navigate(`/product/${id}`);
	};

	const handleCategoryChange = (category) => {
		setSelectedCategory(category);
		setCurrentPage(1); // Reset to first page when category changes
	};

	const handleSearchChange = (event) => {
		setSearchTerm(event.target.value);
		setCurrentPage(1); // Reset to first page when search term changes
	};

	const normalizeText = (text) => {
		return removeDiacritics(text)
			.toLowerCase()
			.replace(/đ/g, 'd')
			.replace(/Đ/g, 'D');
	};

	const doesProductMatchSearchTerm = (product, searchTerm) => {
		if (!searchTerm) return true;
		
		const normalizedProductName = normalizeText(product.name);
		const normalizedProductDes = product.des ? normalizeText(product.des) : '';
		const normalizedSearchTerm = normalizeText(searchTerm);
		const searchKeywords = normalizedSearchTerm.split(' ');

		return searchKeywords.every(keyword => 
			normalizedProductName.includes(keyword) || normalizedProductDes.includes(keyword)
		);
	};

	const sortedProducts = [...products].sort((a, b) => {
		if (sortOrder === 'priceLowToHigh') {
			return a.price - b.price;
		} else if (sortOrder === 'priceHighToLow') {
			return b.price - a.price;
		}
		return 0;
	});

	const filteredProducts = sortedProducts.filter(product => {
		const [min, max] = priceRange;
		if (product.price < min || product.price > max) return false;

		if (selectedCategory !== 'All Products' && product.category?.name !== selectedCategory) {
			return false;
		}

		if (searchTerm && !doesProductMatchSearchTerm(product, searchTerm)) {
			return false;
		}

		return true;
	});

	const indexOfLastProduct = currentPage * itemsPerPage;
	const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
	const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
	const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

	const handlePageChange = (pageNumber) => {
		setCurrentPage(pageNumber);
	};

	const toggleFilterVisibility = () => {
		setIsFilterVisible(!isFilterVisible);
	};

	// Number of categories to show before grouping into dropdown
	const visibleCategoryCount = 3;

	// Show loading state
	if (loading) {
		return <div className="container text-center p-t-80 p-b-80">Loading products...</div>;
	}

	// Show error state
	if (error) {
		return <div className="container text-center p-t-80 p-b-80">{error}</div>;
	}

	return (
		<div className="bg0 m-t-23 p-b-140">
			<div className="container">
				{/* Filter and Search Section */}
				<div className="flex-w flex-sb-m p-b-52">
					<div className="flex-w flex-l-m filter-tope-group m-tb-10">
						{categories.slice(0, visibleCategoryCount).map((category, index) => (
							<button
								key={index}
								className={`stext-106 cl6 hov1 bor3 trans-04 m-r-32 m-tb-5 ${category === selectedCategory ? 'how-active1' : ''}`}
								onClick={() => handleCategoryChange(category)}
							>
								{category}
							</button>
						))}
						<div className="dropdown">
							<button className="dropbtn stext-106 cl6 hov1 bor3 trans-04 m-r-32 m-tb-5">
								Nhiều Hơn
							</button>
							<div className="dropdown-content">
								{categories.slice(visibleCategoryCount).map((category, index) => (
									<a
										href="#"
										key={index}
										className={`stext-106 cl6 hov1 bor3 trans-04 m-r-32 m-tb-5 ${category === selectedCategory ? 'how-active1' : ''}`}
										onClick={() => handleCategoryChange(category)}
									>
										{category}
									</a>
								))}
							</div>
						</div>
					</div>
					<div className="flex-w flex-c-m m-tb-10">
						<div className="flex-c-m stext-106 cl6 size-104 bor4 pointer hov-btn3 trans-04 m-r-8 m-tb-4 js-show-filter" onClick={toggleFilterVisibility}>
							<i className="icon-filter cl2 m-r-6 fs-15 trans-04 zmdi zmdi-filter-list"></i>
							<i className={`icon-close-filter cl2 m-r-6 fs-15 trans-04 zmdi zmdi-close ${isFilterVisible ? '' : 'dis-none'}`}></i>
							Filter
						</div>
					</div>
					<div className="panel-search p-t-10 p-b-15">
						<div className="bor8 dis-flex p-l-15">
							<button className="size-113 flex-c-m fs-16 cl2 hov-cl1 trans-04">
								<i className="zmdi zmdi-search"></i>
							</button>
							<input
								className="mtext-107 cl2 size-114 plh2 p-r-15"
								type="text"
								name="search-product"
								placeholder="Tìm kiếm sản phẩm..."
								value={searchTerm}
								onChange={handleSearchChange}
							/>
						</div>
					</div>
				</div>
				{/* Filter Panel */}
				{isFilterVisible && (
					<div className="panel-filter visible">
						<div className="wrap-filter flex-w bg6 w-full p-lr-40 p-t-27 p-lr-15-sm">
							<div className="filter-col1 p-r-15 p-b-27">
								<div className="mtext-102 cl2 p-b-15">Sort By</div>
								<ul>
									<li className="p-b-6">
										<a href="#" className="filter-link stext-106 trans-04" onClick={() => handleSort('default')}>
											Default
										</a>
									</li>
									<li className="p-b-6">
										<a href="#" className="filter-link stext-106 trans-04" onClick={() => handleSort('priceLowToHigh')}>
											Price: Low to High
										</a>
									</li>
									<li className="p-b-6">
										<a href="#" className="filter-link stext-106 trans-04" onClick={() => handleSort('priceHighToLow')}>
											Price: High to Low
										</a>
									</li>
								</ul>
							</div>
							<div className="filter-col2 p-r-15 p-b-27">
								<div className="mtext-102 cl2 p-b-15">Price</div>
								<ReactSlider
									className="horizontal-slider"
									thumbClassName="example-thumb"
									trackClassName="example-track"
									min={0}
									max={10000000}
									step={100000}
									value={priceRange}
									onChange={handlePriceRangeChange}
									renderTrack={(props, state) => (
										<div {...props} className={`${props.className} example-track-${state.index}`} />
									)}
									renderThumb={(props, state) => (
										<div {...props}>
											<div className="thumb-value">{state.valueNow.toLocaleString()}</div>
											<div className="thumb-circle"></div>
										</div>
									)}
								/>
								<div className="price-range-values">
									<span>{priceRange[0].toLocaleString()} VND</span> - <span>{priceRange[1].toLocaleString()} VND</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Product Grid */}
				<div className="row isotope-grid">
					{currentProducts.map((product) => (
						<div key={product.id} className={`col-sm-6 col-md-4 col-lg-3 p-b-35 isotope-item ${product.category?.name.toLowerCase().replace(/ /g, '-')}`}>
							<div className="block2">
								<div className="block2-pic hov-img0">
									<img src={product.img} alt={product.name} />
									{!product.inStock && (
										<div className="out-of-stock-overlay">
											<span>Hết hàng</span>
										</div>
									)}
									<button
										onClick={() => handleDetail(product.id)}
										className="block2-btn flex-c-m stext-103 cl2 size-102 bg0 bor2 hov-btn1 p-lr-15 trans-04 js-show-modal1"
									>
										Chi tiết
									</button>
								</div>
								<div className="block2-txt flex-w flex-t p-t-14">
									<div className="block2-txt-child1 flex-col-l ">
										<a
											href={`/product/${product.id}`}
											className="stext-104 cl4 hov-cl1 trans-04 js-name-b2 p-b-6"
										>
											{product.name}
											{!product.inStock && (
												<span className="product-stock-badge">Hết hàng</span>
											)}
										</a>
										<span className="stext-105 cl3">{product.price.toLocaleString()} VND</span>
									</div>
									<div className="block2-txt-child2 flex-r p-t-3">
										<a href="#" className="btn-addwish-b2 dis-block pos-relative js-addwish-b2">
											<img
												className="icon-heart1 dis-block trans-04"
												src="assets/images/icons/icon-heart-01.png"
												alt="ICON"
											/>
											<img
												className="icon-heart2 dis-block trans-04 ab-t-l"
												src="assets/images/icons/icon-heart-02.png"
												alt="ICON"
											/>
										</a>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Pagination */}
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					onPageChange={handlePageChange}
				/>
			</div>
			<style jsx>{`
				.out-of-stock-overlay {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background-color: rgba(0, 0, 0, 0.5);
					display: flex;
					justify-content: center;
					align-items: center;
					z-index: 1;
				}
				
				.out-of-stock-overlay span {
					background-color: #e65540;
					color: white;
					padding: 8px 16px;
					font-size: 16px;
					font-weight: bold;
					border-radius: 4px;
				}
				
				.product-stock-badge {
					display: inline-block;
					margin-left: 8px;
					padding: 2px 6px;
					background-color: #f8d7da;
					color: #e65540;
					border: 1px solid #f5c6cb;
					border-radius: 4px;
					font-size: 12px;
					font-weight: 500;
				}
			`}</style>
		</div>
	);
};

export default Product;
