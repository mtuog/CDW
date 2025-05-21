import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

const LoyaltySettings = () => {
  // Note: In a real implementation, these settings would be loaded from and saved to the backend
  // For this demo, we'll just show the interface without actual functionality
  
  const [settings, setSettings] = useState({
    // Thresholds for each rank
    ranks: {
      BRONZE: 0,
      SILVER: 100,
      GOLD: 300,
      PLATINUM: 1000
    },
    // Points earned per 10,000 VND spent
    earnRates: {
      BRONZE: 1.0,
      SILVER: 1.2,
      GOLD: 1.5,
      PLATINUM: 2.0
    },
    // General settings
    automaticPointsForDeliveredOrders: true,
    policyText: `
      # Chính sách tích điểm
      
      ## Cách tích điểm
      - Khách hàng sẽ được tích điểm cho mỗi đơn hàng thành công
      - Điểm tích lũy sẽ được tính dựa trên giá trị đơn hàng (sau khi đã áp dụng mã giảm giá)
      
      ## Hạng thành viên
      - Hạng Đồng (Bronze): 0-99 điểm
      - Hạng Bạc (Silver): 100-299 điểm
      - Hạng Vàng (Gold): 300-999 điểm
      - Hạng Bạch Kim (Platinum): 1000+ điểm
      
      ## Tỷ lệ tích điểm
      - Hạng Đồng: 1 điểm cho mỗi 10,000đ
      - Hạng Bạc: 1.2 điểm cho mỗi 10,000đ
      - Hạng Vàng: 1.5 điểm cho mỗi 10,000đ
      - Hạng Bạch Kim: 2 điểm cho mỗi 10,000đ
      
      ## Quy định sử dụng điểm
      - Điểm tích lũy có thể được sử dụng để đổi lấy các ưu đãi hoặc giảm giá
      - Điểm không có thời hạn sử dụng
      - Điểm không có giá trị quy đổi thành tiền mặt
    `
  });
  
  const handleRankThresholdChange = (rank, value) => {
    setSettings({
      ...settings,
      ranks: {
        ...settings.ranks,
        [rank]: parseInt(value) || 0
      }
    });
  };
  
  const handleEarnRateChange = (rank, value) => {
    setSettings({
      ...settings,
      earnRates: {
        ...settings.earnRates,
        [rank]: parseFloat(value) || 0
      }
    });
  };
  
  const handleAutomaticPointsChange = (e) => {
    setSettings({
      ...settings,
      automaticPointsForDeliveredOrders: e.target.checked
    });
  };
  
  const handlePolicyTextChange = (e) => {
    setSettings({
      ...settings,
      policyText: e.target.value
    });
  };
  
  const handleSaveSettings = () => {
    // In a real implementation, this would save the settings to the backend
    Swal.fire({
      icon: 'success',
      title: 'Lưu cài đặt thành công',
      text: 'Các cài đặt tích điểm đã được cập nhật.',
      showConfirmButton: false,
      timer: 1500
    });
  };
  
  return (
    <div className="loyalty-settings">
      <div className="settings-section">
        <h3>Cài đặt ngưỡng hạng thành viên</h3>
        <p className="section-description">
          <FontAwesomeIcon icon={faInfoCircle} /> Thiết lập số điểm tối thiểu để đạt mỗi hạng
        </p>
        
        <div className="settings-grid">
          <div className="setting-item">
            <label>Hạng Đồng (Bronze)</label>
            <input 
              type="number" 
              value={settings.ranks.BRONZE} 
              disabled
              title="Hạng thấp nhất không thể thay đổi"
            />
            <span className="hint">Mặc định</span>
          </div>
          
          <div className="setting-item">
            <label>Hạng Bạc (Silver)</label>
            <input 
              type="number" 
              value={settings.ranks.SILVER} 
              onChange={(e) => handleRankThresholdChange('SILVER', e.target.value)}
              min={settings.ranks.BRONZE + 1}
            />
            <span className="hint">Điểm tối thiểu</span>
          </div>
          
          <div className="setting-item">
            <label>Hạng Vàng (Gold)</label>
            <input 
              type="number" 
              value={settings.ranks.GOLD} 
              onChange={(e) => handleRankThresholdChange('GOLD', e.target.value)}
              min={settings.ranks.SILVER + 1}
            />
            <span className="hint">Điểm tối thiểu</span>
          </div>
          
          <div className="setting-item">
            <label>Hạng Bạch Kim (Platinum)</label>
            <input 
              type="number" 
              value={settings.ranks.PLATINUM} 
              onChange={(e) => handleRankThresholdChange('PLATINUM', e.target.value)}
              min={settings.ranks.GOLD + 1}
            />
            <span className="hint">Điểm tối thiểu</span>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Cài đặt tỷ lệ tích điểm</h3>
        <p className="section-description">
          <FontAwesomeIcon icon={faInfoCircle} /> Thiết lập số điểm tích lũy cho mỗi 10,000đ chi tiêu
        </p>
        
        <div className="settings-grid">
          <div className="setting-item">
            <label>Hạng Đồng (Bronze)</label>
            <input 
              type="number" 
              value={settings.earnRates.BRONZE} 
              onChange={(e) => handleEarnRateChange('BRONZE', e.target.value)}
              step="0.1"
              min="0.1"
            />
            <span className="hint">Điểm / 10,000đ</span>
          </div>
          
          <div className="setting-item">
            <label>Hạng Bạc (Silver)</label>
            <input 
              type="number" 
              value={settings.earnRates.SILVER} 
              onChange={(e) => handleEarnRateChange('SILVER', e.target.value)}
              step="0.1"
              min={settings.earnRates.BRONZE}
            />
            <span className="hint">Điểm / 10,000đ</span>
          </div>
          
          <div className="setting-item">
            <label>Hạng Vàng (Gold)</label>
            <input 
              type="number" 
              value={settings.earnRates.GOLD} 
              onChange={(e) => handleEarnRateChange('GOLD', e.target.value)}
              step="0.1"
              min={settings.earnRates.SILVER}
            />
            <span className="hint">Điểm / 10,000đ</span>
          </div>
          
          <div className="setting-item">
            <label>Hạng Bạch Kim (Platinum)</label>
            <input 
              type="number" 
              value={settings.earnRates.PLATINUM} 
              onChange={(e) => handleEarnRateChange('PLATINUM', e.target.value)}
              step="0.1"
              min={settings.earnRates.GOLD}
            />
            <span className="hint">Điểm / 10,000đ</span>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Cài đặt chung</h3>
        
        <div className="setting-checkbox">
          <input 
            type="checkbox" 
            id="automaticPoints"
            checked={settings.automaticPointsForDeliveredOrders}
            onChange={handleAutomaticPointsChange}
          />
          <label htmlFor="automaticPoints">
            Tự động tích điểm khi đơn hàng được giao thành công
          </label>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Chính sách tích điểm</h3>
        <p className="section-description">
          <FontAwesomeIcon icon={faInfoCircle} /> Nội dung này sẽ được hiển thị cho khách hàng
        </p>
        
        <textarea 
          className="policy-text"
          value={settings.policyText}
          onChange={handlePolicyTextChange}
          rows={15}
        ></textarea>
        <p className="hint">Hỗ trợ định dạng Markdown</p>
      </div>
      
      <div className="action-buttons">
        <button 
          className="btn btn-primary save-btn"
          onClick={handleSaveSettings}
        >
          <FontAwesomeIcon icon={faSave} /> Lưu cài đặt
        </button>
      </div>
      
      <style jsx>{`
        .loyalty-settings {
          margin-top: 20px;
        }
        
        .settings-section {
          background-color: #f8f9fa;
          border-radius: 5px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .settings-section h3 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 18px;
          color: #333;
        }
        
        .section-description {
          color: #666;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .section-description svg {
          color: #2c7be5;
          margin-right: 5px;
        }
        
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }
        
        .setting-item {
          display: flex;
          flex-direction: column;
        }
        
        .setting-item label {
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .setting-item input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .setting-item input:disabled {
          background-color: #f0f0f0;
          cursor: not-allowed;
        }
        
        .hint {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        
        .setting-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .setting-checkbox input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }
        
        .policy-text {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
        }
        
        .action-buttons {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary {
          background-color: #2c7be5;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #1a68d1;
        }
        
        .save-btn {
          font-size: 16px;
        }
        
        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LoyaltySettings; 