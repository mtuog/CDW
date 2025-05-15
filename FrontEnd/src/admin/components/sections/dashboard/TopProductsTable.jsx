import React from 'react';
import { Link } from 'react-router-dom';

const TopProductsTable = ({ products, formatCurrency }) => {
  return (
    <div className="top-products-section">
      <div className="section-header">
        <h2>Sản phẩm bán chạy</h2>
        <Link to="/admin/products" className="view-all-link">
          Xem tất cả
        </Link>
      </div>
      
      <div className="table-container">
        <table className="top-products-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Giá</th>
              <th>Đã bán</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td className="product-info">
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className="product-name">
                    <Link to={`/admin/products/${product.id}/edit`}>
                      {product.name}
                    </Link>
                  </div>
                </td>
                <td className="product-price">{formatCurrency(product.price)}</td>
                <td className="product-sold">{product.sold}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="3" className="no-data">
                  Chưa có dữ liệu sản phẩm
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .top-products-section {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          padding: 20px;
          margin-bottom: 24px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .section-header h2 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .view-all-link {
          font-size: 14px;
          color: #007bff;
          text-decoration: none;
        }
        
        .view-all-link:hover {
          text-decoration: underline;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .top-products-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .top-products-table th,
        .top-products-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }
        
        .top-products-table th {
          font-weight: 600;
          color: #495057;
          background-color: #f8f9fa;
        }
        
        .product-info {
          display: flex;
          align-items: center;
        }
        
        .product-image {
          width: 40px;
          height: 40px;
          margin-right: 12px;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .product-name a {
          color: #212529;
          text-decoration: none;
          font-weight: 500;
        }
        
        .product-name a:hover {
          color: #007bff;
        }
        
        .product-price {
          font-weight: 500;
        }
        
        .product-sold {
          font-weight: 500;
          color: #28a745;
        }
        
        .no-data {
          text-align: center;
          color: #6c757d;
          padding: 24px 0;
        }
      `}</style>
    </div>
  );
};

export default TopProductsTable; 