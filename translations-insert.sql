-- Insert translations for UI components (from properties files)
-- Structure: INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at)

-- Home page translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('BỘ SƯU TẬP ATLANTIS', 'en', 'ATLANTIS COLLECTION', 'UI', NOW(), NOW()),
('Khám phá bộ sưu tập đồng phục sang trọng với thiết kế tinh tế', 'en', 'Discover our luxury uniform collection with sophisticated design', 'UI', NOW(), NOW()),
('Mua Ngay', 'en', 'Shop Now', 'UI', NOW(), NOW()),
('Khám Phá', 'en', 'Discover', 'UI', NOW(), NOW()),
('Đến Shop', 'en', 'To Shop', 'UI', NOW(), NOW());

-- Header translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Miễn phí vận chuyển cho đơn hàng tiêu chuẩn trên $100', 'en', 'Free shipping for standard orders over $100', 'UI', NOW(), NOW()),
('Trợ giúp và câu hỏi thường gặp', 'en', 'Help & FAQs', 'UI', NOW(), NOW()),
('Tài khoản của tôi', 'en', 'My Account', 'UI', NOW(), NOW()),
('Đăng nhập', 'en', 'Login', 'UI', NOW(), NOW()),
('Đăng xuất', 'en', 'Logout', 'UI', NOW(), NOW());

-- Menu translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Trang chủ', 'en', 'Home', 'UI', NOW(), NOW()),
('Sản phẩm', 'en', 'Products', 'UI', NOW(), NOW()),
('Giỏ hàng', 'en', 'Shopping Cart', 'UI', NOW(), NOW()),
('Giới thiệu', 'en', 'About Us', 'UI', NOW(), NOW()),
('Liên hệ', 'en', 'Contact', 'UI', NOW(), NOW());

-- Common translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Tìm kiếm', 'en', 'Search', 'UI', NOW(), NOW()),
('Thêm', 'en', 'Add', 'UI', NOW(), NOW()),
('Đang tải...', 'en', 'Loading...', 'UI', NOW(), NOW()),
('Lưu', 'en', 'Save', 'UI', NOW(), NOW()),
('Hủy', 'en', 'Cancel', 'UI', NOW(), NOW()),
('Sửa', 'en', 'Edit', 'UI', NOW(), NOW()),
('Xóa', 'en', 'Delete', 'UI', NOW(), NOW()),
('Có', 'en', 'Yes', 'UI', NOW(), NOW()),
('Không', 'en', 'No', 'UI', NOW(), NOW());

