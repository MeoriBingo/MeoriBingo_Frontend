import { useState, useEffect } from 'react'
import apiClient from '../api/apiClient'
import PhotoUploadModal from '../components/PhotoUploadModal'
import BingoGenerateModal from '../components/BingoGenerateModal'
import './MainPage.css'

function IconRefresh() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M3 16v4h4M21 8V4h-4" />
    </svg>
  )
}

function MainPage() {
  const [userInfo, setUserInfo] = useState({
    nickname: '...',
    point: 0,
    streak_count: 0
  });

  const [timeRemaining, setTimeRemaining] = useState({ hours: '00', minutes: '00' });
  const [bingoHistory, setBingoHistory] = useState(null);
  const [isBingoLoading, setIsBingoLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const fetchUserInfo = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          const response = await apiClient.get(`/api/users/${user.id}`);
          const data = response.data;
          setUserInfo({
            nickname: data.nickname,
            point: data.point,
            streak_count: data.streak_count
          });
        }
      }
    } catch (error) {
      console.error('API 호출 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchBingoHistory = async () => {
    try {
      const today = new Date();
      const targetDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const response = await apiClient.get(`/api/history/history/by-date?target_date=${targetDate}`);
      const result = response.data;
      // 백엔드 응답이 { data: [...] } 거나 직접 [...] 형태일 수 있으므로 두 경우 모두 방어
      const history = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
      setBingoHistory(history);
    } catch (error) {
      console.error('빙고 내역 API 호출 오류:', error);
    } finally {
      setIsBingoLoading(false);
    }
  };

  useEffect(() => {
    fetchBingoHistory();
  }, []);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const diffMs = midnight - now;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining({
        hours: diffHrs.toString().padStart(2, '0'),
        minutes: diffMins.toString().padStart(2, '0')
      });
    };

    calculateTimeRemaining();
    const timerId = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(timerId);
  }, []);

  const handleGenerateBingo = async (params) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        alert('로그인이 필요합니다.');
        return;
      }
      const user = JSON.parse(userStr);
      const response = await apiClient.post('/api/bingo/generate', { 
        user_id: user.id,
        category: params?.category,
        mode: params?.mode
      });
      const data = response.data;
      setBingoHistory([data]);
    } catch (error) {
      console.error('빙고 생성 API 호출 중 오류 발생:', error);
      alert('빙고 생성 중 오류가 발생했습니다.');
      throw error; // Re-throw to be caught by the modal's try-catch
    }
  };

  const handleResetBingo = async () => {
    try {
      if (!window.confirm('빙고판을 재생성하시겠습니까? (기존 진행 내역이 초기화됩니다)')) return;

      await apiClient.post('/api/bingo/reset');
      alert('빙고판이 초기화되었습니다. 새 빙고를 생성해주세요.');
      setBingoHistory([]); // Clear the history to show the generate button
    } catch (error) {
      console.error('빙고 재생성 중 오류 발생:', error);
      alert('빙고 재생성 중 오류가 발생했습니다.');
    }
  };

  const displayName = userInfo.nickname || '사용자';
  const avatarLabel = displayName[0] ? displayName[0].toUpperCase() : 'M';

  return (
    <div className="main-page">
      <div className="main-page__scroll">
        <section className="main-page__hero" aria-label="유저 정보">
          <div className="main-page__profile-row">
            <div className="main-page__avatar" aria-hidden>{avatarLabel}</div>
            <h1 className="main-page__welcome">Hello, {displayName}!</h1>
          </div>
          <span className="main-page__point-pill" aria-label={`보유 점수 ${userInfo.point}점`}>
            <span className="main-page__point-coin" aria-hidden>🪙</span>
            {userInfo.point}point
          </span>
        </section>

        <section className="main-page__streak" aria-label="연속 달성 현황">
          <div className="main-page__streak-head">
            <span className="main-page__streak-badge">HOT STREAK</span>
            <strong>{userInfo.streak_count}일째 달성 중!</strong>
          </div>
          <p className="main-page__streak-desc">
          AI가 매일 새로운 미션을 생성합니다! <br />
          빙고를 완성하며 성취감 넘치는 하루를 기록하세요
          </p>
        </section>

        <section className="main-page__mission" aria-label="오늘의 빙고 미션">
          <div className="main-page__section-head">
            <h2 className="main-page__section-title">오늘의 빙고 미션</h2>
            <p className="main-page__deadline">
              <i className="fa-regular fa-clock" aria-hidden />
              {timeRemaining.hours}h {timeRemaining.minutes}m 남음
            </p>
          </div>

          {isBingoLoading ? (
            <div className="main-page__state">빙고 정보를 불러오는 중...</div>
          ) : (bingoHistory && bingoHistory.length > 0) ? (
            <>
              <div className="main-page__grid" role="list" aria-label="빙고 미션 9칸">
                {(() => {
                  const firstBingo = bingoHistory[0];
                  const cells = firstBingo?.cells || [];
                  const sortedCells = [...cells].sort((a, b) => a.position - b.position);

                  if (sortedCells.length === 0) {
                    return Array.from({ length: 9 }, (_, i) => (
                      <div key={i} className="main-page__tile" role="listitem" />
                    ));
                  }

                  return sortedCells.map((cell) => {
                    const hasImage = !!cell.proof_image_url;
                    let imageUrl = cell.proof_image_url;

                    if (hasImage && imageUrl.startsWith('/')) {
                      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
                      imageUrl = `${baseUrl}${imageUrl}`;
                    }

                    const bgStyle = hasImage
                      ? {
                          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75)), url(${imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : {};

                    return (
                      <div
                        key={cell.id || cell.position}
                        className={`main-page__tile${hasImage ? ' main-page__tile--with-image' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCell(cell)}
                        style={bgStyle}
                      >
                        {cell.mission_title}
                      </div>
                    );
                  });
                })()}
              </div>

              <button type="button" className="main-page__regen" onClick={handleResetBingo}>
                <IconRefresh />
                빙고판 재생성
              </button>
            </>
          ) : (
            <div className="main-page__empty">
              <p>아직 생성된 빙고가 없어요.</p>
              <button type="button" className="main-page__generate-btn" onClick={() => setShowGenerateModal(true)}>
                빙고 생성하기
              </button>
            </div>
          )}
        </section>
      </div>

      {selectedCell && (
        <PhotoUploadModal
          cell={selectedCell}
          onClose={() => setSelectedCell(null)}
          onVerifySuccess={() => {
            fetchBingoHistory();
            fetchUserInfo();
          }}
        />
      )}

      {showGenerateModal && (
        <BingoGenerateModal
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGenerateBingo}
        />
      )}
    </div>
  )
}

export default MainPage
