import { useState, useEffect, useContext, useMemo } from 'react';
import { UserContext } from '../contexts/UserContext';
import apiClient from '../api/apiClient';
import './MyPage.css';

function MyPage() {
    const { updateUser } = useContext(UserContext);
    const [originalProfile, setOriginalProfile] = useState({ nickname: '', email: '' });
    const [currentProfile, setCurrentProfile] = useState({ nickname: '', email: '' });
    const [userId, setUserId] = useState(null);
    const [isNicknameEditing, setIsNicknameEditing] = useState(false);
    const [isEmailEditing, setIsEmailEditing] = useState(false);
    const [monthlyData, setMonthlyData] = useState(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user && user.id) {
                        setUserId(user.id);
                        const response = await apiClient.get(`/api/users/${user.id}`);
                        const data = response.data;
                        const profileData = {
                            nickname: data.nickname || '',
                            email: data.email || ''
                        };
                        setOriginalProfile(profileData);
                        setCurrentProfile(profileData);
                    }
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        const fetchMonthlyHistory = async () => {
            try {
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

                const response = await apiClient.get('/api/history/history/monthly', {
                    params: {
                        year: currentYear,
                        month: currentMonth
                    }
                });
                setMonthlyData(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('월간 히스토리 조회 실패:', error);
                setMonthlyData({ error: '데이터를 불러오지 못했습니다.' });
            }
        };

        fetchUserInfo();
        fetchMonthlyHistory();
    }, []);

    // 차트 데이터 가공
    const chartData = useMemo(() => {
        if (!Array.isArray(monthlyData)) return [];

        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const counts = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, count: 0 }));

        monthlyData.forEach(item => {
            if (item.is_completed && item.completed_at) {
                const day = new Date(item.completed_at).getDate();
                if (day >= 1 && day <= daysInMonth) {
                    counts[day - 1].count += 1;
                }
            }
        });

        return counts;
    }, [monthlyData]);

    const maxCount = useMemo(() => {
        const counts = chartData.map(d => d.count);
        return counts.length > 0 ? Math.max(...counts, 5) : 5; // 최소 높이 5 보장
    }, [chartData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId) return;

        const body = {};
        if (currentProfile.nickname !== originalProfile.nickname) {
            body.nickname = currentProfile.nickname;
        }
        if (currentProfile.email !== originalProfile.email) {
            body.email = currentProfile.email;
        }

        if (Object.keys(body).length === 0) {
            alert('수정된 정보가 없습니다.');
            return;
        }

        try {
            await apiClient.patch(`/api/users/me/${userId}`, body);

            alert('프로필이 성공적으로 수정되었습니다.');
            setOriginalProfile(currentProfile);
            setIsNicknameEditing(false);
            setIsEmailEditing(false);

            updateUser(body);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('프로필 수정 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="my-page">
            <h2 className="my-page__title">마이페이지</h2>

            <section className="my-page__card my-page__card--report">
                <div className="my-page__card-head">
                    <span className="my-page__card-icon-wrap" aria-hidden="true">
                        <i className="fa-solid fa-chart-column my-page__card-icon" />
                    </span>
                    <h3 className="my-page__card-title">월간 활동 리포트</h3>
                </div>
                {Array.isArray(monthlyData) ? (
                    <>
                        <p className="my-page__report-text">
                            이번 달 현재까지 달성한 미션의 갯수는 <strong>{monthlyData.filter(i => i.is_completed).length}개</strong> 입니다.
                        </p>

                        <div className="my-page__chart">
                            {chartData.map((data) => (
                                <div
                                    key={data.day}
                                    className={`my-page__bar${data.count > 0 ? ' my-page__bar--active' : ''}`}
                                    style={{ height: `${(data.count / maxCount) * 100}%` }}
                                    title={`${data.day}일: ${data.count}개`}
                                >
                                    {data.count > 0 && (
                                        <span className="my-page__bar-count">
                                            {data.count}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="my-page__chart-caption">
                            <span>1일</span>
                            <span>15일</span>
                            <span>{chartData.length}일</span>
                        </div>
                    </>
                ) : monthlyData?.error ? (
                    <p className="my-page__error-text">{monthlyData.error}</p>
                ) : (
                    <p className="my-page__empty-text">데이터를 불러오는 중...</p>
                )}
            </section>

            <section className="my-page__card my-page__card--profile">
                <div className="my-page__card-head">
                    <span className="my-page__card-icon-wrap" aria-hidden="true">
                        <i className="fa-solid fa-user-pen my-page__card-icon" />
                    </span>
                    <h3 className="my-page__card-title">내 프로필 관리</h3>
                </div>

                <form onSubmit={handleSubmit} className="my-page__form">
                    <div className="my-page__field">
                        <label htmlFor="nickname" className="my-page__label">닉네임</label>
                        <div className="my-page__field-row">
                            <input
                                type="text"
                                id="nickname"
                                name="nickname"
                                value={currentProfile.nickname}
                                onChange={handleChange}
                                disabled={!isNicknameEditing}
                                className={`my-page__input${!isNicknameEditing ? ' my-page__input--disabled' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (isNicknameEditing) {
                                        setCurrentProfile(prev => ({ ...prev, nickname: originalProfile.nickname }));
                                    }
                                    setIsNicknameEditing(!isNicknameEditing);
                                }}
                                className={`my-page__edit-btn${isNicknameEditing ? ' my-page__edit-btn--cancel' : ''}`}
                            >
                                {isNicknameEditing ? '취소' : '수정'}
                            </button>
                        </div>
                    </div>

                    <div className="my-page__field">
                        <label htmlFor="email" className="my-page__label">이메일</label>
                        <div className="my-page__field-row">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={currentProfile.email}
                                onChange={handleChange}
                                disabled={!isEmailEditing}
                                className={`my-page__input${!isEmailEditing ? ' my-page__input--disabled' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (isEmailEditing) {
                                        setCurrentProfile(prev => ({ ...prev, email: originalProfile.email }));
                                    }
                                    setIsEmailEditing(!isEmailEditing);
                                }}
                                className={`my-page__edit-btn${isEmailEditing ? ' my-page__edit-btn--cancel' : ''}`}
                            >
                                {isEmailEditing ? '취소' : '수정'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="my-page__submit-btn">
                        저장하기
                    </button>
                </form>
            </section>
        </div>
    );
}

export default MyPage;
