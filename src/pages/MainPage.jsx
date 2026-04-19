import { useState, useEffect } from 'react'
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

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user && user.id) {
            const baseUrl = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${baseUrl}/api/users/${user.id}`);
            if (response.ok) {
              const data = await response.json();
              setUserInfo({
                nickname: data.nickname,
                point: data.point,
                streak_count: data.streak_count
              });
            } else {
              console.error('유저 정보를 불러오는데 실패했습니다.');
            }
          }
        }
      } catch (error) {
        console.error('API 호출 중 오류 발생:', error);
      }
    };

    fetchUserInfo();
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

        <div className="main-page__grid" role="list" aria-label="빙고 미션 9칸">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="main-page__tile" role="listitem" />
          ))}
        </div>

        <button type="button" className="main-page__regen">
          <IconRefresh />
          빙고판 재생성
        </button>

        <p className="main-page__deadline">빙고 미션 달성 마감까지 {timeRemaining.hours}시간 {timeRemaining.minutes}분 남았습니다.</p>
      </div>

    </div>
  )
}

export default MainPage
