import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { remove as removeDiacritics } from 'diacritics';
import { getAllProducts } from '../../../api/productApi';
import Pagination from '../Pagination/Pagination';

const SearchResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search).get('q') || '';
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await getAllProducts();
                setProducts(data);
                setLoading(false);
            } catch (error) {
                setError("Không thể tải sản phẩm. Vui lòng thử lại sau.");
                setLoading(false);
                console.error("Error fetching products:", error);
            }
        };

        fetchProducts();
    }, []);

    const normalizeText = (text) => {
        return removeDiacritics(text)
            .toLowerCase()
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    };

    const doesProductMatchSearchTerm = (productName, searchTerm) => {
        const normalizedProductName = normalizeText(productName);
        const normalizedSearchTerm = normalizeText(searchTerm);
        const searchKeywords = normalizedSearchTerm.split(' ');

        return searchKeywords.every(keyword => normalizedProductName.includes(keyword));
    };

    const filteredProducts = products.filter(product => 
        doesProductMatchSearchTerm(product.name, query)
    );

    const handleDetail = (id) => {
        window.scrollTo(0, 0);  // Scroll to the top
        navigate(`/product/${id}`);
    };

    const indexOfLastProduct = currentPage * itemsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    // Show loading state
    if (loading) {
        return <div className="container text-center p-t-80 p-b-80">Loading search results...</div>;
    }

    // Show error state
    if (error) {
        return <div className="container text-center p-t-80 p-b-80">{error}</div>;
    }

    return (
        <div className="bg0 m-t-23 p-b-140">
            <div className="container">
                <div className="bread-crumb flex-w p-l-25 p-r-15 p-t-30 p-lr-0-lg">
                    <a href="/" className="stext-109 cl8 hov-cl1 trans-04">
                        Trang Chủ
                        <i className="fa fa-angle-right m-l-9 m-r-10" aria-hidden="true"></i>
                    </a>
                    <span className="stext-109 cl4">
                        Kết quả tìm kiếm cho: "{query}"
                    </span>
                </div>

                <div className="p-t-30 p-b-30">
                    <h3 className="ltext-103 cl5">
                        Kết quả tìm kiếm ({filteredProducts.length} sản phẩm)
                    </h3>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center p-t-50 p-b-50">
                        <h2>Không tìm thấy sản phẩm nào</h2>
                        <p className="p-t-20">Vui lòng thử từ khóa khác.</p>
                    </div>
                ) : (
                    <>
                        <div className="row isotope-grid">
                            {currentProducts.map((product) => (
                                <div key={product.id} className="col-sm-6 col-md-4 col-lg-3 p-b-35 isotope-item">
                                    <div className="block2">
                                        <div className="block2-pic hov-img0">
                                            <img src={product.img} alt={product.name} />
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

                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
