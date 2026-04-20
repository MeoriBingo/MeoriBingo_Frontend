import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

function FriendPage() {
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await apiClient.get('/api/social/friends');
                const result = response.data;
                // 응답이 { data: [...] } 거나 [...] 형태일 경우 대응
                const friendList = Array.isArray(result.data) 
                    ? result.data 
                    : (Array.isArray(result) ? result : Object.values(result).find(Array.isArray) || []);
                setFriends(friendList);
            } catch (error) {
                console.error('API error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFriends();
    }, []);

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', boxSizing: 'border-box' }}>
            {/* 상단: 현재 친구 목록 */}
            <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eaeaea', paddingBottom: '10px', color: '#333' }}>현재 친구 목록</h3>
                {isLoading ? (
                    <p style={{ color: '#666' }}>친구 목록을 불러오는 중...</p>
                ) : friends.length > 0 ? (
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                        {friends.map((friend, idx) => (
                            <li key={idx} style={{ padding: '12px 10px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>👤</span>
                                <span style={{ fontWeight: 500, color: '#444' }}>{friend.nickname || '이름 없음'}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>등록된 친구가 없습니다.</p>
                )}
            </div>

            {/* 하단: 친구 요청 현황 (좌/우 분할) */}
            <div style={{ flex: 1, display: 'flex', gap: '15px' }}>
                {/* 좌측: 내가 친구 요청한 목록 */}
                <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#555' }}>내가 보낸 요청</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 30px)', color: '#aaa', fontSize: '14px', border: '1px dashed #ddd', borderRadius: '4px' }}>
                        추후 구현 영역
                    </div>
                </div>

                {/* 우측: 내가 받은 친구 요청 목록 */}
                <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#555' }}>받은 요청</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 30px)', color: '#aaa', fontSize: '14px', border: '1px dashed #ddd', borderRadius: '4px' }}>
                        추후 구현 영역
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FriendPage;