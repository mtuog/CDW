# CDW - Complete E-commerce Platform with Smart Chat System

## 🚀 Giới thiệu

CDW là một nền tảng thương mại điện tử toàn diện được xây dựng với Spring Boot và React, tích hợp hệ thống chat thông minh hỗ trợ 2 chế độ: **Tự động với selection options** và **Live chat với human agents**.

## ✨ Tính năng chính

### 🛒 E-commerce Core
- **Quản lý sản phẩm**: CRUD, bulk upload, quản lý kho, featured products, size/color variants
- **Hệ thống đặt hàng**: Đặt hàng, thanh toán (VNPay, Bank Transfer), theo dõi trạng thái
- **Quản lý danh mục**: Phân loại sản phẩm đa cấp với hierarchy
- **Hệ thống người dùng**: Đăng ký, đăng nhập, OAuth2 (Google, Facebook), email verification
- **Analytics**: Dashboard thống kê doanh thu, khách hàng, sản phẩm với charts
- **Loyalty Program**: Chương trình tích điểm, rewards, tier system
- **Discount System**: Mã giảm giá, khuyến mãi, bulk discount codes
- **Wishlist**: Danh sách yêu thích với sync cross-device
- **Notifications**: Real-time notifications cho admin via WebSocket

### 💬 Smart Chat System (2-Mode)
#### Chế độ Tự động (Auto Support)
- **Selection-based Navigation**: Menu tương tác với quick replies
- **Predefined Categories**: 
  - 📦 Products & Services
  - 🛍️ Orders & Shipping  
  - 💳 Payment & Billing
  - 🔄 Returns & Exchanges
  - 👤 Account Management
- **Smart Transfer**: Tự động chuyển sang live chat theo context
- **24/7 Availability**: Hỗ trợ instant cho guest và logged users

#### Chế độ Live Chat
- **Real-time Messaging**: WebSocket (STOMP) bidirectional communication
- **Admin Dashboard**: Quản lý conversations với status tracking
- **Multi-conversation Support**: Handle multiple chats simultaneously  
- **Transfer Capability**: Seamless handover từ auto sang live
- **Message History**: Persistent storage với conversation lifecycle
- **Connection Status**: Live connection monitoring và auto-reconnect

### 🎨 UI/UX Features
- **Responsive Design**: Mobile-first approach với breakpoints
- **Modern Interface**: Bootstrap 5 + custom CSS với animations
- **Rich Components**: Antd integration, React Icons, FontAwesome
- **Interactive Elements**: Slick carousel, date pickers, modals
- **Charts & Analytics**: Chart.js, Recharts với real-time data

## 🏗️ Kiến trúc hệ thống

### Backend (Spring Boot 3.2.2)
```
BackEndSpring/
├── src/main/java/com/example/BackEndSpring/
│   ├── controller/          # REST API endpoints
│   │   ├── ChatController    # Chat & AutoChat APIs
│   │   ├── OrderController   # Order management
│   │   └── ProductController # Product CRUD
│   ├── service/            # Business logic layer
│   │   ├── AutoChatService   # Selection-based responses
│   │   ├── ChatService       # Real-time messaging
│   │   ├── NotificationService # WebSocket notifications
│   │   ├── VietQRService     # QR payment integration
│   │   └── LoyaltyService    # Points & rewards
│   ├── model/              # JPA entities
│   ├── dto/                # Data transfer objects
│   ├── repository/         # Data access layer
│   ├── config/             # Configuration classes
│   │   ├── WebSocketConfig   # STOMP configuration
│   │   └── SecurityConfig   # JWT + OAuth2
│   ├── security/           # Authentication & authorization
│   └── util/               # Helper utilities
├── uploads/                # Local file storage
└── pom.xml                # Maven dependencies
```

### Frontend (React 18.3.1)
```
FrontEnd/
├── src/
│   ├── user/               # Customer interface
│   │   ├── components/     # UI components
│   │   │   ├── Chat/       # ChatWidget, ChatWindow
│   │   │   ├── Product/    # Product catalog
│   │   │   └── Payment/    # Payment flows
│   │   └── pages/          # Page components
│   ├── admin/              # Admin dashboard
│   │   ├── pages/          # Admin management pages
│   │   │   ├── chat/       # ChatManagement
│   │   │   ├── dashboard/  # Analytics dashboard
│   │   │   ├── products/   # Product management
│   │   │   └── orders/     # Order management
│   │   ├── components/     # Reusable admin components
│   │   └── layouts/        # Layout templates
│   ├── api/                # API service layers
│   ├── services/           # Business logic services
│   │   ├── chatService.js    # Live chat APIs
│   │   ├── autoChatService.js # Auto chat logic
│   │   └── authService.js    # Authentication
│   ├── store/              # Redux state management
│   └── utils/              # Helper functions
├── public/                 # Static assets & vendor libs
└── package.json           # NPM dependencies
```

