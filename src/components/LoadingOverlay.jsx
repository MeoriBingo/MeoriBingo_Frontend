import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ message = '처리 중...' }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
        <div className="loading-progress-bar">
          <div className="loading-progress-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
