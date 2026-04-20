import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

function FriendPage() {
    const [friends, setFriends] = useState([]);
    const [sentRequests, setSentRequests] = useState(null);
    const [receivedRequests, setReceivedRequests] = useState(null);
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

        const fetchSentRequests = async () => {
            try {
                const response = await apiClient.get('/api/social/friends/requests/sent');
                const requests = Array.isArray(response.data) ? response.data : [];
                
                // 각 요청의 user_id를 사용하여 유저 상세 정보(닉네임)를 가져옴
                const detailedRequests = await Promise.all(
                    requests.map(async (req) => {
                        try {
                            const userRes = await apiClient.get(`/api/users/${req.user_id}`);
                            return {
                                ...req,
                                fetchedNickname: userRes.data.nickname
                            };
                        } catch (err) {
                            console.error(`User ${req.user_id} info fetch error:`, err);
                            return { ...req, fetchedNickname: '알 수 없음' };
                        }
                    })
                );
                
                setSentRequests(detailedRequests);
            } catch (error) {
                console.error('Sent requests API error:', error);
                setSentRequests({ error: '데이터를 불러오지 못했습니다.' });
            }
        };

        const fetchReceivedRequests = async () => {
            try {
                const response = await apiClient.get('/api/social/friends/requests/received');
                const requests = Array.isArray(response.data) ? response.data : [];
                setReceivedRequests(requests);
            } catch (error) {
                console.error('Received requests API error:', error);
                setReceivedRequests({ error: '데이터를 불러오지 못했습니다.' });
            }
        };

        fetchFriends();
        fetchSentRequests();
        fetchReceivedRequests();
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
                    {!sentRequests ? (
                        <p style={{ color: '#666', fontSize: '14px' }}>로딩 중...</p>
                    ) : sentRequests.error ? (
                        <p style={{ color: '#ff4d4f', fontSize: '14px' }}>{sentRequests.error}</p>
                    ) : Array.isArray(sentRequests) && sentRequests.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                            {sentRequests.map((req, idx) => (
                                <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #f9f9f9', fontSize: '14px', color: '#444' }}>
                                    <span style={{ marginRight: '8px' }}>📤</span>
                                    {req.fetchedNickname}
                                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>({req.status})</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '10px', fontSize: '14px' }}>보낸 요청이 없습니다.</p>
                    )}
                </div>

                {/* 우측: 내가 받은 친구 요청 목록 */}
                <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#555' }}>받은 요청</h4>
                    {!receivedRequests ? (
                        <p style={{ color: '#666', fontSize: '14px' }}>로딩 중...</p>
                    ) : receivedRequests.error ? (
                        <p style={{ color: '#ff4d4f', fontSize: '14px' }}>{receivedRequests.error}</p>
                    ) : Array.isArray(receivedRequests) && receivedRequests.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                            {receivedRequests.map((req, idx) => (
                                <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #f9f9f9', fontSize: '14px', color: '#444' }}>
                                    <span style={{ marginRight: '8px' }}>📥</span>
                                    {req.nickname}
                                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>({req.status})</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '10px', fontSize: '14px' }}>받은 요청이 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FriendPage;
