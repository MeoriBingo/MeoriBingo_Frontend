import { useState, useEffect, useContext, useRef } from 'react'
import apiClient from '../api/apiClient'
import { UserContext } from '../contexts/UserContext'
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
  const { user, updateUser } = useContext(UserContext);
  const [userInfo, setUserInfo] = useState({
    nickname: user?.nickname || '...',
    point: user?.point || 0,
    streak_count: user?.streak_count || 0
  });

  // user 컨텍스트가 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    if (user) {
      setUserInfo({
        nickname: user.nickname,
        point: user.point,
        streak_count: user.streak_count
      });
    }
  }, [user]);

  const [timeRemaining, setTimeRemaining] = useState({ hours: '00', minutes: '00' });
  const [bingoHistory, setBingoHistory] = useState(null);
  const [isBingoLoading, setIsBingoLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const isUserFetched = useRef(false);
  const isHistoryFetched = useRef(false);

  const fetchUserInfo = async () => {
    try {
      if (user && user.id) {
        const response = await apiClient.get(`/api/users/${user.id}`);
        const data = response.data;
        const updatedInfo = {
          nickname: data.nickname,
          point: data.point,
          streak_count: data.streak_count
        };
        setUserInfo(updatedInfo);
        updateUser(updatedInfo);
      }
    } catch (error) {
      console.error('사용자 정보 로드 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    if (isUserFetched.current) return;
    if (user?.id) {
      fetchUserInfo();
      isUserFetched.current = true;
    }
  }, [user?.id]);

  const fetchBingoHistory = async () => {
    try {
      const today = new Date();
      const targetDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const response = await apiClient.get(`/api/history/history/by-date?target_date=${targetDate}`);
      const result = response.data;
      const history = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
      setBingoHistory(history);
    } catch (error) {
      console.error('빙고 내역 API 호출 오류:', error);
      alert('빙고 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsBingoLoading(false);
    }
  };

  useEffect(() => {
    if (isHistoryFetched.current) return;
    fetchBingoHistory();
    isHistoryFetched.current = true;
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

  return (
    <div className="main-page">
      <div className="main-page__scroll">
        <h1 className="main-page__welcome">{userInfo.nickname}님 환영합니다.</h1>

        <section className="main-page__streak" aria-label="연속 달성 현황">
          <p className="main-page__streak-title">
            <span aria-hidden>🔥</span>
            {userInfo.streak_count}일째 달성 중
          </p>
          <p className="main-page__streak-desc">
            AI가 생성한 미션을 통해 하루를 빙고로 기록하세요
          </p>
        </section>

        <div className="main-page__section-head">
          <h2 className="main-page__section-title">오늘의 빙고 미션</h2>
          <span className="main-page__points" aria-label={`보유 점수 ${userInfo.point}점`}>
            <span aria-hidden>🪙</span>
            {userInfo.point}점
          </span>
        </div>

        {isBingoLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
            빙고 정보를 불러오는 중...
          </div>
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

                  // 만약 이미지가 상대경로(/로 시작)로 내려오면 API Base URL을 붙여줍니다
                  if (hasImage && imageUrl.startsWith('/')) {
                    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
                    imageUrl = `${baseUrl}${imageUrl}`;
                  }

                  const bgStyle = hasImage
                    ? {
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), url(${imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {};

                  return (
                    <div
                      key={cell.id || cell.position}
                      className="main-page__tile"
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
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <button type="button" style={{
              padding: '16px 32px',
              fontSize: '18px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,123,255,0.3)',
              transition: 'background-color 0.2s'
            }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
              onClick={() => setShowGenerateModal(true)}
            >
              빙고 생성하기
            </button>
          </div>
        )}

        <p className="main-page__deadline">빙고 미션 달성 마감까지 {timeRemaining.hours}시간 {timeRemaining.minutes}분 남았습니다.</p>
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