-- Product page translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Lọc', 'en', 'Filter', 'UI', NOW(), NOW()),
('Nhiều Hơn', 'en', 'More', 'UI', NOW(), NOW()),
('Tìm kiếm sản phẩm...', 'en', 'Search products...', 'UI', NOW(), NOW()),
('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'en', 'Unable to load data. Please try again later.', 'UI', NOW(), NOW()),
('Tất cả sản phẩm', 'en', 'All Products', 'UI', NOW(), NOW()),
('Sắp xếp theo', 'en', 'Sort by', 'UI', NOW(), NOW()),
('Giá', 'en', 'Price', 'UI', NOW(), NOW()),
('Tên sản phẩm', 'en', 'Product Name', 'UI', NOW(), NOW()),
('Danh mục', 'en', 'Category', 'UI', NOW(), NOW()),
('Thêm vào giỏ', 'en', 'Add to Cart', 'UI', NOW(), NOW()),
('Xem chi tiết', 'en', 'View Details', 'UI', NOW(), NOW()),
('Hết hàng', 'en', 'Out of Stock', 'UI', NOW(), NOW()),
('Còn hàng', 'en', 'In Stock', 'UI', NOW(), NOW()),
('Mặc định', 'en', 'Default', 'UI', NOW(), NOW()),
('Giá: Thấp đến cao', 'en', 'Price: Low to High', 'UI', NOW(), NOW()),
('Giá: Cao đến thấp', 'en', 'Price: High to Low', 'UI', NOW(), NOW());

-- Cart translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Giỏ hàng trống', 'en', 'Cart is empty', 'UI', NOW(), NOW()),
('Tổng cộng', 'en', 'Total', 'UI', NOW(), NOW()),
('Thanh toán', 'en', 'Checkout', 'UI', NOW(), NOW()),
('Tiếp tục mua sắm', 'en', 'Continue Shopping', 'UI', NOW(), NOW()),
('Số lượng', 'en', 'Quantity', 'UI', NOW(), NOW());

-- Button translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Gửi', 'en', 'Submit', 'UI', NOW(), NOW());

-- Form label translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Tên', 'en', 'Name', 'UI', NOW(), NOW()),
('Email', 'en', 'Email', 'UI', NOW(), NOW()),
('Số điện thoại', 'en', 'Phone Number', 'UI', NOW(), NOW()),
('Tin nhắn', 'en', 'Message', 'UI', NOW(), NOW()),
('Địa chỉ', 'en', 'Address', 'UI', NOW(), NOW()),
('Mật khẩu', 'en', 'Password', 'UI', NOW(), NOW()),
('Xác nhận mật khẩu', 'en', 'Confirm Password', 'UI', NOW(), NOW());

-- Message translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Thành công', 'en', 'Success', 'UI', NOW(), NOW()),
('Có lỗi xảy ra', 'en', 'An error occurred', 'UI', NOW(), NOW()),
('Đã lưu thành công', 'en', 'Saved successfully', 'UI', NOW(), NOW()),
('Đã xóa thành công', 'en', 'Deleted successfully', 'UI', NOW(), NOW()),
('Đã cập nhật thành công', 'en', 'Updated successfully', 'UI', NOW(), NOW());

-- Navigation translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Trước', 'en', 'Previous', 'UI', NOW(), NOW()),
('Tiếp theo', 'en', 'Next', 'UI', NOW(), NOW()),
('Đầu tiên', 'en', 'First', 'UI', NOW(), NOW()),
('Cuối cùng', 'en', 'Last', 'UI', NOW(), NOW());

-- Account translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Hồ sơ', 'en', 'Profile', 'UI', NOW(), NOW()),
('Đơn hàng', 'en', 'Orders', 'UI', NOW(), NOW()),
('Danh sách yêu thích', 'en', 'Wishlist', 'UI', NOW(), NOW()),
('Cài đặt', 'en', 'Settings', 'UI', NOW(), NOW());

-- Category translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Áo sơ mi', 'en', 'Shirts', 'CATEGORY', NOW(), NOW()),
('Áo vest', 'en', 'Suits', 'CATEGORY', NOW(), NOW()),
('Quần tây', 'en', 'Trousers', 'CATEGORY', NOW(), NOW()),
('Quần jean', 'en', 'Jeans', 'CATEGORY', NOW(), NOW()),
('Áo khoác', 'en', 'Jackets', 'CATEGORY', NOW(), NOW()),
('Váy', 'en', 'Dresses', 'CATEGORY', NOW(), NOW()),
('Giày', 'en', 'Shoes', 'CATEGORY', NOW(), NOW()),
('Giày dép', 'en', 'Footwear', 'CATEGORY', NOW(), NOW()),
('Phụ kiện', 'en', 'Accessories', 'CATEGORY', NOW(), NOW()),
('Đồng phục công sở', 'en', 'Office Uniforms', 'CATEGORY', NOW(), NOW()),
('Đồng phục học sinh', 'en', 'School Uniforms', 'CATEGORY', NOW(), NOW()),
('Cặp táp', 'en', 'Briefcases', 'CATEGORY', NOW(), NOW());

-- Product pattern translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Áo', 'en', 'Shirt', 'PRODUCT_PATTERN', NOW(), NOW()),
('sơ mi', 'en', 'dress shirt', 'PRODUCT_PATTERN', NOW(), NOW()),
('Quần', 'en', 'Pants', 'PRODUCT_PATTERN', NOW(), NOW()),
('jean', 'en', 'jeans', 'PRODUCT_PATTERN', NOW(), NOW()),
('vest', 'en', 'suit', 'PRODUCT_PATTERN', NOW(), NOW()),
('khoác', 'en', 'jacket', 'PRODUCT_PATTERN', NOW(), NOW()),
('Váy', 'en', 'Dress', 'PRODUCT_PATTERN', NOW(), NOW()),
('Cặp', 'en', 'Briefcase', 'PRODUCT_PATTERN', NOW(), NOW()),
('táp', 'en', 'bag', 'PRODUCT_PATTERN', NOW(), NOW()),
('nam', 'en', 'men''s', 'PRODUCT_PATTERN', NOW(), NOW()),
('nữ', 'en', 'women''s', 'PRODUCT_PATTERN', NOW(), NOW()),
('unisex', 'en', 'unisex', 'PRODUCT_PATTERN', NOW(), NOW()),
('trẻ em', 'en', 'kids', 'PRODUCT_PATTERN', NOW(), NOW());

-- Color pattern translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('trắng', 'en', 'white', 'PRODUCT_PATTERN', NOW(), NOW()),
('đen', 'en', 'black', 'PRODUCT_PATTERN', NOW(), NOW()),
('xanh', 'en', 'blue', 'PRODUCT_PATTERN', NOW(), NOW()),
('đỏ', 'en', 'red', 'PRODUCT_PATTERN', NOW(), NOW()),
('vàng', 'en', 'yellow', 'PRODUCT_PATTERN', NOW(), NOW()),
('tím', 'en', 'purple', 'PRODUCT_PATTERN', NOW(), NOW()),
('hồng', 'en', 'pink', 'PRODUCT_PATTERN', NOW(), NOW()),
('nâu', 'en', 'brown', 'PRODUCT_PATTERN', NOW(), NOW()),
('xám', 'en', 'gray', 'PRODUCT_PATTERN', NOW(), NOW()),
('cam', 'en', 'orange', 'PRODUCT_PATTERN', NOW(), NOW()),
('xanh lá', 'en', 'green', 'PRODUCT_PATTERN', NOW(), NOW()),
('xanh navy', 'en', 'navy blue', 'PRODUCT_PATTERN', NOW(), NOW());

-- Description pattern translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('chất liệu', 'en', 'material', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('cotton', 'en', 'cotton', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('polyester', 'en', 'polyester', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('thoải mái', 'en', 'comfortable', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('phong cách', 'en', 'style', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('thời trang', 'en', 'fashion', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('cao cấp', 'en', 'premium', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('thường', 'en', 'regular', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('công sở', 'en', 'office', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('học sinh', 'en', 'student', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('thiết kế hiện đại', 'en', 'modern design', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('chất liệu cao cấp', 'en', 'premium material', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('phù hợp cho', 'en', 'suitable for', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('màu sắc', 'en', 'color', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('kích thước', 'en', 'size', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('thương hiệu', 'en', 'brand', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('xuất xứ', 'en', 'origin', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('Việt Nam', 'en', 'Vietnam', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('dễ giặt', 'en', 'easy care', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('không nhăn', 'en', 'wrinkle-free', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('thoáng mát', 'en', 'breathable', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('co giãn', 'en', 'stretchable', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('bền đẹp', 'en', 'durable', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('bền bỉ', 'en', 'durable', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('mềm mại', 'en', 'soft', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('sang trọng', 'en', 'luxurious', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('tinh tế', 'en', 'sophisticated', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('thanh lịch', 'en', 'elegant', 'DESCRIPTION_PATTERN', NOW(), NOW()),
('chuyên nghiệp', 'en', 'professional', 'DESCRIPTION_PATTERN', NOW(), NOW());

-- Size pattern translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Size S', 'en', 'Size S', 'PRODUCT_PATTERN', NOW(), NOW()),
('Size M', 'en', 'Size M', 'PRODUCT_PATTERN', NOW(), NOW()),
('Size L', 'en', 'Size L', 'PRODUCT_PATTERN', NOW(), NOW()),
('Size XL', 'en', 'Size XL', 'PRODUCT_PATTERN', NOW(), NOW()),
('Size XXL', 'en', 'Size XXL', 'PRODUCT_PATTERN', NOW(), NOW()),
('nhỏ', 'en', 'small', 'PRODUCT_PATTERN', NOW(), NOW()),
('vừa', 'en', 'medium', 'PRODUCT_PATTERN', NOW(), NOW()),
('lớn', 'en', 'large', 'PRODUCT_PATTERN', NOW(), NOW());

-- Admin UI translations
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Bảng điều khiển', 'en', 'Dashboard', 'ADMIN_UI', NOW(), NOW()),
('Quản lý sản phẩm', 'en', 'Product Management', 'ADMIN_UI', NOW(), NOW()),
('Quản lý danh mục', 'en', 'Category Management', 'ADMIN_UI', NOW(), NOW()),
('Quản lý đơn hàng', 'en', 'Order Management', 'ADMIN_UI', NOW(), NOW()),
('Quản lý khách hàng', 'en', 'Customer Management', 'ADMIN_UI', NOW(), NOW()),
('Quản lý admin', 'en', 'Admin Management', 'ADMIN_UI', NOW(), NOW()),
('Thống kê', 'en', 'Statistics', 'ADMIN_UI', NOW(), NOW()),
('Báo cáo', 'en', 'Reports', 'ADMIN_UI', NOW(), NOW());

-- Additional common phrases
INSERT INTO translations (source_text, target_language, translated_text, category, created_at, updated_at) VALUES
('Xin chào', 'en', 'Hello', 'UI', NOW(), NOW()),
('Cảm ơn', 'en', 'Thank you', 'UI', NOW(), NOW()),
('Xin lỗi', 'en', 'Sorry', 'UI', NOW(), NOW()),
('Đồng ý', 'en', 'Agree', 'UI', NOW(), NOW()),
('Không đồng ý', 'en', 'Disagree', 'UI', NOW(), NOW()),
('Xác nhận', 'en', 'Confirm', 'UI', NOW(), NOW()),
('Từ chối', 'en', 'Reject', 'UI', NOW(), NOW()),
('Hoàn thành', 'en', 'Complete', 'UI', NOW(), NOW()),
('Đang xử lý', 'en', 'Processing', 'UI', NOW(), NOW()),
('Thất bại', 'en', 'Failed', 'UI', NOW(), NOW()); 