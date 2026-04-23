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

  // 블러 처리 관련 상태
  const [isBlurMode, setIsBlurMode] = useState(false);
  const [selection, setSelection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

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
      setSelection(null);
      setIsBlurMode(false);
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
    setSelection(null);
    setIsBlurMode(false);
  };

  // 블러 처리 시작/취소
  const toggleBlurMode = () => {
    setIsBlurMode(!isBlurMode);
    setSelection(null);
  };

  // 마우스/터치 이벤트 핸들러
  const getCoordinates = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    if (!isBlurMode) return;
    const pos = getCoordinates(e);
    setStartPos(pos);
    setSelection({ x: pos.x, y: pos.y, width: 0, height: 0 });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isBlurMode || !isDragging) return;
    const pos = getCoordinates(e);
    const newSelection = {
      x: Math.min(pos.x, startPos.x),
      y: Math.min(pos.y, startPos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y)
    };
    setSelection(newSelection);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 실제 블러 적용 (Canvas 활용)
  const applyBlur = async () => {
    if (!selection || selection.width < 5 || selection.height < 5) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 원본 이미지 크기로 캔버스 설정
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 1. 전체 이미지 그리기
    ctx.drawImage(img, 0, 0);

    // 2. 선택 영역 계산 (화면 좌표 -> 이미지 실제 좌표 정밀 보정)
    const containerW = img.clientWidth;
    const containerH = img.clientHeight;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    // object-fit: cover 환경에서의 실제 이미지 스케일 및 오프셋 계산
    const containerRatio = containerW / containerH;
    const naturalRatio = naturalW / naturalH;

    let scale, offsetX = 0, offsetY = 0;

    if (naturalRatio > containerRatio) {
      // 이미지가 컨테이너보다 가로로 더 긴 경우 (좌우가 잘림)
      scale = naturalH / containerH;
      offsetX = (naturalW - containerW * scale) / 2;
    } else {
      // 이미지가 컨테이너보다 세로로 더 긴 경우 (상하가 잘림)
      scale = naturalW / containerW;
      offsetY = (naturalH - containerH * scale) / 2;
    }

    const blurX = selection.x * scale + offsetX;
    const blurY = selection.y * scale + offsetY;
    const blurW = selection.width * scale;
    const blurH = selection.height * scale;

    // 3. 선택 영역 블러 처리
    ctx.save();
    ctx.beginPath();
    ctx.rect(blurX, blurY, blurW, blurH);
    ctx.clip();

    ctx.filter = 'blur(25px)';
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // 4. 새로운 파일 생성
    canvas.toBlob((blob) => {
      const newFile = new File([blob], selectedFile.name, { type: selectedFile.type });
      const newUrl = URL.createObjectURL(newFile);

      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setSelectedFile(newFile);
      setPreviewUrl(newUrl);
      setIsBlurMode(false);
      setSelection(null);
    }, selectedFile.type);
  };

  const handleButtonClick = async () => {
    if (isBlurMode) {
      applyBlur();
      return;
    }

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
            <div
              className={`photo-modal__preview-wrap ${isBlurMode ? 'photo-modal__preview-wrap--blur-mode' : ''}`}
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={previewUrl}
                alt="미션 인증 미리보기"
                className="photo-modal__preview-image"
                draggable={false}
              />

              {isBlurMode && selection && (
                <div
                  className="photo-modal__selection-box"
                  style={{
                    left: `${selection.x}px`,
                    top: `${selection.y}px`,
                    width: `${selection.width}px`,
                    height: `${selection.height}px`,
                  }}
                />
              )}

              {isBlurMode && (
                <div className="photo-modal__blur-hint">
                  가리고 싶은 영역을 드래그하세요
                </div>
              )}

              {!isBlurMode && (
                <button
                  type="button"
                  className="photo-modal__blur-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBlurMode();
                  }}
                >
                  <i className="fa-solid fa-mask"></i> 영역 가리기
                </button>
              )}

              {isBlurMode && (
                <button
                  type="button"
                  className="photo-modal__blur-cancel"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBlurMode();
                  }}
                >
                  취소
                </button>
              )}

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
          disabled={!selectedFile || (isBlurMode && !selection) || isUploading}
        >
          {isUploading ? (
            '인증 중...'
          ) : isBlurMode ? (
            '블러 적용하기'
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