## 🛠️ Tech Stack

### Backend Technologies
- **Framework**: Spring Boot 3.2.2 (Java 17)
- **Database**: MySQL 8.0 (cdweb_db)
- **Security**: Spring Security 6 + JWT (jjwt 0.11.5)
- **OAuth2**: Google & Facebook integration
- **File Storage**: Cloudinary CDN (v1.34.0)
- **Email**: Gmail SMTP với Spring Mail
- **Documentation**: SpringDoc OpenAPI 2.3.0 (Swagger UI)
- **Real-time**: Spring WebSocket + STOMP protocol
- **Build Tool**: Maven 3.6+
- **ORM**: Hibernate/JPA với MySQL Connector

### Frontend Technologies
- **Framework**: React 18.3.1 với Create React App
- **State Management**: Redux Toolkit 2.2.6 + React Redux 9.1.2
- **Routing**: React Router DOM 6.24.1
- **UI Framework**: Bootstrap 5.3.3 + React Bootstrap 2.10.9
- **Component Library**: Ant Design 5.25.2
- **Icons**: FontAwesome 6.7.2 + React Icons 5.5.0
- **Charts**: Chart.js với React Chart.js 2 + Recharts 2.15.1
- **HTTP Client**: Axios 1.8.4
- **Real-time**: Socket.IO 4.7.5 + STOMP.js 7.1.1
- **Notifications**: React Hot Toast 2.5.2 + SweetAlert2 11.12.0
- **File Processing**: XLSX 0.18.5 + Apache POI (backend)

### Key Dependencies & Services
- **Payment**: VNPay + VietQR integration
- **Authentication**: JWT + OAuth2 (Google, Facebook)
- **File Upload**: Cloudinary với local fallback
- **Email**: Gmail SMTP với verification system
- **Date Handling**: Moment.js 2.30.1 + React DatePicker 8.3.0
- **UI Enhancements**: 
  - Slick Carousel 1.8.1 (product galleries)
  - Perfect Scrollbar 1.5.5 (custom scrollbars)
  - Magnific Popup 1.2.0 (image lightbox)
  - Animsition 4.0.2 (page transitions)
- **Development**: 
  - Jest Testing Framework
  - Webpack 5 (bundling)
  - ESLint (code quality)

### Database Schema
- **MySQL 8.0** với timezone `Asia/Ho_Chi_Minh`
- **JPA Auto DDL**: Update mode với SQL formatting
- **Connection Pool**: HikariCP (default Spring Boot)
- **Indexing**: Optimized queries cho performance

### Real-time Architecture
- **WebSocket Endpoints**: `/ws` với SockJS fallback
- **STOMP Topics**:
  - `/topic/admin/notifications` - Admin notifications
  - `/topic/admin/chat/messages` - Chat updates
  - `/topic/user/{conversationId}/messages` - User messages
  - `/topic/conversation/{id}/messages` - Specific conversation
- **Authentication**: JWT-based WebSocket security

## ⚙️ Cài đặt và chạy

### Yêu cầu hệ thống
- **Java**: 17+ (OpenJDK hoặc Oracle JDK)
- **Node.js**: 16+ với npm 8+
- **MySQL**: 8.0+ 
- **Maven**: 3.6+
- **Git**: Latest version

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/CDW.git
cd CDW
```

### 2. Setup Database
```sql
-- Tạo database
CREATE DATABASE cdweb_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo user (optional)
CREATE USER 'cdweb_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cdweb_db.* TO 'cdweb_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Setup Backend
```bash
cd BackEndSpring

# Cấu hình application.properties
cp src/main/resources/application.properties.example src/main/resources/application.properties

# Chỉnh sửa database config
# spring.datasource.url=jdbc:mysql://localhost:3306/cdweb_db
# spring.datasource.username=root
# spring.datasource.password=your_mysql_password

# Cài đặt dependencies
mvn clean install

# Chạy ứng dụng (port 8080)
mvn spring-boot:run
```

### 4. Setup Frontend
```bash
cd FrontEnd

# Cài đặt dependencies
npm install

# Chạy development server (port 3000)
npm start
```

### 5. Cấu hình môi trường

#### Backend Configuration (`application.properties`)
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/cdweb_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=your_password

# JWT
jwt.secret=cdwebsecretkey2024allrightsreservedjwttokensecurityconfiguration
jwt.expiration=86400

# Cloudinary
cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret

# Email (Gmail)
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password

