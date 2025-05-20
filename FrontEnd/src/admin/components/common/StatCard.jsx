import React from 'react';

const StatCard = ({ title, value, icon, color, increase }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <i className={icon}></i>
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <div className="stat-value-container">
          <span className="stat-value">{value}</span>
          {increase && (
            <span className="stat-increase">{increase}</span>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .stat-card {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
          display: flex;
          align-items: center;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          flex-shrink: 0;
        }
        
        .stat-icon i {
          color: #fff;
          font-size: 24px;
        }
        
        .stat-content {
          flex: 1;
        }
        
        .stat-title {
          font-size: 14px;
          color: #6c757d;
          margin: 0 0 8px 0;
          font-weight: normal;
        }
        
        .stat-value-container {
          display: flex;
          align-items: baseline;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin-right: 10px;
        }
        
        .stat-increase {
          font-size: 12px;
          color: #28a745;
        }
      `}</style>
    </div>
  );
};

export default StatCard; 