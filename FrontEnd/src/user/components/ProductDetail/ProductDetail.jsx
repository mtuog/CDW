// src/components/ProductDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../../store/Actions';
import { findProductSizesById } from '../../../sizeColorHelpers';
import { getProductById } from '../../../api/productApi';
import { BACKEND_URL_HTTP } from '../../../config';
import axios from 'axios';
import Swal from 'sweetalert2';
import ProductReviews from './ProductReviews';

const ProductDetail = () => {
	const { id } = useParams();
	const [product, setProduct] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const cart = useSelector(state => state.cart);
	const [quantity, setQuantity] = useState(1);
	const [selectedSize, setSelectedSize] = useState('');
	const [showZoom, setShowZoom] = useState(false);
	const [isInWishlist, setIsInWishlist] = useState(false);
	const [productSizes, setProductSizes] = useState([]);
	const [loadingSizes, setLoadingSizes] = useState(false);
	
	// Fetch product details from API
	useEffect(() => {
		const fetchProductDetails = async () => {
			try {
				setLoading(true);
				const data = await getProductById(parseInt(id));
				setProduct(data);
				
				// Fetch sizes for this product
				await fetchProductSizes(parseInt(id));
				
				// Kiểm tra xem sản phẩm có trong wishlist không
				checkWishlistStatus(parseInt(id));
				
				setLoading(false);
			} catch (error) {
				setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
				setLoading(false);
				console.error("Error fetching product details:", error);
			}
		};

		fetchProductDetails();
	}, [id]);
	
	// Kiểm tra trạng thái wishlist
	const checkWishlistStatus = async (productId) => {
		const token = localStorage.getItem('token');
		const userId = localStorage.getItem('userId');
		
		if (!token || !userId) return;
		
		try {
			console.log("Checking wishlist status for product:", productId, "and user:", userId);
			
			const response = await axios.get(
				`${BACKEND_URL_HTTP}/api/wishlist/check?userId=${userId}&productId=${productId}`,
				{
					headers: {
						'Authorization': `Bearer ${token}`
					}
				}
			);
			
			console.log("Wishlist check response:", response.data);
			
			if (response.status === 200) {
				setIsInWishlist(response.data);
			}
		} catch (error) {
			console.error('Error checking wishlist status:', error);
			console.error('Error details:', error.response?.data || error.message);
		}
	};
	
	// Add to wishlist
	const handleAddToWishlist = async (e) => {
		if (e) e.preventDefault(); // Ngăn chặn hành vi mặc định của thẻ a
		
		const token = localStorage.getItem('token');
		const userId = localStorage.getItem('userId');
		
		console.log("Token available:", !!token);
		console.log("UserId:", userId);
		
		if (!token || !userId) {
			// Người dùng chưa đăng nhập
			Swal.fire({
				title: 'Yêu cầu đăng nhập',
				text: 'Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích',
				icon: 'info',
				showCancelButton: true,
				confirmButtonText: 'Đăng nhập ngay',
				cancelButtonText: 'Để sau',
				confirmButtonColor: '#e65540'
			}).then((result) => {
				if (result.isConfirmed) {
					navigate('/login');
				}
			});
			return;
		}
		
		try {
			console.log("Calling wishlist API with method:", isInWishlist ? "DELETE" : "POST");
			console.log("Token being sent:", token.substring(0, 10) + "...");
			console.log("UserId being used:", userId);
			let response;
			
			if (isInWishlist) {
				// Xóa khỏi wishlist
				response = await axios.delete(
					`${BACKEND_URL_HTTP}/api/wishlist/remove/${product.id}?userId=${userId}`,
					{
						headers: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'application/json'
						}
					}
				);
				
				if (response.status === 200) {
					setIsInWishlist(false);
					// Dispatch wishlist update event
					window.dispatchEvent(new Event('wishlist-update'));
					Swal.fire({
						title: 'Đã xóa',
						text: 'Sản phẩm đã được xóa khỏi danh sách yêu thích',
						icon: 'success',
						timer: 1500,
						showConfirmButton: false
					});
				}
			} else {
				// Thêm vào wishlist
				console.log("Sending request to add to wishlist:", {
					productId: product.id,
					userId: parseInt(userId),
					endpoint: `${BACKEND_URL_HTTP}/api/wishlist/add`
				});
				
				response = await axios.post(
					`${BACKEND_URL_HTTP}/api/wishlist/add`,
					{
						productId: product.id,
						userId: parseInt(userId)
					},
					{
						headers: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'application/json'
						},
						withCredentials: true
					}
				);
				
				if (response.status === 200 || response.status === 201) {
					setIsInWishlist(true);
					// Dispatch wishlist update event
					window.dispatchEvent(new Event('wishlist-update'));
					Swal.fire({
						title: 'Đã thêm',
						text: 'Sản phẩm đã được thêm vào danh sách yêu thích',
						icon: 'success',
						timer: 1500,
						showConfirmButton: false
					});
				}
			}
			
			console.log("API response:", response);
		} catch (error) {
			console.error('Error updating wishlist:', error);
			console.error('Error details:', error.response?.data || error.message);
			
			Swal.fire({
				title: 'Lỗi',
				text: 'Không thể cập nhật danh sách yêu thích. Vui lòng thử lại sau.',
				icon: 'error',
				confirmButtonText: 'Đóng'
			});
		}
	};
	
	// Toggle zoom image modal and control header visibility
	const toggleZoom = () => {
		const newZoomState = !showZoom;
		setShowZoom(newZoomState);
		
		// Get the header element and toggle its visibility
		const header = document.querySelector('header');
		if (header) {
			if (newZoomState) {
				// Hide header when zoom is shown
				header.style.display = 'none';
				// Also lock body scrolling
				document.body.style.overflow = 'hidden';
			} else {
				// Show header when zoom is closed
				header.style.display = '';
				// Restore body scrolling
				document.body.style.overflow = '';
			}
		}
	};

	// Close modal when clicking outside image
	const handleCloseZoom = (e) => {
		if (e.target.classList.contains('zoom-modal')) {
			toggleZoom(); // Use toggleZoom to ensure header visibility is also toggled
		}
	};

	// Close modal with ESC key
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.keyCode === 27 && showZoom) {
				toggleZoom(); // Use toggleZoom to ensure header visibility is also toggled
			}
		};
		window.addEventListener('keydown', handleEsc);
		
		// Cleanup function
		return () => {
			window.removeEventListener('keydown', handleEsc);
			// Ensure header is visible when component unmounts if it was hidden
			if (showZoom) {
				const header = document.querySelector('header');
				if (header) {
					header.style.display = '';
				}
				document.body.style.overflow = '';
			}
		};
	}, [showZoom]);

	const handleAddToCart = () => {
		// Kiểm tra nếu sản phẩm hết hàng
		if (!product.inStock) {
			Swal.fire({
				title: 'Sản phẩm đã hết hàng!',
				text: 'Sản phẩm này hiện đã hết hàng, vui lòng chọn sản phẩm khác hoặc quay lại sau.',
				icon: 'error',
				confirmButtonText: 'Đã hiểu',
				confirmButtonColor: '#e65540'
			});
			return;
		}

		// Kiểm tra nếu chưa chọn size
		if (!selectedSize) {
			Swal.fire({
				title: 'Vui lòng chọn kích thước!',
				text: 'Bạn cần chọn kích thước trước khi thêm sản phẩm vào giỏ hàng.',
				icon: 'warning',
				confirmButtonText: 'Đã hiểu',
				confirmButtonColor: '#e65540'
			});
			return;
		}

		// Kiểm tra số lượng tồn kho của size cụ thể
		const sizeInfo = productSizes.find(s => s.size === selectedSize);
		if (sizeInfo && quantity > sizeInfo.quantity) {
			Swal.fire({
				title: 'Vượt quá số lượng tồn kho!',
				text: `Số lượng bạn yêu cầu (${quantity}) vượt quá số lượng size ${selectedSize} còn lại trong kho (${sizeInfo.quantity}). Vui lòng giảm số lượng.`,
				icon: 'warning',
				confirmButtonText: 'Đã hiểu',
				confirmButtonColor: '#e65540'
			});
			return;
		}

		const productToAdd = {
			id: parseInt(id),
			quantity: quantity,
			size: selectedSize,
		};

		// Kiểm tra nếu sản phẩm đã tồn tại trong giỏ hàng với cùng size
		const existingItem = cart.find(item => 
			item.id === productToAdd.id && item.size === productToAdd.size
		);

		if (existingItem) {
			// Kiểm tra tổng số lượng sau khi thêm có vượt quá số lượng tồn kho của size không
			if (sizeInfo && existingItem.quantity + quantity > sizeInfo.quantity) {
				Swal.fire({
					title: 'Vượt quá số lượng tồn kho!',
					text: `Tổng số lượng trong giỏ hàng (${existingItem.quantity + quantity}) sẽ vượt quá số lượng size ${selectedSize} còn lại trong kho (${sizeInfo.quantity}).`,
					icon: 'warning',
					confirmButtonText: 'Đã hiểu',
					confirmButtonColor: '#e65540'
				});
				return;
			}

			const message = 'Sản phẩm đã có trong giỏ hàng. Bạn có muốn xem giỏ hàng không?';
			
			Swal.fire({
				title: 'Sản phẩm đã tồn tại',
				text: message,
				icon: 'info',
				showCancelButton: true,
				confirmButtonText: 'Xem giỏ hàng',
				cancelButtonText: 'Tiếp tục mua hàng',
				confirmButtonColor: '#e65540'
			}).then((result) => {
				if (result.isConfirmed) {
					navigate('/cart');
				}
			});
			
			return;
		}
		
		dispatch(addToCart(productToAdd));
		
		Swal.fire({
			title: 'Thêm vào giỏ hàng thành công!',
			text: 'Bạn có muốn đến trang giỏ hàng không?',
			icon: 'success',
			showCancelButton: true,
			confirmButtonText: 'Đến giỏ hàng',
			cancelButtonText: 'Tiếp tục mua hàng',
			confirmButtonColor: '#e65540'
		}).then((result) => {
			if (result.isConfirmed) {
				navigate('/cart');
			}
		});
	};

	const decreaseQuantity = () => {
		if (quantity > 1) {
			setQuantity(quantity - 1);
		}
	};

	const increaseQuantity = () => {
		if (quantity < product.quantity) {
			setQuantity(quantity + 1);
		}
	};

	// Hàm lấy thông tin size từ API
	const fetchProductSizes = async (productId) => {
		try {
			setLoadingSizes(true);
			const sizes = await findProductSizesById(productId);
			setProductSizes(sizes || []);
			setLoadingSizes(false);
		} catch (error) {
			console.error(`Error fetching sizes for product ${productId}:`, error);
			setProductSizes([]);
			setLoadingSizes(false);
		}
	};

	// Thêm useEffect mới để gọi fetchProductSizes khi component mount
	useEffect(() => {
		if (product && product.id) {
			fetchProductSizes(product.id);
		}
	}, [product]);

	// Show loading state
	if (loading) {
		return <div className="container text-center p-t-80 p-b-80">Loading product details...</div>;
	}

	// Show error state
	if (error) {
		return <div className="container text-center p-t-80 p-b-80">{error}</div>;
	}

	// Show "product not found" state
	if (!product) {
		return <div className="container text-center p-t-80 p-b-80">Product not found</div>;
	}

	return (
		<div>
			<section className="sec-product-detail bg0 p-t-65 p-b-60">
				<div className="container">
					<div className="row">
						<div className="col-md-6 col-lg-7 p-b-30">
							<div className="p-l-25 p-r-30 p-lr-0-lg">
								<div className="wrap-pic-w pos-relative">
									<img 
										src={product.img} 
										alt={product.name} 
										style={{ 
											height: '600px', 
											width: '100%', 
											objectFit: 'contain',
											cursor: 'pointer' 
										}} 
										onClick={toggleZoom}
									/>
									<a 
										className="flex-c-m size-108 how-pos1 bor0 fs-16 cl10 bg0 hov-btn3 trans-04" 
										onClick={toggleZoom}
										style={{ cursor: 'pointer' }}
									>
										<i className="fa fa-expand"></i>
									</a>
									{!product.inStock && (
										<div className="out-of-stock-badge">
											Hết hàng
										</div>
									)}
								</div>
							</div>
						</div>

						<div className="col-md-6 col-lg-5 p-b-30">
							<div className="p-r-50 p-t-5 p-lr-0-lg">
								<h4 className="mtext-105 cl2 js-name-detail p-b-14">
									{product.name}
									{!product.inStock && (
										<span className="stock-badge out-of-stock">
											Hết hàng
										</span>
									)}
								</h4>
								<span className="mtext-106 cl2">
                                    {product.price.toLocaleString()} VND
                                </span>
                                <div className="product-quantity mt-2">
									<span className="stock-info">
										{product.inStock ? (
											<>Còn <span className="quantity-number">{product.quantity}</span> sản phẩm</>
										) : (
											<span className="out-of-stock-text">Hết hàng</span>
										)}
									</span>
								</div>
								<p className="stext-102 cl3 p-t-23">
									{product.des}
								</p>
								<div className="p-t-33">
									{/* Category */}
									<div className="flex-w flex-r-m p-b-10">
										<div className="size-203 flex-c-m respon6">
											Danh mục
										</div>
										<div className="size-204 respon6-next">
											<div className="rs1-select2 bor8 bg0">
												<div className="category-display">
													{typeof product.category === 'object' ? product.category.name : product.category || 'Uncategorized'}
												</div>
											</div>
										</div>
									</div>

									{/* Size Selection */}
									<div className="flex-w flex-r-m p-b-10">
										<div className="size-203 flex-c-m respon6">
											Kích thước
										</div>
										<div className="size-204 respon6-next">
											<div className="rs1-select2 bor8 bg0">
												{loadingSizes ? (
													<div className="loading-sizes">Đang tải...</div>
												) : (
													<>
														<select 
															className="form-control" 
															value={selectedSize} 
															onChange={(e) => setSelectedSize(e.target.value)}
															required
														>
															<option value="">Chọn kích thước</option>
															{productSizes.map((sizeInfo) => (
																<option 
																	key={sizeInfo.id} 
																	value={sizeInfo.size}
																	disabled={!sizeInfo.active || sizeInfo.quantity <= 0}
																>
																	{sizeInfo.size} {sizeInfo.quantity > 0 ? `(còn ${sizeInfo.quantity})` : "(hết hàng)"}
																</option>
															))}
														</select>
														<div className="size-info">
															{productSizes.length === 0 && !loadingSizes && (
																<span className="no-sizes">Không có kích thước nào cho sản phẩm này</span>
															)}
														</div>
													</>
												)}
											</div>
										</div>
									</div>

									{/* Quantity */}
									<div className="flex-w flex-r-m p-b-10">
										<div className="size-203 flex-c-m respon6">
											Số lượng
										</div>
										<div className="size-204 flex-w flex-m respon6-next">
											<div className="wrap-num-product flex-w m-r-20 m-tb-10">
												<div 
													className={`btn-num-product-down cl8 hov-btn3 trans-04 flex-c-m ${!product.inStock ? 'disabled' : ''}`}
													onClick={product.inStock ? decreaseQuantity : undefined}
												>
													<i className="fs-16 zmdi zmdi-minus"></i>
												</div>

												<input 
													className="mtext-104 cl3 txt-center num-product" 
													type="number" 
													name="num-product" 
													value={quantity}
													onChange={(e) => {
														if (product.inStock) {
															const newQuantity = parseInt(e.target.value) || 1;
															// Đảm bảo số lượng không vượt quá tồn kho
															setQuantity(Math.min(newQuantity, product.quantity));
														}
													}}
													min="1"
													max={product.quantity}
													disabled={!product.inStock}
												/>

												<div 
													className={`btn-num-product-up cl8 hov-btn3 trans-04 flex-c-m ${!product.inStock ? 'disabled' : ''}`}
													onClick={product.inStock ? increaseQuantity : undefined}
												>
													<i className="fs-16 zmdi zmdi-plus"></i>
												</div>
											</div>

											<button 
												className={`flex-c-m stext-101 cl0 size-101 bg1 bor1 hov-btn1 p-lr-15 trans-04 js-addcart-detail ${!product.inStock ? 'btn-disabled' : ''}`}
												onClick={handleAddToCart}
												disabled={!product.inStock}
											>
												{product.inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
											</button>
										</div>
									</div>
								</div>
								<div className="flex-w flex-m p-l-100 p-t-40 respon7">
									<div className="flex-m bor9 p-r-10 m-r-11">
										<button 
											onClick={handleAddToWishlist} 
											className="fs-14 cl3 hov-cl1 trans-04 lh-10 p-lr-5 p-tb-2 js-addwish-detail tooltip100"
											data-tooltip={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
											style={{ 
												cursor: 'pointer',
												background: 'transparent',
												border: 'none',
												padding: '0.5rem'
											}}
										>
											<i className={`zmdi zmdi-favorite${isInWishlist ? '' : '-outline'}`} style={{ color: isInWishlist ? '#e65540' : '' }}></i>
										</button>
									</div>
									<a href="#" className="fs-14 cl3 hov-cl1 trans-04 lh-10 p-lr-5 p-tb-2 m-r-8 tooltip100" data-tooltip="Facebook">
										<i className="fa fa-facebook"></i>
									</a>
									<a href="#" className="fs-14 cl3 hov-cl1 trans-04 lh-10 p-lr-5 p-tb-2 m-r-8 tooltip100" data-tooltip="Twitter">
										<i className="fa fa-twitter"></i>
									</a>
									<a href="#" className="fs-14 cl3 hov-cl1 trans-04 lh-10 p-lr-5 p-tb-2 m-r-8 tooltip100" data-tooltip="Google Plus">
										<i className="fa fa-google-plus"></i>
									</a>
								</div>
							</div>
						</div>
					</div>

					<div className="bg6 flex-c-m flex-w size-302 m-t-73 p-tb-15">
                        <span className="stext-107 cl6 p-lr-25">
                            Categories: {typeof product.category === 'object' ? product.category.name : product.category || 'Uncategorized'}
                        </span>
					</div>
				</div>
			</section>

			{/* Zoom Image Modal */}
			{showZoom && (
				<div 
					className="zoom-modal" 
					onClick={handleCloseZoom}
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						backgroundColor: 'rgba(0,0,0,0.9)',
						zIndex: 1050,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					<div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
						<img 
							src={product.img} 
							alt={product.name} 
							style={{
								maxWidth: '100%',
								maxHeight: '90vh',
								objectFit: 'contain'
							}}
						/>
						<button 
							onClick={toggleZoom} 
							style={{
								position: 'absolute',
								top: '-40px',
								right: '-40px',
								background: 'transparent',
								border: 'none',
								color: '#fff',
								fontSize: '30px',
								cursor: 'pointer'
							}}
						>
							×
						</button>
					</div>
				</div>
			)}
			
			{/* Reviews Section */}
			<ProductReviews productId={product.id} />

			<style jsx>{`
				.stock-badge {
					display: inline-block;
					padding: 4px 8px;
					border-radius: 4px;
					font-size: 14px;
					font-weight: 500;
					margin-left: 10px;
				}
				.out-of-stock {
					background-color: #f8d7da;
					color: #e65540;
					border: 1px solid #f5c6cb;
				}
				.out-of-stock-badge {
					position: absolute;
					top: 15px;
					right: 15px;
					background-color: #e65540;
					color: white;
					padding: 8px 16px;
					font-size: 16px;
					font-weight: bold;
					border-radius: 4px;
					z-index: 10;
				}
				.disabled, .btn-disabled {
					opacity: 0.5;
					cursor: not-allowed;
					pointer-events: none;
				}
				.product-quantity {
					margin-top: 8px;
					font-size: 14px;
					color: #555;
				}
				.quantity-number {
					font-weight: bold;
					color: #e65540;
				}
				.out-of-stock-text {
					color: #e65540;
					font-weight: bold;
				}
				.stock-info {
					display: inline-block;
					padding: 4px 0;
				}
				.size-info {
					margin-top: 8px;
					font-size: 13px;
					color: #666;
				}
				.no-sizes {
					font-style: italic;
					color: #dc3545;
				}
				.loading-sizes {
					padding: 10px;
					text-align: center;
					font-style: italic;
					color: #666;
				}
			`}</style>
		</div>
	);
};

export default ProductDetail;