# Facebook OAuth2
facebook.app.id=your_facebook_app_id
facebook.app.secret=your_facebook_app_secret
```

#### Frontend Configuration (`src/config.js`)
```javascript
export const BACKEND_URL_HTTP = 'http://localhost:8080';
export const APP_NAME = 'CDWeb Shop';
export const CORS_CONFIG = {
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};
```

## 🚀 Deployment

### Docker Deployment
```bash
# Backend
cd BackEndSpring
docker build -t cdw-backend .
docker run -p 8080:8080 cdw-backend

# Frontend
cd FrontEnd
docker build -t cdw-frontend .
docker run -p 3000:3000 cdw-frontend
```

### Production Build
```bash
# Frontend production build
cd FrontEnd
npm run build

# Backend production package
cd BackEndSpring
mvn clean package -Pprod
```

## 📚 API Documentation

API documentation được tự động tạo với SpringDoc OpenAPI:
- **Development**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/v3/api-docs

### Main API Endpoints

#### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký  
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/facebook` - Facebook OAuth

#### Products
- `GET /api/products` - Danh sách sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/{id}` - Cập nhật sản phẩm
- `DELETE /api/products/{id}` - Xóa sản phẩm
- `POST /api/products/bulk-upload` - Upload bulk products

#### Chat System
- `POST /api/chat/autochat/init` - Khởi tạo auto chat
- `POST /api/chat/autochat/response` - Gửi selection response
- `GET /api/chat/conversations` - Lấy danh sách conversations
- `POST /api/chat/send` - Gửi tin nhắn live chat
- `PUT /api/chat/conversations/{id}/close` - Đóng conversation

#### Orders & Payment
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/{id}` - Chi tiết đơn hàng
- `POST /api/vnpay/create-payment` - Tạo payment VNPay
- `POST /api/orders/{id}/bank-transfer` - Bank transfer payment

#### Admin APIs
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/notifications` - Admin notifications
- `POST /api/admin/notifications/mark-read` - Đánh dấu đã đọc

## 🔧 Development

### Code Structure

#### Chat System Architecture
```
Chat System/
├── Auto Chat Mode
│   ├── AutoChatService.java       # Selection-based responses
│   ├── ChatController.java        # Auto chat endpoints
│   └── predefined responses       # Menu categories & quick replies
├── Live Chat Mode
│   ├── ChatService.java           # Real-time messaging
│   ├── WebSocketConfig.java       # STOMP configuration
│   ├── WebSocketEventListener.java # Connection lifecycle
│   └── ChatManagement.jsx         # Admin interface
├── Real-time Communication
│   ├── NotificationService.java   # WebSocket notifications
│   ├── SimpMessagingTemplate      # Message broadcasting
│   └── STOMP Protocol            # Bidirectional communication
└── Shared Components
    ├── ChatMessage.java           # Message entity
    ├── ChatMessageDTO.java        # Data transfer object
    ├── ChatWidget.jsx             # User chat interface
    └── ChatWindow.jsx             # Chat conversation UI
```

#### Key Services & Components

**Backend Services:**
- **AutoChatService**: Selection-based automated responses với predefined menus
- **ChatService**: Real-time messaging với conversation management
- **NotificationService**: WebSocket broadcasting cho admin notifications
- **VietQRService**: QR code generation cho bank transfers
- **LoyaltyService**: Points system và rewards management

**Frontend Components:**
- **ChatWidget**: Main chat interface với mode selection
- **ChatManagement**: Admin dashboard cho conversation management
- **Dashboard**: Analytics với charts và real-time stats
- **ProductManagement**: CRUD với bulk operations
- **OrderManagement**: Order processing với payment integration

### Development Guidelines

1. **Code Style**: 
   - Java: Google Java Style Guide
   - JavaScript: ESLint với Airbnb config
   - Consistent naming conventions

2. **Testing Strategy**:
   - Backend: JUnit 5 + Mockito cho unit tests
   - Frontend: Jest + React Testing Library
   - Integration tests cho API endpoints
   - WebSocket testing cho real-time features

3. **Security Best Practices**:
   - Input validation trên tất cả endpoints
   - JWT token với proper expiration
   - CORS configuration cho production
   - SQL injection prevention với JPA
   - XSS protection với Content Security Policy

4. **Performance Optimization**:
   - Database query optimization với indexing
   - Lazy loading cho large datasets
   - CDN integration cho static files
   - WebSocket connection pooling
   - Frontend code splitting với React.lazy

5. **Real-time Communication**:
   - STOMP protocol over WebSocket
   - Topic-based message routing
   - Connection lifecycle management
   - Auto-reconnection logic
   - Message deduplication

## 🧪 Testing

### Backend Tests
```bash
cd BackEndSpring

# Chạy unit tests
mvn test

# Chạy integration tests
mvn integration-test

# Test coverage report
mvn jacoco:report
```

### Frontend Tests
```bash
cd FrontEnd

