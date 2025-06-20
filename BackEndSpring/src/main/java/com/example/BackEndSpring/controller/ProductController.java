package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.Category;
import com.example.BackEndSpring.model.Product;
import com.example.BackEndSpring.model.ProductSize;
import com.example.BackEndSpring.service.CategoryService;
import com.example.BackEndSpring.service.ProductService;
import com.example.BackEndSpring.service.DatabaseTranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.ArrayList;
import java.io.IOException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", 
    allowedHeaders = {"authorization", "content-type", "x-auth-token", "origin", "x-requested-with", "accept"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final DatabaseTranslationService translationService;

    @Autowired
    public ProductController(ProductService productService, CategoryService categoryService, 
                           DatabaseTranslationService translationService) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.translationService = translationService;
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }
    
    // GET all products with translation
    @GetMapping("/translated")
    public ResponseEntity<List<Product>> getAllProductsTranslated(@RequestParam(defaultValue = "vi") String lang) {
        List<Product> products = productService.getAllProducts();
        List<Product> translatedProducts = translationService.translateProducts(products, lang);
        return ResponseEntity.ok(translatedProducts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Optional<Product> product = productService.getProductById(id);
        return product.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    // GET product by ID with translation
    @GetMapping("/{id}/translated")
    public ResponseEntity<Product> getProductByIdTranslated(@PathVariable Long id, @RequestParam(defaultValue = "vi") String lang) {
        Optional<Product> product = productService.getProductById(id);
        if (product.isPresent()) {
            Product translatedProduct = translationService.translateProduct(product.get(), lang);
            return ResponseEntity.ok(translatedProduct);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/top-selling")
    public ResponseEntity<List<Product>> getTopSellingProducts() {
        List<Product> products = productService.getTopSellingProducts(10);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/top-selling/translated")
    public ResponseEntity<List<Product>> getTopSellingProductsTranslated(@RequestParam(defaultValue = "vi") String lang) {
        List<Product> products = productService.getTopSellingProducts(10);
        List<Product> translatedProducts = translationService.translateProducts(products, lang);
        return ResponseEntity.ok(translatedProducts);
    }

    @GetMapping("/featured")
    public ResponseEntity<List<Product>> getFeaturedProducts() {
        List<Product> products = productService.getFeaturedProducts();
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/featured/translated")
    public ResponseEntity<List<Product>> getFeaturedProductsTranslated(@RequestParam(defaultValue = "vi") String lang) {
        List<Product> products = productService.getFeaturedProducts();
        List<Product> translatedProducts = translationService.translateProducts(products, lang);
        return ResponseEntity.ok(translatedProducts);
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        List<Product> products = productService.getProductsByCategory(category);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/bestseller")
    public ResponseEntity<List<Product>> getBestSellerProducts() {
        List<Product> products = productService.getBestSellerProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/new")
    public ResponseEntity<List<Product>> getNewProducts() {
        List<Product> products = productService.getNewProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/favorite")
    public ResponseEntity<List<Product>> getFavoriteProducts() {
        List<Product> products = productService.getFavoriteProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/instock")
    public ResponseEntity<List<Product>> getInStockProducts() {
        List<Product> products = productService.getInStockProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/outofstock")
    public ResponseEntity<List<Product>> getOutOfStockProducts() {
        List<Product> products = productService.getOutOfStockProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/category/{category}/instock")
    public ResponseEntity<List<Product>> getInStockProductsByCategory(@PathVariable String category) {
        List<Product> products = productService.getProductsInStockByCategory(category);
        return ResponseEntity.ok(products);
    }

    @PostMapping(
        consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE, 
        produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        try {
            // Xử lý trường hợp id đã được đặt
            product.setId(null); // Đảm bảo rằng id là null để JPA sinh id mới
            
            // Log dữ liệu sản phẩm nhận được
            System.out.println("Received product data: " + product.getName() + ", price: " + product.getPrice());
            
        // Xử lý trường hợp product có category dạng string hoặc id
        if (product.getCategory() != null && product.getCategory().getId() == null && product.getCategory().getName() != null) {
            // Tìm category theo tên
                System.out.println("Looking for category: " + product.getCategory().getName());
            Category category = categoryService.getCategoryByName(product.getCategory().getName());
            // Nếu category không tồn tại, tạo mới
            if (category == null) {
                    System.out.println("Category not found, creating new one");
                Category newCategory = new Category();
                newCategory.setName(product.getCategory().getName());
                category = categoryService.saveCategory(newCategory);
            }
            product.setCategory(category);
                System.out.println("Category set: " + category.getId() + " - " + category.getName());
            }
            
            // Set các giá trị mặc định cho favorite
            product.setFavorite(false); // Mặc định sản phẩm mới không phải là favorite
            
            // Mặc định cho sản phẩm mới là 'new'
            product.setNewProduct(true);
            
            // Lưu sản phẩm trước để lấy ID
        Product savedProduct = productService.saveProduct(product);
            
            // Xử lý sizes nếu có
            if (product.getSizes() != null && !product.getSizes().isEmpty()) {
                // Lưu từng size vào database
                for (ProductSize size : product.getSizes()) {
                    size.setProduct(savedProduct);
                }
                
                // Cập nhật tổng số lượng
                savedProduct.updateTotalQuantity();
                savedProduct = productService.saveProduct(savedProduct);
            } else {
                System.out.println("No sizes provided for the product");
                // Sizes sẽ được thêm riêng thông qua API addProductSize
            }
            
        return new ResponseEntity<>(savedProduct, HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("Error creating product: " + e.getMessage());
            e.printStackTrace();
            
            // Trả về lỗi chi tiết thay vì lỗi 500 chung chung
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @PutMapping(
        value = "/{id}", 
        consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE, 
        produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        try {
            System.out.println("Received request to update product with ID: " + id);
            System.out.println("Request Content-Type: application/json");
            System.out.println("Received product data: " + product);
            
            Optional<Product> existingProductOpt = productService.getProductById(id);
            if (!existingProductOpt.isPresent()) {
                System.out.println("Product with ID " + id + " not found");
                return ResponseEntity.notFound().build();
            }
            
            Product existingProduct = existingProductOpt.get();
            product.setId(id);
            
            // Xử lý trường hợp product có category dạng string hoặc id
            if (product.getCategory() != null && product.getCategory().getId() == null && product.getCategory().getName() != null) {
                // Tìm category theo tên
                Category category = categoryService.getCategoryByName(product.getCategory().getName());
                // Nếu category không tồn tại, tạo mới
                if (category == null) {
                    Category newCategory = new Category();
                    newCategory.setName(product.getCategory().getName());
                    category = categoryService.saveCategory(newCategory);
                }
                product.setCategory(category);
            }
            
            // Giữ nguyên danh sách sizes hiện tại nếu không có sizes mới được gửi lên
            if (product.getSizes() == null || product.getSizes().isEmpty()) {
                product.setSizes(existingProduct.getSizes());
            } else {
                // Nếu có sizes mới, cập nhật chúng
                for (ProductSize size : product.getSizes()) {
                    size.setProduct(product);
                }
            }
            
            // Lưu sản phẩm với thông tin cập nhật
            Product updatedProduct = productService.saveProduct(product);
            
            // Cập nhật tổng số lượng dựa trên các sizes
            updatedProduct.updateTotalQuantity();
            updatedProduct = productService.saveProduct(updatedProduct);
            
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            System.err.println("Error updating product with ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping(
        value = "/{id}/stock",
        produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Void> updateProductStock(@PathVariable Long id, @RequestParam boolean inStock) {
        boolean updated = productService.updateProductStock(id, inStock);
        if (updated) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping(
        value = "/{id}/quantity",
        produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Void> updateProductQuantity(@PathVariable Long id, @RequestParam int quantity) {
        boolean updated = productService.updateProductQuantity(id, quantity);
        if (updated) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        Optional<Product> existingProduct = productService.getProductById(id);
        if (existingProduct.isPresent()) {
            productService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Endpoint nhập sản phẩm hàng loạt từ file Excel/CSV
     */
    @PostMapping("/bulk-upload")
    public ResponseEntity<?> bulkUploadProducts(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng chọn file để tải lên");
        }
        
        // Kiểm tra định dạng file
        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".csv"))) {
            return ResponseEntity.badRequest().body("Chỉ hỗ trợ file Excel (.xlsx) hoặc CSV (.csv)");
        }
        
        try {
            Workbook workbook;
            
            // Đọc file Excel
            workbook = new XSSFWorkbook(file.getInputStream());
            Sheet sheet = workbook.getSheetAt(0);
            
            // Chuẩn bị thống kê
            int successCount = 0;
            int errorCount = 0;
            List<String> errorMessages = new ArrayList<>();
            
            // Bỏ qua hàng tiêu đề (hàng đầu tiên)
            boolean isFirstRow = true;
            
            // Duyệt qua từng hàng trong file
            for (Row row : sheet) {
                if (isFirstRow) {
                    isFirstRow = false;
                    continue;
                }
                
                try {
                    // Đọc dữ liệu từ từng ô trong hàng
                    String name = getCellValueAsString(row.getCell(0));
                    String categoryName = getCellValueAsString(row.getCell(1));
                    double price = Double.parseDouble(getCellValueAsString(row.getCell(2)));
                    String description = getCellValueAsString(row.getCell(3));
                    String imageUrl = getCellValueAsString(row.getCell(4));
                    String sizesString = getCellValueAsString(row.getCell(5));
                    boolean inStock = Boolean.parseBoolean(getCellValueAsString(row.getCell(6)).toLowerCase());
                    
                    // Validate dữ liệu cơ bản
                    if (name.isEmpty() || categoryName.isEmpty() || price <= 0 || imageUrl.isEmpty()) {
                        throw new IllegalArgumentException("Thiếu thông tin bắt buộc (tên, danh mục, giá, hình ảnh)");
                    }
                    
                    // Tạo đối tượng sản phẩm
                    Product product = new Product();
                    product.setName(name);
                    product.setPrice((int) price); // Giá được lưu dưới dạng int
                    product.setDes(description);
                    product.setImg(imageUrl);
                    product.setInStock(inStock);
                    product.setFavorite(false); // Mặc định không phải favorite
                    product.setNewProduct(true); // Mặc định là sản phẩm mới
                    
                    // Xử lý danh mục
                    Category category = categoryService.getCategoryByName(categoryName);
                    if (category == null) {
                        Category newCategory = new Category();
                        newCategory.setName(categoryName);
                        category = categoryService.saveCategory(newCategory);
                    }
                    product.setCategory(category);
                    
                    // Lưu sản phẩm để lấy ID
                    Product savedProduct = productService.saveProduct(product);
                    
                    // Xử lý kích thước và số lượng
                    if (!sizesString.isEmpty()) {
                        // Format dự kiến: S:10,M:15,L:20,XL:5
                        String[] sizeEntries = sizesString.split(",");
                        int totalQuantity = 0;
                        
                        for (String sizeEntry : sizeEntries) {
                            String[] parts = sizeEntry.split(":");
                            if (parts.length == 2) {
                                String size = parts[0].trim();
                                int quantity = Integer.parseInt(parts[1].trim());
                                
                                if (quantity > 0) {
                                    // Tạo đối tượng ProductSize
                                    ProductSize productSize = new ProductSize();
                                    productSize.setProduct(savedProduct);
                                    productSize.setSize(size);
                                    productSize.setQuantity(quantity);
                                    productSize.setActive(true);
                                    
                                    // Thêm size vào sản phẩm
                                    if (savedProduct.getSizes() == null) {
                                        savedProduct.setSizes(new ArrayList<>());
                                    }
                                    savedProduct.getSizes().add(productSize);
                                    
                                    totalQuantity += quantity;
                                }
                            }
                        }
                        
                        // Cập nhật tổng số lượng
                        savedProduct.setQuantity(totalQuantity);
                        savedProduct.setInStock(totalQuantity > 0);
                        
                        // Lưu sản phẩm với các size đã cập nhật
                        productService.saveProduct(savedProduct);
                    }
                    
                    successCount++;
                } catch (Exception e) {
                    errorCount++;
                    errorMessages.add("Lỗi ở hàng " + (row.getRowNum() + 1) + ": " + e.getMessage());
                }
            }
            
            workbook.close();
            
            // Trả về kết quả
            Map<String, Object> response = new HashMap<>();
            response.put("successCount", successCount);
            response.put("errorCount", errorCount);
            if (errorCount > 0) {
                response.put("errors", errorMessages);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi đọc file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi xử lý dữ liệu: " + e.getMessage());
        }
    }
    
    /**
     * Phương thức hỗ trợ đọc giá trị từ ô trong file Excel
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Định dạng số để tránh hiển thị dạng khoa học (1.0E4)
                    return String.valueOf(cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                switch (cell.getCachedFormulaResultType()) {
                    case STRING:
                        return cell.getStringCellValue();
                    case NUMERIC:
                        return String.valueOf(cell.getNumericCellValue());
                    default:
                        return "";
                }
            default:
                return "";
        }
    }
} 