import { useState, useEffect, useContext, useMemo } from 'react';
import { UserContext } from '../contexts/UserContext';
import apiClient from '../api/apiClient';

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
        <div style={{ padding: '20px', maxWidth: '430px', margin: '0 auto', boxSizing: 'border-box' }}>
            <h2 style={{ marginBottom: '24px', textAlign: 'center', fontWeight: '800' }}>마이페이지</h2>

            {/* 상단 섹션: 월간 집계 정보 */}
            <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '700', color: '#08060d' }}>월간 활동 리포트</h3>
                
                {Array.isArray(monthlyData) ? (
                    <>
                        <p style={{ fontSize: '15px', color: '#444', marginBottom: '24px', lineHeight: '1.5' }}>
                            이번 달 현재까지 달성한 미션의 갯수는 <strong style={{ color: '#007bff', fontSize: '18px' }}>{monthlyData.filter(i => i.is_completed).length}개</strong> 입니다.
                        </p>

                        {/* 커스텀 막대 그래프 */}
                        <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '2px', paddingBottom: '20px', borderBottom: '1px solid #eee', marginBottom: '10px' }}>
                            {chartData.map((data) => (
                                <div 
                                    key={data.day} 
                                    style={{ 
                                        flex: 1, 
                                        height: `${(data.count / maxCount) * 100}%`, 
                                        backgroundColor: data.count > 0 ? '#007bff' : '#f0f0f0',
                                        borderRadius: '2px 2px 0 0',
                                        position: 'relative',
                                        minHeight: data.count > 0 ? '4px' : '0'
                                    }}
                                    title={`${data.day}일: ${data.count}개`}
                                >
                                    {data.count > 0 && (
                                        <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 'bold', color: '#007bff' }}>
                                            {data.count}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999', padding: '0 4px' }}>
                            <span>1일</span>
                            <span>15일</span>
                            <span>{chartData.length}일</span>
                        </div>
                    </>
                ) : monthlyData?.error ? (
                    <p style={{ color: '#dc3545', textAlign: 'center' }}>{monthlyData.error}</p>
                ) : (
                    <p style={{ textAlign: 'center', color: '#999' }}>데이터를 불러오는 중...</p>
                )}
            </div>

            {/* 하단 섹션: 내 프로필 관리 */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '18px', fontWeight: '700', color: '#08060d' }}>내 프로필 관리</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label htmlFor="nickname" style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>닉네임</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                id="nickname"
                                name="nickname"
                                value={currentProfile.nickname}
                                onChange={handleChange}
                                disabled={!isNicknameEditing}
                                style={{ padding: '12px', fontSize: '15px', flex: 1, backgroundColor: isNicknameEditing ? 'white' : '#f8f8f8', color: '#333', border: '1px solid #eee', borderRadius: '12px', outline: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (isNicknameEditing) {
                                        setCurrentProfile(prev => ({ ...prev, nickname: originalProfile.nickname }));
                                    }
                                    setIsNicknameEditing(!isNicknameEditing);
                                }}
                                style={{ padding: '0 16px', cursor: 'pointer', backgroundColor: isNicknameEditing ? '#f0f0f0' : '#08060d', color: isNicknameEditing ? '#666' : 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }}
                            >
                                {isNicknameEditing ? '취소' : '수정'}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label htmlFor="email" style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>이메일</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={currentProfile.email}
                                onChange={handleChange}
                                disabled={!isEmailEditing}
                                style={{ padding: '12px', fontSize: '15px', flex: 1, backgroundColor: isEmailEditing ? 'white' : '#f8f8f8', color: '#333', border: '1px solid #eee', borderRadius: '12px', outline: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (isEmailEditing) {
                                        setCurrentProfile(prev => ({ ...prev, email: originalProfile.email }));
                                    }
                                    setIsEmailEditing(!isEmailEditing);
                                }}
                                style={{ padding: '0 16px', cursor: 'pointer', backgroundColor: isEmailEditing ? '#f0f0f0' : '#08060d', color: isEmailEditing ? '#666' : 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }}
                            >
                                {isEmailEditing ? '취소' : '수정'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" style={{ marginTop: '8px', padding: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,123,255,0.2)' }}>
                        저장하기
                    </button>
                </form>
            </div>
        </div>
    );
}

export default MyPage;
