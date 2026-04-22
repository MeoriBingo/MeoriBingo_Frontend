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

function IconArrowRight() {
  return (
    <svg className="photo-modal__upload-btn-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = async () => {
    if (!selectedFile) return;
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
          className={`photo-modal__placeholder${previewUrl ? ' photo-modal__placeholder--preview' : ''}`}
          onClick={() => {
            if (!selectedFile && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          style={{ cursor: selectedFile ? 'default' : 'pointer' }}
        >
          {previewUrl ? (
            <div className="photo-modal__preview-wrap">
              <img src={previewUrl} alt="미션 인증 미리보기" className="photo-modal__preview-image" />
              <button
                type="button"
                className="photo-modal__remove-photo"
                onClick={handleRemovePhoto}
                aria-label="선택한 사진 삭제"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="photo-modal__empty">
              <div className="photo-modal__empty-icon-circle">
                <i className="fa-solid fa-photo-film photo-modal__fa-photo" aria-hidden="true" />
              </div>
              <p className="photo-modal__empty-title">터치하여 사진 업로드</p>
              <p className="photo-modal__empty-subtitle">물체가 선명하게 보이도록 해주세요</p>
            </div>
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
          className={`photo-modal__upload-btn${isUploading ? ' photo-modal__upload-btn--busy' : ''}`}
          type="button"
          onClick={handleButtonClick}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            '인증 중...'
          ) : (
            <>
              <span>사진 인증하기</span>
              <IconArrowRight />
            </>
          )}
        </button>

        <section className="photo-modal__guide-card" aria-labelledby="photo-upload-guide-heading">
          <div className="photo-modal__guide-head">
            <span className="photo-modal__guide-info-wrap" aria-hidden="true">
              <i className="fa-solid fa-circle-info photo-modal__guide-info-fa" aria-hidden="true" />
            </span>
            <h3 id="photo-upload-guide-heading" className="photo-modal__guide-heading">
              사진 업로드 가이드
            </h3>
          </div>
          <ul className="photo-modal__guide-bullets">
            <li>부적절·선정적이거나 타인의 초상권을 침해하는 사진은 업로드할 수 없습니다.</li>
            <li>미션과 무관한 사진, 화면 캡처·도용 이미지는 인증이 거절될 수 있습니다.</li>
            <li>
              이번 미션(<strong>{cell.mission_title || '미션'}</strong>)에 맞는 물품·장면이 한눈에 보이도록 밝고 선명하게 촬영해 주세요.
            </li>
            <li>너무 어둡거나 흔들리고, 대상이 잘려 보이는 사진은 인증에 실패할 수 있습니다.</li>
            <li>허위·조작된 사진은 서비스 이용 제재를 받을 수 있습니다.</li>
          </ul>
          <div className="photo-modal__guide-examples">
            <figure className="photo-modal__guide-example photo-modal__guide-example--good">
              <div className="photo-modal__guide-example-inner">
                <div className="photo-modal__guide-demo photo-modal__guide-demo--good" aria-hidden="true" />
                <span className="photo-modal__guide-badge photo-modal__guide-badge--ok" aria-label="좋은 예시">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <figcaption className="photo-modal__guide-example-caption">좋은 예</figcaption>
            </figure>
            <figure className="photo-modal__guide-example photo-modal__guide-example--bad">
              <div className="photo-modal__guide-example-inner">
                <div className="photo-modal__guide-demo photo-modal__guide-demo--bad" aria-hidden="true" />
                <span className="photo-modal__guide-badge photo-modal__guide-badge--bad" aria-label="나쁜 예시">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 2L10 10M10 2L2 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </div>
              <figcaption className="photo-modal__guide-example-caption">피할 예</figcaption>
            </figure>
          </div>
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
