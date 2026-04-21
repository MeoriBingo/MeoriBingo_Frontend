import React, { useRef, useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiClient';
import { UserContext } from '../contexts/UserContext';
import LoadingOverlay from './LoadingOverlay';
import './PhotoUploadModal.css';

function IconBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function PhotoUploadModal({ cell, onClose, onVerifySuccess }) {
  const { user, updateUser } = useContext(UserContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
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

        // 1. 사진 인증 호출
        const response = await apiClient.post(`/api/mission/verify/${targetCellId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const data = response.data;

        if (data.is_success) {
          const userId = user?.id || user?.user_id;

          // 1. 빙고칸 완료 처리
          await apiClient.patch(`/api/bingo/cells/${targetCellId}`);

          // 2. 포인트 부여
          await apiClient.post(`/api/admin/point/${userId}`, {
            amount: 100,
            reason: "미션 성공 포인트 부여"
          });

          // 3. 미션 성공내역 및 스트릭 업데이트를 위한 유저 정보 조회
          const userResponse = await apiClient.get(`/api/users/${userId}`);
          const userData = userResponse.data;

          let streak_count = userData.streak_count || 0;
          let last_completed_date = userData.last_completed_date;

          const today = new Date();
          // 로컬 시간을 기준으로 날짜 문자열 (YYYY-MM-DD) 생성
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          const todayStr = `${year}-${month}-${day}`;

          if (!last_completed_date) {
            // 첫 미션 달성
            streak_count = 1;
          } else {
            const lastDate = new Date(last_completed_date);
            const currentDate = new Date(todayStr);

            const diffTime = currentDate.getTime() - lastDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
              // 오늘 이미 성공한 적이 있음 - 스트릭 유지
            } else if (diffDays === 1) {
              // 어제 성공하고 오늘 처음 성공 - 스트릭 증가
              streak_count += 1;
            } else {
              // 2일 이상 차이남 - 스트릭 초기화
              streak_count = 1;
            }
          }

          last_completed_date = todayStr;

          // 서버에 스트릭 정보 업데이트
          await apiClient.patch(`/api/users/mission/${userId}`, {
            streak_count,
            last_completed_date
          });

          // 로컬 컨텍스트 업데이트
          if (updateUser) {
            updateUser({ streak_count, last_completed_date });
          }

          setIsSuccess(true);
          setResultMessage(data.message || '인증이 완료되었습니다!');
        } else {
          setIsSuccess(false);
          setResultMessage(data.message || '인증에 실패했습니다.');
        }
      } catch (error) {
        console.error('업로드 및 처리 실패:', error);
        setIsSuccess(false);
        setResultMessage('사진 인증 중 오류가 발생했습니다.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCloseResult = () => {
    if (isSuccess && onVerifySuccess) {
      onVerifySuccess();
    }

    // 인증 실패 시 사진 초기화하여 다시 올릴 수 있게 함
    if (!isSuccess) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      // HTML 인풋 요소의 값을 초기화해야 동일한 파일 재선택 시 onChange가 발생함
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    setResultMessage(null);

    if (isSuccess) {
      onClose();
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

      {isUploading && <LoadingOverlay message="AI가 사진을 분석하고 있습니다..." />}

      {resultMessage && (
        <div className="result-overlay">
          <div className="result-popup">
            <div className={`result-popup__icon ${isSuccess ? 'result-popup__icon--success' : 'result-popup__icon--fail'}`}>
              {isSuccess ? '✅' : '❌'}
            </div>
            <p className="result-popup__message">{resultMessage}</p>
            <button className="result-popup__btn" onClick={handleCloseResult}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoUploadModal;
