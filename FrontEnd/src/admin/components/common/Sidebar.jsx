import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, links = [] }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (text) => {
    setExpandedMenus(prev => ({
      ...prev,
      [text]: !prev[text]
    }));
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>Fashion Admin</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {links.map((link, index) => (
            <li key={index} className={link.submenu ? 'menu-item has-submenu' : 'menu-item'}>
              {link.submenu ? (
                <>
                  <div 
                    className={`menu-link ${expandedMenus[link.text] ? 'active' : ''}`}
                    onClick={() => toggleSubmenu(link.text)}
                  >
                    <i className={link.icon}></i>
                    <span>{link.text}</span>
                    <i className={`submenu-icon fas ${expandedMenus[link.text] ? 'fa-angle-down' : 'fa-angle-right'}`}></i>
                  </div>
                  
                  <ul className={`submenu ${expandedMenus[link.text] ? 'open' : ''}`}>
                    {link.submenu.map((subItem, subIndex) => (
                      <li key={subIndex} className="submenu-item">
                        <Link 
                          to={subItem.to} 
                          className={`submenu-link ${location.pathname === subItem.to ? 'active' : ''}`}
                        >
                          {subItem.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link 
                  to={link.to} 
                  className={`menu-link ${location.pathname === link.to ? 'active' : ''}`}
                >
                  <i className={link.icon}></i>
                  <span>{link.text}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      
      <style jsx>{`
        .sidebar {
          background-color: #2c3e50;
          color: #ecf0f1;
          height: 100vh;
          transition: width 0.3s;
          overflow-x: hidden;
          position: fixed;
          left: 0;
          top: 0;
          width: 250px;
          z-index: 100;
        }
        
        .sidebar.closed {
          width: 70px;
        }
        
        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #34495e;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 70px;
        }
        
        .sidebar-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .sidebar.closed .sidebar-header h2 {
          display: none;
        }
        
        .sidebar-nav {
          padding: 15px 0;
        }
        
        .sidebar-menu {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .menu-item {
          margin-bottom: 5px;
        }
        
        .menu-link {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          color: #ecf0f1;
          text-decoration: none;
          transition: all 0.3s;
          cursor: pointer;
        }
        
        .menu-link:hover, .menu-link.active {
          background-color: #34495e;
        }
        
        .menu-link i {
          margin-right: 15px;
          width: 20px;
          text-align: center;
        }
        
        .sidebar.closed .menu-link span {
          display: none;
        }
        
        .submenu-icon {
          margin-left: auto;
          font-size: 12px;
        }
        
        .sidebar.closed .submenu-icon {
          display: none;
        }
        
        .submenu {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-in-out;
        }
        
        .submenu.open {
          max-height: 200px;
        }
        
        .submenu-item {
          background-color: #243342;
        }
        
        .submenu-link {
          display: block;
          padding: 10px 20px 10px 55px;
          color: #ecf0f1;
          text-decoration: none;
          transition: background-color 0.3s;
        }
        
        .submenu-link:hover, .submenu-link.active {
          background-color: #1a252f;
        }
        
        .sidebar.closed .submenu {
          position: absolute;
          left: 70px;
          top: 0;
          width: 180px;
          background-color: #2c3e50;
          z-index: 101;
          max-height: 0;
          overflow: hidden;
        }
        
        .sidebar.closed .has-submenu:hover .submenu {
          max-height: 200px;
        }
        
        .sidebar.closed .submenu-link {
          padding-left: 20px;
        }
        
        @media (max-width: 768px) {
          .sidebar {
            width: 70px;
          }
          
          .sidebar.open {
            width: 250px;
          }
          
          .sidebar-header h2 {
            display: none;
          }
          
          .sidebar.open .sidebar-header h2 {
            display: block;
          }
          
          .menu-link span {
            display: none;
          }
          
          .sidebar.open .menu-link span {
            display: inline;
          }
          
          .submenu-icon {
            display: none;
          }
          
          .sidebar.open .submenu-icon {
            display: inline;
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar; 