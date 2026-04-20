import React, { useRef, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import './PhotoUploadModal.css';

function IconBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function PhotoUploadModal({ cell, onClose, onVerifySuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Cleanup preview URL
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!cell) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleButtonClick = async () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
    } else {
      
      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        const targetCellId = cell.id || cell.cell_id;
        console.log('업로드 대상 셀:', cell, '추출된 ID:', targetCellId);

        const response = await apiClient.post(`/api/mission/verify/${targetCellId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        alert('인증이 완료되었습니다!');
        if (onVerifySuccess) onVerifySuccess();
        onClose();
      } catch (error) {
        console.error('업로드 실패:', error);
        alert('사진 인증에 실패했습니다.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="photo-modal">
      <header className="photo-modal__header">
        <button className="photo-modal__back" onClick={onClose} aria-label="뒤로가기">
          <IconBack />
        </button>
        <h2 className="photo-modal__title">사진 인증</h2>
      </header>
      
      <div className="photo-modal__content">
        <div 
          className="photo-modal__placeholder"
          onClick={() => {
            if (!selectedFile && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          style={{ cursor: selectedFile ? 'default' : 'pointer' }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="미션 인증 미리보기" className="photo-modal__preview-image" />
          ) : (
            <span className="photo-modal__placeholder-text">터치하여 사진 선택</span>
          )}
        </div>

        <input 
          type="file" 
          accept="image/*"
          capture="environment"
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />

        <button 
          className="photo-modal__upload-btn" 
          type="button"
          onClick={handleButtonClick}
          disabled={isUploading}
        >
          {isUploading ? '업로드 중...' : (selectedFile ? '인증하기' : '사진 업로드 하기')}
        </button>

        <section className="photo-modal__guide">
          <h3 className="photo-modal__guide-title">사진 업로드 가이드</h3>
          <ul className="photo-modal__guide-list">
            <li>인증할 사진에 대한 가이드 출력 부분</li>
            <li>
              ex) {cell.mission_title} 챌린지인 경우<br />
              "{cell.mission_title} 사진을 선명하게 촬영해주세요"
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default PhotoUploadModal;
