import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <i className="fa fa-bars"></i>
        </button>
        <div className="search-box">
          <input type="text" placeholder="Tìm kiếm..." />
          <button><i className="fa fa-search"></i></button>
        </div>
      </div>
      
      <div className="header-right">
        <div className="header-icons">
          <button className="icon-button">
            <i className="fa fa-bell"></i>
            <span className="badge">3</span>
          </button>
          <button className="icon-button">
            <i className="fa fa-envelope"></i>
            <span className="badge">5</span>
          </button>
        </div>
        
        <div className="user-dropdown">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <img 
              src="https://via.placeholder.com/40" 
              alt="User Avatar" 
              className="user-avatar" 
            />
            <span className="user-name">Admin</span>
            <i className={`fa fa-chevron-${dropdownOpen ? 'up' : 'down'}`}></i>
          </button>
          
          {dropdownOpen && (
            <div className="dropdown-menu">
              <Link to="/admin/profile" className="dropdown-item">
                <i className="fa fa-user"></i> Hồ sơ
              </Link>
              <Link to="/admin/settings" className="dropdown-item">
                <i className="fa fa-cog"></i> Cài đặt
              </Link>
              <div className="dropdown-divider"></div>
              <Link to="/logout" className="dropdown-item">
                <i className="fa fa-sign-out"></i> Đăng xuất
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
          padding: 0 20px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-left, .header-right {
          display: flex;
          align-items: center;
        }
        
        .sidebar-toggle {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          margin-right: 20px;
          color: #495057;
        }
        
        .search-box {
          display: flex;
          background-color: #f1f3f5;
          border-radius: 20px;
          padding: 5px 15px;
        }
        
        .search-box input {
          border: none;
          background: none;
          outline: none;
          width: 250px;
        }
        
        .search-box button {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
        }
        
        .header-icons {
          display: flex;
          margin-right: 20px;
        }
        
        .icon-button {
          background: none;
          border: none;
          font-size: 18px;
          color: #495057;
          position: relative;
          margin-left: 15px;
          cursor: pointer;
        }
        
        .badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #dc3545;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .user-dropdown {
          position: relative;
        }
        
        .dropdown-toggle {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 10px;
        }
        
        .user-name {
          margin-right: 5px;
          color: #495057;
        }
        
        .dropdown-menu {
          position: absolute;
          top: 55px;
          right: 0;
          width: 200px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 10px 0;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 8px 20px;
          color: #495057;
          text-decoration: none;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        
        .dropdown-item i {
          margin-right: 10px;
          width: 20px;
          text-align: center;
        }
        
        .dropdown-divider {
          height: 1px;
          background-color: #e9ecef;
          margin: 8px 0;
        }
      `}</style>
    </header>
  );
};

export default Header; 