# Chạy unit tests
npm test

# Run tests với coverage
npm test -- --coverage

# E2E testing (nếu có)
npm run test:e2e
```

### WebSocket Testing
```bash
# Test WebSocket connections
npm run test:websocket

# Chat functionality testing
npm run test:chat
```

## 📊 Performance & Monitoring

### Key Metrics
- **API Response Time**: < 200ms cho REST endpoints
- **Database Performance**: Query optimization với explain plans
- **WebSocket Latency**: < 100ms cho real-time messages
- **File Upload**: Cloudinary CDN với progressive loading
- **Frontend Performance**: Lighthouse scores > 90

### Monitoring Tools
- **Backend**: Spring Boot Actuator endpoints
- **Database**: MySQL performance schema monitoring
- **Frontend**: Lighthouse CI, Web Vitals tracking
- **Real-time**: WebSocket connection monitoring
- **Error Tracking**: Console logging với structured format

### Caching Strategy
- **Browser Caching**: Static assets với proper headers
- **API Caching**: Redis cho session management (ready)
- **Database Caching**: JPA second-level cache
- **CDN Caching**: Cloudinary automatic optimization

## 🔒 Security Features

- **Authentication**: JWT với refresh token rotation
- **Authorization**: Role-based access control (USER/ADMIN)
- **OAuth2 Integration**: Google & Facebook login
- **Input Validation**: Bean Validation với custom validators
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Spring Security CSRF tokens
- **SQL Injection**: Parameterized queries với JPA
- **File Upload Security**: Type validation + virus scanning ready
- **WebSocket Security**: JWT-based connection authentication
- **Password Security**: BCrypt với proper salt rounds

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/AmazingFeature`
3. **Follow coding standards**: ESLint + Google Java Style
4. **Write tests**: Ensure code coverage > 80%
5. **Commit changes**: `git commit -m 'Add AmazingFeature'`
6. **Push to branch**: `git push origin feature/AmazingFeature`
7. **Open Pull Request**: Với detailed description

### Development Workflow
- **Feature Development**: Feature branches từ `develop`
- **Code Review**: Required cho tất cả PRs
- **Testing**: Automated tests phải pass
- **Documentation**: Update README cho major features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Full-stack Developer**: React, Spring Boot, Database Design
- **UI/UX Designer**: Interface design, User experience
- **DevOps Engineer**: Deployment, CI/CD, Monitoring
- **QA Engineer**: Testing, Quality assurance

## 📞 Support

- **Email**: support@cdwshop.com
- **Documentation**: [Project Wiki](wiki)
- **Issues**: [GitHub Issues](issues)  
- **Live Chat**: Integrated trong ứng dụng
- **Technical Support**: [Stack Overflow Tag](stackoverflow)

## 🔄 Changelog

### Version 2.1.0 (Latest)
- ✅ **Enhanced Chat System**: Auto mode + Live chat với WebSocket
- ✅ **VietQR Integration**: QR code payments cho bank transfers
- ✅ **Real-time Notifications**: Admin notifications via WebSocket
- ✅ **Advanced Analytics**: Dashboard với charts và metrics
- ✅ **Loyalty System**: Points, rewards, tier management
- ✅ **Security Improvements**: Enhanced JWT + OAuth2 integration

### Version 2.0.0
- ✅ **Smart Chat System**: Dual-mode chat implementation
- ✅ **Auto Chat**: Selection-based responses với quick replies
- ✅ **Live Chat**: Real-time messaging với admin dashboard
- ✅ **WebSocket Integration**: STOMP protocol communication
- ✅ **Enhanced UI**: Bootstrap 5 + Antd components

### Version 1.5.0
- ✅ **Payment Integration**: VNPay + Bank transfer support
- ✅ **File Management**: Cloudinary CDN integration
- ✅ **Email System**: Gmail SMTP với verification
- ✅ **Bulk Operations**: Product upload, discount management

### Version 1.0.0
- ✅ **Core E-commerce**: Product, order, user management
- ✅ **Authentication**: JWT + OAuth2 (Google, Facebook)
- ✅ **Admin Dashboard**: Complete management interface
- ✅ **Responsive Design**: Mobile-first approach

---

**CDW E-commerce Platform** - Powering your online business with intelligent chat support 🚀

### 🌟 **Key Highlights:**
- **Production-Ready**: Comprehensive e-commerce solution
- **Real-time Communication**: Advanced WebSocket implementation
- **Modern Tech Stack**: Latest versions của Spring Boot 3.2.2 & React 18.3.1
- **Scalable Architecture**: Microservices-ready design
- **Security-First**: Enterprise-level security implementation
- **Developer-Friendly**: Extensive documentation & clean code

**Built with ❤️ for the Vietnamese e-commerce market**