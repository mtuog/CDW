import React from 'react';
import './ChatPopup.css';

const ChatPopup = ({ show, type, title, message, onConfirm, onCancel, onClose }) => {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'confirm':
        return '❓';
      default:
        return 'ℹ️';
    }
  };

  const getButtonConfig = () => {
    switch (type) {
      case 'confirm':
        return (
          <>
            <button className="popup-btn popup-btn-cancel" onClick={onCancel}>
              Hủy
            </button>
            <button className="popup-btn popup-btn-confirm" onClick={onConfirm}>
              Xác nhận
            </button>
          </>
        );
      case 'error':
        return (
          <button className="popup-btn popup-btn-error" onClick={onClose}>
            Đóng
          </button>
        );
      case 'warning':
        return (
          <>
            <button className="popup-btn popup-btn-cancel" onClick={onCancel}>
              Hủy
            </button>
            <button className="popup-btn popup-btn-warning" onClick={onConfirm}>
              Tiếp tục
            </button>
          </>
        );
      default:
        return (
          <button className="popup-btn popup-btn-primary" onClick={onClose}>
            OK
          </button>
        );
    }
  };

  return (
    <div className="chat-popup-overlay" onClick={type === 'confirm' || type === 'warning' ? null : onClose}>
      <div className="chat-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="popup-icon">{getIcon()}</div>
          <h3 className="popup-title">{title}</h3>
          {type !== 'confirm' && type !== 'warning' && (
            <button className="popup-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        
        <div className="popup-body">
          <p className="popup-message">{message}</p>
        </div>
        
        <div className="popup-footer">
          {getButtonConfig()}
        </div>
      </div>
    </div>
  );
};

export default ChatPopup; 