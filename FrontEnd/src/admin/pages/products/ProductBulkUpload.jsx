import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const ProductBulkUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [template, setTemplate] = useState(null);
  
  // Cấu trúc dữ liệu cho file mẫu Excel
  const templateData = [
    {
      name: 'Áo thun nam basic',
      category: 'Áo nam',
      price: 250000,
      description: 'Áo thun nam chất liệu cotton 100%',
      imageUrl: 'https://example.com/image.jpg',
      sizes: 'S:10,M:15,L:20,XL:5',
      inStock: 'true'
    },
    {
      name: 'Quần jean nữ ống rộng',
      category: 'Quần nữ',
      price: 450000,
      description: 'Quần jean nữ dáng ống rộng thời trang',
      imageUrl: 'https://example.com/image2.jpg',
      sizes: 'S:5,M:10,L:10',
      inStock: 'true'
    }
  ];
  
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.csv')) {
        toast.error('Vui lòng chọn file Excel (.xlsx) hoặc CSV (.csv)');
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      try {
        const data = await readExcel(selectedFile);
        setPreviewData(data.slice(0, 5)); // Chỉ hiển thị 5 sản phẩm đầu tiên để xem trước
      } catch (error) {
        console.error('Lỗi đọc file:', error);
        toast.error('Không thể đọc file. Vui lòng kiểm tra định dạng file.');
      }
    }
  };
  
  const readExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };
  
  const generateTemplateFile = () => {
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    
    // Tạo file Excel để tải xuống
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Tạo URL để tải xuống
    setTemplate(URL.createObjectURL(blob));
    
    // Tự động tải xuống file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'product_import_template.xlsx';
    link.click();
    
    toast.success('Đã tạo file mẫu. Đang tải xuống...');
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast.error('Vui lòng chọn file để tải lên');
      return;
    }
    
    // Hiển thị xác nhận trước khi tải lên
    const result = await Swal.fire({
      title: 'Xác nhận tải lên',
      text: 'Bạn có chắc chắn muốn nhập các sản phẩm này? Hành động này không thể hoàn tác.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Tải lên',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      setUploading(true);
      
      // Đọc toàn bộ dữ liệu từ file
      const productData = await readExcel(file);
      
      // Lấy token xác thực từ localStorage
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      // Tạo FormData để gửi lên server
      const formData = new FormData();
      formData.append('file', file);
      
      // Gửi API request để tải lên
      const response = await axios.post('http://localhost:8080/api/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      setUploading(false);
      
      // Hiển thị thông báo thành công
      Swal.fire({
        title: 'Tải lên thành công!',
        text: `Đã nhập ${response.data.successCount || 'nhiều'} sản phẩm. ${response.data.errorCount > 0 ? `${response.data.errorCount} sản phẩm bị lỗi.` : ''}`,
        icon: 'success',
        confirmButtonText: 'Xem danh sách sản phẩm',
        confirmButtonColor: '#4CAF50'
      }).then((result) => {
        // Chuyển đến trang danh sách sản phẩm sau khi xác nhận
        if (result.isConfirmed) {
          navigate('/admin/products');
        }
      });
    } catch (error) {
      setUploading(false);
      console.error('Lỗi tải lên sản phẩm:', error);
      
      Swal.fire({
        title: 'Lỗi tải lên',
        text: error.response?.data?.message || 'Không thể tải lên sản phẩm. Vui lòng kiểm tra định dạng file và thử lại.',
        icon: 'error',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#e65540'
      });
    }
  };
  
  const renderPreviewTable = () => {
    if (!previewData || previewData.length === 0) return null;
    
    // Lấy tên cột từ dữ liệu
    const columns = Object.keys(previewData[0]);
    
    return (
      <div className="preview-table-container">
        <h3>Xem trước dữ liệu ({previewData.length} sản phẩm đầu tiên)</h3>
        <div className="table-responsive">
          <table className="preview-table">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex}>{row[column]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bulk-upload-container">
      <div className="form-header">
        <h1>Nhập sản phẩm hàng loạt</h1>
        <button 
          type="button" 
          className="cancel-button"
          onClick={() => navigate('/admin/products')}
        >
          Quay lại
        </button>
      </div>
      
      <div className="info-box">
        <div className="info-icon"><i className="fa fa-info-circle"></i></div>
        <div className="info-content">
          <h3>Hướng dẫn nhập sản phẩm hàng loạt</h3>
          <p>Để nhập nhiều sản phẩm cùng lúc, vui lòng làm theo các bước sau:</p>
          <ol>
            <li>Tải xuống <button className="template-link" onClick={generateTemplateFile}>file mẫu Excel</button></li>
            <li>Điền thông tin sản phẩm theo đúng cấu trúc được cung cấp</li>
            <li>Đối với cột <strong>sizes</strong>, nhập theo định dạng: S:10,M:15,L:20 (kích thước:số lượng)</li>
            <li>Đối với cột <strong>imageUrl</strong>, nhập URL hình ảnh trực tiếp</li>
            <li>Tải lên file đã điền và xác nhận</li>
          </ol>
          <p><strong>Lưu ý:</strong> Chỉ hỗ trợ file Excel (.xlsx) hoặc CSV (.csv). Dung lượng tối đa: 5MB.</p>
        </div>
      </div>
      
      <div className="upload-section">
        <div className="file-upload-container">
          <div className="file-upload">
            <input 
              type="file" 
              id="file-upload" 
              accept=".xlsx,.csv" 
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="file-upload" className="file-label">
              <i className="fa fa-cloud-upload-alt"></i>
              <span>{fileName || 'Chọn file Excel/CSV'}</span>
            </label>
          </div>
          
          {file && (
            <button 
              className="upload-button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Đang tải lên...' : 'Tải lên và nhập sản phẩm'}
            </button>
          )}
        </div>
        
        {uploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="progress-text">{uploadProgress}% hoàn thành</div>
          </div>
        )}
      </div>
      
      {renderPreviewTable()}
      
      <style jsx>{`
        .bulk-upload-container {
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .form-header h1 {
          font-size: 24px;
          margin: 0;
          color: #333;
        }
        
        .cancel-button {
          padding: 8px 16px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .cancel-button:hover {
          background-color: #5a6268;
        }
        
        .info-box {
          display: flex;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #e8f4fd;
          border-left: 4px solid #2196f3;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .info-icon {
          flex: 0 0 30px;
          font-size: 24px;
          color: #2196f3;
          margin-right: 15px;
        }
        
        .info-content {
          flex: 1;
        }
        
        .info-content h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #0d47a1;
          font-size: 16px;
        }
        
        .info-content p {
          margin: 0 0 10px;
          color: #333;
          font-size: 14px;
        }
        
        .info-content ol {
          margin: 0 0 10px;
          padding-left: 20px;
        }
        
        .info-content li {
          margin-bottom: 5px;
          color: #333;
          font-size: 14px;
        }
        
        .template-link {
          background: none;
          border: none;
          color: #2196f3;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          font-size: inherit;
        }
        
        .template-link:hover {
          color: #0d47a1;
        }
        
        .upload-section {
          margin-bottom: 20px;
        }
        
        .file-upload-container {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .file-upload {
          position: relative;
          display: inline-block;
        }
        
        .file-input {
          position: absolute;
          left: 0;
          top: 0;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        
        .file-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background-color: #f8f9fa;
          border: 1px dashed #ced4da;
          border-radius: 4px;
          cursor: pointer;
          min-width: 240px;
        }
        
        .file-label:hover {
          background-color: #e9ecef;
        }
        
        .file-label i {
          font-size: 18px;
          color: #6c757d;
        }
        
        .upload-button {
          padding: 10px 16px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
          font-size: 14px;
        }
        
        .upload-button:hover {
          background-color: #218838;
        }
        
        .upload-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .progress-container {
          margin-top: 10px;
        }
        
        .progress-bar {
          width: 100%;
          height: 10px;
          background-color: #e9ecef;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        
        .progress {
          height: 100%;
          background-color: #28a745;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 12px;
          color: #6c757d;
          text-align: right;
        }
        
        .preview-table-container {
          margin-top: 30px;
        }
        
        .preview-table-container h3 {
          font-size: 18px;
          margin-bottom: 15px;
          color: #333;
        }
        
        .table-responsive {
          overflow-x: auto;
        }
        
        .preview-table {
          width: 100%;
          border-collapse: collapse;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .preview-table th, .preview-table td {
          padding: 10px;
          border: 1px solid #e9ecef;
          text-align: left;
        }
        
        .preview-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          position: sticky;
          top: 0;
        }
        
        .preview-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .preview-table tr:hover {
          background-color: #e9ecef;
        }
        
        @media (max-width: 768px) {
          .file-upload-container {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .file-label {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductBulkUpload; 